// screens/VetPetDetailScreen.js
import React, { useEffect, useState } from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { doc, getDoc, collection, getDocs, deleteDoc } from "firebase/firestore";

import { db } from "../firebase/config";
import { useTheme } from "../src/themes/useTheme";

import AppCard from "../src/components/ui/AppCard";
import AppText from "../src/components/ui/AppText";

export default function VetPetDetailScreen({ navigation, route }) {
  const { colors } = useTheme();
  const { petId, clientRecordId } = route.params;

  const [pet, setPet] = useState(null);
  const [consultas, setConsultas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPet();
    loadConsultas();
  }, []);

  const loadPet = async () => {
    try {
      const petSnap = await getDoc(doc(db, "mascotas", petId));
      if (petSnap.exists()) {
        setPet({ id: petSnap.id, ...petSnap.data() });
      }
    } catch (err) {
      console.log("Error cargando mascota:", err);
    }
  };

  const loadConsultas = async () => {
    try {
      const q = collection(db, "clientes_vet", clientRecordId, "mascotas", petId, "consultas");
      const snap = await getDocs(q);

      setConsultas(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.log("Error cargando consultas:", err);
    } finally {
      setLoading(false);
    }
  };

  const borrarMascotaDelVet = async () => {
    navigation.navigate("VetDeleteConfirm", {
      type: "pet",
      petId,
      clientRecordId,
      onDelete: async () => {
        await deleteDoc(doc(db, "clientes_vet", clientRecordId, "mascotas", petId));
      },
    });
  };

  if (loading || !pet) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.background,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <AppText>Cargando ficha de mascota...</AppText>
      </View>
    );
  }

  const edadFormateada = () => {
    if (!pet.edadValor || !pet.edadTipo) return "No especificada";
    const unidad = pet.edadValor === 1 ? pet.edadTipo.slice(0, -1) : pet.edadTipo;
    return `${pet.edadValor} ${unidad}`;
  };

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
          {pet.nombre}
        </AppText>

        <TouchableOpacity
          style={[styles.iconCircle, { backgroundColor: "#e53935" }]}
          onPress={borrarMascotaDelVet}
        >
          <Ionicons name="trash-outline" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {/* PERFIL BÁSICO */}
        <AppCard style={styles.card}>
          {pet.fotoUrl ? (
            <Image source={{ uri: pet.fotoUrl }} style={styles.petImage} />
          ) : (
            <View style={styles.petPlaceholder}>
              <Ionicons name="paw-outline" size={40} color={colors.textSmall} />
            </View>
          )}

          <AppText title style={styles.petName}>
            {pet.nombre}
          </AppText>

          <AppText small style={styles.subInfo}>
            {pet.especie?.toUpperCase()} · {edadFormateada()}
          </AppText>

          <View style={styles.row}>
            <AppText small style={styles.label}>Sexo:</AppText>
            <AppText>{pet.sexo || "No especificado"}</AppText>
          </View>
          <View style={styles.row}>
            <AppText small style={styles.label}>Microchip:</AppText>
            <AppText>{pet.tieneMicrochip ? pet.identificadorMicrochip : "No"}</AppText>
          </View>
        </AppCard>

        {/* CONSULTAS MÉDICAS DEL VET */}
        <AppCard style={styles.card}>
          <AppText title style={styles.sectionTitle}>Consultas médicas</AppText>

          {consultas.length === 0 ? (
            <AppText small>No hay consultas registradas.</AppText>
          ) : (
            consultas.map((c) => (
              <TouchableOpacity
                key={c.id}
                style={styles.consultaItem}
                onPress={() =>
                  navigation.navigate("VetConsultHistory", {
                    petId,
                    clientRecordId,
                    consultId: c.id,
                  })
                }
              >
                <Ionicons name="document-text-outline" size={22} color={colors.primary} />
                <View style={{ marginLeft: 10 }}>
                  <AppText>{c.motivo}</AppText>
                  <AppText small style={{ color: colors.textSmall }}>
                    {new Date(c.fecha).toLocaleDateString()}
                  </AppText>
                </View>
              </TouchableOpacity>
            ))
          )}

          {/* BOTÓN AGREGAR CONSULTA */}
          <TouchableOpacity
            style={[styles.addBtn, { backgroundColor: colors.primary }]}
            onPress={() =>
              navigation.navigate("VetAddConsult", {
                petId,
                clientRecordId,
              })
            }
          >
            <Ionicons name="add-circle-outline" size={24} color="#fff" />
            <AppText style={styles.addBtnText}>Agregar consulta</AppText>
          </TouchableOpacity>
        </AppCard>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingTop: 20,
    justifyContent: "space-between",
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

  petImage: {
    width: "100%",
    height: 180,
    borderRadius: 14,
    marginBottom: 12,
  },

  petPlaceholder: {
    width: "100%",
    height: 180,
    borderRadius: 14,
    backgroundColor: "#ccc3",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },

  petName: {
    marginBottom: 4,
    textAlign: "center",
  },

  subInfo: {
    textAlign: "center",
    marginBottom: 12,
  },

  row: {
    flexDirection: "row",
    marginTop: 4,
  },

  label: {
    width: 100,
    color: "#888",
  },

  consultaItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },

  sectionTitle: {
    marginBottom: 8,
  },

  addBtn: {
    marginTop: 12,
    padding: 12,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  addBtnText: {
    color: "#fff",
    marginLeft: 6,
  },
});
