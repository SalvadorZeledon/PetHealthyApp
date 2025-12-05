import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

// --- PANTALLAS PRINCIPALES ---
import HomeScreen from '../feature/home/views/HomeScreen';
import MyPetScreen from '../feature/pet/views/MyPetScreen';
import AppointmentsScreen from '../feature/pet/views/AppointmentsScreen';
import ChatbotScreen from '../feature/chatbot/views/ChatbotScreen';
import VetMapScreen from '../feature/directory/views/VetMapScreen'; // 🔥 MAPA


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
          } else if (route.name === 'VetMap') {
            iconName = focused ? 'map' : 'map-outline';
          } else if (route.name === 'Chatbot') {
            iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Inicio' }} />
      <Tab.Screen name="MyPets" component={MyPetScreen} options={{ title: 'Mascotas' }} />
      <Tab.Screen name="Appointments" component={AppointmentsScreen} options={{ title: 'Citas' }} />

      {/* 🔥 NUEVA PESTAÑA PRINCIPAL */}
      <Tab.Screen name="VetMap" component={VetMapScreen} options={{ title: 'Mapa' }} />

      <Tab.Screen name="Chatbot" component={ChatbotScreen} options={{ title: 'Chatbot' }} />
    </Tab.Navigator>
  );
};

export default TabNavigator;
