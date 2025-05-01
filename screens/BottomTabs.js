import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import HomeScreen from './HomeScreen';
import ProfileScreen from './ProfileScreen';
import CardScreen from './CardScreen';

const Tab = createBottomTabNavigator();

const BottomTabs = ({ route }) => {
  const { userId } = route.params;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Home') iconName = focused ? 'home' : 'home-outline';
          else if (route.name === 'Card') iconName = focused ? 'card' : 'card-outline';
          else if (route.name === 'Profile') iconName = focused ? 'person' : 'person-outline';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#C4A35A', // Gold when active
        tabBarInactiveTintColor: '#bbb', // Light gray when inactive
        tabBarStyle: {
          backgroundColor: '#1c1c1c', // Dark base like Pantheon stone
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
      <Tab.Screen name="Home" component={HomeScreen} initialParams={{ userId }} />
      <Tab.Screen name="Card" component={CardScreen} initialParams={{ userId }} />
      <Tab.Screen name="Profile" component={ProfileScreen} initialParams={{ userId }} />
    </Tab.Navigator>
  );
};

export default BottomTabs;
