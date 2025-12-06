// screens/ProfileScreen.js
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const avatarPlaceholder = require("../../../../assets/logoPH.png");

const ProfileScreen = ({ navigation }) => {
  const handleOpenUserInfo = () => {
    navigation.navigate("UserInfo");
  };

  const handleOpenSettings = () => {
    console.log("Ir a Configuración");
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mi perfil</Text>

        <View style={styles.headerRight}>
          <TouchableOpacity
            onPress={handleOpenSettings}
            style={styles.iconButton}
          >
            <Ionicons name="settings-outline" size={22} color="#365b6d" />
          </TouchableOpacity>

          <TouchableOpacity onPress={handleOpenUserInfo}>
            <Image source={avatarPlaceholder} style={styles.avatar} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.profileCard}>
          <Image source={avatarPlaceholder} style={styles.bigAvatar} />
          <Text style={styles.name}>Pepito Cliente</Text>
          <Text style={styles.email}>pepito@correo.com</Text>
          <Text style={styles.role}>Cliente • Propietario de mascotas</Text>
        </View>

        <Text style={styles.sectionTitle}>Tu actividad</Text>

        <View style={styles.row}>
          <View style={styles.statCard}>
            <Ionicons name="paw-outline" size={22} color="#4CAF50" />
            <Text style={styles.statLabel}>Mascotas registradas</Text>
            <Text style={styles.statValue}>3</Text>
          </View>

          <View style={styles.statCard}>
            <Ionicons name="calendar-outline" size={22} color="#1E88E5" />
            <Text style={styles.statLabel}>Citas realizadas</Text>
            <Text style={styles.statValue}>5</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Opciones</Text>

        <TouchableOpacity
          style={styles.optionCard}
          onPress={handleOpenUserInfo}
        >
          <Ionicons name="person-circle-outline" size={24} color="#365b6d" />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.optionTitle}>Información de usuario</Text>
            <Text style={styles.optionSubtitle}>
              Ver y editar tus datos personales.
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#90A4AE" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.optionCard}>
          <Ionicons name="notifications-outline" size={24} color="#365b6d" />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.optionTitle}>Notificaciones</Text>
            <Text style={styles.optionSubtitle}>
              Configura recordatorios de vacunas y citas.
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#90A4AE" />
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

export default ProfileScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#E3F2FD",
    marginTop: Platform.OS === "ios" ? 0 : 0,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#365b6d",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconButton: {
    marginRight: 10,
    padding: 6,
    borderRadius: 999,
    backgroundColor: "#E0E9F5",
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: "#ffffff",
    backgroundColor: "#ffffff",
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  profileCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    paddingVertical: 20,
    alignItems: "center",
    marginBottom: 18,
    elevation: 3,
  },
  bigAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: "#E3F2FD",
    marginBottom: 8,
    backgroundColor: "#ffffff",
  },
  name: {
    fontSize: 18,
    fontWeight: "700",
    color: "#263238",
  },
  email: {
    fontSize: 13,
    color: "#607D8B",
    marginBottom: 4,
  },
  role: {
    fontSize: 12,
    color: "#558B2F",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#365b6d",
    marginBottom: 8,
  },
  row: {
    flexDirection: "row",
    marginBottom: 18,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 12,
    marginRight: 8,
    elevation: 2,
  },
  statLabel: {
    fontSize: 12,
    color: "#607D8B",
    marginTop: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#365b6d",
    marginTop: 6,
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
