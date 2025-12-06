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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ALERT_TYPE, Dialog } from "react-native-alert-notification";
import { createPetWithHistory } from "../services/petServices";
import { getUserFromStorage } from "../../../shared/utils/storage";

const RegistroMascota3 = ({ navigation, route }) => {
  const draftPet = route?.params?.draftPet || {};
  const [isSubmitting, setIsSubmitting] = useState(false);

  /* ======================================================
     ESTADO: CONVIVENCIA CON OTROS ANIMALES
     ====================================================== */
  const [livesWithOthers, setLivesWithOthers] = useState(null); // true | false | null
  const [othersRelation, setOthersRelation] = useState(null); // 'juegan' | 'se_pelean' | 'no_unidos' | 'conviven_bien' | null
  const [othersDescription, setOthersDescription] = useState("");

  /* ======================================================
     ESTADO: AGRESIVIDAD Y COMPROMISO
     ====================================================== */
  const [isAggressive, setIsAggressive] = useState(null); // true | false | null
  const [aggressionDescription, setAggressionDescription] = useState("");
  const [honestyChecked, setHonestyChecked] = useState(false);

  /* ======================================================
     ESTADO: VIAJES
     ====================================================== */
  const [travelsRegularly, setTravelsRegularly] = useState(null); // true | false | null
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
     HANDLER FINALIZAR REGISTRO
     ====================================================== */
  const handleFinish = async () => {
    // 1) Convivencia con otros animales
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

    // 2) Agresividad
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

    // Compromiso veracidad
    if (!honestyChecked) {
      showWarning(
        "Compromiso de veracidad",
        "Debes confirmar que la información proporcionada es verdadera."
      );
      return;
    }

    // 3) Viajes
    if (travelsRegularly === null) {
      showWarning("Viajes", "Indica si tu mascota viaja regularmente o no.");
      return;
    }

    if (travelsRegularly === true && !travelDescription.trim()) {
      showWarning("Viajes", "Describe a dónde sueles viajar con tu mascota.");
      return;
    }

    // 4) Construir objeto comportamiento
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
      // Obtener usuario actual
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

      // Guardar en Firestore + Cloudinary
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
          "Ocurrió un error al guardar la información de tu mascota. Inténtalo nuevamente.",
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
    <View style={styles.screen}>
      {/* HEADER NUEVO */}
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

      {/* CONTENIDO */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          {/* LOGO + TÍTULO */}
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

          {/* 1. CONVIVENCIA CON OTROS ANIMALES */}
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
                  placeholder="Ej: Tengo dos gatos además de mi perro, conviven bien pero a veces se pelean cuando hay comida..."
                  placeholderTextColor="#9CA3AF"
                  value={othersDescription}
                  onChangeText={setOthersDescription}
                  multiline
                />
              </>
            )}
          </View>

          {/* 2. AGRESIVIDAD + COMPROMISO */}
          <View style={styles.section}>
            <Text style={styles.label}>¿Tu mascota es agresiva?</Text>

            {/* Advertencia resaltada */}
            <View style={styles.infoWarningBox}>
              <Text style={styles.infoWarningText}>
                Por favor sé lo más sincero posible. Cualquier información falsa
                puede poner en riesgo a otras personas o animales.
              </Text>
            </View>

            <View style={[styles.rowWrap, { marginTop: 8 }]}>
              {renderChip("Sí", true, isAggressive, setIsAggressive, "#DC2626")}
              {renderChip(
                "No",
                false,
                isAggressive,
                setIsAggressive,
                "#10B981"
              )}
            </View>

            {isAggressive === true && (
              <>
                <Text style={[styles.label, { marginTop: 12 }]}>
                  ¿En qué situaciones suele mostrarse agresivo?
                </Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Ej: Ladra y gruñe a desconocidos, no tolera que toquen su comida..."
                  placeholderTextColor="#9CA3AF"
                  value={aggressionDescription}
                  onChangeText={setAggressionDescription}
                  multiline
                />
              </>
            )}

            {/* Checkbox de compromiso */}
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
                Confirmo que la información proporcionada es verdadera y
                completa según mi conocimiento.
              </Text>
            </TouchableOpacity>
          </View>

          {/* 3. VIAJES */}
          <View style={styles.section}>
            <Text style={styles.label}>¿Tu mascota viaja regularmente?</Text>

            <View style={styles.rowWrap}>
              {renderChip("Sí", true, travelsRegularly, setTravelsRegularly)}
              {renderChip("No", false, travelsRegularly, setTravelsRegularly)}
            </View>

            {travelsRegularly === true && (
              <>
                <Text style={[styles.label, { marginTop: 12 }]}>
                  Describe a dónde suele viajar con tu mascota
                </Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Ej: Vivimos en el centro, pero a veces lo llevo a la casa de mi madre en San Julián y a la playa los fines de semana..."
                  placeholderTextColor="#9CA3AF"
                  value={travelDescription}
                  onChangeText={setTravelDescription}
                  multiline
                />
              </>
            )}
          </View>

          {/* BOTÓN FINALIZAR (CENTRADO) */}
          <TouchableOpacity
            style={[styles.primaryButton, isSubmitting && { opacity: 0.8 }]}
            onPress={handleFinish}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <ActivityIndicator
                  size="small"
                  color="#FFFFFF"
                  style={{ marginRight: 8 }}
                />
                <Text style={styles.primaryButtonText}>Guardando...</Text>
              </>
            ) : (
              <>
                <Text style={styles.primaryButtonText}>Finalizar registro</Text>
                <Ionicons name="checkmark" size={18} color="#FFFFFF" />
              </>
            )}
          </TouchableOpacity>
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
};

export default RegistroMascota3;

/* ----------------------- STYLES ----------------------- */
const styles = StyleSheet.create({
  /* ================================
     LAYOUT GENERAL / HEADER
     ================================ */
  screen: {
    flex: 1,
    backgroundColor: "#E0F7FA",
    paddingTop: 0,
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

  /* ================================
     SCROLL PRINCIPAL + CARD
     ================================ */
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

  /* ================================
     TIPOGRAFÍA GENERAL + LOGO
     ================================ */
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

  /* ================================
     INPUTS / TEXTAREA
     ================================ */
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
    minHeight: 90,
    textAlignVertical: "top",
  },

  /* ================================
     CHIPS
     ================================ */
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

  /* ================================
     ADVERTENCIA AGRESIVIDAD
     ================================ */
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

  /* ================================
     CHECKBOX COMPROMISO
     ================================ */
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

  /* ================================
     BOTÓN FINAL (CENTRADO)
     ================================ */
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
  primaryButtonText: { color: "#FFF", fontWeight: "600", marginRight: 8 },
});
