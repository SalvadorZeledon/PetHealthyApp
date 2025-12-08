// App.js
import "react-native-gesture-handler";
import React from "react";
import { StatusBar } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import AppNavigator from "./src/navigation/AppNavigator";
import { AlertNotificationRoot } from "react-native-alert-notification";

export default function App() {
  return (
    <AlertNotificationRoot>
      {/* StatusBar global: transparente y traslúcido */}
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />

      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>
    </AlertNotificationRoot>
  );
}
