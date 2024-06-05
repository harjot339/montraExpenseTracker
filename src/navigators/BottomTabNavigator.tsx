import {
  BottomTabBarProps,
  createBottomTabNavigator,
} from '@react-navigation/bottom-tabs';
import Home from '../screens/Home';
import {NAVIGATION} from '../constants/strings';
import CustomTab from '../components/CustomTab';
import TransactionScreen from '../screens/Transactions';
import {View} from 'react-native';
import FilterSheet from '../components/FilterSheet';
import CategorySelectionSheet from '../components/CategorySelectionSheet';
import BudgetScreen from '../screens/Budgets';
import {BottomParamList} from '../defs/navigation';
import ProfileScreen from '../screens/Profile';
const Tab = createBottomTabNavigator<BottomParamList>();
function CustomTabBar(props: Readonly<BottomTabBarProps>) {
  return <CustomTab {...props} />;
}
function BottomTabNavigator() {
  return (
    <View style={{flex: 1}}>
      <Tab.Navigator screenOptions={{headerShown: false}} tabBar={CustomTabBar}>
        <Tab.Screen name={NAVIGATION.Home} component={Home} />
        <Tab.Screen
          name={NAVIGATION.Transaction}
          component={TransactionScreen}
        />
        <Tab.Screen name={NAVIGATION.Budget} component={BudgetScreen} />
        <Tab.Screen name={NAVIGATION.Profile} component={ProfileScreen} />
      </Tab.Navigator>
      <FilterSheet />
      <CategorySelectionSheet />
    </View>
  );
}

export default BottomTabNavigator;
