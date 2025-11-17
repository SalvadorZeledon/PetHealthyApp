import 'react-native-gesture-handler';
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import AppNavigator from './src/navigation/AppNavigator';
import { AlertNotificationRoot } from 'react-native-alert-notification';
import { ThemeProvider } from './src/themes/ThemeContext'; //Importación añadida

export default function App() {
  return (
    <AlertNotificationRoot>
      <ThemeProvider>
        <NavigationContainer>
          <StatusBar style="auto" />
          <AppNavigator />
        </NavigationContainer>
      </ThemeProvider>
    </AlertNotificationRoot>
  );
}
