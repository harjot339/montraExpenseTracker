import {
  BottomSheetModal,
  BottomSheetModalProvider,
  BottomSheetView,
} from '@gorhom/bottom-sheet';
import React, {useCallback, useEffect, useMemo, useRef} from 'react';
import {Text, View} from 'react-native';
import CustomButton from '../CustomButton';
import {useAppDispatch, useAppSelector} from '../../redux/store';
import style from './styles';
import {COLORS} from '../../constants/commonStyles';
import {setTheme, userLoggedIn} from '../../redux/reducers/userSlice';
import SheetBackdrop from '../SheetBackDrop';
import {STRINGS} from '../../constants/strings';
import {useAppTheme} from '../../hooks/themeHook';
// Third Party Libraries
import {BottomSheetModalMethods} from '@gorhom/bottom-sheet/lib/typescript/types';
import auth from '@react-native-firebase/auth';
import {openLogoutSheet} from '../../redux/reducers/transactionSlice';
import {useRealm} from '@realm/react';
import {GoogleSignin} from '@react-native-google-signin/google-signin';
import {useNetInfo} from '@react-native-community/netinfo';
import Toast from 'react-native-toast-message';
function LogoutSheet() {
  // constants
  const COLOR = useAppTheme();
  const styles = style(COLOR);
  const dispatch = useAppDispatch();
  const authTheme = useAppSelector(state => state.user.currentUser?.theme);
  const snapPoints = useMemo(() => ['25%'], []);
  const ref = useRef<BottomSheetModalMethods>(null);
  const realm = useRealm();
  const {isConnected} = useNetInfo();
  // redux
  const isOpen = useAppSelector(state => state.transaction.isLogoutOpen);
  // functions
  const onLogout = useCallback(async () => {
    try {
      if (!isConnected) {
        ref.current?.dismiss();
        Toast.show({text1: 'No Internet', type: 'error'});
        return;
      }
      if (await GoogleSignin.isSignedIn()) {
        await GoogleSignin.signOut();
      } else {
        await auth().signOut();
      }
      // console.log('auththeme', authTheme);
      dispatch(setTheme(authTheme));
      dispatch(userLoggedIn(undefined));
      dispatch(openLogoutSheet(false));
      realm.write(() => {
        realm.deleteAll();
      });
    } catch (e) {
      console.log(e);
    }
  }, [authTheme, isConnected]);
  useEffect(() => {
    if (isOpen === true) {
      ref.current?.present();
    } else {
      ref.current?.close();
    }
  }, [isOpen]);
  return (
    <BottomSheetModalProvider>
      <BottomSheetModal
        enablePanDownToClose
        ref={ref}
        index={0}
        snapPoints={snapPoints}
        backdropComponent={SheetBackdrop}
        backgroundStyle={styles.sheetBack}
        handleIndicatorStyle={{backgroundColor: COLOR.VIOLET[40]}}
        onDismiss={() => {
          dispatch(openLogoutSheet(false));
        }}>
        <BottomSheetView style={styles.sheetView}>
          <Text style={styles.text1}>{STRINGS.Logout}</Text>
          <Text style={styles.text2}>{STRINGS.SureLogout}</Text>
          <View style={styles.BtnRow}>
            <View style={styles.flex}>
              <CustomButton
                title={STRINGS.No}
                onPress={() => {
                  dispatch(openLogoutSheet(false));
                }}
                backgroundColor={COLORS.VIOLET[20]}
                textColor={COLORS.VIOLET[100]}
              />
            </View>
            <View style={styles.flex}>
              <CustomButton title={STRINGS.Yes} onPress={onLogout} />
            </View>
          </View>
        </BottomSheetView>
      </BottomSheetModal>
    </BottomSheetModalProvider>
  );
}

export default LogoutSheet;
