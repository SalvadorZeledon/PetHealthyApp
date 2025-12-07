import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Alert,
  ScrollView, // 👈 Agregué ScrollView por si la pantalla se llena
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { clearUserFromStorage } from "../../../shared/utils/storage";

const SettingsScreen = ({ navigation }) => {
  const handleBack = () => {
    navigation.goBack();
  };

  const handleOpenAboutUs = () => {
    navigation.navigate("AboutUs");
  };

  const handleOpenDirectory = () => {
    navigation.navigate("Directorio");
  };

  // --- NUEVA FUNCIONALIDAD: ESCÁNER ---
  const handleOpenScanner = () => {
    navigation.navigate("VetScanner");
  };

  const handleLogout = async () => {
    try {
      Alert.alert("Cerrar sesión", "¿Seguro que deseas salir de tu cuenta?", [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Cerrar sesión",
          style: "destructive",
          onPress: async () => {
            await clearUserFromStorage();
            await AsyncStorage.clear();

            navigation.reset({
              index: 0,
              routes: [{ name: "Login" }],
            });
          },
        },
      ]);
    } catch (error) {
      console.log("Error al cerrar sesión:", error);
      Alert.alert("Error", "No se pudo cerrar la sesión. Inténtalo más tarde.");
    }
  };

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.topIconButton}>
          <Ionicons name="arrow-back" size={22} color="#365b6d" />
        </TouchableOpacity>

        <Text style={styles.topTitle}>Configuración</Text>

        <View style={styles.topIconButton} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* SECCIÓN CUENTA */}
        <Text style={styles.sectionTitle}>Cuenta</Text>

        <TouchableOpacity
          style={styles.optionCard}
          onPress={handleOpenDirectory}
        >
          <Ionicons name="book-outline" size={24} color="#365b6d" />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.optionTitle}>Directorio</Text>
            <Text style={styles.optionSubtitle}>
              Instituciones para denuncias.
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#90A4AE" />
        </TouchableOpacity>

        {/* 2) ACERCA DE NOSOTROS (antes decía "Cuenta") */}
        <Text style={styles.sectionTitle}>Acerca de nosotros</Text>

        <TouchableOpacity style={styles.optionCard} onPress={handleOpenAboutUs}>
          <Ionicons
            name="information-circle-outline"
            size={24}
            color="#365b6d"
          />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.optionTitle}>Acerca de PetHealthy</Text>
            <Text style={styles.optionSubtitle}>
              Conoce más sobre la aplicación.
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#90A4AE" />
        </TouchableOpacity>

        {/* 👇👇👇 NUEVA SECCIÓN DE PRUEBAS 👇👇👇 */}
        <Text style={styles.sectionTitle}>Zona de Pruebas</Text>

        <TouchableOpacity
          style={[styles.optionCard, { backgroundColor: "#E0F2F1" }]} // Un color menta suave
          onPress={handleOpenScanner}
        >
          <Ionicons name="qr-code-outline" size={24} color="#00695C" />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={[styles.optionTitle, { color: "#00695C" }]}>
              Modo Veterinario
            </Text>
            <Text style={[styles.optionSubtitle, { color: "#004D40" }]}>
              Probar Escáner QR
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#004D40" />
        </TouchableOpacity>
        {/* 👆👆👆 --------------------------- 👆👆👆 */}

        {/* SECCIÓN SESIÓN */}
        <Text style={styles.sectionTitle}>Sesión</Text>

        <TouchableOpacity
          style={[styles.optionCard, { backgroundColor: "#FFEBEE" }]}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={24} color="#E53935" />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={[styles.optionTitle, { color: "#C62828" }]}>
              Cerrar sesión
            </Text>
            <Text style={[styles.optionSubtitle, { color: "#C62828" }]}>
              Salir de tu cuenta en este dispositivo.
            </Text>
          </View>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

export default SettingsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#E3F2FD",
    paddingTop: 0,
  },
  header: {
    paddingTop: Platform.OS === "ios" ? 52 : 32,
    paddingHorizontal: 20,
    paddingBottom: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#4A85A5",
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
  },
  topIconButton: {
    padding: 6,
    borderRadius: 999,
    backgroundColor: "#E0E9F5",
  },
  topTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40, // Espacio extra al final
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#607D8B",
    marginBottom: 8,
    marginTop: 12,
  },
  optionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
    elevation: 2,
  },
  optionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#263238",
  },
  optionSubtitle: {
    fontSize: 12,
    color: "#607D8B",
  },
});