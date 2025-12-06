// screens/VetConsultHistoryScreen.js
import React, { useEffect, useState } from "react";
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  collection,
  getDocs,
  orderBy,
  query,
} from "firebase/firestore";

import { db } from "../firebase/config";
import { useTheme } from "../src/themes/useTheme";
import AppCard from "../src/components/ui/AppCard";
import AppText from "../src/components/ui/AppText";

export default function VetConsultHistoryScreen({ navigation, route }) {
  const { colors } = useTheme();
  const { petId, clientRecordId } = route.params;

  const [consults, setConsults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarConsultas();
  }, []);

  const cargarConsultas = async () => {
    try {
      const colRef = collection(
        db,
        "clientes_vet",
        clientRecordId,
        "mascotas",
        petId,
        "consultas"
      );

      const q = query(colRef, orderBy("fecha", "desc"));
      const snap = await getDocs(q);

      const lista = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setConsults(lista);
    } catch (error) {
      console.log("Error cargando historial:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatearFecha = (timestamp) => {
    const d = new Date(timestamp);
    return d.toLocaleDateString();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          style={[styles.iconCircle, { backgroundColor: colors.card }]}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={20} color={colors.text} />
        </TouchableOpacity>

        <AppText title style={styles.headerTitle}>
          Historial de consultas
        </AppText>

        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <AppText small style={{ marginTop: 10 }}>
            Cargando historial...
          </AppText>
        </View>
      ) : consults.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons
            name="document-text-outline"
            size={60}
            color={colors.placeholder}
          />
          <AppText small style={styles.emptyText}>
            No hay consultas registradas.
          </AppText>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
          {consults.map((c, index) => (
            <TouchableOpacity
              key={c.id}
              onPress={() =>
                navigation.navigate("VetConsultDetail", {
                  consult: c,
                })
              }
              style={{ marginHorizontal: 16 }}
            >
              <AppCard style={styles.card}>
                <View style={styles.row}>
                  <Ionicons
                    name="medical-outline"
                    size={28}
                    color={colors.primary}
                  />

                  <View style={{ marginLeft: 12, flex: 1 }}>
                    <AppText bold>
                      Consulta #{consults.length - index}
                    </AppText>
                    <AppText small color={colors.textSmall}>
                      {formatearFecha(c.fecha)}
                    </AppText>

                    <AppText small numberOfLines={1} style={{ marginTop: 4 }}>
                      Motivo: {c.motivo}
                    </AppText>
                  </View>

                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={colors.textSmall}
                  />
                </View>
              </AppCard>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    paddingTop: 20,
    paddingBottom: 12,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
  },

  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },

  headerTitle: {
    flex: 1,
    textAlign: "center",
  },

  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  emptyText: {
    marginTop: 8,
    opacity: 0.7,
  },

  card: {
    marginTop: 12,
    padding: 16,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
  },
});
