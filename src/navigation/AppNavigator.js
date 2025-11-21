// src/navigation/AppNavigator.js
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LoginScreen from '../../screens/Loginscreen';
import RegisterScreen from '../../screens/RegisterScreen';
import CompleteProfileScreen from '../../screens/CompleteProfileScreen';
import ProfilePhotoScreen from '../../screens/ProfilePhotoScreen';
import UserInfoScreen from '../../screens/UserInfoScreen';
import SettingsScreen from '../../screens/SettingsScreen';
import TabNavigator from './TabNavigator';
import LocationPickerScreen from '../../screens/LocationPickerScreen';

// 👇 IMPORTA TU TermsScreen
import TermsScreen from '../../screens/TermsScreen';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName="Login"
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />

      <Stack.Screen name="CompleteProfile" component={CompleteProfileScreen} />
      <Stack.Screen name="ProfilePhotoSetup" component={ProfilePhotoScreen} />

      <Stack.Screen name="UserInfo" component={UserInfoScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="LocationPicker" component={LocationPickerScreen} />

      <Stack.Screen name="MainTabs" component={TabNavigator} />
      
      {/* 👇 AGREGA LA PANTALLA DE TÉRMINOS */}
      <Stack.Screen
        name="Terms"
        component={TermsScreen}
        options={{ headerShown: true, title: "Términos y Condiciones" }}
      />
    </Stack.Navigator>
  );
};

export default AppNavigator;
