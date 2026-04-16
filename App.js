import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

// Core Screens
import SplashScreen from './screens/SplashScreen';
import WelcomeScreen from './screens/WelcomeScreen';
import RegisterScreen from './screens/RegisterScreen';
import LoginScreen from './screens/LoginScreen';
import BrowseBatangasStoresScreen from './screens/BrowseBatangasStoresScreen';
import CartScreen from './screens/CartScreen';
import OrdersScreen from './screens/OrdersScreen';
import TrackOrderScreen from './screens/TrackOrderScreen';
import RoleSelectionScreen from './screens/RoleSelectionScreen';
import BottomTabs from './screens/BottomTabs';
import NearbyOrdersScreen from './screens/NearbyOrdersScreen';
import ChatScreen from './screens/ChatScreen';
import VoucherScreen from './screens/VoucherScreen';
import StoreItemsScreen from './screens/StoreItemsScreen';
import InboxScreen from './screens/InboxScreen';
import DeliveryHistoryScreen from './screens/DeliveryHistoryScreen';
import PasabuyerRequestsScreen from './screens/PasabuyerRequestsScreen';
import EarningsScreen from './screens/EarningsScreen';
import AvailabilityScreen from './screens/AvailabilityScreen';
import PasapayWalletScreen from './screens/PasapayWalletScreen';
import NewPasabuyRequestScreen from './screens/NewPasabuyRequestScreen';
import NotificationsScreen from './screens/NotificationsScreen';

// Profile Destination Screens
import ReferFriendsScreen from './screens/ReferFriendsScreen';
// Removed bank-related Settings screen
import ProfileEdit from './screens/ProfileEdit';
import HelpScreen from './screens/HelpScreen';
import TermsScreen from './screens/TermsScreen';

const Stack = createStackNavigator();

// Common screen options
const commonScreenOptions = {
  headerShown: false,
};

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Splash" screenOptions={{ headerShown: false }}>
        {/* Core Screens */}
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Home" component={BottomTabs} />
        {/* Delivery screens */}
        <Stack.Screen name="Browse" component={BrowseBatangasStoresScreen} />
        <Stack.Screen name="StoreItems" component={StoreItemsScreen} />
        <Stack.Screen name="Cart" component={CartScreen} />
        <Stack.Screen name="Orders" component={OrdersScreen} />
        <Stack.Screen name="TrackOrder" component={TrackOrderScreen} />
        <Stack.Screen name="RoleSelection" component={RoleSelectionScreen} />
        <Stack.Screen name="NearbyOrders" component={NearbyOrdersScreen} />
        <Stack.Screen name="Chat" component={ChatScreen} />
        <Stack.Screen name="Inbox" component={InboxScreen} />
        <Stack.Screen name="Vouchers" component={VoucherScreen} options={commonScreenOptions} />
        <Stack.Screen name="DeliveryHistory" component={DeliveryHistoryScreen} options={commonScreenOptions} />
        <Stack.Screen name="PasabuyerRequests" component={PasabuyerRequestsScreen} options={commonScreenOptions} />
        <Stack.Screen name="Earnings" component={EarningsScreen} options={commonScreenOptions} />
        <Stack.Screen name="Availability" component={AvailabilityScreen} options={commonScreenOptions} />
        <Stack.Screen name="Pasapay" component={PasapayWalletScreen} options={{ headerShown: false }} />
        <Stack.Screen name="NewPasabuyRequest" component={NewPasabuyRequestScreen} options={commonScreenOptions} />
        <Stack.Screen name="Notifications" component={NotificationsScreen} options={commonScreenOptions} />

        {/* Profile Destination Screens */}
        <Stack.Screen
          name="ReferFriends"
          component={ReferFriendsScreen}
          options={commonScreenOptions}
        />
        {/* Settings removed */}
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
      </Stack.Navigator>
    </NavigationContainer>
  );
}