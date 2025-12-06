// screens/VetDashboardScreen.js
import React, { useEffect, useState } from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../src/themes/useTheme";
import { getUserFromStorage } from "../src/utils/storage";
import { db } from "../firebase/config";
import { doc, getDoc } from "firebase/firestore";
import AppCard from "../src/components/ui/AppCard";
import AppText from "../src/components/ui/AppText";

export default function VetDashboardScreen({ navigation }) {
  const { colors } = useTheme();

  const [vet, setVet] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadVet();
  }, []);

  const loadVet = async () => {
    try {
      const local = await getUserFromStorage();
      if (!local || local.rol !== "veterinario") return;

      const ref = doc(db, "usuarios", local.id);
      const snap = await getDoc(ref);

      if (snap.exists()) {
        setVet({ id: snap.id, ...snap.data() });
      }
    } catch (e) {
      console.log("Error cargando vet:", e);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !vet) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <AppText small>Cargando tu panel profesional...</AppText>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      {/* HEADER */}
      <View style={styles.header}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          {vet.logoUri ? (
            <Image source={{ uri: vet.logoUri }} style={styles.logo} />
          ) : (
            <View style={[styles.logoPlaceholder, { backgroundColor: colors.card }]}>
              <Ionicons name="business-outline" size={30} color={colors.textSmall} />
            </View>
          )}

          <View style={{ marginLeft: 12 }}>
            <AppText title>{vet.clinicName || "Mi clínica"}</AppText>
            <AppText small style={{ color: colors.textSmall }}>
              Bienvenido, Dr. {vet.vetName}
            </AppText>
          </View>
        </View>

        <TouchableOpacity onPress={() => navigation.navigate("Settings")}>
          <Ionicons name="settings-outline" size={26} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* ACCIONES RÁPIDAS */}
      <AppText title style={[styles.sectionTitle, { color: colors.text }]}>
        Acciones rápidas
      </AppText>

      <View style={styles.grid}>
        <TouchableOpacity
          style={[styles.actionBox, { backgroundColor: colors.card }]}
          onPress={() => navigation.navigate("VetAddByCode")}
        >
          <Ionicons name="qr-code-outline" size={36} color={colors.primary} />
          <AppText small>Agregar por código</AppText>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBox, { backgroundColor: colors.card }]}
          onPress={() => navigation.navigate("VetClients")}
        >
          <Ionicons name="people-outline" size={36} color={colors.primary} />
          <AppText small>Mis clientes</AppText>
        </TouchableOpacity>
      </View>

      {/* RESUMEN */}
      <AppCard style={styles.card}>
        <AppText title>Resumen</AppText>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Ionicons name="paw-outline" size={26} color={colors.primary} />
            <AppText small>{vet.totalMascotas || 0} mascotas</AppText>
          </View>

          <View style={styles.statBox}>
            <Ionicons name="person-outline" size={26} color={colors.primary} />
            <AppText small>{vet.totalClientes || 0} clientes</AppText>
          </View>
        </View>
      </AppCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  logo: {
    width: 60,
    height: 60,
    borderRadius: 40,
  },

  logoPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
  },

  sectionTitle: {
    marginLeft: 20,
    marginTop: 20,
    marginBottom: 8,
  },

  grid: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 10,
  },

  actionBox: {
    width: "45%",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
  },

  card: {
    marginTop: 20,
    marginHorizontal: 20,
  },

  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
  },

  statBox: {
    alignItems: "center",
    width: "45%",
    paddingVertical: 10,
  },
});

