import React from 'react';
import {GoogleSignin} from '@react-native-google-signin/google-signin';
import {NavigationContainer} from '@react-navigation/native';
import RootNavigator from './navigators/RootNavigator';
import {Provider} from 'react-redux';
import store, {persistor} from './redux/store';
import {PersistGate} from 'redux-persist/integration/react';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import Loader from './components/Loader';
import Toast from 'react-native-toast-message';
import { enableFreeze, enableScreens } from 'react-native-screens';

enableFreeze(true);
enableScreens(false);
GoogleSignin.configure({
  webClientId:"426728684733-08hbgavcdljaclium152ea992drr4ev3.apps.googleusercontent.com"
});
function App(): React.JSX.Element {
  return (
    <GestureHandlerRootView style={{flex: 1}}>
      <Provider store={store}>
        <PersistGate persistor={persistor}>
          <Loader>
            <NavigationContainer>
              <RootNavigator />
              <Toast/>
            </NavigationContainer>
          </Loader>
        </PersistGate>
      </Provider>
    </GestureHandlerRootView>
  );
}

export default App;
