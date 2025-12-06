// screens/VetClientDetailScreen.js
import React, { useEffect, useState } from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase/config";
import { useTheme } from "../src/themes/useTheme";

import AppCard from "../src/components/ui/AppCard";
import AppText from "../src/components/ui/AppText";

export default function VetClientDetailScreen({ navigation, route }) {
  const { colors } = useTheme();
  const { clientRecordId } = route.params;

  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadClient();
  }, []);

  const loadClient = async () => {
    try {
      const snap = await getDoc(doc(db, "clientes_vet", clientRecordId));
      if (snap.exists()) {
        setClient({ id: snap.id, ...snap.data() });
      }
    } catch (e) {
      console.log("Error cargando cliente:", e);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !client) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.background,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <AppText>Cargando cliente...</AppText>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          style={[styles.iconCircle, { backgroundColor: colors.card }]}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </TouchableOpacity>

        <AppText title style={styles.headerTitle}>
          {client.nombre}
        </AppText>

        {/* Botón borrar cliente */}
        <TouchableOpacity
          style={[styles.iconCircle, { backgroundColor: "#e53935" }]}
          onPress={() =>
            navigation.navigate("VetDeleteConfirm", {
              type: "client",
              clientRecordId: client.id,
              clientName: client.nombre,
              onDelete: async () => {
                await deleteDoc(doc(db, "clientes_vet", client.id));
              },
            })
          }
        >
          <Ionicons name="trash-outline" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* CONTENIDO */}
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <AppCard style={styles.card}>
          <AppText title>Información del cliente</AppText>

          <View style={styles.row}>
            <AppText small style={styles.label}>
              Nombre:
            </AppText>
            <AppText>{client.nombre}</AppText>
          </View>

          {client.email ? (
            <View style={styles.row}>
              <AppText small style={styles.label}>
                Correo:
              </AppText>
              <AppText>{client.email}</AppText>
            </View>
          ) : null}

          {client.telefono ? (
            <View style={styles.row}>
              <AppText small style={styles.label}>
                Teléfono:
              </AppText>
              <AppText>{client.telefono}</AppText>
            </View>
          ) : null}
        </AppCard>

        {/* BOTÓN VER MASCOTAS */}
        <TouchableOpacity
          style={[
            styles.petButton,
            { backgroundColor: colors.primary },
          ]}
          onPress={() =>
            navigation.navigate("VetClientPets", {
              clientRecordId: client.id,
              clientName: client.nombre,
            })
          }
        >
          <Ionicons name="paw-outline" size={22} color="#fff" />
          <AppText style={styles.petButtonText}>
            Ver mascotas del cliente
          </AppText>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 20,
    justifyContent: "space-between",
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
    marginHorizontal: 10,
  },

  card: {
    marginTop: 20,
    padding: 16,
  },

  row: {
    flexDirection: "row",
    marginTop: 6,
  },

  label: {
    width: 110,
    color: "#888",
  },

  petButton: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 20,
    marginTop: 20,
    padding: 14,
    borderRadius: 12,
    justifyContent: "center",
  },

  petButtonText: {
    color: "#fff",
    marginLeft: 8,
  },
});
