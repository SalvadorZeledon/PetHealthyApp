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

import { db } from "../../../../firebase/config";
import { COL_MASCOTAS } from "../../../shared/utils/collections";
import { getUserFromStorage } from "../../../shared/utils/storage";

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

          unsubscribe = onSnapshot(
            q,
            (snapshot) => {
              const list = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
              }));
              setPets(list);
              setLoading(false);
            },
            (error) => {
              console.error("Error al cargar mascotas:", error);
              setPets([]);
              setLoading(false);
            }
          );
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
        <View style={styles.emptyWrapper}>
          <View style={styles.placeholderCard}>
            <Ionicons name="paw-outline" size={40} color="#4CAF50" />
            <Text style={styles.placeholderTitle}>
              Aún no tienes mascotas registradas
            </Text>
            <Text style={styles.placeholderText}>
              Cuando registres una mascota, aparecerá aquí su ficha principal.
            </Text>

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleAddPet}
            >
              <Ionicons name="add-outline" size={18} color="#FFFFFF" />
              <Text style={styles.primaryButtonText}>Agregar mascota</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.petsSection}>
        <View style={styles.petsCardHeaderRow}>
          <Text style={styles.petsCardTitle}>Tus mascotas</Text>
          <Text style={styles.petsCountText}>
            {pets.length === 1 ? "1 registrada" : `${pets.length} registradas`}
          </Text>
        </View>

        <View style={styles.gridContainer}>
          {pets.map((pet) => (
            <View key={pet.id} style={styles.petItem}>
              <TouchableOpacity
                activeOpacity={0.9}
                style={styles.petCard}
                onPress={() =>
                  navigation.navigate("PetProfile", { petId: pet.id })
                }
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
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Mis mascotas</Text>
          <Text style={styles.headerSubtitle}>
            Administra y consulta sus perfiles
          </Text>
        </View>

        <View style={styles.headerRight}>
          {/* Botón agregar mascota (izquierda de la tuerquita) */}
          <TouchableOpacity
            style={[styles.iconCircle, styles.iconCirclePrimary]}
            onPress={handleAddPet}
          >
            <Ionicons name="add" size={20} color="#FFFFFF" />
          </TouchableOpacity>

          {/* Botón configuración */}
          <TouchableOpacity
            style={[
              styles.iconCircle,
              styles.iconCircleSecondary,
              { marginLeft: 8 },
            ]}
            onPress={handleOpenSettings}
          >
            <Ionicons name="settings-outline" size={20} color="#365b6d" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {renderContent()}
      </ScrollView>
    </View>
  );
};

export default MyPetScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#E3F2FD",
    paddingTop: 0, // 👈 quitamos el paddingTop de aquí
  },
  header: {
    paddingTop: Platform.OS === "ios" ? 63 : 43,
    paddingHorizontal: 20,
    paddingBottom: 14,

    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",

    backgroundColor: "#4A85A5",
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
    color: "#ffffffff",
  },
  headerSubtitle: {
    marginTop: 2,
    fontSize: 12,
    color: "#ffffffff",
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
  iconCirclePrimary: {
    backgroundColor: "#4CAF50",
  },
  iconCircleSecondary: {
    backgroundColor: "#FFFFFF",
  },

  content: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },

  loadingContainer: {
    marginTop: 32,
    alignItems: "center",
  },
  loadingText: {
    marginTop: 8,
    fontSize: 13,
    color: "#607D8B",
  },

  emptyWrapper: {
    marginTop: 12,
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
    color: "#263238",
    textAlign: "center",
  },
  placeholderText: {
    marginTop: 6,
    fontSize: 13,
    color: "#607D8B",
    textAlign: "center",
  },

  // contenedor sin card
  petsSection: {
    marginTop: 8,
  },
  petsCardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  petsCardTitle: {
    marginTop: 12,
    fontSize: 15,
    fontWeight: "700",
    color: "#263238",
  },
  petsCountText: {
    marginTop: 12,
    fontSize: 12,
    color: "#607D8B",
  },

  gridContainer: {
    marginTop: 4,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  petItem: {
    width: "48%",
    marginBottom: 18,
    alignItems: "center",
  },
  petCard: {
    width: "100%",
    aspectRatio: 0.95,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
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
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#4CAF50",
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 9,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 14,
    marginLeft: 6,
  },
});
