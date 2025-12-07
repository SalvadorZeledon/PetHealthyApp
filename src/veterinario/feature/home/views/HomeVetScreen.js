// veterinario/feature/home/views/HomeVetScreen.js
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const avatarPlaceholder = require("../../../../assets/logo.png");

const HomeVetScreen = ({ navigation }) => {
  const handleOpenProfile = () => {
    // 👉 Perfil del veterinario (nueva vista)
    navigation.navigate("VetProfile");
  };

  const handleOpenSettings = () => {
    // 👉 Pantalla de configuración que ya tienes
    navigation.navigate("Settings");
  };

  // 👇 NUEVA FUNCIÓN PARA EL CLICK
  const handleOpenScanner = () => {
    navigation.navigate("VetScanner");
  };

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <View>
          <Text style={styles.helloText}>Hola,</Text>
          <View style={styles.nameRow}>
            <Text style={styles.nameText}>Profesional</Text>
            <Text style={styles.wave}> 🩺</Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          {/* Avatar profesional => perfil */}
          <TouchableOpacity
            style={styles.iconCircle}
            onPress={handleOpenProfile}
          >
            <Image source={avatarPlaceholder} style={styles.avatar} />
          </TouchableOpacity>

          {/* Configuración */}
          <TouchableOpacity
            style={[styles.iconCircle, { marginLeft: 8 }]}
            onPress={handleOpenSettings}
          >
            <Ionicons name="settings-outline" size={20} color="#6A1B9A" />
          </TouchableOpacity>
        </View>
      </View>

      {/* CONTENIDO PRINCIPAL */}
      <ScrollView contentContainerStyle={styles.content}>
        
        {/* 👇 AHORA ESTA TARJETA ES TOCABLE (TouchableOpacity) */}
        <TouchableOpacity 
            style={styles.mainCard} 
            activeOpacity={0.9} 
            onPress={handleOpenScanner} // 👈 Acción al tocar
        >
          <View style={styles.cardHeaderRow}>
            <View style={styles.cardIconWrapper}>
              <Ionicons name="qr-code-outline" size={26} color="#7B1FA2" />
            </View>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.mainCardTitle}>Escaneo de pacientes</Text>
              <Text style={styles.mainCardSubtitle}>
                Toca aquí para escanear el código QR de las mascotas y ver su historial.
              </Text>
            </View>
          </View>

          {/* Placeholder visual de cámara */}
          <View style={styles.placeholderArea}>
            <Ionicons name="camera" size={42} color="#D1C4E9" />
            <Text style={styles.placeholderText}>
              Iniciar Escáner
            </Text>
          </View>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
};

export default HomeVetScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3E5F5",
  },
  header: {
    paddingTop: Platform.OS === "ios" ? 52 : 32,
    paddingHorizontal: 20,
    paddingBottom: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#7B1FA2",
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
  },
  helloText: {
    fontSize: 14,
    color: "#FFFFFF",
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  nameText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  wave: {
    fontSize: 20,
    marginLeft: 4,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    elevation: 3,
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  content: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  mainCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 18,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  cardIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#EDE7F6",
    justifyContent: "center",
    alignItems: "center",
  },
  mainCardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#4527A0",
  },
  mainCardSubtitle: {
    marginTop: 2,
    fontSize: 13,
    color: "#616161",
  },
  placeholderArea: {
    marginTop: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E1BEE7",
    backgroundColor: "#FAF5FF",
    paddingVertical: 20,
    paddingHorizontal: 12,
    alignItems: "center",
  },
  placeholderText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '600',
    color: "#6A1B9A",
    textAlign: "center",
  },
});