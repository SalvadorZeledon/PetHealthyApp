// screens/VetAddConsultScreen.js
import React, { useState } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";

import { db } from "../firebase/config";
import { useTheme } from "../src/themes/useTheme";
import AppCard from "../src/components/ui/AppCard";
import AppText from "../src/components/ui/AppText";

export default function VetAddConsultScreen({ navigation, route }) {
  const { colors } = useTheme();
  const { petId, clientRecordId } = route.params;

  const [motivo, setMotivo] = useState("");
  const [diagnostico, setDiagnostico] = useState("");
  const [tratamiento, setTratamiento] = useState("");
  const [notas, setNotas] = useState("");
  const [saving, setSaving] = useState(false);

  const guardarConsulta = async () => {
    if (!motivo.trim()) {
      alert("Debes ingresar el motivo de la consulta.");
      return;
    }

    setSaving(true);

    try {
      await addDoc(
        collection(db, "clientes_vet", clientRecordId, "mascotas", petId, "consultas"),
        {
          motivo,
          diagnostico,
          tratamiento,
          notas,
          fecha: Date.now(),
          creadoEn: serverTimestamp(),
        }
      );

      navigation.goBack();
    } catch (err) {
      console.log("Error guardando consulta:", err);
      alert("No se pudo guardar la consulta.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={[styles.header, { backgroundColor: colors.background }]}>
        <TouchableOpacity
          style={[styles.iconCircle, { backgroundColor: colors.card }]}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={20} color={colors.text} />
        </TouchableOpacity>

        <AppText title style={styles.headerTitle}>
          Nueva consulta
        </AppText>

        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <AppCard style={styles.card}>
          {/* MOTIVO */}
          <AppText small style={styles.label}>Motivo de la consulta *</AppText>
          <TextInput
            style={[styles.input, { color: colors.text, borderColor: colors.inputBorder }]}
            placeholder="Ejemplo: vómito, diarrea, decaimiento..."
            placeholderTextColor={colors.placeholder}
            value={motivo}
            onChangeText={setMotivo}
          />

          {/* DIAGNÓSTICO */}
          <AppText small style={styles.label}>Diagnóstico</AppText>
          <TextInput
            style={[styles.textArea, { color: colors.text, borderColor: colors.inputBorder }]}
            placeholder="Ejemplo: gastroenteritis, alergia alimentaria..."
            placeholderTextColor={colors.placeholder}
            value={diagnostico}
            onChangeText={setDiagnostico}
            multiline
          />

          {/* TRATAMIENTO */}
          <AppText small style={styles.label}>Tratamiento</AppText>
          <TextInput
            style={[styles.textArea, { color: colors.text, borderColor: colors.inputBorder }]}
            placeholder="Medicamentos, dosis, recomendaciones..."
            placeholderTextColor={colors.placeholder}
            value={tratamiento}
            onChangeText={setTratamiento}
            multiline
          />

          {/* NOTAS */}
          <AppText small style={styles.label}>Notas adicionales</AppText>
          <TextInput
            style={[styles.textArea, { color: colors.text, borderColor: colors.inputBorder }]}
            placeholder="Indicaciones especiales o advertencias..."
            placeholderTextColor={colors.placeholder}
            value={notas}
            onChangeText={setNotas}
            multiline
          />

          {/* BOTÓN GUARDAR */}
          <TouchableOpacity
            style={[styles.saveBtn, { backgroundColor: colors.primary }]}
            onPress={guardarConsulta}
            disabled={saving}
          >
            <Ionicons name="checkmark-circle-outline" size={24} color="#fff" />
            <AppText style={styles.saveBtnText}>
              {saving ? "Guardando..." : "Guardar consulta"}
            </AppText>
          </TouchableOpacity>
        </AppCard>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    paddingTop: 20,
    paddingHorizontal: 16,
    paddingBottom: 12,
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

  card: {
    marginTop: 20,
    padding: 16,
  },

  label: {
    marginBottom: 6,
    color: "#78909c",
  },

  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginBottom: 14,
    fontSize: 14,
  },

  textArea: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    height: 90,
    marginBottom: 14,
    fontSize: 14,
  },

  saveBtn: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: 14,
    borderRadius: 10,
  },

  saveBtnText: {
    color: "#fff",
    marginLeft: 8,
    fontWeight: "600",
  },
});
