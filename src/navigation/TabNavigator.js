// src/navigation/TabNavigator.js
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import Homescreen from '../../screens/Homescreen';
import MyPetScreen from '../../screens/MyPetScreen';
import AppointmentsScreen from '../../screens/AppointmentsScreen';
import ChatbotScreen from '../../screens/ChatbotScreen';

const Tab = createBottomTabNavigator();

const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#365b6d',
        tabBarInactiveTintColor: '#90A4AE',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#E0E0E0',
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
        component={Homescreen}
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
