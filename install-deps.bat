#!/bin/bash

# Script para instalar las dependencias de PetHealtyApp

echo "Instalando dependencias base de Expo (npm install)..."
npm install

echo "Instalando React Navigation (core)..."
npm install @react-navigation/native

echo "Instalando dependencias nativas de React Navigation..."
npx expo install react-native-screens react-native-safe-area-context

echo "Instalando Stack Navigator..."
npm install @react-navigation/native-stack

echo "Instalando Bottom Tabs..."
npm install @react-navigation/bottom-tabs

echo "Instalando Firebase..."
npm install firebase

echo "Instalando AsyncStorage..."
npx expo install @react-native-async-storage/async-storage

echo "Instalando AsyncStorage..."
npm install react-native-alert-notification

echo "Instalando Fuente Poppins..."
npx expo install expo-font @expo-google-fonts/poppins

echo "Instalando libreria para obtener imagenes..."
npx expo install expo-image-picker

echo "Instalando libreria para mapas y ubicacion..."
npx expo install expo-location

echo "Instalando React Native Maps para acceder a los mapas..-"
npx expo install react-native-maps



echo "✅ Listo. Todas las dependencias deberían estar instaladas."
