import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  Dimensions,
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import style from './styles';

import CustomInput from '../../components/CustomInput';
import {COLORS} from '../../constants/commonStyles';
import Sapcer from '../../components/Spacer';
import CustomDropdown from '../../components/CustomDropDown';
import {ICONS} from '../../constants/icons';
import {BottomSheetModal, BottomSheetModalProvider} from '@gorhom/bottom-sheet';
import FilePickerSheet from '../../components/FilePickerSheet';
import RepeatTransactionSheet from '../../components/RepeatTranscationSheet';
import firestore, {Timestamp} from '@react-native-firebase/firestore';
import {
  currencies,
  monthData,
  STRINGS,
  weekData,
} from '../../constants/strings';
import CustomButton from '../../components/CustomButton';
import {repeatDataType, transactionType} from '../../defs/transaction';
import {useAppDispatch, useAppSelector} from '../../redux/store';
import {setLoading} from '../../redux/reducers/userSlice';
import uuid from 'react-native-uuid';
import Toast from 'react-native-toast-message';
import {ExpenseScreenProps} from '../../defs/navigation';
import AddCategorySheet from '../../components/AddCategorySheet';
import {UserType} from '../../defs/user';
import {CompundEmptyError, EmptyError} from '../../constants/errors';
import {UserFromJson} from '../../utils/userFuncs';
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

function AddExpense({navigation, route}: Readonly<ExpenseScreenProps>) {
  // constants
  const COLOR = useAppTheme();
  const styles = style(COLOR);
  const pageType = route.params.type;
  const isEdit = route.params.isEdit;
  let transaction: transactionType | undefined;
  if (isEdit) {
    transaction = route.params.transaction;
    console.log(transaction);
  }
  const month = new Date().getMonth();
  const backgroundColor =
    pageType === 'expense'
      ? COLORS.PRIMARY.RED
      : pageType === 'transfer'
      ? COLORS.PRIMARY.BLUE
      : COLORS.PRIMARY.GREEN;
  const dispatch = useAppDispatch();
  useEffect(() => {
    navigation.setOptions({
      title: pageType[0].toUpperCase() + pageType.slice(1),
    });
  }, [pageType]);
  // redux use
  const conversion = useAppSelector(state => state.transaction.conversion);
  const expenseCat = useAppSelector(
    state => state.user.currentUser?.expenseCategory,
  );
  const incomeCat = useAppSelector(
    state => state.user.currentUser?.incomeCategory,
  );
  const uid = useAppSelector(state => state.user.currentUser?.uid);
  const currency = useAppSelector(state => state.user.currentUser?.currency);
  // state
  const [image, setImage] = useState(
    transaction && transaction.attachementType === 'image'
      ? transaction.attachement
      : '',
  );
  const [doc, setDoc] = useState<{uri: string; name: string} | undefined>(
    transaction && transaction.attachementType === 'doc'
      ? {uri: transaction.attachement!, name: 'Document'}
      : undefined,
  );
  const [repeatData, setRepeatData] = useState<repeatDataType | undefined>(
    transaction ? transaction.freq! : undefined,
  );
  const [desc, setDesc] = useState(transaction ? transaction.desc : '');
  const [zindex, setZindex] = useState(1);
  const [amount, setAmount] = useState(
    transaction
      ? Number(
          (
            conversion.usd[(currency ?? 'USD').toLowerCase()] *
            transaction.amount
          ).toFixed(1),
        ).toString()
      : '',
  );
  const [category, setCategory] = useState(
    transaction ? transaction.category : '',
  );
  const [wallet, setWallet] = useState(transaction ? transaction.wallet : '');
  const [from, setFrom] = useState(transaction ? transaction.from : '');
  const [to, setTo] = useState(transaction ? transaction.to : '');
  const [formKey, setFormKey] = useState(false);
  // refs
  const filePickSheetRef = useRef<BottomSheetModal>(null);
  const repeatSheetRef = useRef<BottomSheetModal>(null);
  const addCategorySheetRef = useRef<BottomSheetModal>(null);

  // functions
  const getAttachmentAndType = useCallback(() => {
    let attachement = '';
    let attachementType: transactionType['attachementType'] = 'none';
    if (image !== '') {
      attachement = image!;
      attachementType = 'image';
    } else if (doc) {
      attachement = doc.uri;
      attachementType = 'doc';
    }
    return {attachement, attachementType};
  }, [image, doc]);

  const handlePress = useCallback(async () => {
    setFormKey(true);
    if (pageType === 'transfer' && (from === '' || to === '')) {
      return;
    }
    if (
      pageType !== 'transfer' &&
      (amount === '' || category === '' || wallet === '')
    ) {
      return;
    }
    dispatch(setLoading(true));
    const {attachement, attachementType} = getAttachmentAndType();
    try {
      const id = uuid.v4().toString();
      const curr = await firestore().collection('users').doc(uid).get();
      const url = await getAttachmentUrl({
        attachement: attachement,
        id: id,
        uid: uid!,
      });
      const trans = createTransaction({
        id: id,
        url: url,
        attachementType: attachementType,
        amount: amount,
        category: category,
        conversion: conversion,
        currency: currency!,
        desc: desc,
        isEdit: isEdit,
        pageType: pageType,
        repeatData: repeatData!,
        transaction: transaction!,
        wallet: wallet,
        uid: uid!,
        from: from,
        to: to,
      });

      if (isEdit) {
        await updateTransaction({
          trans: trans,
          transId: transaction?.id!,
          uid: uid!,
        });
        if (pageType === 'expense') {
          await handleExpenseUpdate({
            curr: curr,
            amount: Number(amount),
            category: category,
            conversion: conversion,
            currency: currency!,
            month: month,
            transaction: transaction!,
            uid: uid!,
          });
          const totalSpent =
            UserFromJson(curr.data() as UserType)?.spend?.[month]?.[category] ??
            0 - transaction!.amount + Number(amount);
          await handleNotify({
            curr: curr,
            totalSpent: totalSpent,
            category: category,
            month: month,
            uid: uid!,
          });
        } else if (pageType === 'income') {
          await handleIncomeUpdate({
            curr: curr,
            amount: Number(amount),
            category: category,
            conversion: conversion,
            currency: currency!,
            month: month,
            transaction: transaction!,
            uid: uid!,
          });
        }
      } else {
        await addNewTransaction({id: id, trans: trans, uid: uid!});
        if (pageType === 'expense') {
          await handleNewExpense({
            curr: curr,
            amount: Number(amount),
            category: category,
            conversion: conversion,
            currency: currency!,
            month: month,
            uid: uid!,
          });
          const totalSpent =
            (UserFromJson(curr.data() as UserType)?.spend[month]?.[category] ??
              0) + Number(amount);
          await handleNotify({
            curr: curr,
            totalSpent: totalSpent,
            category: category,
            month: month,
            uid: uid!,
          });
        } else if (pageType === 'income') {
          await handleNewIncome({
            curr: curr,
            amount: Number(amount),
            category: category,
            conversion: conversion,
            currency: currency!,
            month: month,
            uid: uid!,
          });
        }
      }
      Toast.show({
        text1: 'Transaction has been Added Succesfully',
        type: 'custom',
      });
      navigation.pop();
      dispatch(setLoading(false));
    } catch (e) {
      dispatch(setLoading(false));
    }
  }, [pageType, amount, category, wallet, from, to]);

  return (
    <>
      <KeyboardAwareScrollView
        style={[{backgroundColor: backgroundColor}]}
        contentContainerStyle={[
          {backgroundColor: backgroundColor, flexGrow: 1},
        ]}
        enableOnAndroid={true}>
        <SafeAreaView
          style={[
            styles.safeView,
            {
              backgroundColor: backgroundColor,
            },
          ]}>
          <View
            style={[
              styles.mainView,
              {
                height:
                  pageType === 'transfer'
                    ? Dimensions.get('screen').height / 2
                    : Dimensions.get('screen').height / 3.2,
              },
            ]}>
            <Text style={styles.text1}>{STRINGS.HowMuch}</Text>
            <View style={styles.moneyCtr}>
              <Text style={styles.text2}>{currencies[currency!].symbol}</Text>
              <TextInput
                style={styles.input}
                maxLength={6}
                onChangeText={(str: string) => {
                  let numericValue = str.replace(/[^0-9.]+/g, '');
                  const decimalCount = numericValue.split('.').length - 1;
                  if (decimalCount > 1) {
                    const parts = numericValue.split('.');
                    numericValue = parts[0] + '.' + parts.slice(1).join('');
                  }
                  setAmount(numericValue);
                }}
                value={amount}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.amtError}>
              <EmptyError
                errorText={STRINGS.PleaseFillAnAmount}
                value={amount}
                formKey={formKey}
                color={COLORS.LIGHT[100]}
                size={18}
              />
            </View>
          </View>
        </SafeAreaView>
        <View style={styles.detailsCtr}>
          {pageType !== 'transfer' && (
            <CustomDropdown
              data={(pageType === 'expense' ? expenseCat! : incomeCat!)?.map(
                item => {
                  return {
                    label:
                      item === 'add'
                        ? 'Add new Category'
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
            />
          )}
          {pageType === 'transfer' && (
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
          )}
          {pageType === 'transfer' && (
            <CompundEmptyError
              errorText="Please fill both the fields."
              value1={to}
              value2={from}
              formKey={formKey}
            />
          )}
          {pageType !== 'transfer' && (
            <EmptyError
              errorText={STRINGS.PleaseSelectACategory}
              value={category}
              formKey={formKey}
            />
          )}
          <CustomInput
            placeholderText={STRINGS.Description}
            onChangeText={(str: string) => {
              setDesc(str);
            }}
            type="name"
            value={desc}
            inputColor={COLOR.DARK[100]}
          />
          <Sapcer height={24} />
          {pageType !== 'transfer' && (
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
          )}
          {pageType !== 'transfer' && (
            <EmptyError
              errorText={STRINGS.PleaseSelectAWallet}
              value={wallet}
              formKey={formKey}
            />
          )}
          {image === '' && doc === undefined ? (
            <Pressable
              style={styles.attachementCtr}
              onPress={() => {
                setZindex(0);
                filePickSheetRef.current?.present();
              }}>
              {ICONS.Attachment({
                height: 25,
                width: 25,
                color: COLOR.DARK[100],
              })}
              <Text style={styles.attachementText}>
                {STRINGS.AddAttachement}
              </Text>
            </Pressable>
          ) : doc === undefined ? (
            <View>
              <Pressable
                onPress={() => {
                  setImage('');
                }}
                style={[styles.closeIcon, {left: 90, zIndex: zindex}]}>
                {ICONS.Close({height: 20, width: 20})}
              </Pressable>
              <Image
                source={{uri: image}}
                height={110}
                width={110}
                style={{borderRadius: 10}}
              />
            </View>
          ) : (
            <View>
              <Pressable
                onPress={() => {
                  setDoc(undefined);
                }}
                style={[styles.closeIcon, {left: 100, zIndex: zindex}]}>
                {ICONS.Close({height: 20, width: 20})}
              </Pressable>
              <Pressable
                style={[styles.sheetBtn, {paddingHorizontal: 10}]}
                onPress={() => {}}>
                {ICONS.Document({height: 30, width: 30})}
                <Text style={styles.sheetBtnText}>{doc.name}</Text>
              </Pressable>
            </View>
          )}
          <Sapcer height={20} />
          {pageType !== 'transfer' && (
            <View style={styles.flexRow}>
              <View>
                <Text style={styles.flexRowText1}>{STRINGS.Repeat}</Text>
                <Text style={styles.flexRowText2}>
                  {STRINGS.RepeatTransaction}
                </Text>
              </View>
              <Switch
                trackColor={{
                  false: COLORS.VIOLET[20],
                  true: COLORS.VIOLET[100],
                }}
                ios_backgroundColor={COLORS.VIOLET[20]}
                onValueChange={val => {
                  if (val) {
                    repeatSheetRef.current?.present({
                      isEdit: isEdit,
                      transaction: transaction,
                    });
                  } else {
                    setRepeatData(undefined);
                  }
                }}
                value={repeatData !== undefined && repeatData !== null}
              />
            </View>
          )}
          {pageType !== 'transfer' && <Sapcer height={20} />}
          {repeatData && (
            <View style={styles.flexRow}>
              <View>
                <Text style={styles.flexRowText1}>{STRINGS.Frequency}</Text>
                <Text style={styles.flexRowText2}>
                  {repeatData.freq[0].toUpperCase() + repeatData.freq.slice(1)}
                  {repeatData.freq !== 'daily' && ' - '}
                  {repeatData.freq === 'yearly' &&
                    monthData[repeatData.month! - 1].label}{' '}
                  {(repeatData.freq === 'yearly' ||
                    repeatData.freq === 'monthly') &&
                    repeatData.day}
                  {repeatData.freq === 'weekly' &&
                    weekData[repeatData.weekDay].label}
                </Text>
              </View>
              {repeatData.end === 'date' && (
                <View>
                  <Text style={styles.flexRowText1}>{STRINGS.EndAfter}</Text>
                  <Text style={styles.flexRowText2}>
                    {isEdit
                      ? (repeatData.date as Timestamp)?.seconds !== undefined
                        ? (repeatData.date as Timestamp)
                            .toDate()
                            .toLocaleDateString()
                        : (repeatData.date as Date)?.toLocaleDateString()
                      : (repeatData.date as Date)?.toLocaleDateString()}
                  </Text>
                </View>
              )}
              <Pressable
                style={styles.editBtn}
                onPress={() => {
                  repeatSheetRef.current?.present({
                    isEdit: isEdit,
                    transaction: transaction,
                  });
                }}>
                <Text style={styles.editBtnText}>Edit</Text>
              </Pressable>
            </View>
          )}
          <Sapcer height={20} />
          <CustomButton title={STRINGS.Continue} onPress={handlePress} />
          <Sapcer height={20} />
        </View>
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
        />
        <AddCategorySheet
          bottomSheetModalRef={addCategorySheetRef}
          type={pageType}
        />
      </BottomSheetModalProvider>
    </>
  );
}

export default AddExpense;
