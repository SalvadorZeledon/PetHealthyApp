// screens/VetClientsScreen.js
import React, { useCallback, useState } from "react";
import {
  View,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  TouchableOpacity,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import {
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
  writeBatch,
} from "firebase/firestore";
import { Dialog, ALERT_TYPE } from "react-native-alert-notification";

import { db } from "../firebase/config";
import { COL_USUARIOS } from "../src/utils/collections";
import { getUserFromStorage } from "../src/utils/storage";
import { useTheme } from "../src/themes/useTheme";
import AppText from "../src/components/ui/AppText";
import AppCard from "../src/components/ui/AppCard";

const VetClientsScreen = ({ navigation }) => {
  const { colors } = useTheme();

  const [loading, setLoading] = useState(true);
  const [vetId, setVetId] = useState(null);
  const [clients, setClients] = useState([]);

  // ==============================
  // CARGAR CLIENTES AL ENTRAR
  // ==============================
  const loadClients = useCallback(async () => {
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

      // 1) Buscar relaciones vet-cliente
      const relRef = collection(db, "vetClients");
      const qRel = query(relRef, where("vetId", "==", currentVetId));
      const relSnap = await getDocs(qRel);

      if (relSnap.empty) {
        setClients([]);
        return;
      }

      const clientIds = [];
      relSnap.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.clientId && !clientIds.includes(data.clientId)) {
          clientIds.push(data.clientId);
        }
      });

      if (clientIds.length === 0) {
        setClients([]);
        return;
      }

      // 2) Cargar info de cada cliente desde "usuarios"
      const usuariosPromises = clientIds.map((cid) =>
        getDocs(
          query(collection(db, COL_USUARIOS), where("__name__", "==", cid))
        )
      );

      const usuariosResults = await Promise.all(usuariosPromises);

      const loadedClients = [];
      usuariosResults.forEach((snap) => {
        snap.forEach((docSnap) => {
          const data = docSnap.data();
          loadedClients.push({
            id: docSnap.id,
            nombre:
              data.nombre ||
              `${data.nombres || ""} ${data.apellidos || ""}`.trim() ||
              "Cliente sin nombre",
            email: data.email || "",
            telefono: data.telefono || "",
          });
        });
      });

      setClients(loadedClients);
    } catch (error) {
      console.error("Error cargando clientes del veterinario:", error);
      Dialog.show({
        type: ALERT_TYPE.DANGER,
        title: "Error",
        textBody:
          "No se pudieron cargar tus clientes. Intenta nuevamente más tarde.",
        button: "Cerrar",
      });
    } finally {
      setLoading(false);
    }
  }, [navigation]);

  useFocusEffect(
    useCallback(() => {
      loadClients();
    }, [loadClients])
  );

  // ==============================
  // ELIMINAR CLIENTE DEL PANEL DEL VET
  // (solo relaciones, NO se borra el usuario ni sus mascotas)
  // ==============================
  const confirmDeleteClient = (client) => {
    Alert.alert(
      "Eliminar cliente",
      `¿Deseas quitar a "${client.nombre}" de tu panel profesional? Esto no borrará la cuenta del cliente ni sus mascotas, solo la relación con tu clínica.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: () => handleDeleteClient(client.id),
        },
      ]
    );
  };

  const handleDeleteClient = async (clientId) => {
    if (!vetId) return;

    try {
      setLoading(true);

      const batch = writeBatch(db);

      // 1) Borrar relación en "vetClients"
      const relRef = collection(db, "vetClients");
      const qRel = query(
        relRef,
        where("vetId", "==", vetId),
        where("clientId", "==", clientId)
      );
      const relSnap = await getDocs(qRel);
      relSnap.forEach((docSnap) => batch.delete(docSnap.ref));

      // 2) Borrar todas las mascotas de ese cliente en "vetClientsPets"
      const relPetsRef = collection(db, "vetClientsPets");
      const qRelPets = query(
        relPetsRef,
        where("vetId", "==", vetId),
        where("clientId", "==", clientId)
      );
      const relPetsSnap = await getDocs(qRelPets);
      relPetsSnap.forEach((docSnap) => batch.delete(docSnap.ref));

      await batch.commit();

      // 3) Actualizar lista local
      setClients((prev) => prev.filter((c) => c.id !== clientId));

      Dialog.show({
        type: ALERT_TYPE.SUCCESS,
        title: "Cliente eliminado",
        textBody: "El cliente ha sido eliminado de tu panel profesional.",
        button: "OK",
      });
    } catch (error) {
      console.error("Error eliminando cliente del vet:", error);
      Dialog.show({
        type: ALERT_TYPE.DANGER,
        title: "Error al eliminar",
        textBody:
          "No se pudo eliminar el cliente de tu panel. Intenta nuevamente.",
        button: "Cerrar",
      });
    } finally {
      setLoading(false);
    }
  };

  // ==============================
  // RENDER ITEM LISTA
  // ==============================
  const renderClientItem = ({ item }) => (
    <AppCard
      style={[
        styles.clientCard,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      <View style={styles.clientRow}>
        <View style={styles.clientAvatar}>
          <Ionicons name="person-circle-outline" size={38} color={colors.primary} />
        </View>

        <View style={styles.clientInfo}>
          <AppText title style={[styles.clientName, { color: colors.text }]}>
            {item.nombre}
          </AppText>
          {item.email ? (
            <AppText small style={{ color: colors.textSmall }}>
              {item.email}
            </AppText>
          ) : null}
          {item.telefono ? (
            <AppText small style={{ color: colors.textSmall }}>
              Tel: {item.telefono}
            </AppText>
          ) : null}
        </View>

        <View style={styles.clientActions}>
          <TouchableOpacity
            style={[
              styles.iconButton,
              { backgroundColor: colors.inputBackground },
            ]}
            onPress={() =>
              navigation.navigate("VetClientPets", {
                clientId: item.id,
                clientName: item.nombre,
                clientEmail: item.email || "",
              })
            }
          >
            <Ionicons name="paw-outline" size={20} color={colors.primary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.iconButton,
              { backgroundColor: colors.dangerBackground || "#FEE2E2" },
            ]}
            onPress={() => confirmDeleteClient(item)}
          >
            <Ionicons
              name="trash-outline"
              size={20}
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
  if (loading && clients.length === 0) {
    return (
      <View
        style={[
          styles.loadingContainer,
          { backgroundColor: colors.background },
        ]}
      >
        <ActivityIndicator size="large" color={colors.primary} />
        <AppText small style={{ marginTop: 8, color: colors.textSmall }}>
          Cargando tus clientes...
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

        <AppText title style={[styles.headerTitle, { color: colors.text }]}>
          Mis clientes
        </AppText>

        <View style={{ width: 36 }} />
      </View>

      {/* LISTA / VACÍO */}
      {clients.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons
            name="people-outline"
            size={40}
            color={colors.textSmall}
          />
          <AppText
            small
            style={{ marginTop: 8, textAlign: "center", color: colors.textSmall }}
          >
            Aún no tienes clientes vinculados.{"\n"}
            Pide a tus clientes que te envíen el código de sus mascotas y
            agrégalas desde "Agregar por código".
          </AppText>
        </View>
      ) : (
        <FlatList
          contentContainerStyle={styles.listContent}
          data={clients}
          keyExtractor={(item) => item.id}
          renderItem={renderClientItem}
        />
      )}
    </View>
  );
};

export default VetClientsScreen;

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
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "700",
  },

  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  clientCard: {
    marginBottom: 12,
    borderWidth: 1,
  },
  clientRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  clientAvatar: {
    marginRight: 10,
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: 15,
    marginBottom: 2,
  },
  clientActions: {
    flexDirection: "column",
    alignItems: "flex-end",
    justifyContent: "space-between",
    height: 60,
  },
  iconButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
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
