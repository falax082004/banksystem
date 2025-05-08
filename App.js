import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

// Core Screens
import SplashScreen from './screens/SplashScreen';
import RegisterScreen from './screens/RegisterScreen';
import LoginScreen from './screens/LoginScreen';
import DepositScreen from './screens/DepositScreen';
import TransferScreen from './screens/TransferScreen';
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
import CardScreen from './screens/CardScreen';
import LockCardScreen from './screens/LockCardScreen';
// Inbox Screen (new screen)
import InboxScreen from './screens/InboxScreen'; // Ensure this is imported correctly

const Stack = createStackNavigator();

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

        {/* Profile Destination Screens */}
        <Stack.Screen
          name="My Linked Accounts"
          component={MyLinkedAccountsScreen}
          options={{
            headerStyle: { backgroundColor: '#333' },
            headerTitleStyle: { color: '#fff' },
            headerShown: true,
          }}
        />
        <Stack.Screen
          name="MyQRCode"
          component={MyQRCodeScreen}
          options={{
            headerStyle: { backgroundColor: '#333' },
            headerTitleStyle: { color: '#fff' },
            headerShown: true,
          }}
        />
        <Stack.Screen
          name="ProfileLimits"
          component={ProfileLimitsScreen}
          options={{
            headerStyle: { backgroundColor: '#333' },
            headerTitleStyle: { color: '#fff' },
            headerShown: true,
          }}
        />
        <Stack.Screen
          name="ManageCards"
          component={ManageCardsScreen}
          options={{
            headerStyle: { backgroundColor: '#333' },
            headerTitleStyle: { color: '#fff' },
            headerShown: true,
          }}
        />
        <Stack.Screen
          name="Investment"
          component={InvestmentScreen}
          options={{
            headerStyle: { backgroundColor: '#333' },
            headerTitleStyle: { color: '#fff' },
            headerShown: true,
          }}
        />
          <Stack.Screen
          name="Charity"
          component={CharityScreen}
          options={{
            headerStyle: { backgroundColor: '#333' },
            headerTitleStyle: { color: '#fff' },
            headerShown: true,
          }}
        />
        <Stack.Screen
          name="ReferFriends"
          component={ReferFriendsScreen}
          options={{
            headerStyle: { backgroundColor: '#333' },
            headerTitleStyle: { color: '#fff' },
            headerShown: true,
          }}
        />
        <Stack.Screen
          name="Settings"
          component={SettingsScreen}
          options={{
            headerStyle: { backgroundColor: '#333' },
            headerTitleStyle: { color: '#fff' },
            headerShown: true,
          }}
          />
        <Stack.Screen
          name="ProfileEdit"
          component={ProfileEdit}
          options={{
            headerStyle: { backgroundColor: '#333' },
            headerTitleStyle: { color: '#fff' },
            headerShown: true,
          }}
        />
        <Stack.Screen
          name="Help"
          component={HelpScreen}
          options={{
            headerStyle: { backgroundColor: '#333' },
            headerTitleStyle: { color: '#fff' },
            headerShown: true,
          }}
        />

        {/* Inbox Screen */}
        <Stack.Screen
          name="Inbox"
          component={InboxScreen} // This is the Inbox screen
          options={{
            headerStyle: { backgroundColor: '#333' },
            headerTitleStyle: { color: '#fff' },
            headerShown: true,
            title: 'Inbox',
            
          }}
          />
          <Stack.Screen
          name="CardScreen"
          component={CardScreen} // This is the Inbox screen
          options={{
            headerStyle: { backgroundColor: '#333' },
            headerTitleStyle: { color: '#fff' },
            headerShown: true,
            title: 'CardScreen',
          }}
          />
          <Stack.Screen
          name="LockCardScreen"
          component={LockCardScreen} // This is the Inbox screen
          options={{
            headerStyle: { backgroundColor: '#333' },
            headerTitleStyle: { color: '#fff' },
            headerShown: true,
            title: 'LockCardScreen',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
