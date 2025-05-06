import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import HomeScreen from './HomeScreen';
import ProfileScreen from './ProfileScreen';
import InboxScreen from './InboxScreen';

const Tab = createBottomTabNavigator();

const BottomTabs = ({ route }) => {
  const { userId } = route.params || {};  // Ensure userId is passed

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Home') iconName = focused ? 'home' : 'home-outline';
          else if (route.name === 'Inbox') iconName = focused ? 'mail' : 'mail-outline';
          else if (route.name === 'Profile') iconName = focused ? 'person' : 'person-outline';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
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
      {/* Ensure each screen is properly configured */}
      <Tab.Screen 
        name="Home" 
        component={HomeScreen} 
        initialParams={{ userId }} 
      />
      <Tab.Screen 
        name="Inbox" 
        component={InboxScreen} 
        initialParams={{ userId }} 
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen} 
        initialParams={{ userId }} 
      />
    </Tab.Navigator>
  );
};

export default BottomTabs;
