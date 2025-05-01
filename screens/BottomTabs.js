import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import HomeScreen from './HomeScreen'; // Import HomeScreen
import ProfileScreen from './ProfileScreen'; // Import ProfileScreen
import CardScreen from './CardScreen'; // Import CardScreen

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
        tabBarActiveTintColor: 'white', // Active icon color
        tabBarInactiveTintColor: 'white', // Inactive icon color
        tabBarStyle: {
          backgroundColor: '#1c1c1c', // Bottom tab background color
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} initialParams={{ userId }} options={{ headerShown: false }} />
      <Tab.Screen name="Card" component={CardScreen} initialParams={{ userId }} options={{ headerShown: false }} />
      <Tab.Screen name="Profile" component={ProfileScreen} initialParams={{ userId }} options={{ headerShown: false }} />
    </Tab.Navigator>
  );
};

export default BottomTabs;
