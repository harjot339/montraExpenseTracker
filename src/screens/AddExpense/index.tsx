import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
  Alert,
  BackHandler,
  Dimensions,
  Platform,
  SafeAreaView,
  View,
} from 'react-native';
import style from './styles';

import CustomInput from '../../components/CustomInput';
import {COLORS} from '../../constants/commonStyles';
import Spacer from '../../components/Spacer';
import CustomDropdown from '../../components/CustomDropDown';
import {ICONS} from '../../constants/icons';
import {BottomSheetModal, BottomSheetModalProvider} from '@gorhom/bottom-sheet';
import FilePickerSheet from '../../components/FilePickerSheet';
import RepeatTransactionSheet from '../../components/RepeatTranscationSheet';
import firestore, {Timestamp} from '@react-native-firebase/firestore';
import {STRINGS} from '../../constants/strings';
import CustomButton from '../../components/CustomButton';
import {repeatDataType, transactionType} from '../../defs/transaction';
import {useAppDispatch, useAppSelector} from '../../redux/store';
import {setLoading, userLoggedIn} from '../../redux/reducers/userSlice';
import uuid from 'react-native-uuid';
import Toast from 'react-native-toast-message';
import {ExpenseScreenProps} from '../../defs/navigation';
import AddCategorySheet from '../../components/AddCategorySheet';

import {CompundEmptyError, EmptyError} from '../../constants/errors';
import AttachementContainer from './atoms/attachementContainer';
import {
  addNewTransaction,
  createTransaction,
  getAttachmentUrl,
  handleExpenseUpdate,
  handleIncomeUpdate,
  handleNewExpense,
  handleNewIncome,
  handleNotify,
  updateTransaction,
} from '../../utils/firebase';
import {useAppTheme} from '../../hooks/themeHook';
import {KeyboardAwareScrollView} from 'react-native-keyboard-aware-scroll-view';
import {useNetInfo} from '@react-native-community/netinfo';
import {useObject, useRealm} from '@realm/react';
import {TransFromJson} from '../../utils/transFuncs';
import {OnlineTransactionModel} from '../../DbModels/OnlineTransactionModel';
import {UpdateMode} from 'realm';
import {OfflineTransactionModel} from '../../DbModels/OfflineTransactionModel';
import CustomHeader from '../../components/CustomHeader';
import MoneyInput from './atoms/MoneyInput';
import {RepeatDataModel} from '../../DbModels/RepeatDataModel';
import {formatWithCommas, getMyColor} from '../../utils/commonFuncs';
import RepeatInput from './atoms/RepeatInput';
import notifee from '@notifee/react-native';
function AddExpense({navigation, route}: Readonly<ExpenseScreenProps>) {
  // constants
  const {isConnected} = useNetInfo();
  const realm = useRealm();
  const COLOR = useAppTheme();
  const styles = style(COLOR);
  const pageType = route.params.type;
  const isEdit = route.params.isEdit;
  let prevTransaction:
    | transactionType
    | OnlineTransactionModel
    | OfflineTransactionModel
    | undefined;
  if (isEdit) {
    prevTransaction = route.params.transaction;
  }
  console.log(prevTransaction);
  const TransOnline = useObject(
    OnlineTransactionModel,
    prevTransaction?.id ?? '',
  );
  const month = new Date().getMonth();
  const getBackgroundColor = useMemo(() => {
    if (pageType === 'expense') {
      return COLORS.PRIMARY.RED;
    } else if (pageType === 'transfer') {
      return COLORS.PRIMARY.BLUE;
    } else {
      return COLORS.PRIMARY.GREEN;
    }
  }, [pageType]);
  const backgroundColor = getBackgroundColor;
  const dispatch = useAppDispatch();
  // redux use
  const conversion = useAppSelector(state => state.transaction.conversion);
  const expenseCat = useAppSelector(
    state => state.user.currentUser?.expenseCategory,
  );
  const incomeCat = useAppSelector(
    state => state.user.currentUser?.incomeCategory,
  );
  const user = useAppSelector(state => state.user.currentUser);
  const uid = useAppSelector(state => state.user.currentUser!.uid);
  const currency = useAppSelector(state => state.user.currentUser?.currency);
  // state
  const [firstTime, setFirstTime] = useState(true);
  const [prevAmt, setPrevAmt] = useState<number>();
  const [image, setImage] = useState(
    prevTransaction && prevTransaction.attachementType === 'image'
      ? prevTransaction.attachement
      : '',
  );
  const [doc, setDoc] = useState<{uri: string; name: string} | undefined>(
    prevTransaction && prevTransaction.attachementType === 'doc'
      ? {uri: prevTransaction.attachement!, name: 'Document'}
      : undefined,
  );
  const [repeatData, setRepeatData] = useState<
    repeatDataType | RepeatDataModel | undefined
  >(prevTransaction ? prevTransaction.freq! : undefined);
  // console.log('RepeatData', repeatData)
  const [desc, setDesc] = useState(prevTransaction ? prevTransaction.desc : '');
  const [zindex, setZindex] = useState(1);
  const [amount, setAmount] = useState(
    prevTransaction
      ? formatWithCommas(
          Number(
            (
              conversion.usd[(currency ?? 'USD').toLowerCase()] *
              prevTransaction.amount
            ).toFixed(1),
          ).toString(),
        )
      : '0',
  );
  const [category, setCategory] = useState<string | undefined>(
    prevTransaction ? prevTransaction.category : '',
  );
  const [wallet, setWallet] = useState(
    prevTransaction ? prevTransaction.wallet : '',
  );
  const [from, setFrom] = useState(prevTransaction ? prevTransaction.from : '');
  const [to, setTo] = useState(prevTransaction ? prevTransaction.to : '');
  const [formKey, setFormKey] = useState(false);
  const [catColors, setCatColors] = useState<{[key: string]: string}>();
  const [isSwitchOn, setIsSwitchOn] = useState(
    repeatData !== undefined ? repeatData !== null : repeatData !== undefined,
  );
  // refs
  const filePickSheetRef = useRef<BottomSheetModal>(null);
  const repeatSheetRef = useRef<BottomSheetModal>(null);
  const addCategorySheetRef = useRef<BottomSheetModal>(null);

  // functions
  const getAttachmentAndType = useCallback(() => {
    let attachement = '';
    let attachementType: transactionType['attachementType'] = 'none';
    if (image !== '') {
      console.log('IMAGE', image);
      attachement = image!;
      attachementType = 'image';
    } else if (doc) {
      attachement = doc.uri;
      attachementType = 'doc';
    }
    return {attachement, attachementType};
  }, [image, doc]);

  const handleOffline = async ({
    id,
    attachement,
    attachementType,
  }: {
    id: string;
    attachement: string;
    attachementType: 'none' | 'image' | 'doc';
  }) => {
    console.log('offline');
    let trans = TransFromJson(
      createTransaction({
        id: id,
        url: attachement,
        attachementType: attachementType,
        amount: amount.replace(/,/g, ''),
        category: pageType === 'transfer' ? 'transfer' : category!,
        conversion: conversion,
        currency: currency!,
        desc: desc,
        isEdit: isEdit,
        pageType: pageType,
        repeatData: repeatData!,
        transaction: prevTransaction!,
        wallet: wallet,
        uid: uid,
        from: from,
        to: to,
      }),
      uid,
    );
    if (
      !isConnected &&
      (trans.freq?.date as Timestamp)?.seconds !== undefined
    ) {
      trans.freq!.date = Timestamp.fromMillis(
        (trans.freq?.date as Timestamp).seconds * 1000,
      ).toDate();
    }
    if (pageType === 'income') {
      dispatch(
        userLoggedIn({
          ...user,
          income: {
            ...(user?.income ?? {}),
            [month]: {
              ...(user?.income?.[month] ?? {}),
              [category!]: isEdit
                ? user?.income[month][category!]! -
                  prevTransaction?.amount! +
                  Number(amount.replace(/,/g, '')) /
                    (conversion?.usd[currency?.toLowerCase() ?? 'usd'] ?? 1)
                : (user?.income?.[month]?.[category!] ?? 0) +
                  Number(amount.replace(/,/g, '')) /
                    (conversion?.usd[currency?.toLowerCase() ?? 'usd'] ?? 1),
            },
          },
        }),
      );
      realm.write(() => {
        realm.create(
          'amount',
          {
            id: month + '_' + category + '_' + pageType,
            amount: isEdit
              ? user?.income[month][category!]! -
                prevTransaction?.amount! +
                Number(amount.replace(/,/g, '')) /
                  (conversion?.usd[currency?.toLowerCase() ?? 'usd'] ?? 1)
              : (user?.income?.[month]?.[category!] ?? 0) +
                Number(amount.replace(/,/g, '')) /
                  (conversion?.usd[currency?.toLowerCase() ?? 'usd'] ?? 1),
          },
          UpdateMode.All,
        );
        console.log('done');
      });
    } else {
      // console.log(
      //   'djfnsdjf',
      //   user?.spend?.[month]?.[pageType === 'transfer' ? 'transfer' : category!]!,
      //   prevAmt!,
      //   Number(amount.replace(/,/g, '')) /
      //     (conversion?.usd[currency?.toLowerCase() ?? 'usd'] ?? 1),
      //   user?.spend?.[month]?.[pageType === 'transfer' ? 'transfer' : category!]! -
      //     prevAmt! +
      //     Number(amount.replace(/,/g, '')) /
      //       (conversion?.usd[currency?.toLowerCase() ?? 'usd'] ?? 1),
      // );
      dispatch(
        userLoggedIn({
          ...user,
          spend: {
            ...(user?.spend ?? {}),
            [month]: {
              ...(user?.spend?.[month] ?? {}),
              [pageType === 'transfer' ? 'transfer' : category!]: isEdit
                ? user?.spend?.[month]?.[
                    pageType === 'transfer' ? 'transfer' : category!
                  ]! -
                  prevAmt! +
                  Number(amount.replace(/,/g, '')) /
                    (conversion?.usd[currency?.toLowerCase() ?? 'usd'] ?? 1)
                : (user?.spend?.[month]?.[
                    pageType === 'transfer' ? 'transfer' : category!
                  ] ?? 0) +
                  Number(amount.replace(/,/g, '')) /
                    (conversion?.usd[currency?.toLowerCase() ?? 'usd'] ?? 1),
            },
          },
        }),
      );
      realm.write(() => {
        realm.create(
          'amount',
          {
            id:
              month +
              '_' +
              (pageType === 'transfer' ? 'transfer' : category) +
              '_' +
              pageType,
            amount: isEdit
              ? user?.spend[month][
                  pageType === 'transfer' ? 'transfer' : category!
                ]! -
                prevTransaction?.amount! +
                Number(amount.replace(/,/g, '')) /
                  (conversion?.usd[currency?.toLowerCase() ?? 'usd'] ?? 1)
              : (user?.spend?.[month]?.[
                  pageType === 'transfer' ? 'transfer' : category!
                ] ?? 0) +
                Number(amount.replace(/,/g, '')) /
                  (conversion?.usd[currency?.toLowerCase() ?? 'usd'] ?? 1),
          },
          UpdateMode.All,
        );
        console.log('done');
      });
      if (pageType !== 'transfer') {
        const totalBudget = user?.budget?.[month]?.[category!];
        const totalSpent = isEdit
          ? user?.spend[month][category!]! -
            prevTransaction?.amount! +
            Number(amount.replace(/,/g, '')) /
              (conversion?.usd[currency?.toLowerCase() ?? 'usd'] ?? 1)
          : (user?.spend?.[month]?.[category!] ?? 0) +
            Number(amount.replace(/,/g, '')) /
              (conversion?.usd[currency?.toLowerCase() ?? 'usd'] ?? 1);
        if (
          totalBudget &&
          (totalSpent >= totalBudget.limit ||
            totalSpent >= totalBudget.limit * (totalBudget.percentage / 100))
        ) {
          try {
            const notificationId = uuid.v4();
            await notifee.requestPermission();
            const channelId = await notifee.createChannel({
              id: 'default',
              name: 'Default Channel',
            });
            if (totalSpent >= totalBudget.limit) {
              realm.write(() => {
                realm.create(
                  'notification',
                  {
                    type: 'budget-limit',
                    category: category!,
                    id: notificationId,
                    time: Timestamp.now(),
                    read: false,
                    percentage: totalBudget.percentage,
                  },
                  UpdateMode.Never,
                );
              });
              dispatch(
                userLoggedIn({
                  ...user,
                  notification: {
                    ...user.notification,
                    [notificationId as string]: {
                      type: 'budget-limit',
                      category: category!,
                      id: notificationId,
                      time: Timestamp.now(),
                      read: false,
                      percentage: totalBudget.percentage,
                    },
                  },
                }),
              );
              await notifee.displayNotification({
                title:
                  category![0].toUpperCase() +
                  category!.slice(1) +
                  ' Budget Limit Exceeded',
                body:
                  'Your ' +
                  category![0].toUpperCase() +
                  category!.slice(1) +
                  ' budget has exceeded the limit',
                android: {
                  channelId,
                },
              });
            } else if (
              totalSpent >=
              totalBudget.limit * (totalBudget.percentage / 100)
            ) {
              realm.write(() => {
                realm.create(
                  'notification',
                  {
                    type: 'budget-percent',
                    category: category!,
                    id: notificationId,
                    time: Timestamp.now(),
                    read: false,
                    percentage: totalBudget.percentage,
                  },
                  UpdateMode.Never,
                );
              });
              dispatch(
                userLoggedIn({
                  ...user,
                  notification: {
                    ...user.notification,
                    [notificationId as string]: {
                      type: 'budget-percent',
                      category: category!,
                      id: notificationId,
                      time: Timestamp.now(),
                      read: false,
                      percentage: totalBudget.percentage,
                    },
                  },
                }),
              );
              await notifee.displayNotification({
                title: `Exceeded ${totalBudget.percentage}% of ${
                  category![0].toUpperCase() + category!.slice(1)
                } budget`,
                body: `You've exceeded ${totalBudget.percentage}% of your ${
                  category![0].toUpperCase() + category!.slice(1)
                } budget. Take action to stay on track.`,
                android: {
                  channelId,
                },
              });
            }
          } catch (e) {
            console.log(e);
          }
        }
      }
    }
    if (trans.freq) {
      trans.freq.date = Timestamp.fromDate(trans.freq?.date as Date);
    }
    realm.write(() => {
      if (isEdit && TransOnline) {
        realm.create(
          'OnlineTransaction',
          {...trans, changed: true},
          UpdateMode.Modified,
        );
      }
      realm.create(
        'OfflineTransaction',
        {...trans, operation: isEdit ? 'update' : 'add'},
        UpdateMode.All,
      );
    });
  };

  const handleOnline = async ({
    id,
    attachement,
    attachementType,
  }: {
    id: string;
    attachement: string;
    attachementType: 'none' | 'image' | 'doc';
  }) => {
    const url = await getAttachmentUrl({
      attachement: attachement,
      id: id,
      uid: uid,
    });
    const trans = createTransaction({
      id: id,
      url: url,
      attachementType: attachementType,
      amount: amount.replace(/,/g, ''),
      category: pageType === 'transfer' ? 'transfer' : category!,
      conversion: conversion,
      currency: currency!,
      desc: desc,
      isEdit: isEdit,
      pageType: pageType,
      repeatData: repeatData!,
      transaction: prevTransaction!,
      wallet: wallet,
      uid: uid,
      from: from,
      to: to,
    });
    const curr = await firestore().collection('users').doc(uid).get();
    if (isEdit) {
      if (pageType === 'expense' || pageType === 'transfer') {
        handleExpenseUpdate({
          curr: curr,
          amount: Number(amount.replace(/,/g, '')),
          category: pageType === 'transfer' ? 'transfer' : category!,
          conversion: conversion,
          currency: currency!,
          month: month,
          transaction: prevTransaction!,
          uid: uid,
        });
      } else if (pageType === 'income') {
        handleIncomeUpdate({
          curr: curr,
          amount: Number(amount.replace(/,/g, '')),
          category: category!,
          conversion: conversion,
          currency: currency!,
          month: month,
          transaction: prevTransaction!,
          uid: uid,
        });
      }
      await updateTransaction({
        trans: trans,
        transId: prevTransaction?.id!,
        uid: uid,
      });
    } else {
      if (pageType === 'expense' || pageType === 'transfer') {
        handleNewExpense({
          curr: curr,
          amount: Number(amount.replace(/,/g, '')),
          category: pageType === 'transfer' ? 'transfer' : category!,
          conversion: conversion,
          currency: currency!,
          month: month,
          uid: uid,
        });
      } else if (pageType === 'income') {
        handleNewIncome({
          curr: curr,
          amount: Number(amount.replace(/,/g, '')),
          category: category!,
          conversion: conversion,
          currency: currency!,
          month: month,
          uid: uid,
        });
      }
      await addNewTransaction({id: id, trans: trans, uid: uid});
    }
  };

  const handlePress = async () => {
    setFormKey(true);
    if (
      pageType === 'transfer' &&
      (amount.replace(/,/g, '').trim() === '' ||
        amount.replace(/,/g, '').trim() === '.' ||
        Number(amount.replace(/,/g, '')) <= 0 ||
        from === '' ||
        to === '')
    ) {
      return;
    }
    if (
      pageType !== 'transfer' &&
      (amount.replace(/,/g, '').trim() === '' ||
        amount.replace(/,/g, '').trim() === '.' ||
        Number(amount.replace(/,/g, '')) <= 0 ||
        category === '' ||
        wallet === '')
    ) {
      return;
    }
    dispatch(setLoading(true));
    const {attachement, attachementType} = getAttachmentAndType();
    try {
      const id = uuid.v4().toString();
      if (!isConnected) {
        await handleOffline({
          attachement: attachement,
          attachementType: attachementType,
          id: id,
        });
      } else {
        await handleOnline({
          attachement: attachement,
          attachementType: attachementType,
          id: id,
        });
      }
      Toast.show({
        text1: `Transaction has been ${
          isEdit ? 'Updated' : 'Added'
        } Successfully`,
        type: 'custom',
        swipeable: false,
      });
      navigation.pop();
      dispatch(setLoading(false));
    } catch (e) {
      dispatch(setLoading(false));
    }
  };
  useEffect(() => {
    setFirstTime(false);
    if (isEdit) {
      setPrevAmt(prevTransaction?.amount);
    }
  }, []);
  console.log(prevAmt);
  useEffect(() => {
    setCatColors(
      Object.values(pageType === 'expense' ? expenseCat! : incomeCat!).reduce(
        (acc: {[key: string]: string}, item) => {
          acc[item] = getMyColor();
          return acc;
        },
        {},
      ),
    );
    return () => {
      setCatColors(undefined);
    };
  }, [pageType, expenseCat, incomeCat]);
  useEffect(() => {
    const back = BackHandler.addEventListener('hardwareBackPress', () => {
      if (
        pageType === 'transfer' &&
        (((amount.replace(/,/g, '').trim() !== '' ||
          amount.replace(/,/g, '').trim() !== '0') &&
          amount.replace(/,/g, '').trim() === '.') ||
          Number(amount.replace(/,/g, '')) > 0 ||
          from !== '' ||
          to !== '')
      ) {
        Alert.alert(
          'Discard changes?',
          'You have unsaved changes. Are you sure you want to discard them and leave the screen?',
          [
            {
              text: 'No',
            },
            {text: 'Yes', onPress: () => [navigation.goBack()]},
          ],
        );
      } else if (
        pageType !== 'transfer' &&
        (((amount.replace(/,/g, '').trim() !== '' ||
          amount.replace(/,/g, '').trim() !== '0') &&
          amount.replace(/,/g, '').trim() === '.') ||
          Number(amount.replace(/,/g, '')) > 0 ||
          category !== '' ||
          wallet !== '')
      ) {
        Alert.alert(
          'Discard changes?',
          'You have unsaved changes. Are you sure you want to discard them and leave the screen?',
          [
            {
              text: 'No',
            },
            {text: 'Yes', onPress: () => [navigation.goBack()]},
          ],
        );
      } else {
        navigation.goBack();
      }
      return true;
    });
    return () => back.remove();
  });
  return (
    <>
      <KeyboardAwareScrollView
        style={{backgroundColor: backgroundColor}}
        contentContainerStyle={{flexGrow: 1}}>
        <SafeAreaView
          style={[
            styles.safeView,
            {
              backgroundColor: backgroundColor,
              height:
                Platform.OS !== 'ios'
                  ? pageType !== 'transfer'
                    ? Dimensions.get('screen').height / 3.138
                    : Dimensions.get('screen').height / 2.06
                  : pageType !== 'transfer'
                  ? Dimensions.get('screen').height / 2.65
                  : Dimensions.get('screen').height / 1.85,
            },
          ]}>
          <CustomHeader
            backgroundColor={getBackgroundColor}
            title={pageType[0].toUpperCase() + pageType.slice(1)}
            navigation={navigation}
            onPress={() => {
              if (
                pageType === 'transfer'
                  ? ((amount.replace(/,/g, '').trim() !== '' ||
                      amount.replace(/,/g, '').trim() !== '0') &&
                      amount.replace(/,/g, '').trim() === '.') ||
                    Number(amount.replace(/,/g, '')) > 0 ||
                    from !== '' ||
                    to !== ''
                  : ((amount.replace(/,/g, '').trim() !== '' ||
                      amount.replace(/,/g, '').trim() !== '0') &&
                      amount.replace(/,/g, '').trim() === '.') ||
                    Number(amount.replace(/,/g, '')) > 0 ||
                    category !== '' ||
                    wallet !== ''
              ) {
                Alert.alert(
                  'Discard changes?',
                  'You have unsaved changes. Are you sure you want to discard them and leave the screen?',
                  [
                    {
                      text: 'No',
                    },
                    {text: 'Yes', onPress: () => [navigation.goBack()]},
                  ],
                );
              } else {
                navigation.goBack();
              }
            }}
          />
          <MoneyInput
            amount={amount}
            currency={currency!}
            formKey={formKey}
            setAmount={setAmount}
          />
        </SafeAreaView>
        <View style={styles.detailsCtr}>
          {pageType !== 'transfer' && (
            <>
              <CustomDropdown
                data={(pageType === 'expense' ? expenseCat! : incomeCat!)?.map(
                  item => {
                    return {
                      label:
                        item === 'add'
                          ? 'ADD NEW CATEGORY'
                          : item[0].toUpperCase() + item.slice(1),
                      value: item,
                    };
                  },
                )}
                onChange={val => {
                  if (val.value === 'add') {
                    addCategorySheetRef.current?.present();
                  } else {
                    setCategory(val.value);
                  }
                }}
                value={category}
                placeholder={STRINGS.Category}
                leftIcon={visible => {
                  return !visible && category !== '' ? (
                    <View
                      style={{
                        height: 15,
                        width: 15,
                        backgroundColor: catColors?.[category ?? ''] ?? 'green',
                        borderRadius: 20,
                        marginRight: 8,
                      }}
                    />
                  ) : undefined;
                }}
                catColors={catColors}
              />
              <EmptyError
                errorText={STRINGS.PleaseSelectACategory}
                value={category!}
                formKey={formKey}
              />
            </>
          )}
          {pageType === 'transfer' && (
            <>
              <View style={styles.transferRow}>
                <View style={styles.flex}>
                  <CustomInput
                    placeholderText={'From'}
                    onChangeText={(str: string) => {
                      setFrom(str);
                    }}
                    type="name"
                    value={from}
                    inputColor={COLOR.DARK[100]}
                  />
                </View>
                <View style={[styles.transferIcon, {zIndex: zindex}]}>
                  {ICONS.Transfer2({height: 25, width: 25})}
                </View>
                <View style={styles.flex}>
                  <CustomInput
                    placeholderText={'To'}
                    onChangeText={(str: string) => {
                      setTo(str);
                    }}
                    type="name"
                    value={to}
                    inputColor={COLOR.DARK[100]}
                  />
                </View>
              </View>
              <CompundEmptyError
                errorText="Please fill both the fields."
                value1={to}
                value2={from}
                formKey={formKey}
              />
            </>
          )}
          <CustomInput
            placeholderText={STRINGS.Description}
            onChangeText={(str: string) => {
              setDesc(str);
            }}
            type="sentence"
            value={desc}
            inputColor={COLOR.DARK[100]}
          />
          <Spacer height={24} />
          {pageType !== 'transfer' && (
            <>
              <CustomDropdown
                data={[
                  {label: 'Paypal', value: 'paypal'},
                  {label: 'Chase', value: 'chase'},
                ]}
                onChange={val => {
                  setWallet(val.value);
                }}
                value={wallet}
                placeholder={STRINGS.Wallet}
              />
              <EmptyError
                errorText={STRINGS.PleaseSelectAWallet}
                value={wallet}
                formKey={formKey}
              />
            </>
          )}
          <AttachementContainer
            doc={doc}
            filePickSheetRef={filePickSheetRef}
            image={image!}
            setDoc={setDoc}
            setImage={setImage}
            setZindex={setZindex}
            zindex={zindex}
          />
          <Spacer height={20} />
          <RepeatInput
            firstTime={firstTime}
            isEdit={isEdit}
            pageType={pageType}
            repeatData={repeatData}
            setRepeatData={setRepeatData}
            repeatSheetRef={repeatSheetRef}
            isSwitchOn={isSwitchOn}
            setIsSwitchOn={setIsSwitchOn}
          />
          <Spacer height={20} />
          <CustomButton title={STRINGS.Continue} onPress={handlePress} />
          <Spacer height={20} />
        </View>
        <BottomSheetModalProvider>
          <AddCategorySheet
            bottomSheetModalRef={addCategorySheetRef}
            type={pageType}
            setMyCategory={setCategory}
          />
        </BottomSheetModalProvider>
      </KeyboardAwareScrollView>
      <BottomSheetModalProvider>
        <FilePickerSheet
          onDismiss={() => {
            setZindex(1);
          }}
          bottomSheetModalRef={filePickSheetRef}
          setDoc={setDoc}
          setImage={setImage}
        />
        <RepeatTransactionSheet
          bottomSheetModalRef={repeatSheetRef}
          setRepeatData={setRepeatData}
          repeatData={repeatData}
          setIsSwitchOn={setIsSwitchOn}
        />
      </BottomSheetModalProvider>
    </>
  );
}

export default React.memo(AddExpense);
