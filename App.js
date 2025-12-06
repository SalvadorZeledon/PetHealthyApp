// App.js
import "react-native-gesture-handler";
import React from "react";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import AppNavigator from "./src/navigation/AppNavigator";
import { AlertNotificationRoot } from "react-native-alert-notification";

export default function App() {
  return (
    <AlertNotificationRoot>
      {/* Barra de estado GLOBAL:
          - fondo negro
          - iconos/texto blancos */}
      <StatusBar style="dark" backgroundColor="#FFFFFF" />

      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>
    </AlertNotificationRoot>
  );
}
