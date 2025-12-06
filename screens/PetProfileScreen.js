// screens/PetProfileScreen.js
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
  Share,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import * as Linking from "expo-linking";
import { doc, getDoc } from "firebase/firestore";
import { ALERT_TYPE, Dialog } from "react-native-alert-notification";

import { db } from "../firebase/config";
import { COL_MASCOTAS } from "../src/utils/collections";

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
  const { petId } = route.params || {};

  const [pet, setPet] = useState(null);
  const [history, setHistory] = useState(null);
  const [loading, setLoading] = useState(true);

  // 🔥 ESTE ES EL CÓDIGO ÚNICO DEL PET
  const codigoMascota = petId;

  useEffect(() => {
    if (!petId) {
      Dialog.show({
        type: ALERT_TYPE.DANGER,
        title: "Error",
        textBody: "No se pudo identificar la mascota.",
        button: "Volver",
        onPressButton: () => {
          Dialog.hide();
          navigation.goBack();
        },
      });
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);

        const petRef = doc(db, COL_MASCOTAS, petId);
        const petSnap = await getDoc(petRef);

        if (!petSnap.exists()) throw new Error("La mascota no existe.");

        const petData = { id: petSnap.id, ...petSnap.data() };
        setPet(petData);

        const historyRef = doc(db, COL_MASCOTAS, petId, "historial", "inicial");
        const historySnap = await getDoc(historyRef);
        setHistory(historySnap.exists() ? historySnap.data() : null);
      } catch (error) {
        Dialog.show({
          type: ALERT_TYPE.DANGER,
          title: "Error",
          textBody: "No se pudo cargar el perfil de la mascota.",
          button: "Volver",
          onPressButton: () => navigation.goBack(),
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [petId]);

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
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "";

    return `${String(d.getDate()).padStart(2, "0")}/${String(
      d.getMonth() + 1
    ).padStart(2, "0")}/${d.getFullYear()}`;
  };

  // 📌 COPIAR CÓDIGO
  const copyCode = async () => {
    await Clipboard.setStringAsync(codigoMascota);
    Dialog.show({
      type: ALERT_TYPE.SUCCESS,
      title: "Código copiado",
      textBody: "El código único ya está en tu portapapeles.",
      button: "OK",
    });
  };

  // 📌 COMPARTIR POR WHATSAPP
  const shareWhatsApp = () => {
    const message = `Código único de mi mascota 🐶:\n${codigoMascota}\n\nÚsalo para agregarla a tu clínica en PetHealthyApp.`;
    const url = `whatsapp://send?text=${encodeURIComponent(message)}`;
    Linking.openURL(url).catch(() => {
      Dialog.show({
        type: ALERT_TYPE.WARNING,
        title: "WhatsApp no disponible",
        textBody: "No pudimos abrir WhatsApp en este dispositivo.",
        button: "OK",
      });
    });
  };

  // 📌 COMPARTIR POR OTRAS APPS
  const shareGeneral = async () => {
    Share.share({
      message: `Código único de mi mascota 🐾:\n${codigoMascota}\n\nÚsalo en PetHealthyApp para que el veterinario pueda ver su historial.`,
    });
  };

  if (loading || !pet) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color="#365b6d" />
        <Text style={styles.loadingText}>Cargando información...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconCircle} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={20} color="#365b6d" />
        </TouchableOpacity>

        <Text style={styles.headerTitle} numberOfLines={1}>
          {pet.nombre}
        </Text>

        <View style={styles.headerRight} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* ============================= */}
        {/* PERFIL BÁSICO */}
        {/* ============================= */}
        <View style={styles.card}>
          <View style={styles.photoWrapper}>
            {pet.fotoUrl ? (
              <Image source={{ uri: pet.fotoUrl }} style={styles.petImage} />
            ) : (
              <View style={styles.petImagePlaceholder}>
                <Ionicons name="paw-outline" size={40} color="#4B5563" />
              </View>
            )}
          </View>

          <Text style={styles.petName}>{pet.nombre}</Text>
          <Text style={styles.petSubInfo}>
            {pet.especie?.toUpperCase()} · {formatAge()}
          </Text>

          {/* CÓDIGO ÚNICO */}
          <View style={styles.codeBox}>
            <Text style={styles.codeLabel}>Código único para veterinario</Text>
            <Text style={styles.codeValue}>{codigoMascota}</Text>

            <View style={styles.codeButtonsRow}>
              <TouchableOpacity style={styles.codeBtn} onPress={copyCode}>
                <Ionicons name="copy-outline" size={18} color="#2563EB" />
                <Text style={styles.codeBtnText}>Copiar</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.codeBtn} onPress={shareWhatsApp}>
                <Ionicons name="logo-whatsapp" size={18} color="#22C55E" />
                <Text style={styles.codeBtnText}>WhatsApp</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.codeBtn} onPress={shareGeneral}>
                <Ionicons name="share-social-outline" size={18} color="#6B7280" />
                <Text style={styles.codeBtnText}>Compartir</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* INFO GENERAL */}
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
              <Text style={styles.infoValue}>{formatBool(pet.tieneMicrochip)}</Text>
              {pet.identificadorMicrochip && (
                <Text style={styles.infoExtra}>{pet.identificadorMicrochip}</Text>
              )}
            </View>
          </View>
        </View>

        {/* ============================= */}
        {/* HISTORIAL MÉDICO */}
        {/* ============================= */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Historial médico</Text>

          {!history ? (
            <Text style={styles.emptyText}>No se registró historial inicial.</Text>
          ) : (
            <>
              {/* Vacunas */}
              <Text style={styles.sectionSubtitle}>Vacunas aplicadas</Text>
              {history.vacunas?.length > 0 ? (
                history.vacunas.map((v, i) => (
                  <View key={i} style={styles.lineRow}>
                    <View style={styles.bullet} />
                    <Text style={styles.lineText}>
                      {v.nombre} {v.fecha && `· ${formatDate(v.fecha)}`}
                    </Text>
                  </View>
                ))
              ) : (
                <Text style={styles.emptySubText}>Sin vacunas registradas.</Text>
              )}

              {/* Desparasitación */}
              <Text style={styles.sectionSubtitle}>Desparasitación</Text>
              {history.desparacitaciones?.length > 0 ? (
                history.desparacitaciones.map((d, i) => (
                  <View key={i} style={styles.lineRow}>
                    <View style={styles.bullet} />
                    <Text style={styles.lineText}>
                      {d.tipo} {d.fecha && `· ${formatDate(d.fecha)}`}
                    </Text>
                  </View>
                ))
              ) : (
                <Text style={styles.emptySubText}>Sin registros.</Text>
              )}

              {/* Condiciones */}
              <Text style={styles.sectionSubtitle}>Condiciones y contexto</Text>

              <View style={styles.tagRow}>
                {history.contextoVivienda && (
                  <View style={styles.tag}>
                    <Text style={styles.tagText}>
                      {contextoLabels[history.contextoVivienda]}
                    </Text>
                  </View>
                )}
                {history.frecuenciaPaseo && (
                  <View style={styles.tag}>
                    <Text style={styles.tagText}>
                      Paseo: {frecuenciaLabels[history.frecuenciaPaseo]}
                    </Text>
                  </View>
                )}
              </View>

              {history.condicionesMedicas ? (
                <Text style={styles.paragraph}>{history.condicionesMedicas}</Text>
              ) : (
                <Text style={styles.emptySubText}>Sin condiciones médicas.</Text>
              )}
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

export default PetProfileScreen;

/* ========================== */
/*         STYLES            */
/* ========================== */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#E3F2FD",
    paddingTop: Platform.OS === "ios" ? 40 : 24,
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
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    elevation: 3,
  },
  headerTitle: {
    flex: 1,
    marginLeft: 12,
    fontSize: 18,
    fontWeight: "700",
    color: "#263238",
  },
  headerRight: {
    width: 36,
    height: 36,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },

  /* CARD */
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

  /* PHOTO */
  photoWrapper: {
    width: "100%",
    aspectRatio: 2,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#E5E7EB",
    marginBottom: 12,
  },
  petImage: { width: "100%", height: "100%" },
  petImagePlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  /* NAME */
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

  /* UNIQUE CODE BOX */
  codeBox: {
    marginTop: 16,
    padding: 14,
    borderRadius: 12,
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  codeLabel: {
    fontSize: 13,
    color: "#1E3A8A",
    fontWeight: "600",
  },
  codeValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1D4ED8",
    marginTop: 4,
  },
  codeButtonsRow: {
    flexDirection: "row",
    marginTop: 10,
    justifyContent: "space-between",
  },
  codeBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  codeBtnText: {
    marginLeft: 6,
    color: "#374151",
    fontSize: 13,
  },

  /* INFO ROWS */
  infoRow: {
    flexDirection: "row",
    marginTop: 12,
  },
  infoItem: { flex: 1 },
  infoLabel: {
    fontSize: 12,
    color: "#9CA3AF",
    textTransform: "uppercase",
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

  /* HISTORIAL */
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
  },

  /* TAGS */
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
});
