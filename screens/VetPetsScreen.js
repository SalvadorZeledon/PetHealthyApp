// screens/VetPetsScreen.js
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { db } from "../firebase/config";
import { getUserFromStorage } from "../src/utils/storage";
import {
  collection,
  getDocs,
  deleteDoc,
  doc,
} from "firebase/firestore";

export default function VetPetsScreen({ navigation }) {
  const [pets, setPets] = useState([]);
  const [vetId, setVetId] = useState(null);

  useEffect(() => {
    loadPets();
  }, []);

  const loadPets = async () => {
    const user = await getUserFromStorage();
    if (!user || user.rol !== "veterinario") return;

    setVetId(user.id);

    const snap = await getDocs(
      collection(db, "veterinarios", user.id, "mascotas")
    );

    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    setPets(list);
  };

  const removePet = (petId) => {
    Alert.alert(
      "Eliminar mascota",
      "¿Deseas quitar esta mascota de tu lista? (No se borrará del dueño)",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            await deleteDoc(doc(db, "veterinarios", vetId, "mascotas", petId));

            setPets((prev) => prev.filter((p) => p.id !== petId));
          },
        },
      ]
    );
  };

  const renderPet = ({ item }) => (
    <TouchableOpacity
      style={styles.petCard}
      onPress={() =>
        navigation.navigate("VetPetProfile", { petId: item.petId })
      }
    >
      <Image
        source={
          item.fotoUrl
            ? { uri: item.fotoUrl }
            : require("../assets/pet_placeholder.png")
        }
        style={styles.image}
      />

      <View style={{ flex: 1 }}>
        <Text style={styles.petName}>{item.nombre}</Text>
        <Text style={styles.petOwner}>Dueño: {item.ownerName}</Text>
      </View>

      <TouchableOpacity onPress={() => removePet(item.id)}>
        <Ionicons name="trash-outline" size={24} color="#d33" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mascotas en la clínica</Text>

      <FlatList
        data={pets}
        keyExtractor={(i) => i.id}
        renderItem={renderPet}
        contentContainerStyle={{ paddingBottom: 40 }}
      />

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => navigation.navigate("VetAddByCode")}
      >
        <Ionicons name="add" size={30} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#F1F8E9" },

  title: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 10,
    color: "#2e4e3f",
  },

  petCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
    alignItems: "center",
    elevation: 2,
  },

  image: { width: 60, height: 60, borderRadius: 10, marginRight: 12 },

  petName: { fontSize: 17, fontWeight: "700", color: "#333" },

  petOwner: { fontSize: 13, color: "#666" },

  addButton: {
    position: "absolute",
    right: 20,
    bottom: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#43A047",
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
  },
});
