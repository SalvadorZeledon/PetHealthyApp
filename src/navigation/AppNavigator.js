import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

// --- TAB NAVIGATOR PRINCIPAL ---
import TabNavigator from "./TabNavigator";

// --- AUTENTICACIÓN ---
import LoginScreen from "../feature/auth/views/LoginScreen";
import RegisterScreen from "../feature/auth/views/RegisterScreen";
import CompleteProfileScreen from "../feature/profile/views/CompleteProfileScreen";
import ProfilePhotoScreen from "../feature/profile/views/ProfilePhotoScreen";
import VetLoginScreen from "../feature/auth/views/VetLoginScreen";

// --- PERFIL ---
import UserInfoScreen from "../feature/profile/views/UserInfoScreen";
import SettingsScreen from "../feature/settings/views/SettingsScreen";
import LocationPickerScreen from "../feature/profile/views/LocationPickerScreen";

// --- MASCOTAS ---
import DogBasicInfoScreen from "../feature/pet/views/DogBasicInfoScreen";
import RegistroMascota from "../feature/pet/views/RegistroMascota";
import RegistroMascota1 from "../feature/pet/views/RegistroMascota1";
import RegistroMascota2 from "../feature/pet/views/RegistroMascota2";
import RegistroMascota3 from "../feature/pet/views/RegistroMascota3";
import PetProfileScreen from "../feature/pet/views/PetProfileScreen";
import EditPetScreen from "../feature/pet/views/EditPetScreen";

// --- DIRECTORIO / VETS ---
import DirectorioScreen from "../feature/directory/views/DirectorioScreen";
import DirectorioDetailScreen from "../feature/directory/views/DirectorioDetailScreen";
import VetFinderScreen from "../feature/directory/views/VetFinderScreen";
import VetDetailScreen from "../feature/directory/views/VetDetailScreen";
import VetMapScreen from "../feature/directory/views/VetMapScreen";

// --- INFO LEGAL ---
import TermsScreen from "../feature/settings/views/TermsScreen";
import AboutUsScreen from "../feature/home/views/AboutUsScreen";

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {/* ===================== AUTENTICACIÓN ===================== */}
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="CompleteProfile" component={CompleteProfileScreen} />
      <Stack.Screen name="ProfilePhotoSetup" component={ProfilePhotoScreen} />
      <Stack.Screen name="VetLogin" component={VetLoginScreen} options={{ headerShown: false }}/>

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
      <Stack.Screen
        name="EditPet"
        component={EditPetScreen}
        options={{ headerShown: false }}
      />

      {/* ===================== DIRECTORIO ===================== */}
      <Stack.Screen name="Directorio" component={DirectorioScreen} />
      <Stack.Screen
        name="DirectorioDetail"
        component={DirectorioDetailScreen}
      />

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
