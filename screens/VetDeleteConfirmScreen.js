// screens/VetDeleteConfirmScreen.js
import React, { useState } from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../src/themes/useTheme";

import AppText from "../src/components/ui/AppText";
import AppCard from "../src/components/ui/AppCard";

export default function VetDeleteConfirmScreen({ navigation, route }) {
  const { colors } = useTheme();

  const {
    type, // "client" o "pet"
    clientRecordId,
    petRecordId,
    clientName,
    petName,
    onDelete, // función enviada desde la pantalla anterior
  } = route.params;

  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    try {
      setLoading(true);
      await onDelete(); // ejecuta eliminación en Firestore
      navigation.goBack();
    } catch (e) {
      console.log("Error al eliminar:", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AppCard style={[styles.card, { backgroundColor: colors.card }]}>
        
        <Ionicons
          name="warning-outline"
          size={60}
          color="#e53935"
          style={{ alignSelf: "center", marginBottom: 12 }}
        />

        <AppText title style={{ textAlign: "center" }}>
          Confirmar eliminación
        </AppText>

        <AppText
          style={{
            textAlign: "center",
            marginTop: 8,
            color: colors.textSmall,
          }}
        >
          {type === "client"
            ? `¿Deseas eliminar al cliente "${clientName}" junto a todas sus mascotas asignadas en tu clínica?`
            : `¿Deseas eliminar la mascota "${petName}" de tu registro profesional?`}
        </AppText>

        {/* BOTONES */}
        <View style={styles.buttonsRow}>
          {/* Cancelar */}
          <TouchableOpacity
            style={[styles.cancelButton, { borderColor: colors.primary }]}
            onPress={() => navigation.goBack()}
            disabled={loading}
          >
            <AppText style={{ color: colors.primary }}>Cancelar</AppText>
          </TouchableOpacity>

          {/* Eliminar */}
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDelete}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <AppText style={styles.deleteText}>Eliminar</AppText>
            )}
          </TouchableOpacity>
        </View>
      </AppCard>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
  },
  card: {
    padding: 22,
    borderRadius: 18,
  },
  buttonsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 22,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    marginRight: 8,
  },
  deleteButton: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: "#e53935",
    borderRadius: 10,
    alignItems: "center",
    marginLeft: 8,
  },
  deleteText: {
    color: "#fff",
    fontWeight: "700",
  },
});
