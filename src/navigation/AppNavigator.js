// src/navigation/AppNavigator.js
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LoginScreen from '../../screens/Loginscreen';
import RegisterScreen from '../../screens/RegisterScreen';
import CompleteProfileScreen from '../../screens/CompleteProfileScreen';
import ProfilePhotoScreen from '../../screens/ProfilePhotoScreen';
import UserInfoScreen from '../../screens/UserInfoScreen';
import SettingsScreen from '../../screens/SettingsScreen';   // 👈 NUEVO
import TabNavigator from './TabNavigator';
import LocationPickerScreen from '../../screens/LocationPickerScreen'; // 👈 nuevo
import DogBasicInfoScreen from '../../screens/DogBasicInfoScreen';
import RegistroMascota from '../../screens/RegistroMascota';
import RegistroMascota1 from '../../screens/RegistroMascota1';
import RegistroMascota2 from '../../screens/RegistroMascota2';
import RegistroMascota3 from '../../screens/RegistroMascota3';
import PetProfileScreen from '../../screens/PetProfileScreen';



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
      <Stack.Screen name="DogBasicInfo" component={DogBasicInfoScreen} />
      <Stack.Screen name="PetProfile" component={PetProfileScreen} />

      <Stack.Screen name="RegistroMascota" component={RegistroMascota} />
      <Stack.Screen name="RegistroMascota1" component={RegistroMascota1} />
      <Stack.Screen name="RegistroMascota2" component={RegistroMascota2} />
      <Stack.Screen name="RegistroMascota3" component={RegistroMascota3} />


      <Stack.Screen name="UserInfo" component={UserInfoScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="LocationPicker" component={LocationPickerScreen} />
      
      <Stack.Screen name="MainTabs" component={TabNavigator} />
    </Stack.Navigator>
  );
};

export default AppNavigator;
