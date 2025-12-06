// screens/VetAddByCodeScreen.js
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ALERT_TYPE, Dialog } from "react-native-alert-notification";

import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase/config";
import { getUserFromStorage } from "../src/utils/storage";

const VetAddByCodeScreen = ({ navigation }) => {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  // ======================================
  // BUSCAR MASCOTA POR CÓDIGO (petId)
  // ======================================
  const handleSearch = async () => {
    const codigo = code.trim();

    if (codigo.length < 10) {
      Dialog.show({
        type: ALERT_TYPE.WARNING,
        title: "Código incompleto",
        textBody: "Ingresa un código válido de mascota.",
        button: "Cerrar",
      });
      return;
    }

    setLoading(true);

    try {
      const vet = await getUserFromStorage();
      if (!vet || !vet.id) {
        throw new Error("Sesión expirada. Reinicia la aplicación.");
      }

      // 👉 Buscar mascota por ID directamente (petId)
      const mascotaRef = doc(db, "mascotas", codigo);
      const mascotaSnap = await getDoc(mascotaRef);

      if (!mascotaSnap.exists()) {
        setLoading(false);
        Dialog.show({
          type: ALERT_TYPE.WARNING,
          title: "No encontrada",
          textBody: "No existe ninguna mascota con este código.",
          button: "Cerrar",
        });
        return;
      }

      const mascotaData = { id: mascotaSnap.id, ...mascotaSnap.data() };

      // ---------------------------------------------
      // Buscar si ya existe en "vetClients"
      // ---------------------------------------------
      const clientRef = doc(db, "vetClients", `${vet.id}_${mascotaData.ownerId}`);
      const clientSnap = await getDoc(clientRef);

      // ========================================
      // SI EL CLIENTE NO EXISTE → CREARLO
      // ========================================
      if (!clientSnap.exists()) {
        await setDoc(clientRef, {
          vetId: vet.id,
          clientId: mascotaData.ownerId,
          createdAt: new Date().toISOString(),
        });
      }

      // ==========================================
      // Ahora agregar esta mascota a vetClientsPets
      // ==========================================
      const petRef = doc(
        db,
        "vetClientsPets",
        `${vet.id}_${mascotaData.ownerId}_${mascotaData.id}`
      );

      await setDoc(petRef, {
        vetId: vet.id,
        clientId: mascotaData.ownerId,
        petId: mascotaData.id,
        createdAt: new Date().toISOString(),
      });

      setLoading(false);

      Dialog.show({
        type: ALERT_TYPE.SUCCESS,
        title: "Mascota agregada",
        textBody: `${mascotaData.nombre} ahora está disponible en tu panel profesional.`,
        button: "Ver cliente",
        onPressButton: () => {
          Dialog.hide();
          navigation.navigate("VetClientPets", {
            clientId: mascotaData.ownerId,
          });
        },
      });
    } catch (error) {
      console.error("ERROR agregando por código:", error);
      Dialog.show({
        type: ALERT_TYPE.DANGER,
        title: "Error",
        textBody: error.message || "No fue posible agregar la mascota.",
        button: "Cerrar",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.screen}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Agregar por código</Text>
      </View>

      {/* CONTENIDO */}
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Ingresa el código único de la mascota</Text>

        <TextInput
          style={styles.input}
          placeholder="Ej: 8Gs1aN4pQw..."
          placeholderTextColor="#9CA3AF"
          value={code}
          onChangeText={setCode}
          autoCapitalize="none"
        />

        <TouchableOpacity
          style={[styles.btnSearch, loading && { opacity: 0.7 }]}
          onPress={handleSearch}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.btnSearchText}>Buscar mascota</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

export default VetAddByCodeScreen;

/* ========================== ESTILOS ========================== */
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#0F172A", // Modo oscuro
    paddingTop: Platform.OS === "ios" ? 50 : 28,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#1E293B",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    marginLeft: 12,
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 15,
    color: "#CBD5E1",
    marginBottom: 12,
  },
  input: {
    backgroundColor: "#1E293B",
    borderColor: "#334155",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: "#fff",
    marginBottom: 18,
  },
  btnSearch: {
    backgroundColor: "#3B82F6",
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: "center",
  },
  btnSearchText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 15,
  },
});
