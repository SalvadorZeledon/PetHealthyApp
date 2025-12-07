import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const FILTERS = [
  { key: "all", label: "Todos" },
  { key: "dog", label: "Perros" },
  { key: "cat", label: "Gatos" },
  { key: "other", label: "Otros" },
];

const VetPatientsScreen = ({ navigation }) => {
  const [selectedFilter, setSelectedFilter] = useState("all");

  const handleOpenSettings = () => {
    navigation.navigate("Settings");
  };

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Pacientes</Text>
          <Text style={styles.headerSubtitle}>
            Mascotas vinculadas a tu perfil profesional
          </Text>
        </View>

        <View style={styles.headerRight}>
          {/* Solo configuración para el vet, sin botón de agregar */}
          <TouchableOpacity
            style={[styles.iconCircle, styles.iconCircleSecondary]}
            onPress={handleOpenSettings}
          >
            <Ionicons name="settings-outline" size={20} color="#6A1B9A" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* FILTROS (por ahora solo visuales) */}
        <View style={styles.filtersRow}>
          {FILTERS.map((f) => {
            const active = selectedFilter === f.key;
            return (
              <TouchableOpacity
                key={f.key}
                style={[styles.filterChip, active && styles.filterChipActive]}
                onPress={() => setSelectedFilter(f.key)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    active && styles.filterChipTextActive,
                  ]}
                >
                  {f.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ESTADO VACÍO */}
        <View style={styles.emptyWrapper}>
          <View style={styles.placeholderCard}>
            <Ionicons name="paw-outline" size={40} color="#7B1FA2" />
            <Text style={styles.placeholderTitle}>
              Aún no tienes pacientes vinculados
            </Text>
            <Text style={styles.placeholderText}>
              Cuando tus clientes compartan el perfil de sus mascotas mediante
              el código QR, aquí verás la lista de pacientes que atiendes.
            </Text>
            <Text style={styles.placeholderHint}>
              Más adelante podrás filtrar por especie y buscar pacientes por
              nombre.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default VetPatientsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3E5F5",
    paddingTop: 0,
  },
  header: {
    paddingTop: Platform.OS === "ios" ? 63 : 43,
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
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  headerSubtitle: {
    marginTop: 2,
    fontSize: 12,
    color: "#EDE7F6",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  iconCircleSecondary: {
    backgroundColor: "#FFFFFF",
  },

  content: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },

  /* ---------- Filtros ---------- */
  filtersRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 16,
    marginBottom: 12,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#D1C4E9",
    backgroundColor: "#FFFFFF",
    marginRight: 8,
    marginBottom: 8,
  },
  filterChipActive: {
    backgroundColor: "#7B1FA2",
    borderColor: "#7B1FA2",
  },
  filterChipText: {
    fontSize: 12,
    color: "#5E35B1",
    fontWeight: "500",
  },
  filterChipTextActive: {
    color: "#FFFFFF",
    fontWeight: "600",
  },

  /* ---------- Placeholder vacío ---------- */
  emptyWrapper: {
    marginTop: 8,
  },
  placeholderCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 20,
    alignItems: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  placeholderTitle: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: "600",
    color: "#311B92",
    textAlign: "center",
  },
  placeholderText: {
    marginTop: 6,
    fontSize: 13,
    color: "#5E35B1",
    textAlign: "center",
  },
  placeholderHint: {
    marginTop: 10,
    fontSize: 12,
    color: "#9575CD",
    textAlign: "center",
  },
});
