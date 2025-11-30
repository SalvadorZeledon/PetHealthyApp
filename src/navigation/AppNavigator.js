// src/navigation/AppNavigator.js
import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

// --- AUTENTICACIÓN ---
import LoginScreen from "../../screens/Loginscreen";
import RegisterScreen from "../../screens/RegisterScreen";
import CompleteProfileScreen from "../../screens/CompleteProfileScreen";
import ProfilePhotoScreen from "../../screens/ProfilePhotoScreen";

// --- PERFIL ---
import UserInfoScreen from "../../screens/UserInfoScreen";
import SettingsScreen from "../../screens/SettingsScreen";
import LocationPickerScreen from "../../screens/LocationPickerScreen";

// --- MASCOTAS ---
import DogBasicInfoScreen from "../../screens/DogBasicInfoScreen";
import RegistroMascota from "../../screens/RegistroMascota";
import RegistroMascota1 from "../../screens/RegistroMascota1";
import RegistroMascota2 from "../../screens/RegistroMascota2";
import RegistroMascota3 from "../../screens/RegistroMascota3";
import PetProfileScreen from "../../screens/PetProfileScreen";

// --- DIRECTORIO ---
import DirectorioScreen from "../../screens/DirectorioScreen";
import DirectorioDetailScreen from "../../screens/DirectorioDetailScreen";

// --- VETERINARIAS Y MAPA ---
import VetFinderScreen from "../../screens/VetFinderScreen";
import VetDetailScreen from "../../screens/VetDetailScreen";
import VetMapScreen from "../../screens/VetMapScreen"; // ← IMPORTANTE

// --- INFORMACIÓN LEGAL ---
import TermsScreen from "../../screens/TermsScreen";
import AboutUsScreen from "../../screens/AboutUsScreen";

// --- TAB NAVIGATOR PRINCIPAL ---
import TabNavigator from "./TabNavigator";


const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>

      {/* ===================== AUTENTICACIÓN ===================== */}
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="CompleteProfile" component={CompleteProfileScreen} />
      <Stack.Screen name="ProfilePhotoSetup" component={ProfilePhotoScreen} />

      {/* ===================== MAIN TABS ===================== */}
      {/* Se coloca aquí para que sea accesible después del login */}
      <Stack.Screen name="MainTabs" component={TabNavigator} />

      {/* ===================== PERFIL Y CONFIGURACIÓN ===================== */}
      <Stack.Screen name="UserInfo" component={UserInfoScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="LocationPicker" component={LocationPickerScreen} />

      {/* ===================== MASCOTAS ===================== */}
      <Stack.Screen name="DogBasicInfo" component={DogBasicInfoScreen} />
      <Stack.Screen name="RegistroMascota" component={RegistroMascota} />
      <Stack.Screen name="RegistroMascota1" component={RegistroMascota1} />
      <Stack.Screen name="RegistroMascota2" component={RegistroMascota2} />
      <Stack.Screen name="RegistroMascota3" component={RegistroMascota3} />
      <Stack.Screen name="PetProfile" component={PetProfileScreen} />

      {/* ===================== DIRECTORIO ===================== */}
      <Stack.Screen name="Directorio" component={DirectorioScreen} />
      <Stack.Screen name="DirectorioDetail" component={DirectorioDetailScreen} />

      {/* ===================== VETERINARIAS Y MAPA ===================== */}
      <Stack.Screen name="VetFinder" component={VetFinderScreen} />
      <Stack.Screen name="VetDetail" component={VetDetailScreen} />
      <Stack.Screen name="VetMap" component={VetMapScreen} />

      {/* ===================== LEGALES ===================== */}
      <Stack.Screen name="Terms" component={TermsScreen} />
      <Stack.Screen name="AboutUs" component={AboutUsScreen} />

    </Stack.Navigator>
  );
};

export default AppNavigator;
