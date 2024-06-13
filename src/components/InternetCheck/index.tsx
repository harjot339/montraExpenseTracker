import React from 'react';
import {Text, View} from 'react-native';
import styles from './styles';
import {useAppTheme} from '../../hooks/themeHook';
import { STRINGS } from '../../constants/strings';
// Third Party Libraries
import {useNetInfo} from '@react-native-community/netinfo';

function InternetCheck({children}: Readonly<{children: React.JSX.Element}>) {
  // constants
  const {isConnected} = useNetInfo();
  const COLOR = useAppTheme();
  return !isConnected ? (
    <>
      {children}
      <View style={styles.loader}>
        <Text
          style={[
            styles.text1,
            {backgroundColor: COLOR.DARK[100], color: COLOR.LIGHT[100]},
          ]}>
          {STRINGS.NoInternetAccess} {'\n'}
          <Text style={[styles.text2, {color: COLOR.DARK[25]}]}>
            {STRINGS.CheckInternet}
          </Text>
        </Text>
      </View>
    </>
  ) : (
    children
  );
}

export default InternetCheck;
