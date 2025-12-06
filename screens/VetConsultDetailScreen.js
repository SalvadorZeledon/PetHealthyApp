// screens/VetConsultDetailScreen.js
import React from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../src/themes/useTheme";
import AppCard from "../src/components/ui/AppCard";
import AppText from "../src/components/ui/AppText";

export default function VetConsultDetailScreen({ navigation, route }) {
  const { colors } = useTheme();
  const { consult } = route.params;

  const formatDate = (timestamp) => {
    const d = new Date(timestamp);
    return `${d.toLocaleDateString()} · ${d.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })}`;
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
          Detalle de consulta
        </AppText>

        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {/* CARD: FECHA Y MOTIVO */}
        <AppCard style={styles.card}>
          <AppText bold style={{ marginBottom: 4 }}>
            {formatDate(consult.fecha)}
          </AppText>

          <AppText small color={colors.textSmall}>Motivo</AppText>
          <AppText style={styles.value}>{consult.motivo}</AppText>
        </AppCard>

        {/* CARD: DIAGNÓSTICO */}
        <AppCard style={styles.card}>
          <AppText small color={colors.textSmall}>Diagnóstico</AppText>
          <AppText style={styles.value}>
            {consult.diagnostico || "No registrado"}
          </AppText>
        </AppCard>

        {/* CARD: TRATAMIENTO */}
        <AppCard style={styles.card}>
          <AppText small color={colors.textSmall}>Tratamiento</AppText>
          <AppText style={styles.value}>
            {consult.tratamiento || "No registrado"}
          </AppText>
        </AppCard>

        {/* CARD: RECOMENDACIONES */}
        <AppCard style={styles.card}>
          <AppText small color={colors.textSmall}>Recomendaciones</AppText>
          <AppText style={styles.value}>
            {consult.recomendaciones || "No hay recomendaciones adicionales."}
          </AppText>
        </AppCard>

        {/* CARD: SIGNOS VITALES */}
        <AppCard style={styles.card}>
          <AppText bold style={{ marginBottom: 8 }}>Signos Vitales</AppText>

          <View style={styles.row}>
            <View style={styles.col}>
              <AppText small color={colors.textSmall}>Peso</AppText>
              <AppText style={styles.value}>
                {consult.peso ? `${consult.peso} kg` : "—"}
              </AppText>
            </View>

            <View style={styles.col}>
              <AppText small color={colors.textSmall}>Temperatura</AppText>
              <AppText style={styles.value}>
                {consult.temperatura
                  ? `${consult.temperatura} °C`
                  : "—"}
              </AppText>
            </View>
          </View>

          <View style={[styles.row, { marginTop: 10 }]}>
            <View style={styles.col}>
              <AppText small color={colors.textSmall}>Frec. cardíaca</AppText>
              <AppText style={styles.value}>
                {consult.frecuenciaCardiaca
                  ? `${consult.frecuenciaCardiaca} bpm`
                  : "—"}
              </AppText>
            </View>

            <View style={styles.col}>
              <AppText small color={colors.textSmall}>Frec. respiratoria</AppText>
              <AppText style={styles.value}>
                {consult.frecuenciaRespiratoria
                  ? `${consult.frecuenciaRespiratoria} rpm`
                  : "—"}
              </AppText>
            </View>
          </View>
        </AppCard>

        {/* CARD: OBSERVACIONES */}
        <AppCard style={styles.card}>
          <AppText small color={colors.textSmall}>Observaciones</AppText>
          <AppText style={styles.value}>
            {consult.observaciones || "Sin observaciones adicionales."}
          </AppText>
        </AppCard>
      </ScrollView>
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
    elevation: 2,
  },

  headerTitle: {
    flex: 1,
    textAlign: "center",
  },

  card: {
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
  },

  value: {
    marginTop: 4,
    fontSize: 15,
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  col: {
    width: "48%",
  },
});
