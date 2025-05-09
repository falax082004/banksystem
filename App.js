import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

// Core Screens
import SplashScreen from './screens/SplashScreen';
import RegisterScreen from './screens/RegisterScreen';
import LoginScreen from './screens/LoginScreen';
import DepositScreen from './screens/DepositScreen';
import TransferScreen from './screens/TransferScreen';
import BillScreen from './screens/BillScreen';
import BottomTabs from './screens/BottomTabs';

// Profile Destination Screens
import MyLinkedAccountsScreen from './screens/MyLinkedAccountsScreen';
import MyQRCodeScreen from './screens/MyQRCodeScreen';
import ProfileLimitsScreen from './screens/ProfileLimitsScreen';
import ManageCardsScreen from './screens/ManageCardsScreen';
import InvestmentScreen from './screens/InvestmentScreen';
import CharityScreen from './screens/CharityScreen';
import ReferFriendsScreen from './screens/ReferFriendsScreen';
import SettingsScreen from './screens/SettingsScreen';
import ProfileEdit from './screens/ProfileEdit';
import HelpScreen from './screens/HelpScreen';
import TermsScreen from './screens/TermsScreen';
import CardScreen from './screens/CardScreen';
import LockCardScreen from './screens/LockCardScreen';
import InboxScreen from './screens/InboxScreen';

const Stack = createStackNavigator();

// Common screen options
const commonScreenOptions = {
  headerStyle: { backgroundColor: '#333' },
  headerTitleStyle: { color: '#fff' },
  headerShown: true,
};

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Splash" screenOptions={{ headerShown: false }}>
        {/* Core Screens */}
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Home" component={BottomTabs} />
        <Stack.Screen name="Deposit" component={DepositScreen} />
        <Stack.Screen name="Transfer" component={TransferScreen} />
        <Stack.Screen name="PayBills" component={BillScreen} />

        {/* Profile Destination Screens */}
        <Stack.Screen
          name="My Linked Accounts"
          component={MyLinkedAccountsScreen}
          options={commonScreenOptions}
        />
        <Stack.Screen
          name="MyQRCode"
          component={MyQRCodeScreen}
          options={commonScreenOptions}
        />
        <Stack.Screen
          name="ProfileLimits"
          component={ProfileLimitsScreen}
          options={commonScreenOptions}
        />
        <Stack.Screen
          name="ManageCards"
          component={ManageCardsScreen}
          options={commonScreenOptions}
        />
        <Stack.Screen
          name="Investment"
          component={InvestmentScreen}
          options={commonScreenOptions}
        />
        <Stack.Screen
          name="Charity"
          component={CharityScreen}
          options={commonScreenOptions}
        />
        <Stack.Screen
          name="ReferFriends"
          component={ReferFriendsScreen}
          options={commonScreenOptions}
        />
        <Stack.Screen
          name="Settings"
          component={SettingsScreen}
          options={commonScreenOptions}
        />
        <Stack.Screen
          name="Terms"
          component={TermsScreen}
          options={commonScreenOptions}
        />
        <Stack.Screen
          name="ProfileEdit"
          component={ProfileEdit}
          options={commonScreenOptions}
        />
        <Stack.Screen
          name="Help"
          component={HelpScreen}
          options={commonScreenOptions}
        />
        <Stack.Screen
          name="Inbox"
          component={InboxScreen}
          options={{
            ...commonScreenOptions,
            title: 'Inbox',
          }}
        />
        <Stack.Screen
          name="CardScreen"
          component={CardScreen}
          options={{
            ...commonScreenOptions,
            title: 'Card',
          }}
        />
        <Stack.Screen
          name="LockCardScreen"
          component={LockCardScreen}
          options={{
            ...commonScreenOptions,
            title: 'Lock Card',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}