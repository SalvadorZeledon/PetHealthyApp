// src/feature/pet/views/PetProfileScreen.js
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Image,
  TouchableOpacity,
  Platform,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { doc, onSnapshot } from "firebase/firestore";
import { ALERT_TYPE, Dialog } from "react-native-alert-notification";
import QRCode from "react-native-qrcode-svg";
import * as Brightness from "expo-brightness";

import { db } from "../../../../firebase/config";
import { COL_MASCOTAS } from "../../../shared/utils/collections";

const contextoLabels = {
  adentro: "Dentro de casa",
  afuera: "Fuera de casa",
  mixto: "Mixto",
};

const frecuenciaLabels = {
  nulo: "Casi nunca",
  regular: "A veces",
  diario: "Diario",
};

const relacionLabels = {
  juegan: "Juegan mucho",
  se_pelean: "A veces se pelean",
  no_unidos: "No son muy unidos",
  conviven_bien: "Conviven sin problema",
};

const PetProfileScreen = ({ navigation, route }) => {
  const { petId, viewMode } = route.params || {};
  const isVet = viewMode === "veterinarian";

  const [pet, setPet] = useState(null);
  const [history, setHistory] = useState(null);
  const [loading, setLoading] = useState(true);

  // --- ESTADOS PARA EL QR ---
  const [qrVisible, setQrVisible] = useState(false);
  const [previousBrightness, setPreviousBrightness] = useState(null);

  useEffect(() => {
    if (!petId) return;

    setLoading(true);

    // 1️⃣ SUSCRIPCIÓN EN TIEMPO REAL AL PERFIL
    const petRef = doc(db, COL_MASCOTAS, petId);
    const unsubscribePet = onSnapshot(
      petRef,
      (docSnap) => {
        if (docSnap.exists()) {
          setPet({ id: docSnap.id, ...docSnap.data() });
        } else {
          Dialog.show({
            type: ALERT_TYPE.WARNING,
            title: "Aviso",
            textBody: "Esta mascota ha sido eliminada.",
            button: "Salir",
            onPressButton: () => navigation.goBack(),
          });
        }
        setLoading(false);
      },
      (error) => {
        console.error("Error perfil real-time:", error);
        setLoading(false);
      }
    );

    // 2️⃣ SUSCRIPCIÓN EN TIEMPO REAL AL HISTORIAL
    const historyRef = doc(db, COL_MASCOTAS, petId, "historial", "inicial");
    const unsubscribeHistory = onSnapshot(
      historyRef,
      (docSnap) => {
        if (docSnap.exists()) {
          setHistory({ id: docSnap.id, ...docSnap.data() });
        } else {
          setHistory(null);
        }
      },
      (error) => {
        console.error("Error historial real-time:", error);
      }
    );

    return () => {
      unsubscribePet();
      unsubscribeHistory();
    };
  }, [petId, navigation]);

  // --- LÓGICA DEL BRILLO Y QR ---
  const handleOpenQR = async () => {
    try {
      const { status } = await Brightness.requestPermissionsAsync();
      if (status === "granted") {
        const current = await Brightness.getBrightnessAsync();
        setPreviousBrightness(current);
        await Brightness.setBrightnessAsync(1.0);
      }
    } catch (e) {
      console.log(e);
    }
    setQrVisible(true);
  };

  const handleCloseQR = async () => {
    try {
      if (previousBrightness !== null) {
        await Brightness.setBrightnessAsync(previousBrightness);
      }
    } catch (e) {
      console.log(e);
    }
    setQrVisible(false);
  };

  const formatAge = () => {
    if (!pet) return "";
    if (!pet.edadValor || !pet.edadTipo) return "Edad no especificada";
    const unidad =
      pet.edadTipo === "años"
        ? pet.edadValor === 1
          ? "año"
          : "años"
        : pet.edadValor === 1
        ? "mes"
        : "meses";
    return `${pet.edadValor} ${unidad}`;
  };

  const formatBool = (value) => (value ? "Sí" : "No");

  const formatDate = (iso) => {
    if (!iso) return "";
    const d = iso.toDate ? iso.toDate() : new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  if (loading && !pet) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color="#365b6d" />
        <Text style={styles.loadingText}>Cargando información...</Text>
      </View>
    );
  }

  if (!pet) return null;

  const qrData = JSON.stringify({ type: "pet_profile", petId: pet.id });

  return (
    <View style={styles.container}>
      {/* MODAL QR */}
      <Modal
        visible={qrVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCloseQR}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Código Médico de {pet.nombre}</Text>
            <Text style={styles.modalSubtitle}>
              Muestra este código al veterinario para que acceda al historial.
            </Text>
            <View style={styles.qrWrapper}>
              <QRCode value={qrData} size={220} />
            </View>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={handleCloseQR}
            >
              <Text style={styles.closeButtonText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* HEADER */}
      <View style={styles.header}>
        {/* Botón back */}
        <TouchableOpacity
          style={styles.headerIconButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {pet.nombre || "Mascota"}
        </Text>

        <TouchableOpacity
          style={styles.headerIconButton}
          onPress={() => navigation.navigate("EditPet", { petId: pet.id })}
        >
          <Ionicons name="create-outline" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* SECCIÓN PERFIL */}
        <View style={styles.card}>
          <View style={styles.photoWrapper}>
            {pet.fotoUrl ? (
              <Image
                source={{ uri: pet.fotoUrl }}
                style={styles.petImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.petImagePlaceholder}>
                <Ionicons name="paw-outline" size={40} color="#4B5563" />
              </View>
            )}
          </View>

          {/* ✨ MEJORA ESTÉTICA: Alineación y estilo del botón */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            <View style={{ flex: 1, paddingRight: 10 }}>
              <Text style={styles.petName}>{pet.nombre}</Text>
              <Text style={styles.petSubInfo}>
                {pet.especie ? pet.especie.toUpperCase() : "ESPECIE"} ·{" "}
                {formatAge()}
              </Text>
            </View>

            {!isVet && (
              <TouchableOpacity
                style={styles.miniQrButton}
                onPress={handleOpenQR}
                activeOpacity={0.7}
              >
                <Ionicons name="qr-code-outline" size={18} color="#4A85A5" />
                <Text style={styles.miniQrText}>Generar QR</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Sexo</Text>
              <Text style={styles.infoValue}>
                {pet.sexo === "macho"
                  ? "Macho"
                  : pet.sexo === "hembra"
                  ? "Hembra"
                  : "No especificado"}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Microchip</Text>
              <Text style={styles.infoValue}>
                {formatBool(pet.tieneMicrochip)}
              </Text>
              {pet.tieneMicrochip && pet.identificadorMicrochip ? (
                <Text style={styles.infoExtra}>
                  {pet.identificadorMicrochip}
                </Text>
              ) : null}
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Tatuaje</Text>
              <Text style={styles.infoValue}>
                {formatBool(pet.poseeTatuaje)}
              </Text>
            </View>
          </View>
        </View>

        {/* SECCIÓN HISTORIAL MÉDICO */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Historial médico</Text>
          {!history ? (
            <Text style={styles.emptyText}>
              Aún no hay historial médico inicial.
            </Text>
          ) : (
            <>
              {/* Vacunas */}
              <Text style={styles.sectionSubtitle}>Vacunas aplicadas</Text>
              {history.vacunas && history.vacunas.length > 0 ? (
                history.vacunas.map((v, index) => (
                  <View key={`${v.nombre}-${index}`} style={styles.lineRow}>
                    <View style={styles.bullet} />
                    <Text style={styles.lineText}>
                      {v.nombre} {v.fecha && `· ${formatDate(v.fecha)}`}
                    </Text>
                  </View>
                ))
              ) : (
                <Text style={styles.emptySubText}>
                  No se registraron vacunas.
                </Text>
              )}

              {/* Desparasitación */}
              <Text style={styles.sectionSubtitle}>Desparasitación</Text>
              {history.desparacitaciones &&
              history.desparacitaciones.length > 0 ? (
                history.desparacitaciones.map((d, index) => (
                  <View key={`${d.tipo}-${index}`} style={styles.lineRow}>
                    <View style={styles.bullet} />
                    <Text style={styles.lineText}>
                      {d.tipo} {d.fecha && `· ${formatDate(d.fecha)}`}
                    </Text>
                  </View>
                ))
              ) : (
                <Text style={styles.emptySubText}>
                  No se registraron desparasitaciones.
                </Text>
              )}

              {/* Condiciones / contexto */}
              <Text style={styles.sectionSubtitle}>Condiciones y contexto</Text>
              <View style={styles.tagRow}>
                {history.contextoVivienda ? (
                  <View style={styles.tag}>
                    <Text style={styles.tagText}>
                      {contextoLabels[history.contextoVivienda] ||
                        history.contextoVivienda}
                    </Text>
                  </View>
                ) : null}
                {history.frecuenciaPaseo ? (
                  <View style={styles.tag}>
                    <Text style={styles.tagText}>
                      Paseo:{" "}
                      {frecuenciaLabels[history.frecuenciaPaseo] ||
                        history.frecuenciaPaseo}
                    </Text>
                  </View>
                ) : null}
              </View>
              {history.condicionesMedicas ? (
                <Text style={styles.paragraph}>
                  {history.condicionesMedicas}
                </Text>
              ) : (
                <Text style={styles.emptySubText}>
                  No se registraron condiciones médicas.
                </Text>
              )}

              {/* Convivencia */}
              <Text style={styles.sectionSubtitle}>Convivencia</Text>
              <Text style={styles.paragraph}>
                Vive con otros animales:{" "}
                {formatBool(history.viveConOtrosAnimales)}
              </Text>
              {history.viveConOtrosAnimales && (
                <>
                  {history.relacionConOtrosAnimales ? (
                    <Text style={styles.paragraph}>
                      Relación:{" "}
                      {relacionLabels[history.relacionConOtrosAnimales] ||
                        history.relacionConOtrosAnimales}
                    </Text>
                  ) : null}
                  {history.descripcionConvivencia ? (
                    <Text style={styles.paragraph}>
                      {history.descripcionConvivencia}
                    </Text>
                  ) : null}
                </>
              )}

              {/* Agresividad */}
              <Text style={styles.sectionSubtitle}>Agresividad</Text>
              <Text style={styles.paragraph}>
                Es agresiva: {formatBool(history.esAgresivo)}
              </Text>
              {history.esAgresivo && history.descripcionAgresividad ? (
                <Text style={styles.paragraph}>
                  {history.descripcionAgresividad}
                </Text>
              ) : null}
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

export default PetProfileScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#E3F2FD",
    paddingTop: 0,
  },
  loadingScreen: {
    flex: 1,
    backgroundColor: "#E3F2FD",
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 8,
    fontSize: 13,
    color: "#607D8B",
  },
  /* HEADER NUEVO */
  header: {
    paddingTop: Platform.OS === "ios" ? 52 : 32,
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
  headerIconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.18)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    flex: 1,
    marginHorizontal: 12,
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
    textAlign: "center",
  },

  content: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    paddingTop: 16,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  photoWrapper: {
    width: "100%",
    aspectRatio: 2,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#E5E7EB",
    marginBottom: 12,
  },
  petImage: {
    width: "100%",
    height: "100%",
  },
  petImagePlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  petName: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111827",
  },
  petSubInfo: {
    marginTop: 4,
    fontSize: 13,
    color: "#6B7280",
  },
  infoRow: {
    flexDirection: "row",
    marginTop: 12,
  },
  infoItem: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: "#9CA3AF",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    marginTop: 2,
  },
  infoExtra: {
    fontSize: 12,
    color: "#4B5563",
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
  },
  sectionSubtitle: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
  emptyText: {
    marginTop: 4,
    fontSize: 13,
    color: "#6B7280",
  },
  emptySubText: {
    marginTop: 2,
    fontSize: 12,
    color: "#9CA3AF",
  },
  lineRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#38BDF8",
    marginRight: 6,
  },
  lineText: {
    fontSize: 13,
    color: "#374151",
    flexShrink: 1,
  },
  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 6,
    marginBottom: 4,
  },
  tag: {
    backgroundColor: "#E0F2FE",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 6,
    marginBottom: 4,
  },
  tagText: {
    fontSize: 11,
    color: "#0369A1",
    fontWeight: "500",
  },
  paragraph: {
    marginTop: 4,
    fontSize: 13,
    color: "#374151",
  },

  /* ✨ MEJORA ESTÉTICA: Nuevo estilo para el botón QR */
  miniQrButton: {
    flexDirection: "row", // Horizontal
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#4A85A5",
    // Sombra suave para que flote
    shadowColor: "#4A85A5",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    elevation: 2,
  },
  miniQrText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#4A85A5",
    marginLeft: 6, // Separación entre icono y texto
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.85)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "85%",
    backgroundColor: "white",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    elevation: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#333",
    textAlign: "center",
  },
  modalSubtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
  },
  qrWrapper: {
    padding: 10,
    backgroundColor: "white",
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  closeButton: {
    marginTop: 24,
    backgroundColor: "#4A85A5",
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 50,
  },
  closeButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
});
