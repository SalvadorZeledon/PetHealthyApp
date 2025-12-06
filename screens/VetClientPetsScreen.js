// screens/VetClientPetsScreen.js
import React, { useCallback, useState } from "react";
import {
  View,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  TouchableOpacity,
  Alert,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import {
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
} from "firebase/firestore";
import { Dialog, ALERT_TYPE } from "react-native-alert-notification";

import { db } from "../firebase/config";
import { COL_MASCOTAS } from "../src/utils/collections";
import { getUserFromStorage } from "../src/utils/storage";
import { useTheme } from "../src/themes/useTheme";
import AppText from "../src/components/ui/AppText";
import AppCard from "../src/components/ui/AppCard";

const VetClientPetsScreen = ({ navigation, route }) => {
  const { colors } = useTheme();
  const { clientId, clientName, clientEmail } = route.params || {};

  const [loading, setLoading] = useState(true);
  const [vetId, setVetId] = useState(null);
  const [pets, setPets] = useState([]);

  // ==============================
  // CARGAR MASCOTAS DEL CLIENTE
  // ==============================
  const loadPets = useCallback(async () => {
    try {
      setLoading(true);

      const user = await getUserFromStorage();
      if (!user || user.rol !== "veterinario") {
        Dialog.show({
          type: ALERT_TYPE.DANGER,
          title: "Acceso restringido",
          textBody:
            "Solo los usuarios con rol veterinario pueden acceder a este panel.",
          button: "Volver",
          onPressButton: () => {
            Dialog.hide();
            navigation.reset({
              index: 0,
              routes: [{ name: "Login" }],
            });
          },
        });
        return;
      }

      const currentVetId = user.id;
      setVetId(currentVetId);

      if (!clientId) {
        Dialog.show({
          type: ALERT_TYPE.WARNING,
          title: "Cliente no válido",
          textBody: "No se pudo identificar al cliente.",
          button: "Volver",
          onPressButton: () => {
            Dialog.hide();
            navigation.goBack();
          },
        });
        return;
      }

      // 1) Buscar relaciones vet-cliente-mascota en "vetClientsPets"
      const relRef = collection(db, "vetClientsPets");
      const qRel = query(
        relRef,
        where("vetId", "==", currentVetId),
        where("clientId", "==", clientId)
      );
      const relSnap = await getDocs(qRel);

      if (relSnap.empty) {
        setPets([]);
        return;
      }

      const petIds = [];
      relSnap.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.petId && !petIds.includes(data.petId)) {
          petIds.push(data.petId);
        }
      });

      if (petIds.length === 0) {
        setPets([]);
        return;
      }

      // 2) Cargar la info de las mascotas desde colección "mascotas"
      const petsPromises = petIds.map((pid) =>
        getDocs(
          query(collection(db, COL_MASCOTAS), where("__name__", "==", pid))
        )
      );

      const petsResults = await Promise.all(petsPromises);

      const loadedPets = [];
      petsResults.forEach((snap) => {
        snap.forEach((docSnap) => {
          const data = docSnap.data();
          loadedPets.push({
            id: docSnap.id,
            nombre: data.nombre || "Mascota sin nombre",
            especie: data.especie || "",
            sexo: data.sexo || "",
            fotoUrl: data.fotoUrl || null,
            edadValor: data.edadValor || null,
            edadTipo: data.edadTipo || null,
          });
        });
      });

      setPets(loadedPets);
    } catch (error) {
      console.error("Error cargando mascotas del cliente:", error);
      Dialog.show({
        type: ALERT_TYPE.DANGER,
        title: "Error",
        textBody:
          "No se pudieron cargar las mascotas de este cliente. Intenta nuevamente.",
        button: "Cerrar",
      });
    } finally {
      setLoading(false);
    }
  }, [navigation, clientId]);

  useFocusEffect(
    useCallback(() => {
      loadPets();
    }, [loadPets])
  );

  // ==============================
  // ELIMINAR MASCOTA DEL PANEL DEL VET
  // (solo relación vet-cliente-mascota)
  // ==============================
  const confirmDeletePet = (pet) => {
    Alert.alert(
      "Quitar mascota",
      `¿Deseas quitar a "${pet.nombre}" de tu panel para este cliente?\n\nLa mascota NO será borrada del sistema, solo dejará de aparecer en tu clínica.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Quitar",
          style: "destructive",
          onPress: () => handleDeletePet(pet.id),
        },
      ]
    );
  };

  const handleDeletePet = async (petId) => {
    if (!vetId || !clientId) return;

    try {
      setLoading(true);

      const relRef = collection(db, "vetClientsPets");
      const qRel = query(
        relRef,
        where("vetId", "==", vetId),
        where("clientId", "==", clientId),
        where("petId", "==", petId)
      );
      const relSnap = await getDocs(qRel);

      const deletes = [];
      relSnap.forEach((docSnap) => deletes.push(deleteDoc(docSnap.ref)));
      await Promise.all(deletes);

      setPets((prev) => prev.filter((p) => p.id !== petId));

      Dialog.show({
        type: ALERT_TYPE.SUCCESS,
        title: "Mascota quitada",
        textBody:
          "La mascota ha sido removida de tu panel para este cliente.",
        button: "OK",
      });
    } catch (error) {
      console.error("Error quitando mascota del vet:", error);
      Dialog.show({
        type: ALERT_TYPE.DANGER,
        title: "Error al quitar mascota",
        textBody:
          "No se pudo quitar la mascota de tu panel. Intenta nuevamente.",
        button: "Cerrar",
      });
    } finally {
      setLoading(false);
    }
  };

  // ==============================
  // HELPERS
  // ==============================
  const formatAge = (pet) => {
    if (!pet.edadValor || !pet.edadTipo) return "";
    const v = pet.edadValor;
    if (pet.edadTipo === "años") {
      return `${v} ${v === 1 ? "año" : "años"}`;
    }
    return `${v} ${v === 1 ? "mes" : "meses"}`;
  };

  // ==============================
  // RENDER ITEM
  // ==============================
  const renderPetItem = ({ item }) => (
    <AppCard
      style={[
        styles.petCard,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      <View style={styles.petRow}>
        <View style={styles.petAvatarWrapper}>
          {item.fotoUrl ? (
            <Image
              source={{ uri: item.fotoUrl }}
              style={styles.petAvatar}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.petAvatarPlaceholder}>
              <Ionicons name="paw-outline" size={24} color={colors.primary} />
            </View>
          )}
        </View>

        <View style={styles.petInfo}>
          <AppText title style={[styles.petName, { color: colors.text }]}>
            {item.nombre}
          </AppText>
          <AppText small style={{ color: colors.textSmall }}>
            {item.especie
              ? item.especie.toUpperCase()
              : "MASCOTA"}{" "}
            {formatAge(item) ? `· ${formatAge(item)}` : ""}
          </AppText>
          {item.sexo ? (
            <AppText small style={{ color: colors.textSmall }}>
              Sexo:{" "}
              {item.sexo === "macho"
                ? "Macho"
                : item.sexo === "hembra"
                ? "Hembra"
                : item.sexo}
            </AppText>
          ) : null}
        </View>

        <View style={styles.petActions}>
          <TouchableOpacity
            style={[
              styles.iconButton,
              { backgroundColor: colors.inputBackground },
            ]}
            onPress={() => navigation.navigate("PetProfile", { petId: item.id })}
          >
            <Ionicons name="document-text-outline" size={18} color={colors.primary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.iconButton,
              { backgroundColor: colors.dangerBackground || "#FEE2E2" },
            ]}
            onPress={() => confirmDeletePet(item)}
          >
            <Ionicons
              name="trash-outline"
              size={18}
              color={colors.dangerText || "#B91C1C"}
            />
          </TouchableOpacity>
        </View>
      </View>
    </AppCard>
  );

  // ==============================
  // UI PRINCIPAL
  // ==============================
  if (loading && pets.length === 0) {
    return (
      <View
        style={[
          styles.loadingContainer,
          { backgroundColor: colors.background },
        ]}
      >
        <ActivityIndicator size="large" color={colors.primary} />
        <AppText small style={{ marginTop: 8, color: colors.textSmall }}>
          Cargando mascotas del cliente...
        </AppText>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.background },
      ]}
    >
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          style={[styles.iconCircle, { backgroundColor: colors.card }]}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={20} color={colors.primary} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <AppText title style={[styles.headerTitle, { color: colors.text }]}>
            Mascotas de
          </AppText>
          <AppText small style={{ color: colors.textSmall }} numberOfLines={1}>
            {clientName || "Cliente"}
          </AppText>
          {clientEmail ? (
            <AppText small style={{ color: colors.textSmall }} numberOfLines={1}>
              {clientEmail}
            </AppText>
          ) : null}
        </View>

        <View style={{ width: 36 }} />
      </View>

      {/* LISTA / VACÍO */}
      {pets.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="paw-outline" size={40} color={colors.textSmall} />
          <AppText
            small
            style={{ marginTop: 8, textAlign: "center", color: colors.textSmall }}
          >
            Este cliente aún no tiene mascotas asignadas en tu clínica.\n\n
            Pídele que te comparta el código de sus mascotas y agrégalas desde
            "Agregar por código".
          </AppText>
        </View>
      ) : (
        <FlatList
          contentContainerStyle={styles.listContent}
          data={pets}
          keyExtractor={(item) => item.id}
          renderItem={renderPetItem}
        />
      )}
    </View>
  );
};

export default VetClientPetsScreen;

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  header: {
    paddingTop: 18,
    paddingHorizontal: 20,
    paddingBottom: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    elevation: 3,
  },
  headerCenter: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
  },

  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },

  petCard: {
    marginBottom: 12,
    borderWidth: 1,
  },
  petRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  petAvatarWrapper: {
    marginRight: 10,
  },
  petAvatar: {
    width: 54,
    height: 54,
    borderRadius: 16,
  },
  petAvatarPlaceholder: {
    width: 54,
    height: 54,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  petInfo: {
    flex: 1,
  },
  petName: {
    fontSize: 15,
    marginBottom: 2,
  },
  petActions: {
    flexDirection: "column",
    alignItems: "flex-end",
    justifyContent: "space-between",
    height: 60,
  },
  iconButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },

  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
});
