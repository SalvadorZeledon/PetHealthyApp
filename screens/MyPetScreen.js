import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Image,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { collection, query, where, onSnapshot } from "firebase/firestore";

import { db } from "../firebase/config";
import { COL_MASCOTAS } from "../src/utils/collections";
import { getUserFromStorage } from "../src/utils/storage";

const MyPetScreen = ({ navigation }) => {
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);

  const handleOpenSettings = () => {
    navigation.navigate("Settings");
  };

  const handleAddPet = () => {
    navigation.navigate("RegistroMascota");
  };

  useFocusEffect(
    useCallback(() => {
      let unsubscribe;

      const fetchPets = async () => {
        try {
          setLoading(true);
          const user = await getUserFromStorage();
          if (!user || !user.id) {
            setPets([]);
            setLoading(false);
            return;
          }

          const q = query(
            collection(db, COL_MASCOTAS),
            where("ownerId", "==", user.id)
          );

          unsubscribe = onSnapshot(q, (snapshot) => {
            const list = snapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            }));
            setPets(list);
            setLoading(false);
          });
        } catch (error) {
          console.error("Error al cargar mascotas:", error);
          setPets([]);
          setLoading(false);
        }
      };

      fetchPets();

      return () => {
        if (unsubscribe) unsubscribe();
      };
    }, [])
  );

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#365b6d" />
          <Text style={styles.loadingText}>Cargando tus mascotas...</Text>
        </View>
      );
    }

    if (!pets.length) {
      return (
        <View style={styles.placeholderCard}>
          <Ionicons name="paw-outline" size={40} color="#4CAF50" />
          <Text style={styles.placeholderTitle}>
            Aún no tienes mascotas registradas
          </Text>
          <Text style={styles.placeholderText}>
            Cuando registres una mascota, aparecerá aquí su ficha principal.
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.gridContainer}>
        {pets.map((pet) => (
          <View key={pet.id} style={styles.petItem}>
            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.petCard}
              onPress={() => {
                navigation.navigate("PetProfile", { petId: pet.id });
              }}
            >
              {pet.fotoUrl ? (
                <Image
                  source={{ uri: pet.fotoUrl }}
                  style={styles.petImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.petImagePlaceholder}>
                  <Ionicons name="paw-outline" size={30} color="#4B5563" />
                </View>
              )}
            </TouchableOpacity>

            <Text style={styles.petName} numberOfLines={1}>
              {pet.nombre || "Mascota"}
            </Text>
          </View>
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mis mascotas</Text>

        <TouchableOpacity
          style={styles.iconCircle}
          onPress={handleOpenSettings}
        >
          <Ionicons name="settings-outline" size={20} color="#365b6d" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {renderContent()}

        {/* Botón agregar nueva mascota */}
        <TouchableOpacity style={styles.primaryButton} onPress={handleAddPet}>
          <Ionicons name="add-outline" size={18} color="#FFFFFF" />
          <Text style={styles.primaryButtonText}>Agregar nueva mascota</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

export default MyPetScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#E3F2FD",
    paddingTop: Platform.OS === "ios" ? 40 : 24, // 👈 igual que Home y UserInfo
  },
  header: {
    paddingTop: 18,
    paddingHorizontal: 20,
    paddingBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#263238",
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    elevation: 3,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  loadingContainer: {
    marginTop: 24,
    alignItems: "center",
  },
  loadingText: {
    marginTop: 8,
    fontSize: 13,
    color: "#607D8B",
  },
  placeholderCard: {
    marginTop: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 18,
    alignItems: "center",
    elevation: 3,
  },
  placeholderTitle: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: "600",
    color: "#263238",
  },
  placeholderText: {
    marginTop: 4,
    fontSize: 13,
    color: "#607D8B",
    textAlign: "center",
  },
  gridContainer: {
    marginTop: 12,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  petItem: {
    width: "30%",
    marginBottom: 18,
    alignItems: "center",
  },
  petCard: {
    width: "100%",
    aspectRatio: 0.9,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  petImage: {
    width: "100%",
    height: "100%",
  },
  petImagePlaceholder: {
    flex: 1,
    backgroundColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
  },
  petName: {
    marginTop: 6,
    fontSize: 13,
    fontWeight: "600",
    color: "#111827",
    textAlign: "center",
  },
  primaryButton: {
    marginTop: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#4CAF50",
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 14,
    marginLeft: 6,
  },
});
