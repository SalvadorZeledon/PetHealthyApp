// screens/AppointmentsScreen.js
import React from "react";
import {
  View,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { useTheme } from "../src/themes/useTheme";
import AppText from "../src/components/ui/AppText";
import AppButton from "../src/components/ui/AppButton";
import AppCard from "../src/components/ui/AppCard";

const AppointmentsScreen = ({ navigation }) => {
  const { colors } = useTheme();

  const handleOpenSettings = () => {
    navigation.navigate("Settings");
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* HEADER */}
      <View style={styles.header}>
        <AppText title style={[styles.headerTitle, { color: colors.primary }]}>
          Citas
        </AppText>

        <TouchableOpacity style={styles.iconCircle} onPress={handleOpenSettings}>
          <Ionicons name="settings-outline" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>

        {/* Tarjeta principal vacía */}
        <AppCard style={styles.placeholderCard}>
          <Ionicons name="calendar-outline" size={40} color={colors.info} />
          <AppText title style={styles.placeholderTitle}>
            Tus citas médicas
          </AppText>

          <AppText small style={styles.placeholderText}>
            Revisa y administra las consultas, vacunas y controles de tus mascotas.
          </AppText>

          <AppButton
            title="Agendar nueva cita"
            onPress={() => {}}
            style={{
              marginTop: 14,
              flexDirection: "row",
              alignItems: "center",
              borderRadius: 999,
            }}
            textStyle={{ fontSize: 13 }}
          />
        </AppCard>

        {/* Tarjeta de ejemplo de cita */}
        <AppCard style={styles.card}>
          <View style={{ flex: 1 }}>
            <AppText title style={styles.cardTitle}>
              Consulta general
            </AppText>
            <AppText small style={styles.cardSubtitle}>Con Max 🐶</AppText>
            <AppText small style={styles.cardDetail}>Lunes 15 · 10:30 AM</AppText>
            <AppText small style={styles.cardDetail}>Clínica PetHealthy</AppText>
          </View>

          <View
            style={[
              styles.cardIconWrapper,
              { backgroundColor: colors.background },
            ]}
          >
            <Ionicons name="time-outline" size={22} color={colors.primary} />
          </View>
        </AppCard>

      </ScrollView>
    </View>
  );
};

export default AppointmentsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === "ios" ? 40 : 24,
  },

  /* HEADER */
  header: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
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

  /* CONTENIDO */
  content: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },

  /* VACÍO */
  placeholderCard: {
    marginTop: 16,
    alignItems: "center",
    marginBottom: 16,
  },
  placeholderTitle: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: "600",
  },
  placeholderText: {
    marginTop: 4,
    fontSize: 13,
    textAlign: "center",
  },

  /* CITA */
  card: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "600",
  },
  cardSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  cardDetail: {
    fontSize: 12,
    marginTop: 2,
  },
  cardIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
});

