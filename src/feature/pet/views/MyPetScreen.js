// src/feature/pet/views/MyPetScreen.js
import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Platform,
} from "react-native";
import { Image } from "expo-image"; 
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { collection, query, where, onSnapshot, doc, deleteDoc } from "firebase/firestore";
import { ALERT_TYPE, Dialog } from "react-native-alert-notification";

import { db } from "../../../../firebase/config";
import { COL_MASCOTAS } from "../../../shared/utils/collections";
import { getUserFromStorage } from "../../../shared/utils/storage";

const MyPetScreen = ({ navigation }) => {
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // 1. ESTADO PARA EL MODO DE ELIMINACIÓN
  const [isDeleteMode, setIsDeleteMode] = useState(false);

  const handleOpenSettings = () => {
    navigation.navigate("Settings");
  };

  const handleAddPet = () => {
    navigation.navigate("RegistroMascota");
  };

  // LÓGICA PARA ALTERNAR EL MODO ELIMINAR
  const toggleDeleteMode = () => {
    setIsDeleteMode(!isDeleteMode);
  };

  // --- LÓGICA PARA BORRAR MASCOTA ---
  const handleDeletePet = (pet) => {
    Dialog.show({
      type: ALERT_TYPE.WARNING,
      title: "Eliminar mascota",
      textBody: `¿Estás seguro de que quieres eliminar a ${pet.nombre}?`,
      button: "Eliminar",
      onPressButton: async () => {
        try {
          Dialog.hide();
          await deleteDoc(doc(db, COL_MASCOTAS, pet.id));
          
          Dialog.show({
            type: ALERT_TYPE.SUCCESS,
            title: "Eliminado",
            textBody: `${pet.nombre} ha sido eliminado.`,
            button: "Ok",
          });
          
          // Opcional: Salir del modo eliminar tras borrar uno
          // setIsDeleteMode(false); 
        } catch (error) {
          console.error("Error al eliminar:", error);
          Dialog.show({
            type: ALERT_TYPE.DANGER,
            title: "Error",
            textBody: "No se pudo eliminar la mascota.",
            button: "Cerrar",
          });
        }
      }
    });
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

      // Si salimos de la pantalla, reseteamos el modo eliminar
      return () => {
        if (unsubscribe) unsubscribe();
        setIsDeleteMode(false);
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
          <Text style={styles.petsCardTitle}>
             {/* Cambia el título si estamos borrando para avisar al usuario */}
             {isDeleteMode ? "Selecciona para eliminar" : "Tus mascotas"}
          </Text>
          <Text style={styles.petsCountText}>
            {pets.length === 1 ? "1 registrada" : `${pets.length} registradas`}
          </Text>
        </View>

        <View style={styles.gridContainer}>
          {pets.map((pet) => (
            <View key={pet.id} style={styles.petItem}>
              
              <TouchableOpacity
                activeOpacity={0.9}
                // 3. CAMBIO VISUAL: Borde rojo si está en modo eliminar
                style={[
                    styles.petCard, 
                    isDeleteMode && styles.petCardDeleteMode
                ]}
                onPress={() => {
                  // 4. LÓGICA CONDICIONAL AL TOCAR
                  if (isDeleteMode) {
                    handleDeletePet(pet);
                  } else {
                    navigation.navigate("PetProfile", { petId: pet.id });
                  }
                }}
              >
                {pet.fotoUrl ? (
                  <Image
                    source={pet.fotoUrl}
                    style={styles.petImage}
                    contentFit="cover"
                    transition={500}
                    cachePolicy="memory-disk" 
                  />
                ) : (
                  <View style={styles.petImagePlaceholder}>
                    <Ionicons name="paw-outline" size={30} color="#4B5563" />
                  </View>
                )}

                {/* VISUAL: Overlay rojo o icono grande cuando está en modo eliminar */}
                {isDeleteMode && (
                    <View style={styles.deleteOverlay}>
                        <Ionicons name="trash" size={32} color="#FFFFFF" />
                    </View>
                )}
                
                {/* NOTA: Eliminamos el botón pequeño flotante anterior */}

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
          {/* BOTÓN AGREGAR */}
          <TouchableOpacity
            style={[styles.iconCircle, styles.iconCirclePrimary]}
            onPress={handleAddPet}
          >
            <Ionicons name="add" size={20} color="#FFFFFF" />
          </TouchableOpacity>

          {/* 2. NUEVO BOTÓN ELIMINAR (Después del mas) */}
          <TouchableOpacity
            style={[
              styles.iconCircle,
              // Si está activo es Rojo, si no, blanco normal
              isDeleteMode ? styles.iconCircleDanger : styles.iconCircleSecondary,
              { marginLeft: 8 },
            ]}
            onPress={toggleDeleteMode}
          >
            <Ionicons 
                name={isDeleteMode ? "close" : "trash-outline"} 
                size={20} 
                color={isDeleteMode ? "#FFFFFF" : "#365b6d"} 
            />
          </TouchableOpacity>

          {/* BOTÓN SETTINGS */}
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
    paddingTop: 0,
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
  // ESTILO BOTÓN ROJO (Activo)
  iconCircleDanger: {
    backgroundColor: "#EF4444", // Rojo
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
    position: 'relative',
    borderWidth: 2,
    borderColor: 'transparent', // Por defecto sin borde visible
  },
  // ESTILO CUANDO ESTÁ EN MODO ELIMINAR
  petCardDeleteMode: {
    borderColor: '#EF4444', // Borde rojo
  },
  deleteOverlay: {
    ...StyleSheet.absoluteFillObject, // Cubre toda la tarjeta
    backgroundColor: 'rgba(239, 68, 68, 0.4)', // Fondo rojo semitransparente
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
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