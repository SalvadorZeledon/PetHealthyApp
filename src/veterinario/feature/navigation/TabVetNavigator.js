// src/veterinario/feature/navigation/TabVetNavigator.js
import React from "react";
import { Platform } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";

// --- PANTALLAS VETERINARIO ---
import HomeVetScreen from "../home/views/HomeVetScreen";
import VetPatientsScreen from "../patients/views/VetPatientsScreen";
import VetAppointmentsScreen from "../appointments/views/VetAppointmentsScreen";
import ChatbotVetScreen from "../chatbot/views/ChatbotVetScreen";

const Tab = createBottomTabNavigator();

const TabVetNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,

        // 🎨 PALETA MORADA (consistente con login vet)
        tabBarActiveTintColor: "#7B1FA2",
        tabBarInactiveTintColor: "#B39DDB",
        tabBarStyle: {
          backgroundColor: "#FFFFFF",
          borderTopColor: "#E1BEE7",
          borderTopWidth: 1,
          height: Platform.OS === "ios" ? 70 : 60,
          paddingBottom: Platform.OS === "ios" ? 12 : 8,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 12,
        },

        tabBarIcon: ({ color, size, focused }) => {
          let iconName = "home-outline";

          if (route.name === "VetHome") {
            iconName = focused ? "home" : "home-outline";
          } else if (route.name === "VetPatients") {
            iconName = focused ? "paw" : "paw-outline";
          } else if (route.name === "VetAppointments") {
            iconName = focused ? "calendar" : "calendar-outline";
          } else if (route.name === "VetChatbot") {
            iconName = focused ? "chatbubbles" : "chatbubbles-outline";
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="VetHome"
        component={HomeVetScreen}
        options={{ title: "Inicio" }}
      />
      <Tab.Screen
        name="VetPatients"
        component={VetPatientsScreen}
        options={{ title: "Pacientes" }}
      />
      <Tab.Screen
        name="VetAppointments"
        component={VetAppointmentsScreen}
        options={{ title: "Calendario" }}
      />
      <Tab.Screen
        name="VetChatbot"
        component={ChatbotVetScreen}
        options={{ title: "Chatbot" }}
      />
    </Tab.Navigator>
  );
};

export default TabVetNavigator;
