import React, { useEffect, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import ProfileScreen from './ProfileScreen';
import BrowseBatangasStoresScreen from './BrowseBatangasStoresScreen';
import OrdersScreen from './OrdersScreen';
import InboxScreen from './InboxScreen';
import RiderInboxScreen from './RiderInboxScreen';
import PasabuyerInboxScreen from './PasabuyerInboxScreen';
import { db, ref, get, onValue, off } from '../firebaseConfig';
import EarningsScreen from './EarningsScreen';
import NearbyOrdersScreen from './NearbyOrdersScreen';

const Tab = createBottomTabNavigator();

const BottomTabs = ({ route }) => {
  const { userId } = route.params || {};
  const [role, setRole] = useState(null);
  const [pasabuyerEnabled, setPasabuyerEnabled] = useState(false);

  useEffect(() => {
    if (!userId) return;
    const userRef = ref(db, `users/${userId}`);
    const unsubscribe = onValue(userRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        setRole(data.role || null);
        setPasabuyerEnabled(!!data.pasabuyerEnabled);
      }
    });
    return () => off(userRef, 'value', unsubscribe);
  }, [userId]);

  // With realtime subscription above, extra refresh on focus is unnecessary

  return (
    <Tab.Navigator
      screenOptions={() => ({
        tabBarActiveTintColor: '#ffffff',
        tabBarInactiveTintColor: '#bbb',
        tabBarStyle: {
          backgroundColor: '#1c1c1c',
          borderTopWidth: 0.5,
          borderTopColor: '#444',
          height: 70,
          paddingBottom: 10,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        headerShown: false,
      })}
    >
      {role === 'rider' ? (
        <>
          <Tab.Screen
            name="Available"
            component={NearbyOrdersScreen}
            initialParams={{ userId }}
            options={{
              tabBarIcon: ({ focused, color, size }) => (
                <Ionicons name={focused ? 'map' : 'map-outline'} size={size} color={color} />
              ),
              tabBarLabel: 'Available',
            }}
          />
          <Tab.Screen
            name="Deliveries"
            component={OrdersScreen}
            initialParams={{ userId, viewerRole: 'rider' }}
            options={{
              tabBarIcon: ({ focused, color, size }) => (
                <Ionicons name={focused ? 'bicycle' : 'bicycle-outline'} size={size} color={color} />
              ),
              tabBarLabel: 'Deliveries',
            }}
          />
          <Tab.Screen
            name="Earnings"
            component={EarningsScreen}
            initialParams={{ userId }}
            options={{
              tabBarIcon: ({ focused, color, size }) => (
                <Ionicons name={focused ? 'wallet' : 'wallet-outline'} size={size} color={color} />
              ),
            }}
          />
          <Tab.Screen
            name="Inbox"
            component={RiderInboxScreen}
            initialParams={{ userId }}
            options={{
              tabBarIcon: ({ focused, color, size }) => (
                <Ionicons name={focused ? 'chatbubbles' : 'chatbubbles-outline'} size={size} color={color} />
              ),
            }}
          />
          <Tab.Screen
            name="Profile"
            component={ProfileScreen}
            initialParams={{ userId }}
            options={{
              tabBarIcon: ({ focused, color, size }) => (
                <Ionicons name={focused ? 'person' : 'person-outline'} size={size} color={color} />
              ),
            }}
          />
        </>
      ) : (
        <>
          {pasabuyerEnabled && (
            <Tab.Screen
              name="Nearby"
              component={NearbyOrdersScreen}
              initialParams={{ userId }}
              options={{
                tabBarIcon: ({ focused, color, size }) => (
                  <Ionicons name={focused ? 'map' : 'map-outline'} size={size} color={color} />
                ),
                tabBarLabel: 'Nearby',
              }}
            />
          )}
          {pasabuyerEnabled && (
            <Tab.Screen
              name="MyJobs"
              component={OrdersScreen}
              initialParams={{ userId, viewerRole: 'rider' }}
              options={{
                tabBarIcon: ({ focused, color, size }) => (
                  <Ionicons name={focused ? 'briefcase' : 'briefcase-outline'} size={size} color={color} />
                ),
                tabBarLabel: 'Requests',
              }}
            />
          )}
          <Tab.Screen
            name="Browse"
            component={BrowseBatangasStoresScreen}
            initialParams={{ userId }}
            options={{
              tabBarIcon: ({ focused, color, size }) => (
                <Ionicons name={focused ? 'restaurant' : 'restaurant-outline'} size={size} color={color} />
              ),
              tabBarLabel: 'My Area',
            }}
          />
          <Tab.Screen
            name="Inbox"
            component={pasabuyerEnabled ? PasabuyerInboxScreen : InboxScreen}
            initialParams={{ userId, viewerRole: pasabuyerEnabled ? 'pasabuyer' : 'shopper' }}
            options={{
              tabBarIcon: ({ focused, color, size }) => (
                <Ionicons name={focused ? 'chatbubbles' : 'chatbubbles-outline'} size={size} color={color} />
              ),
            }}
          />
          <Tab.Screen
            name="Orders"
            component={OrdersScreen}
            initialParams={{ userId, viewerRole: 'shopper' }}
            options={{
              tabBarIcon: ({ focused, color, size }) => (
                <Ionicons name={focused ? 'receipt' : 'receipt-outline'} size={size} color={color} />
              ),
            }}
          />
          <Tab.Screen
            name="Profile"
            component={ProfileScreen}
            initialParams={{ userId }}
            options={{
              tabBarIcon: ({ focused, color, size }) => (
                <Ionicons name={focused ? 'person' : 'person-outline'} size={size} color={color} />
              ),
            }}
          />
        </>
      )}
    </Tab.Navigator>
  );
};

export default BottomTabs;
