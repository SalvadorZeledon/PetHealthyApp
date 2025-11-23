// src/navigation/TabNavigator.js
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import MyPetScreen from '../../screens/MyPetScreen';
import AppointmentsScreen from '../../screens/AppointmentsScreen';
import ChatbotScreen from '../../screens/ChatbotScreen';
import HomeScreen from '../../screens/Homescreen';
import { useTheme } from '../themes/ThemeContext';


const Tab = createBottomTabNavigator();

const TabNavigator = () => {
const { theme, darkMode } = useTheme();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: theme.accent,
        tabBarInactiveTintColor: theme.textSecondary,
        tabBarStyle: {
          backgroundColor: darkMode ? theme.card2 : theme.card,
          borderTopColor: darkMode ? '#444' : '#E0E0E0',
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 3,
        },
        tabBarIcon: ({ color, size, focused }) => {
          let iconName = 'home-outline';

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'MyPets') {
            iconName = focused ? 'paw' : 'paw-outline';
          } else if (route.name === 'Appointments') {
            iconName = focused ? 'calendar' : 'calendar-outline';
          } else if (route.name === 'Chatbot') {
            iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: 'Inicio' }}
      />
      <Tab.Screen
        name="MyPets"
        component={MyPetScreen}
        options={{ title: 'Mascotas' }}
      />
      <Tab.Screen
        name="Appointments"
        component={AppointmentsScreen}
        options={{ title: 'Citas' }}
      />
      <Tab.Screen
        name="Chatbot"
        component={ChatbotScreen}
        options={{ title: 'Chatbot' }}
      />
    </Tab.Navigator>
  );
};


export default TabNavigator;
