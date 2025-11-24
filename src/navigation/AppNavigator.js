// src/navigation/AppNavigator.js
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LoginScreen from '../../screens/Loginscreen';
import RegisterScreen from '../../screens/RegisterScreen';
import CompleteProfileScreen from '../../screens/CompleteProfileScreen';
import ProfilePhotoScreen from '../../screens/ProfilePhotoScreen';
import UserInfoScreen from '../../screens/UserInfoScreen';
import SettingsScreen from '../../screens/SettingsScreen';
import LocationPickerScreen from '../../screens/LocationPickerScreen';
import TabNavigator from './TabNavigator';
import DogBasicInfoScreen from '../../screens/DogBasicInfoScreen';
import RegistroMascota from '../../screens/RegistroMascota';
import RegistroMascota1 from '../../screens/RegistroMascota1';
import RegistroMascota2 from '../../screens/RegistroMascota2';
import RegistroMascota3 from '../../screens/RegistroMascota3';
import PetProfileScreen from '../../screens/PetProfileScreen';


// --- TUS PANTALLAS (Directorio y Veterinarias) ---
import DirectorioScreen from '../../screens/DirectorioScreen';
import DirectorioDetailScreen from '../../screens/DirectorioDetailScreen';
import VetFinderScreen from '../../screens/VetFinderScreen';
import VetDetailScreen from '../../screens/VetDetailScreen';

// --- PANTALLAS DE IVÁN (Términos y AboutUs) ---
import TermsScreen from '../../screens/TermsScreen';
import AboutUsScreen from '../../screens/AboutUsScreen';

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

      {/* --- TUS RUTAS --- */}
      <Stack.Screen name="Directorio" component={DirectorioScreen} />
      <Stack.Screen name="DirectorioDetail" component={DirectorioDetailScreen} />
      <Stack.Screen name="VetFinder" component={VetFinderScreen} />
      <Stack.Screen name="VetDetail" component={VetDetailScreen} />

      {/* --- RUTAS COMUNES --- */}
      <Stack.Screen name="MainTabs" component={TabNavigator} />

      {/* --- RUTAS DE IVÁN --- */}
      <Stack.Screen
        name="Terms"
        component={TermsScreen}
        options={{ headerShown: true, title: 'Términos y Condiciones' }}
      />
      <Stack.Screen
        name="AboutUs"
        component={AboutUsScreen}
        options={{ headerShown: true, title: 'Acerca de nosotros' }}
      />
    </Stack.Navigator>
  );
};

export default AppNavigator;
