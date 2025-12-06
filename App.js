// App.js
import "react-native-gesture-handler";
import React from "react";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import AppNavigator from "./src/navigation/AppNavigator";
import { AlertNotificationRoot } from "react-native-alert-notification";

import { ThemeProvider } from "./src/themes/ThemeContext";

export default function App() {
  return (
    <ThemeProvider>
      <AlertNotificationRoot>
        <StatusBar style="light" />

        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      </AlertNotificationRoot>
    </ThemeProvider>
  );
}
