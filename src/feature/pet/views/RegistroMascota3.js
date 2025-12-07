// screens/RegistroMascota3.js

import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Platform,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ALERT_TYPE, Dialog } from "react-native-alert-notification";
import { createPetWithHistory } from "../services/petServices";
import { getUserFromStorage } from "../../../shared/utils/storage";

const RegistroMascota3 = ({ navigation, route }) => {
  const draftPet = route?.params?.draftPet || {};
  const [isSubmitting, setIsSubmitting] = useState(false);

  /* ======================================================
     ESTADOS
     ====================================================== */
  const [livesWithOthers, setLivesWithOthers] = useState(null);
  const [othersRelation, setOthersRelation] = useState(null);
  const [othersDescription, setOthersDescription] = useState("");

  const [isAggressive, setIsAggressive] = useState(null);
  const [aggressionDescription, setAggressionDescription] = useState("");

  const [honestyChecked, setHonestyChecked] = useState(false);

  const [travelsRegularly, setTravelsRegularly] = useState(null);
  const [travelDescription, setTravelDescription] = useState("");

  /* ======================================================
     HELPERS
     ====================================================== */
  const renderChip = (label, value, current, setter, color = "#2563EB") => {
    const selected = current === value;

    return (
      <TouchableOpacity
        style={[
          styles.chip,
          selected && { backgroundColor: color, borderColor: color },
        ]}
        onPress={() => setter(value)}
      >
        <Text
          style={[
            styles.chipText,
            selected && { color: "#FFFFFF", fontWeight: "700" },
          ]}
        >
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  const showWarning = (title, textBody) => {
    Dialog.show({
      type: ALERT_TYPE.WARNING,
      title,
      textBody,
      button: "Entendido",
    });
  };

  /* ======================================================
     HANDLER GUARDAR
     ====================================================== */
  const handleFinish = async () => {
    if (livesWithOthers === null) {
      showWarning(
        "Convivencia",
        "Indica si tu mascota vive o no con otros animales."
      );
      return;
    }

    if (livesWithOthers === true) {
      if (!othersRelation) {
        showWarning(
          "Convivencia",
          "Describe cómo es la relación entre tus mascotas."
        );
        return;
      }

      if (!othersDescription.trim()) {
        showWarning(
          "Convivencia",
          "Describe brevemente la convivencia con otros animales."
        );
        return;
      }
    }

    if (isAggressive === null) {
      showWarning("Agresividad", "Indica si tu mascota es agresiva o no.");
      return;
    }

    if (isAggressive === true && !aggressionDescription.trim()) {
      showWarning(
        "Agresividad",
        "Describe en qué situaciones tu mascota suele mostrarse agresiva."
      );
      return;
    }

    if (!honestyChecked) {
      showWarning(
        "Compromiso de veracidad",
        "Debes confirmar que la información proporcionada es verdadera."
      );
      return;
    }

    if (travelsRegularly === null) {
      showWarning(
        "Viajes",
        "Indica si tu mascota viaja regularmente o no."
      );
      return;
    }

    if (travelsRegularly === true && !travelDescription.trim()) {
      showWarning("Viajes", "Describe a dónde sueles viajar con tu mascota.");
      return;
    }

    const comportamiento = {
      viveConOtrosAnimales: livesWithOthers === true,
      relacionConOtrosAnimales: othersRelation,
      descripcionConvivencia: othersDescription.trim(),

      esAgresivo: isAggressive,
      descripcionAgresividad: aggressionDescription.trim(),

      viajaRegularmente: travelsRegularly,
      descripcionViajes: travelDescription.trim(),

      compromisoVeracidad: honestyChecked,
    };

    const draftPetStep3 = {
      ...draftPet,
      comportamiento,
    };

    setIsSubmitting(true);

    try {
      const user = await getUserFromStorage();

      if (!user || !user.id) {
        setIsSubmitting(false);
        Dialog.show({
          type: ALERT_TYPE.DANGER,
          title: "Sesión expirada",
          textBody: "Vuelve a iniciar sesión para registrar tu mascota.",
          button: "Ir al inicio",
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

      await createPetWithHistory(user.id, draftPetStep3);

      Dialog.show({
        type: ALERT_TYPE.SUCCESS,
        title: "Registro completado",
        textBody: "La información de tu mascota se ha guardado correctamente.",
        button: "Continuar",
        onPressButton: () => {
          Dialog.hide();
          navigation.reset({
            index: 0,
            routes: [{ name: "MainTabs" }],
          });
        },
      });
    } catch (error) {
      console.error("Error al registrar mascota:", error);
      Dialog.show({
        type: ALERT_TYPE.DANGER,
        title: "Error",
        textBody:
          error.message ||
          "Ocurrió un error al guardar la información de tu mascota.",
        button: "Entendido",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ======================================================
     RENDER
     ====================================================== */
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 10 : 0}
    >
      <View style={styles.screen}>
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerIconButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Paso 3 de 3</Text>
          <View style={styles.headerIconButton} />
        </View>

        {/* SCROLL AJUSTADO PARA TECLADO */}
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.card}>
            {/* LOGO + HEADER */}
            <View style={styles.headerTextBlock}>
              <Image
                source={require("../../../../assets/logoPH.png")}
                style={styles.logo}
                resizeMode="contain"
              />
              <Text style={styles.title}>Personalidad y contexto</Text>
              <Text style={styles.subtitle}>
                Ayúdanos a entender cómo es tu mascota en su día a día.
              </Text>
            </View>

            {/* ========== SECCIÓN 1: CONVIVENCIA ========== */}
            <View style={styles.section}>
              <Text style={styles.label}>
                ¿Tu mascota vive con otros animales?
              </Text>

              <View style={styles.rowWrap}>
                {renderChip("Sí", true, livesWithOthers, setLivesWithOthers)}
                {renderChip("No", false, livesWithOthers, setLivesWithOthers)}
              </View>

              {livesWithOthers === true && (
                <>
                  <Text style={[styles.label, { marginTop: 12 }]}>
                    ¿Cómo es la relación entre tus mascotas?
                  </Text>

                  <View style={styles.rowWrap}>
                    {renderChip(
                      "Juegan mucho",
                      "juegan",
                      othersRelation,
                      setOthersRelation
                    )}
                    {renderChip(
                      "A veces se pelean",
                      "se_pelean",
                      othersRelation,
                      setOthersRelation
                    )}
                    {renderChip(
                      "No son muy unidos",
                      "no_unidos",
                      othersRelation,
                      setOthersRelation
                    )}
                    {renderChip(
                      "Conviven sin problema",
                      "conviven_bien",
                      othersRelation,
                      setOthersRelation
                    )}
                  </View>

                  <Text style={[styles.label, { marginTop: 12 }]}>
                    Describe brevemente la convivencia
                  </Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Ej: Tengo dos gatos además de mi perro..."
                    placeholderTextColor="#9CA3AF"
                    value={othersDescription}
                    onChangeText={setOthersDescription}
                    multiline
                  />
                </>
              )}
            </View>

            {/* ========== SECCIÓN 2: AGRESIVIDAD ========== */}
            <View style={styles.section}>
              <Text style={styles.label}>¿Tu mascota es agresiva?</Text>

              <View style={styles.infoWarningBox}>
                <Text style={styles.infoWarningText}>
                  Por favor sé lo más sincero posible. Información falsa puede
                  poner en riesgo a otros.
                </Text>
              </View>

              <View style={[styles.rowWrap, { marginTop: 8 }]}>
                {renderChip("Sí", true, isAggressive, setIsAggressive, "#DC2626")}
                {renderChip("No", false, isAggressive, setIsAggressive, "#10B981")}
              </View>

              {isAggressive === true && (
                <>
                  <Text style={[styles.label, { marginTop: 12 }]}>
                    ¿En qué situaciones suele mostrarse agresivo?
                  </Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Ej: Ladra a desconocidos..."
                    placeholderTextColor="#9CA3AF"
                    value={aggressionDescription}
                    onChangeText={setAggressionDescription}
                    multiline
                  />
                </>
              )}

              <TouchableOpacity
                style={styles.checkboxRow}
                onPress={() => setHonestyChecked((prev) => !prev)}
                activeOpacity={0.8}
              >
                <View
                  style={[
                    styles.checkboxBox,
                    honestyChecked && styles.checkboxBoxChecked,
                  ]}
                >
                  {honestyChecked && (
                    <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                  )}
                </View>
                <Text style={styles.checkboxText}>
                  Confirmo que la información proporcionada es verdadera.
                </Text>
              </TouchableOpacity>
            </View>

            {/* ========== SECCIÓN 3: VIAJES ========== */}
            <View style={styles.section}>
              <Text style={styles.label}>¿Tu mascota viaja regularmente?</Text>

              <View style={styles.rowWrap}>
                {renderChip("Sí", true, travelsRegularly, setTravelsRegularly)}
                {renderChip("No", false, travelsRegularly, setTravelsRegularly)}
              </View>

              {travelsRegularly === true && (
                <>
                  <Text style={[styles.label, { marginTop: 12 }]}>
                    Describe a dónde suele viajar
                  </Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Ej: Vamos a San Julián o la playa..."
                    placeholderTextColor="#9CA3AF"
                    value={travelDescription}
                    onChangeText={setTravelDescription}
                    multiline
                  />
                </>
              )}
            </View>

            {/* ========== BOTÓN GUARDAR ========== */}
            <TouchableOpacity
              style={[styles.primaryButton, isSubmitting && { opacity: 0.8 }]}
              onPress={handleFinish}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <ActivityIndicator size="small" color="#FFFFFF" />
                  <Text style={styles.primaryButtonText}>
                    Guardando...
                  </Text>
                </>
              ) : (
                <>
                  <Text style={styles.primaryButtonText}>
                    Finalizar registro
                  </Text>
                  <Ionicons name="checkmark" size={18} color="#FFFFFF" />
                </>
              )}
            </TouchableOpacity>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
};

export default RegistroMascota3;

/* ----------------------- STYLES ----------------------- */
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#E0F7FA",
  },

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
    elevation: 4,
  },

  headerIconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },

  headerTitle: {
    flex: 1,
    marginHorizontal: 12,
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
    textAlign: "center",
  },

  scroll: { flex: 1 },

  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 20,
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 20,
    elevation: 3,
  },

  headerTextBlock: {
    alignItems: "center",
    marginBottom: 18,
  },

  logo: {
    width: 150,
    height: 150,
    marginBottom: 8,
  },

  title: { fontSize: 18, fontWeight: "700", color: "#111827" },

  subtitle: {
    marginTop: 4,
    fontSize: 12,
    color: "#6B7280",
    textAlign: "center",
  },

  section: { marginBottom: 18 },

  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 6,
  },

  input: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#F9FAFB",
    fontSize: 14,
  },

  textArea: {
    minHeight: 100,
    textAlignVertical: "top",
  },

  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#F3F4F6",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    marginRight: 8,
    marginBottom: 8,
  },

  chipText: { fontSize: 13, color: "#374151" },

  rowWrap: { flexDirection: "row", flexWrap: "wrap" },

  infoWarningBox: {
    marginTop: 2,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: "#FEF3C7",
    borderWidth: 1,
    borderColor: "#FBBF24",
  },

  infoWarningText: {
    fontSize: 11,
    color: "#92400E",
  },

  checkboxRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 14,
  },

  checkboxBox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: "#9CA3AF",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
    marginTop: 2,
  },

  checkboxBoxChecked: {
    backgroundColor: "#2563EB",
    borderColor: "#2563EB",
  },

  checkboxText: {
    flex: 1,
    fontSize: 12,
    color: "#374151",
  },

  primaryButton: {
    marginTop: 20,
    alignSelf: "center",
    flexDirection: "row",
    backgroundColor: "#2563EB",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
    alignItems: "center",
  },

  primaryButtonText: {
    color: "#FFF",
    fontWeight: "600",
    marginRight: 8,
  },
});
