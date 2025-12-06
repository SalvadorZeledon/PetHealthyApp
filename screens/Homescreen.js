// screens/HomeScreen.js
import React, { useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { collection, query, where, onSnapshot } from "firebase/firestore";

import { getUserFromStorage } from "../src/utils/storage";
import { db } from "../firebase/config";
import { COL_MASCOTAS } from "../src/utils/collections";

import { useTheme } from "../src/themes/useTheme";
import AppText from "../src/components/ui/AppText";

const avatarPlaceholder = require("../assets/logo.png");

const HomeScreen = ({ navigation }) => {
  const { colors, text } = useTheme();

  const [user, setUser] = useState(null);
  const [photoUri, setPhotoUri] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

  const [pets, setPets] = useState([]);
  const [loadingPets, setLoadingPets] = useState(true);

  const [petsCardWidth, setPetsCardWidth] = useState(0);
  const [activePetIndex, setActivePetIndex] = useState(0);

  useFocusEffect(
    useCallback(() => {
      let unsubscribePets;

      const loadData = async () => {
        try {
          setLoadingUser(true);
          setLoadingPets(true);

          const stored = await getUserFromStorage();
          if (!stored || !stored.id) {
            setUser(null);
            setPhotoUri(null);
            setPets([]);
            return;
          }

          setUser(stored);

          const localPhoto = await AsyncStorage.getItem(
            `@userPhoto_${stored.id}`
          );
          setPhotoUri(localPhoto || null);

          const q = query(
            collection(db, COL_MASCOTAS),
            where("ownerId", "==", stored.id)
          );

          unsubscribePets = onSnapshot(
            q,
            (snapshot) => {
              const list = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
              }));
              setPets(list);
              setLoadingPets(false);
            },
            () => {
              setPets([]);
              setLoadingPets(false);
            }
          );
        } finally {
          setLoadingUser(false);
        }
      };

      loadData();

      return () => {
        if (unsubscribePets) unsubscribePets();
      };
    }, [])
  );

  const handleOpenSettings = () => navigation.navigate("Settings");
  const handleOpenProfile = () => navigation.navigate("UserInfo");
  const handleSeeAllPets = () => navigation.navigate("MyPets");

  const displayName =
    (user && (user.nombre || user.username || user.nombres)) || "Usuario";

  const formatPetAge = (pet) => {
    if (!pet?.edadValor || !pet?.edadTipo) return "Edad no registrada";

    const valor = Number(pet.edadValor);
    const tipo = pet.edadTipo;

    return tipo === "años"
      ? `${valor} ${valor === 1 ? "año" : "años"}`
      : `${valor} ${valor === 1 ? "mes" : "meses"}`;
  };

  const renderPetsSectionContent = (cardWidth) => {
    if (loadingPets) {
      return (
        <View style={styles.petsLoadingRow}>
          <ActivityIndicator size="small" color={colors.primary} />
          <AppText small style={{ marginLeft: 8 }}>
            Cargando tus mascotas…
          </AppText>
        </View>
      );
    }

    if (!pets.length) {
      return (
        <View style={[styles.petsEmptyCard, { backgroundColor: colors.card }]}>
          <Ionicons name="paw-outline" size={32} color={colors.buttonPrimary} />

          <AppText title style={styles.petsEmptyTitle}>
            Aún no tienes mascotas registradas
          </AppText>

          <AppText small style={styles.petsEmptyText}>
            Registra tu primera mascota para ver aquí su resumen rápido.
          </AppText>

          <TouchableOpacity
            style={[
              styles.petsEmptyButton,
              { backgroundColor: colors.buttonPrimary },
            ]}
            onPress={() => navigation.navigate("RegistroMascota")}
          >
            <Ionicons name="add" size={18} color="#FFFFFF" />
            <AppText style={styles.petsEmptyButtonText}>Registrar mascota</AppText>
          </TouchableOpacity>
        </View>
      );
    }

    if (!cardWidth) return null;

    const innerCardWidth = cardWidth - 39;

    return (
      <>
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          style={{ width: cardWidth }}
          onMomentumScrollEnd={(e) => {
            const index = Math.round(
              e.nativeEvent.contentOffset.x / cardWidth
            );
            setActivePetIndex(index);
          }}
        >
          {pets.map((pet) => (
            <View key={pet.id} style={{ width: cardWidth }}>
              <TouchableOpacity
                activeOpacity={0.9}
                style={[
                  styles.petCard,
                  { width: innerCardWidth, backgroundColor: colors.card },
                ]}
                onPress={() =>
                  navigation.navigate("PetProfile", { petId: pet.id })
                }
              >
                <View style={styles.petAvatarWrapper}>
                  {pet.fotoUrl ? (
                    <Image
                      source={{ uri: pet.fotoUrl }}
                      style={styles.petAvatarImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.petAvatarPlaceholder}>
                      <Ionicons name="paw-outline" size={32} color="#4B5563" />
                    </View>
                  )}
                </View>

                <View style={styles.petInfo}>
                  <AppText title>{pet.nombre || "Mascota"}</AppText>

                  <View style={styles.petRow}>
                    <AppText small>{formatPetAge(pet)}</AppText>
                    <AppText small style={styles.petDivider}>
                      |
                    </AppText>
                    <AppText small>
                      {pet.raza || pet.especie || "Sin raza definida"}
                    </AppText>
                  </View>

                  {pet.pesoLbs ? (
                    <AppText small>{pet.pesoLbs} lbs aprox.</AppText>
                  ) : null}
                </View>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>

        <View style={styles.dotsRow}>
          {pets.map((_, idx) => (
            <View
              key={idx}
              style={[
                styles.dot,
                idx === activePetIndex && { backgroundColor: colors.primary },
              ]}
            />
          ))}
        </View>
      </>
    );
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.background },
      ]}
    >
      {/* HEADER */}
      <View style={styles.header}>
        <View>
          <AppText small style={{ color: colors.textSmall }}>
            Hola,
          </AppText>

          {loadingUser ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <View style={styles.nameRow}>
              <AppText title>{displayName}</AppText>
              <AppText style={styles.wave}> 👋</AppText>
            </View>
          )}
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={[styles.iconCircle, { backgroundColor: colors.card }]}
            onPress={handleOpenProfile}
          >
            <Image
              source={photoUri ? { uri: photoUri } : avatarPlaceholder}
              style={styles.avatar}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.iconCircle,
              { backgroundColor: colors.card, marginLeft: 8 },
            ]}
            onPress={handleOpenSettings}
          >
            <Ionicons name="settings-outline" size={20} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* CONTENIDO */}
      <ScrollView contentContainerStyle={styles.content}>
        <View
          style={[styles.petsCard, { backgroundColor: colors.card }]}
          onLayout={(e) => setPetsCardWidth(e.nativeEvent.layout.width)}
        >
          <View style={styles.petsHeaderRow}>
            <AppText title style={{ flex: 1 }}>
              Tus mascotas
            </AppText>

            <TouchableOpacity onPress={handleSeeAllPets}>
              <AppText small style={{ color: colors.info }}>
                Ver todas
              </AppText>
            </TouchableOpacity>
          </View>

          {renderPetsSectionContent(petsCardWidth)}
        </View>

        <AppText title style={styles.sectionTitle}>
          Tu próxima cita
        </AppText>

        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <View style={{ flex: 1 }}>
            <AppText title style={styles.cardTitle}>
              Consulta general
            </AppText>
            <AppText small style={styles.cardSubtitle}>
              Con Max 🐶
            </AppText>
            <AppText small style={styles.cardDetail}>
              Lunes 15 · 10:30 AM
            </AppText>
            <AppText small style={styles.cardDetail}>
              Clínica PetHealthy
            </AppText>
          </View>

          <View
            style={[
              styles.cardIconWrapper,
              { backgroundColor: colors.background },
            ]}
          >
            <Ionicons name="calendar-outline" size={22} color={colors.primary} />
          </View>
        </View>

        <AppText title style={styles.sectionTitle}>
          Accesos rápidos
        </AppText>

        <View style={styles.quickRow}>
          <TouchableOpacity
            style={[styles.quickCard, { backgroundColor: colors.card }]}
            onPress={() => navigation.navigate("RegistroMascota")}
          >
            <Ionicons name="add-circle-outline" size={22} color={colors.buttonPrimary} />
            <AppText small style={styles.quickText}>
              Agregar mascota
            </AppText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickCard, { backgroundColor: colors.card }]}
          >
            <Ionicons name="medkit-outline" size={22} color={colors.info} />
            <AppText small style={styles.quickText}>
              Vacunas
            </AppText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickCard, { backgroundColor: colors.card }]}
          >
            <Ionicons name="time-outline" size={22} color="#FFB300" />
            <AppText small style={styles.quickText}>
              Próximas citas
            </AppText>
          </TouchableOpacity>
        </View>

        <AppText title style={styles.sectionTitle}>
          Resumen de salud
        </AppText>

        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, { backgroundColor: colors.card }]}>
            <Ionicons name="heart-outline" size={22} color="#E91E63" />
            <AppText small style={styles.summaryTitle}>
              Vacunas al día
            </AppText>
            <AppText title style={styles.summaryValue}>
              4 / 5
            </AppText>
          </View>

          <View style={[styles.summaryCard, { backgroundColor: colors.card }]}>
            <Ionicons name="chatbubbles-outline" size={22} color="#00796B" />
            <AppText small style={styles.summaryTitle}>
              Consultas este año
            </AppText>
            <AppText title style={styles.summaryValue}>
              3
            </AppText>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === "ios" ? 40 : 24,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  wave: {
    fontSize: 20,
    marginLeft: 4,
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
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },

  petsCard: {
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 16,
    elevation: 3,
  },
  petsHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },

  petsLoadingRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
  },

  petsEmptyCard: {
    marginTop: 6,
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 12,
    alignItems: "center",
  },

  petsEmptyTitle: { textAlign: "center" },
  petsEmptyText: { textAlign: "center" },

  petsEmptyButton: {
    marginTop: 10,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  petsEmptyButtonText: {
    marginLeft: 6,
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 13,
  },

  petCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 20,
    padding: 14,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },

  petAvatarWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: "#80DEEA",
    overflow: "hidden",
    marginRight: 14,
  },
  petAvatarImage: { width: "100%", height: "100%" },
  petAvatarPlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  petInfo: { flex: 1 },
  petRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    flexWrap: "wrap",
  },
  petDivider: {
    fontSize: 14,
    marginHorizontal: 6,
  },

  dotsRow: {
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#CFD8DC",
    marginHorizontal: 3,
  },

  sectionTitle: {
    marginTop: 8,
    marginBottom: 6,
  },

  card: {
    borderRadius: 18,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
    elevation: 2,
  },
  cardIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },

  quickRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  quickCard: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 10,
    alignItems: "center",
    marginHorizontal: 4,
    elevation: 2,
  },
  quickText: { textAlign: "center" },

  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  summaryCard: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 10,
    alignItems: "center",
    marginHorizontal: 4,
    elevation: 2,
  },
  summaryTitle: { marginTop: 4 },
  summaryValue: { marginTop: 2 },
});
