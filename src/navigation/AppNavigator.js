// src/navigation/AppNavigator.js
import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

/* ===========================
      AUTENTICACIÓN USUARIO
   =========================== */
import LoginScreen from "../../screens/Loginscreen";
import RegisterScreen from "../../screens/RegisterScreen";
import CompleteProfileScreen from "../../screens/CompleteProfileScreen";
import ProfilePhotoScreen from "../../screens/ProfilePhotoScreen";

/* ===========================
           PERFIL
   =========================== */
import UserInfoScreen from "../../screens/UserInfoScreen";
import SettingsScreen from "../../screens/SettingsScreen";
import LocationPickerScreen from "../../screens/LocationPickerScreen";

/* ===========================
           MASCOTAS
   =========================== */
import DogBasicInfoScreen from "../../screens/DogBasicInfoScreen";
import RegistroMascota from "../../screens/RegistroMascota";
import RegistroMascota1 from "../../screens/RegistroMascota1";
import RegistroMascota2 from "../../screens/RegistroMascota2";
import RegistroMascota3 from "../../screens/RegistroMascota3";
import PetProfileScreen from "../../screens/PetProfileScreen";

/* ===========================
          DIRECTORIO
   =========================== */
import DirectorioScreen from "../../screens/DirectorioScreen";
import DirectorioDetailScreen from "../../screens/DirectorioDetailScreen";

/* ===========================
        VETERINARIAS MAPA
   =========================== */
import VetFinderScreen from "../../screens/VetFinderScreen";
import VetDetailScreen from "../../screens/VetDetailScreen";
import VetMapScreen from "../../screens/VetMapScreen";

/* ===========================
      MÓDULO VETERINARIO
   =========================== */
import VetDashboardScreen from "../../screens/VetDashboardScreen";
import VetRegisterScreen from "../../screens/VetRegisterScreen";
import VetCompleteProfileScreen from "../../screens/VetCompleteProfileScreen";

import VetClientsScreen from "../../screens/VetClientsScreen";
import VetClientPetsScreen from "../../screens/VetClientPetsScreen";
import VetAddByCodeScreen from "../../screens/VetAddByCodeScreen";

import VetAddConsultScreen from "../../screens/VetAddConsultScreen";
import VetConsultDetailScreen from "../../screens/VetConsultDetailScreen";



/* ===========================
            LEGALES
   =========================== */
import TermsScreen from "../../screens/TermsScreen";
import AboutUsScreen from "../../screens/AboutUsScreen";

/* ===========================
          MAIN TABS
   =========================== */
import TabNavigator from "./TabNavigator";

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>

      {/* AUTENTICACIÓN */}
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="CompleteProfile" component={CompleteProfileScreen} />
      <Stack.Screen name="ProfilePhotoSetup" component={ProfilePhotoScreen} />

      {/* TABS PRINCIPALES */}
      <Stack.Screen name="MainTabs" component={TabNavigator} />

      {/* PERFIL */}
      <Stack.Screen name="UserInfo" component={UserInfoScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="LocationPicker" component={LocationPickerScreen} />

      {/* MASCOTAS */}
      <Stack.Screen name="DogBasicInfo" component={DogBasicInfoScreen} />
      <Stack.Screen name="RegistroMascota" component={RegistroMascota} />
      <Stack.Screen name="RegistroMascota1" component={RegistroMascota1} />
      <Stack.Screen name="RegistroMascota2" component={RegistroMascota2} />
      <Stack.Screen name="RegistroMascota3" component={RegistroMascota3} />
      <Stack.Screen name="PetProfile" component={PetProfileScreen} />

      {/* DIRECTORIO */}
      <Stack.Screen name="Directorio" component={DirectorioScreen} />
      <Stack.Screen name="DirectorioDetail" component={DirectorioDetailScreen} />

      {/* MAPA Y LISTADOS DE VETERINARIOS */}
      <Stack.Screen name="VetFinder" component={VetFinderScreen} />
      <Stack.Screen name="VetDetail" component={VetDetailScreen} />
      <Stack.Screen name="VetMap" component={VetMapScreen} />

      {/* MÓDULO VETERINARIO */}
      <Stack.Screen name="VetDashboard" component={VetDashboardScreen} />
      <Stack.Screen name="VetRegister" component={VetRegisterScreen} />
      <Stack.Screen name="VetCompleteProfile" component={VetCompleteProfileScreen} />

      {/* CLIENTES Y MASCOTAS DEL VETERINARIO */}
      <Stack.Screen name="VetClients" component={VetClientsScreen} />
      <Stack.Screen name="VetClientPets" component={VetClientPetsScreen} />
      <Stack.Screen name="VetAddByCode" component={VetAddByCodeScreen} />

      {/* CONSULTAS MÉDICAS */}
      <Stack.Screen name="VetAddConsult" component={VetAddConsultScreen} />
      <Stack.Screen name="VetConsultDetail" component={VetConsultDetailScreen} />

      {/* LEGALES */}
      <Stack.Screen name="Terms" component={TermsScreen} />
      <Stack.Screen name="AboutUs" component={AboutUsScreen} />

    </Stack.Navigator>
  );
};

export default AppNavigator;
