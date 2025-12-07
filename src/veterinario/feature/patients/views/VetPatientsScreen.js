// src/veterinario/feature/patients/views/VetPatientsScreen.js
import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { collection, query, where, onSnapshot, getDoc, doc } from "firebase/firestore";

import { db } from "../../../../../firebase/config";
import { COL_MASCOTAS } from "../../../../shared/utils/collections";
import { getUserFromStorage } from "../../../../shared/utils/storage";

// Definición de filtros
const FILTERS = [
  { key: "all", label: "Todos" },
  { key: "perro", label: "Perros" },
  { key: "gato", label: "Gatos" },
  { key: "otro", label: "Otros" },
];

const VetPatientsScreen = ({ navigation }) => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Estado para el filtro seleccionado
  const [selectedFilter, setSelectedFilter] = useState("all");

  const handleOpenSettings = () => {
    navigation.navigate("Settings");
  };

  // Cargar pacientes
  useFocusEffect(
    useCallback(() => {
      let unsubscribe;

      const fetchLinkedPatients = async () => {
        try {
          // Solo mostrar loading si no hay datos previos para evitar parpadeos
          if(patients.length === 0) setLoading(true);
          
          const vetUser = await getUserFromStorage();
          if (!vetUser || !vetUser.id) {
            setLoading(false);
            return;
          }

          const q = query(
            collection(db, "vet_patients"),
            where("vetId", "==", vetUser.id)
          );

          unsubscribe = onSnapshot(q, async (snapshot) => {
            const petIds = snapshot.docs.map(doc => doc.data().petId);
            
            if (petIds.length === 0) {
                setPatients([]);
                setLoading(false);
                return;
            }

            const petsData = [];
            for (const pid of petIds) {
                const petDoc = await getDoc(doc(db, COL_MASCOTAS, pid));
                if (petDoc.exists()) {
                    petsData.push({ id: petDoc.id, ...petDoc.data() });
                }
            }
            
            setPatients(petsData);
            setLoading(false);
          });

        } catch (error) {
          console.error("Error cargando pacientes:", error);
          setLoading(false);
        }
      };

      fetchLinkedPatients();

      return () => {
        if (unsubscribe) unsubscribe();
      };
    }, [])
  );

  // --- LÓGICA DE FILTRADO ---
  const getFilteredPatients = () => {
    if (selectedFilter === 'all') return patients;
    if (selectedFilter === 'perro') return patients.filter(p => p.especie === 'perro');
    if (selectedFilter === 'gato') return patients.filter(p => p.especie === 'gato');
    // Para "otro", excluimos perros y gatos
    return patients.filter(p => p.especie !== 'perro' && p.especie !== 'gato');
  };

  const filteredList = getFilteredPatients();

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Pacientes</Text>
          <Text style={styles.headerSubtitle}>
            Mascotas vinculadas a tu perfil
          </Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={[styles.iconCircle]} onPress={handleOpenSettings}>
            <Ionicons name="settings-outline" size={20} color="#6A1B9A" />
          </TouchableOpacity>
        </View>
      </View>

      {/* CONTENIDO */}
      <ScrollView contentContainerStyle={styles.content}>
        
        {/* BARRA DE FILTROS */}
        <View style={styles.filtersRow}>
            {FILTERS.map((f) => {
                const active = selectedFilter === f.key;
                return (
                    <TouchableOpacity
                        key={f.key}
                        style={[styles.filterChip, active && styles.filterChipActive]}
                        onPress={() => setSelectedFilter(f.key)}
                    >
                        <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                            {f.label}
                        </Text>
                    </TouchableOpacity>
                );
            })}
        </View>

        {loading && patients.length === 0 ? (
            <ActivityIndicator size="large" color="#7B1FA2" style={{marginTop: 50}} />
        ) : filteredList.length === 0 ? (
            <View style={styles.emptyWrapper}>
                <View style={styles.placeholderCard}>
                    <Ionicons name="paw-outline" size={40} color="#7B1FA2" />
                    <Text style={styles.placeholderTitle}>
                        {patients.length === 0 ? "Sin pacientes aún" : "No hay resultados"}
                    </Text>
                    <Text style={styles.placeholderText}>
                        {patients.length === 0 
                            ? "Escanea el código QR de una mascota para agregarla a tu lista de pacientes." 
                            : "No hay mascotas de este tipo en tu lista."}
                    </Text>
                </View>
            </View>
        ) : (
            <View style={styles.gridContainer}>
                {filteredList.map((pet) => (
                    <View key={pet.id} style={styles.petItem}>
                        <TouchableOpacity
                            activeOpacity={0.9}
                            style={styles.petCard}
                            onPress={() => navigation.navigate("PetProfile", { petId: pet.id, viewMode: 'veterinarian' })}
                        >
                            {pet.fotoUrl ? (
                                <Image
                                    source={{ uri: pet.fotoUrl }}
                                    style={styles.petImage}
                                    contentFit="cover"
                                    transition={200}
                                />
                            ) : (
                                <View style={styles.petImagePlaceholder}>
                                    <Ionicons name="paw-outline" size={30} color="#4B5563" />
                                </View>
                            )}
                        </TouchableOpacity>
                        <Text style={styles.petName} numberOfLines={1}>{pet.nombre}</Text>
                        <Text style={styles.petBreed} numberOfLines={1}>
                            {pet.especie ? pet.especie.charAt(0).toUpperCase() + pet.especie.slice(1) : "Mascota"}
                        </Text>
                    </View>
                ))}
            </View>
        )}
        
      </ScrollView>
    </View>
  );
};

export default VetPatientsScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F3E5F5" },
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
    shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 8, elevation: 6,
  },
  headerTitle: { fontSize: 20, fontWeight: "700", color: "#FFFFFF" },
  headerSubtitle: { marginTop: 2, fontSize: 12, color: "#E1BEE7" },
  headerRight: { flexDirection: "row" },
  iconCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#FFFFFF", justifyContent: "center", alignItems: "center", elevation: 3 },
  
  content: { paddingHorizontal: 20, paddingBottom: 24, paddingTop: 16 },

  // --- FILTROS ---
  filtersRow: { flexDirection: "row", flexWrap: "wrap", marginBottom: 16 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: "#D1C4E9", backgroundColor: "#FFFFFF", marginRight: 8, marginBottom: 8 },
  filterChipActive: { backgroundColor: "#7B1FA2", borderColor: "#7B1FA2" },
  filterChipText: { fontSize: 13, color: "#5E35B1", fontWeight: "500" },
  filterChipTextActive: { color: "#FFFFFF", fontWeight: "600" },
  
  emptyWrapper: { marginTop: 20 },
  placeholderCard: { backgroundColor: "#FFFFFF", borderRadius: 18, padding: 30, alignItems: "center", elevation: 2 },
  placeholderTitle: { marginTop: 10, fontSize: 16, fontWeight: "600", color: "#4A148C" },
  placeholderText: { marginTop: 6, fontSize: 13, color: "#7E57C2", textAlign: "center" },

  gridContainer: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  petItem: { width: "48%", marginBottom: 18, alignItems: "center" },
  petCard: { width: "100%", aspectRatio: 0.95, backgroundColor: "#FFFFFF", borderRadius: 18, overflow: "hidden", elevation: 3, marginBottom: 8 },
  petImage: { width: "100%", height: "100%", backgroundColor: "#E1BEE7" },
  petImagePlaceholder: { flex: 1, backgroundColor: "#E1BEE7", alignItems: "center", justifyContent: "center" },
  petName: { fontSize: 14, fontWeight: "700", color: "#4A148C", textAlign: "center" },
  petBreed: { fontSize: 12, color: "#7E57C2", textAlign: "center" },
});