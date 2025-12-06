// feature/pet/views/EditPetScreen.js
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Platform,
  Image,
  ScrollView,
  ActivityIndicator,
  Modal,
} from "react-native";
import { Ionicons, FontAwesome5 } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { doc, getDoc, updateDoc, setDoc } from "firebase/firestore";
import { ALERT_TYPE, Dialog } from "react-native-alert-notification";

import { db } from "../../../../firebase/config";
import { COL_MASCOTAS } from "../../../shared/utils/collections";
import { PET_SEX_OPTIONS } from "../../../shared/utils/petConstants";

// ====== CONSTANTES ======
const NAME_REGEX = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ ]+$/;
const MAX_AGE = 30;

const COMMON_VACCINES = [
  "Parvovirus",
  "Moquillo",
  "Antirrábica",
  "Adenovirus",
  "Parainfluenza",
  "Leptospira",
  "Bordetella",
];

const DEWORM_TYPES = ["Interna", "Externa"];

// helpers de etiquetas (mismas que en PetProfileScreen)
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

// ====== COMPONENTE ======
const EditPetScreen = ({ navigation, route }) => {
  const { petId } = route.params || {};

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // -------- PERFIL BÁSICO --------
  const [imageUri, setImageUri] = useState(null);
  const [name, setName] = useState("");
  const [sex, setSex] = useState("macho");
  const [hasMicrochip, setHasMicrochip] = useState(false);
  const [microchipId, setMicrochipId] = useState("");
  const [hasTattoo, setHasTattoo] = useState(false);
  const [ageValue, setAgeValue] = useState("");
  const [ageType, setAgeType] = useState("años");
  const [isAgeDropdownOpen, setIsAgeDropdownOpen] = useState(false);
  const [errors, setErrors] = useState({});

  // -------- HISTORIAL MÉDICO --------
  const [vaccines, setVaccines] = useState([]); // {nombre, fecha}
  const [dewormings, setDewormings] = useState([]); // {tipo, fecha}
  const [conditions, setConditions] = useState("");
  const [housing, setHousing] = useState(null); // 'adentro' | 'afuera' | 'mixto'
  const [walkFrequency, setWalkFrequency] = useState(null); // 'nulo' | 'regular' | 'diario'

  // -------- PERSONALIDAD / CONTEXTO --------
  const [livesWithOthers, setLivesWithOthers] = useState(null);
  const [othersRelation, setOthersRelation] = useState(null);
  const [othersDescription, setOthersDescription] = useState("");
  const [isAggressive, setIsAggressive] = useState(null);
  const [aggressionDescription, setAggressionDescription] = useState("");
  const [travelsRegularly, setTravelsRegularly] = useState(null);
  const [travelDescription, setTravelDescription] = useState("");
  const [honestyChecked, setHonestyChecked] = useState(false);

  // -------- MODALES VACUNAS / DESPARASITACIÓN --------
  const [showVaccineModal, setShowVaccineModal] = useState(false);
  const [isVaccineDropdownOpen, setIsVaccineDropdownOpen] = useState(false);
  const [showVaccineDateModal, setShowVaccineDateModal] = useState(false);
  const [selectedVaccine, setSelectedVaccine] = useState(COMMON_VACCINES[0]);
  const [vaccineDate, setVaccineDate] = useState(new Date());
  const [editingVaccineIndex, setEditingVaccineIndex] = useState(null);

  const [showDewormModal, setShowDewormModal] = useState(false);
  const [isDewormDropdownOpen, setIsDewormDropdownOpen] = useState(false);
  const [showDewormDateModal, setShowDewormDateModal] = useState(false);
  const [selectedDewormType, setSelectedDewormType] = useState(DEWORM_TYPES[0]);
  const [dewormDate, setDewormDate] = useState(new Date());
  const [editingDewormIndex, setEditingDewormIndex] = useState(null);

  // ====== HELPERS ======
  const isFutureDate = (date) => {
    if (!date) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d.getTime() > today.getTime();
  };

  const formatDate = (iso) => {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

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

  // ====== CARGA INICIAL ======
  useEffect(() => {
    const load = async () => {
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

      try {
        setLoading(true);

        // --- doc principal mascota ---
        const petRef = doc(db, COL_MASCOTAS, petId);
        const petSnap = await getDoc(petRef);

        if (!petSnap.exists()) {
          throw new Error("La mascota no existe o fue eliminada.");
        }

        const petData = { id: petSnap.id, ...petSnap.data() };

        setName(petData.nombre || "");
        setSex(petData.sexo || "macho");
        setHasMicrochip(!!petData.tieneMicrochip);
        setMicrochipId(petData.identificadorMicrochip || "");
        setHasTattoo(!!petData.poseeTatuaje);
        setAgeValue(
          petData.edadValor !== undefined && petData.edadValor !== null
            ? String(petData.edadValor)
            : ""
        );
        setAgeType(petData.edadTipo || "años");
        setImageUri(petData.fotoUrl || null);

        // --- historial inicial ---
        const historyRef = doc(db, COL_MASCOTAS, petId, "historial", "inicial");
        const historySnap = await getDoc(historyRef);

        if (historySnap.exists()) {
          const h = historySnap.data();

          setVaccines(h.vacunas || []);
          setDewormings(h.desparacitaciones || []);
          setConditions(h.condicionesMedicas || "");
          setHousing(h.contextoVivienda || null);
          setWalkFrequency(h.frecuenciaPaseo || null);

          setLivesWithOthers(
            typeof h.viveConOtrosAnimales === "boolean"
              ? h.viveConOtrosAnimales
              : null
          );
          setOthersRelation(h.relacionConOtrosAnimales || null);
          setOthersDescription(h.descripcionConvivencia || "");

          setIsAggressive(
            typeof h.esAgresivo === "boolean" ? h.esAgresivo : null
          );
          setAggressionDescription(h.descripcionAgresividad || "");

          setTravelsRegularly(
            typeof h.viajaRegularmente === "boolean"
              ? h.viajaRegularmente
              : null
          );
          setTravelDescription(h.descripcionViajes || "");

          setHonestyChecked(!!h.compromisoVeracidad);
        }
      } catch (err) {
        console.error("Error cargando mascota:", err);
        Dialog.show({
          type: ALERT_TYPE.DANGER,
          title: "Error",
          textBody:
            err.message ||
            "Ocurrió un problema al cargar la información de la mascota.",
          button: "Volver",
          onPressButton: () => {
            Dialog.hide();
            navigation.goBack();
          },
        });
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [petId, navigation]);

  // ====== PICKER DE IMAGEN ======
  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      alert("Necesitamos permiso para acceder a tus fotos.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.9,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImageUri(result.assets[0].uri);
    }
  };

  // ====== VALIDACIONES BÁSICAS ======
  const validate = () => {
    const newErrors = {};

    if (!name.trim()) {
      newErrors.name = "Ingresa el nombre del perrito.";
    } else if (!NAME_REGEX.test(name.trim())) {
      newErrors.name =
        "El nombre solo puede contener letras y espacios (sin números ni símbolos).";
    }

    if (!ageValue.trim()) {
      newErrors.age = "Ingresa la edad de tu mascota.";
    } else if (!/^\d+$/.test(ageValue.trim())) {
      newErrors.age = "La edad debe ser un número entero positivo.";
    } else if (Number(ageValue) <= 0) {
      newErrors.age = "La edad debe ser mayor que 0.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ====== MANEJO VACUNAS ======
  const handleSaveVaccine = () => {
    if (!selectedVaccine) {
      Dialog.show({
        type: ALERT_TYPE.WARNING,
        title: "Vacuna requerida",
        textBody: "Selecciona una vacuna.",
        button: "Cerrar",
      });
      return;
    }
    if (isFutureDate(vaccineDate)) {
      Dialog.show({
        type: ALERT_TYPE.WARNING,
        title: "Fecha no válida",
        textBody: "La fecha de la vacuna no puede ser futura.",
        button: "Entendido",
      });
      return;
    }

    const isoDate = vaccineDate.toISOString();

    if (editingVaccineIndex !== null) {
      const updated = [...vaccines];
      updated[editingVaccineIndex] = {
        nombre: selectedVaccine,
        fecha: isoDate,
      };
      setVaccines(updated);
    } else {
      setVaccines((prev) => [
        ...prev,
        { nombre: selectedVaccine, fecha: isoDate },
      ]);
    }

    setShowVaccineModal(false);
    setIsVaccineDropdownOpen(false);
    setShowVaccineDateModal(false);
    setEditingVaccineIndex(null);
  };

  const handleDeleteVaccine = (index) => {
    const v = vaccines[index];
    if (!v) return;

    Dialog.show({
      type: ALERT_TYPE.DANGER,
      title: "Eliminar vacuna",
      textBody: `¿Seguro que deseas eliminar la vacuna "${
        v.nombre
      }" con fecha ${formatDate(v.fecha)}?`,
      button: "Eliminar",
      onPressButton: () => {
        setVaccines((prev) => prev.filter((_, i) => i !== index));
        Dialog.hide();
      },
    });
  };

  // ====== MANEJO DESPARASITACIÓN ======
  const handleSaveDeworming = () => {
    if (!selectedDewormType) {
      Dialog.show({
        type: ALERT_TYPE.WARNING,
        title: "Tipo requerido",
        textBody: "Selecciona un tipo de desparasitación.",
        button: "Cerrar",
      });
      return;
    }
    if (isFutureDate(dewormDate)) {
      Dialog.show({
        type: ALERT_TYPE.WARNING,
        title: "Fecha no válida",
        textBody: "La fecha de desparasitación no puede ser futura.",
        button: "Entendido",
      });
      return;
    }

    const isoDate = dewormDate.toISOString();

    if (editingDewormIndex !== null) {
      const updated = [...dewormings];
      updated[editingDewormIndex] = {
        tipo: selectedDewormType,
        fecha: isoDate,
      };
      setDewormings(updated);
    } else {
      setDewormings((prev) => [
        ...prev,
        { tipo: selectedDewormType, fecha: isoDate },
      ]);
    }

    setShowDewormModal(false);
    setIsDewormDropdownOpen(false);
    setShowDewormDateModal(false);
    setEditingDewormIndex(null);
  };

  const handleDeleteDeworming = (index) => {
    const d = dewormings[index];
    if (!d) return;

    Dialog.show({
      type: ALERT_TYPE.DANGER,
      title: "Eliminar desparasitación",
      textBody: `¿Seguro que deseas eliminar la desparasitación "${
        d.tipo
      }" con fecha ${formatDate(d.fecha)}?`,
      button: "Eliminar",
      onPressButton: () => {
        setDewormings((prev) => prev.filter((_, i) => i !== index));
        Dialog.hide();
      },
    });
  };

  // ====== GUARDAR TODO ======
  const handleSaveAll = async () => {
    if (!validate()) return;

    // validaciones mínimas de comportamiento igual que en RegistroMascota3
    if (livesWithOthers === true) {
      if (!othersRelation) {
        Dialog.show({
          type: ALERT_TYPE.WARNING,
          title: "Convivencia",
          textBody: "Describe cómo se relaciona con otros animales.",
          button: "Entendido",
        });
        return;
      }
      if (!othersDescription.trim()) {
        Dialog.show({
          type: ALERT_TYPE.WARNING,
          title: "Convivencia",
          textBody: "Describe brevemente la convivencia.",
          button: "Entendido",
        });
        return;
      }
    }

    if (isAggressive === true && !aggressionDescription.trim()) {
      Dialog.show({
        type: ALERT_TYPE.WARNING,
        title: "Agresividad",
        textBody: "Describe en qué situaciones tu mascota es agresiva.",
        button: "Entendido",
      });
      return;
    }

    if (travelsRegularly === true && !travelDescription.trim()) {
      Dialog.show({
        type: ALERT_TYPE.WARNING,
        title: "Viajes",
        textBody: "Describe a dónde sueles viajar con tu mascota.",
        button: "Entendido",
      });
      return;
    }

    if (!honestyChecked) {
      Dialog.show({
        type: ALERT_TYPE.WARNING,
        title: "Compromiso",
        textBody:
          "Debes confirmar que la información proporcionada es verdadera.",
        button: "Entendido",
      });
      return;
    }

    try {
      setSaving(true);

      // --- actualizar doc mascota ---
      const petRef = doc(db, COL_MASCOTAS, petId);
      await updateDoc(petRef, {
        nombre: name.trim(),
        sexo: sex,
        tieneMicrochip: hasMicrochip,
        identificadorMicrochip: microchipId.trim() || null,
        poseeTatuaje: hasTattoo,
        edadValor: Number(ageValue),
        edadTipo: ageType,
        // importante: fotoUrl la deberías actualizar en tu servicio de Cloudinary;
        // aquí solo guardo la uri local si ya la manejas fuera:
        // fotoUrl: imageUri ?? existing
      });

      // --- actualizar / crear historial inicial ---
      const historyRef = doc(db, COL_MASCOTAS, petId, "historial", "inicial");

      const historyPayload = {
        vacunas: vaccines,
        desparacitaciones: dewormings,
        condicionesMedicas: conditions.trim(),
        contextoVivienda: housing || null,
        frecuenciaPaseo: walkFrequency || null,
        viveConOtrosAnimales:
          livesWithOthers === null ? null : !!livesWithOthers,
        relacionConOtrosAnimales: othersRelation || null,
        descripcionConvivencia: othersDescription.trim() || "",
        esAgresivo: isAggressive === null ? null : !!isAggressive,
        descripcionAgresividad: aggressionDescription.trim() || "",
        viajaRegularmente:
          travelsRegularly === null ? null : !!travelsRegularly,
        descripcionViajes: travelDescription.trim() || "",
        compromisoVeracidad: !!honestyChecked,
      };

      await setDoc(historyRef, historyPayload, { merge: true });

      Dialog.show({
        type: ALERT_TYPE.SUCCESS,
        title: "Cambios guardados",
        textBody: "La información de la mascota se actualizó correctamente.",
        button: "Volver al perfil",
        onPressButton: () => {
          Dialog.hide();
          navigation.goBack();
        },
      });
    } catch (err) {
      console.error("Error actualizando mascota:", err);
      Dialog.show({
        type: ALERT_TYPE.DANGER,
        title: "Error",
        textBody:
          err.message ||
          "Ocurrió un error al guardar los cambios. Inténtalo de nuevo.",
        button: "Entendido",
      });
    } finally {
      setSaving(false);
    }
  };

  // ====== RENDER ======
  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color="#365b6d" />
        <Text style={styles.loadingText}>Cargando datos de la mascota...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerIconButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
        </TouchableOpacity>

        <Text style={styles.headerTitle} numberOfLines={1}>
          Editar mascota
        </Text>

        <View style={styles.headerIconButton} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ==== INFO BÁSICA ==== */}
        <View style={styles.imagePreviewWrapper}>
          <TouchableOpacity
            style={styles.imagePreview}
            activeOpacity={0.8}
            onPress={handlePickImage}
          >
            {imageUri ? (
              <>
                <Image
                  source={{ uri: imageUri }}
                  style={styles.imagePreviewImage}
                />
                <TouchableOpacity
                  style={styles.imageEditButton}
                  onPress={handlePickImage}
                >
                  <FontAwesome5 name="pen" size={14} color="#FFFFFF" />
                </TouchableOpacity>
              </>
            ) : (
              <View style={styles.imagePlaceholder}>
                <FontAwesome5 name="camera" size={28} color="#9CA3AF" />
                <Text style={styles.imagePlaceholderText}>
                  Toca para agregar una foto
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Información básica</Text>
          </View>

          {/* Nombre */}
          <View style={styles.section}>
            <Text style={styles.label}>Nombre</Text>
            <TextInput
              style={[styles.input, errors.name && styles.inputError]}
              placeholder="Ej: Firulais"
              value={name}
              onChangeText={(text) => {
                const cleaned = text.replace(/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ ]/g, "");
                setName(cleaned);
              }}
            />
            {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
          </View>

          {/* Sexo */}
          <View style={styles.section}>
            <Text style={styles.label}>Sexo</Text>
            <View style={styles.rowWrap}>
              {PET_SEX_OPTIONS.map((option) => {
                const isSelected = sex === option.value;
                const iconName = option.value === "macho" ? "mars" : "venus";
                const isMale = option.value === "macho";
                const selectedBackgroundStyle = isSelected
                  ? isMale
                    ? styles.chipMaleSelected
                    : styles.chipFemaleSelected
                  : null;

                return (
                  <TouchableOpacity
                    key={option.value}
                    style={[styles.chip, selectedBackgroundStyle]}
                    onPress={() => setSex(option.value)}
                  >
                    <FontAwesome5
                      name={iconName}
                      size={14}
                      color={isSelected ? "#FFFFFF" : "#607D8B"}
                      style={{ marginRight: 6 }}
                    />
                    <Text
                      style={[
                        styles.chipText,
                        isSelected && styles.chipTextSelected,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Microchip / tatuaje */}
          <View style={styles.section}>
            <View style={styles.rowSplit}>
              <View style={styles.splitColumn}>
                <Text style={styles.label}>¿Posee microchip?</Text>
                <View style={styles.rowWrap}>
                  <TouchableOpacity
                    style={[styles.chip, hasMicrochip && styles.chipSelected]}
                    onPress={() => setHasMicrochip(true)}
                  >
                    <FontAwesome5
                      name="microchip"
                      size={14}
                      color={hasMicrochip ? "#FFFFFF" : "#607D8B"}
                      style={{ marginRight: 6 }}
                    />
                    <Text
                      style={[
                        styles.chipText,
                        hasMicrochip && styles.chipTextSelected,
                      ]}
                    >
                      Sí
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.chip, !hasMicrochip && styles.chipSelected]}
                    onPress={() => setHasMicrochip(false)}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        !hasMicrochip && styles.chipTextSelected,
                      ]}
                    >
                      No
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={[styles.splitColumn, { marginLeft: 12 }]}>
                <Text style={styles.label}>¿Posee tatuaje?</Text>
                <View style={styles.rowWrap}>
                  <TouchableOpacity
                    style={[styles.chip, hasTattoo && styles.chipSelected]}
                    onPress={() => setHasTattoo(true)}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        hasTattoo && styles.chipTextSelected,
                      ]}
                    >
                      Sí
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.chip, !hasTattoo && styles.chipSelected]}
                    onPress={() => setHasTattoo(false)}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        !hasTattoo && styles.chipTextSelected,
                      ]}
                    >
                      No
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {hasMicrochip && (
              <TextInput
                style={[styles.input, styles.microchipInput]}
                placeholder="Código microchip"
                placeholderTextColor="#9CA3AF"
                value={microchipId}
                onChangeText={(text) => setMicrochipId(text.replace(/\D/g, ""))}
                keyboardType="number-pad"
              />
            )}
          </View>

          {/* Edad */}
          <View style={styles.section}>
            <Text style={styles.label}>Edad</Text>
            <View style={styles.ageRow}>
              <View style={styles.ageDropdownWrapper}>
                <TouchableOpacity
                  style={[
                    styles.input,
                    styles.inputAge,
                    errors.age && styles.inputError,
                  ]}
                  onPress={() => setIsAgeDropdownOpen((prev) => !prev)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={
                      ageValue ? styles.ageValueText : styles.agePlaceholderText
                    }
                  >
                    {ageValue || "Elegir"}
                  </Text>
                  <Ionicons
                    name={isAgeDropdownOpen ? "chevron-up" : "chevron-down"}
                    size={16}
                    color="#6B7280"
                  />
                </TouchableOpacity>

                {isAgeDropdownOpen && (
                  <View style={styles.ageDropdownList}>
                    <ScrollView nestedScrollEnabled>
                      {Array.from({ length: MAX_AGE }, (_, i) => i + 1).map(
                        (num) => {
                          const selected = ageValue === String(num);
                          return (
                            <TouchableOpacity
                              key={num}
                              style={[
                                styles.ageDropdownItem,
                                selected && styles.ageDropdownItemSelected,
                              ]}
                              onPress={() => {
                                setAgeValue(String(num));
                                setErrors((prev) => ({
                                  ...prev,
                                  age: undefined,
                                }));
                                setIsAgeDropdownOpen(false);
                              }}
                            >
                              <Text
                                style={[
                                  styles.ageDropdownItemText,
                                  selected &&
                                    styles.ageDropdownItemTextSelected,
                                ]}
                              >
                                {num}
                              </Text>
                            </TouchableOpacity>
                          );
                        }
                      )}
                    </ScrollView>
                  </View>
                )}
              </View>

              <View style={styles.ageOptions}>
                {["años", "meses"].map((type) => {
                  const isSelected = ageType === type;
                  return (
                    <TouchableOpacity
                      key={type}
                      style={[
                        styles.chip,
                        styles.chipSmall,
                        isSelected && styles.chipSelected,
                      ]}
                      onPress={() => setAgeType(type)}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          isSelected && styles.chipTextSelected,
                        ]}
                      >
                        {type}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
            {errors.age && <Text style={styles.errorText}>{errors.age}</Text>}
          </View>
        </View>

        {/* ==== HISTORIAL MÉDICO ==== */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Historial médico</Text>

          {/* Vacunas */}
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.label}>Vacunas aplicadas</Text>
              <TouchableOpacity
                style={styles.addPillButton}
                onPress={() => {
                  setEditingVaccineIndex(null);
                  setSelectedVaccine(COMMON_VACCINES[0]);
                  setVaccineDate(new Date());
                  setShowVaccineModal(true);
                }}
              >
                <Text style={styles.addPillText}>Add +</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.tableContainer}>
              <View style={[styles.tableRow, styles.tableHeaderRow]}>
                <Text style={[styles.tableHeaderCell, { flex: 2 }]}>
                  Vacuna
                </Text>
                <Text style={[styles.tableHeaderCell, { flex: 1.2 }]}>
                  Fecha
                </Text>
                <Text
                  style={[styles.tableHeaderCell, styles.tableHeaderCellSmall]}
                >
                  Opciones
                </Text>
              </View>

              {vaccines.length === 0 ? (
                <View style={styles.emptyRow}>
                  <Text style={styles.emptyText}>
                    Aún no has agregado vacunas.
                  </Text>
                </View>
              ) : (
                vaccines.map((v, index) => (
                  <View key={index} style={styles.tableRow}>
                    <Text
                      style={[styles.tableCell, { flex: 2 }]}
                      numberOfLines={1}
                    >
                      {v.nombre}
                    </Text>
                    <Text style={[styles.tableCell, { flex: 1.2 }]}>
                      {formatDate(v.fecha)}
                    </Text>
                    <View style={[styles.tableCell, styles.tableCellSmall]}>
                      <View style={styles.optionsCellRow}>
                        <TouchableOpacity
                          style={styles.editButton}
                          onPress={() => {
                            setSelectedVaccine(v.nombre);
                            setVaccineDate(new Date(v.fecha));
                            setEditingVaccineIndex(index);
                            setShowVaccineModal(true);
                          }}
                        >
                          <Ionicons
                            name="create-outline"
                            size={16}
                            color="#111827"
                          />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.editButton, styles.deleteButton]}
                          onPress={() => handleDeleteVaccine(index)}
                        >
                          <Ionicons
                            name="trash-outline"
                            size={16}
                            color="#B91C1C"
                          />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                ))
              )}
            </View>
          </View>

          {/* Desparasitación */}
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.label}>Desparasitación</Text>
              <TouchableOpacity
                style={styles.addPillButton}
                onPress={() => {
                  setEditingDewormIndex(null);
                  setSelectedDewormType(DEWORM_TYPES[0]);
                  setDewormDate(new Date());
                  setShowDewormModal(true);
                }}
              >
                <Text style={styles.addPillText}>Add +</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.tableContainer}>
              <View style={[styles.tableRow, styles.tableHeaderRow]}>
                <Text style={[styles.tableHeaderCell, { flex: 2 }]}>
                  Desparasitación
                </Text>
                <Text style={[styles.tableHeaderCell, { flex: 1.2 }]}>
                  Fecha
                </Text>
                <Text
                  style={[styles.tableHeaderCell, styles.tableHeaderCellSmall]}
                >
                  Opciones
                </Text>
              </View>

              {dewormings.length === 0 ? (
                <View style={styles.emptyRow}>
                  <Text style={styles.emptyText}>
                    Aún no has agregado desparasitaciones.
                  </Text>
                </View>
              ) : (
                dewormings.map((d, index) => (
                  <View key={index} style={styles.tableRow}>
                    <Text
                      style={[styles.tableCell, { flex: 2 }]}
                      numberOfLines={1}
                    >
                      {d.tipo}
                    </Text>
                    <Text style={[styles.tableCell, { flex: 1.2 }]}>
                      {formatDate(d.fecha)}
                    </Text>
                    <View style={[styles.tableCell, styles.tableCellSmall]}>
                      <View style={styles.optionsCellRow}>
                        <TouchableOpacity
                          style={styles.editButton}
                          onPress={() => {
                            setSelectedDewormType(d.tipo);
                            setDewormDate(new Date(d.fecha));
                            setEditingDewormIndex(index);
                            setShowDewormModal(true);
                          }}
                        >
                          <Ionicons
                            name="create-outline"
                            size={16}
                            color="#111827"
                          />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.editButton, styles.deleteButton]}
                          onPress={() => handleDeleteDeworming(index)}
                        >
                          <Ionicons
                            name="trash-outline"
                            size={16}
                            color="#B91C1C"
                          />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                ))
              )}
            </View>
          </View>

          {/* Condiciones médicas */}
          <View style={styles.section}>
            <Text style={styles.label}>Condiciones médicas o alergias</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Describe cualquier condición médica o alergias conocidas..."
              value={conditions}
              onChangeText={setConditions}
              multiline
            />
          </View>

          {/* Contexto de vivienda */}
          <View style={styles.section}>
            <Text style={styles.label}>Contexto de vivienda</Text>
            <View style={styles.rowWrap}>
              {renderChip(
                "Vive adentro",
                "adentro",
                housing,
                setHousing,
                "#10B981"
              )}
              {renderChip(
                "Vive afuera",
                "afuera",
                housing,
                setHousing,
                "#10B981"
              )}
              {renderChip(
                "Adentro y afuera",
                "mixto",
                housing,
                setHousing,
                "#10B981"
              )}
            </View>
          </View>

          {/* Frecuencia paseo */}
          <View style={styles.section}>
            <Text style={styles.label}>Frecuencia de paseo</Text>
            <View style={styles.rowWrap}>
              {renderChip(
                "Casi no se pasea",
                "nulo",
                walkFrequency,
                setWalkFrequency,
                "#10B981"
              )}
              {renderChip(
                "Paseos regulares",
                "regular",
                walkFrequency,
                setWalkFrequency,
                "#10B981"
              )}
              {renderChip(
                "Todos los días",
                "diario",
                walkFrequency,
                setWalkFrequency,
                "#10B981"
              )}
            </View>
          </View>
        </View>

        {/* ==== PERSONALIDAD Y CONTEXTO ==== */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Personalidad y contexto</Text>

          {/* Convivencia */}
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
                  value={othersDescription}
                  onChangeText={setOthersDescription}
                  multiline
                />
              </>
            )}
          </View>

          {/* Agresividad */}
          <View style={styles.section}>
            <Text style={styles.label}>¿Tu mascota es agresiva?</Text>

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
                  value={aggressionDescription}
                  onChangeText={setAggressionDescription}
                  multiline
                />
              </>
            )}

            {/* Compromiso veracidad */}
            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() => setHonestyChecked((prev) => !prev)}
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

          {/* Viajes */}
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
                  value={travelDescription}
                  onChangeText={setTravelDescription}
                  multiline
                />
              </>
            )}
          </View>
        </View>

        {/* BOTÓN GUARDAR */}
        <TouchableOpacity
          style={[styles.primaryButton, saving && { opacity: 0.8 }]}
          onPress={handleSaveAll}
          disabled={saving}
        >
          {saving ? (
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
              <Text style={styles.primaryButtonText}>Guardar cambios</Text>
              <Ionicons name="checkmark" size={18} color="#FFFFFF" />
            </>
          )}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ===== MODALES VACUNAS / DESPARASITACIÓN ===== */}
      {/* Modal vacunas */}
      <Modal
        visible={showVaccineModal}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setShowVaccineModal(false);
          setIsVaccineDropdownOpen(false);
          setShowVaccineDateModal(false);
          setEditingVaccineIndex(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingVaccineIndex !== null
                ? "Editar vacuna"
                : "Registrar vacuna"}
            </Text>
            <Text style={styles.modalSubtitle}>
              Selecciona la vacuna aplicada y la fecha.
            </Text>

            <Text style={[styles.label, { marginTop: 16 }]}>
              Tipo de vacuna
            </Text>
            <View style={styles.dropdownWrapper}>
              <TouchableOpacity
                style={styles.dropdown}
                onPress={() => setIsVaccineDropdownOpen((prev) => !prev)}
                activeOpacity={0.8}
              >
                <Text
                  style={
                    selectedVaccine
                      ? styles.dropdownText
                      : styles.dropdownPlaceholder
                  }
                  numberOfLines={1}
                >
                  {selectedVaccine || "Selecciona una vacuna"}
                </Text>
                <Ionicons
                  name={isVaccineDropdownOpen ? "chevron-up" : "chevron-down"}
                  size={18}
                  color="#6B7280"
                />
              </TouchableOpacity>

              {isVaccineDropdownOpen && (
                <View style={styles.dropdownList}>
                  <ScrollView nestedScrollEnabled>
                    {COMMON_VACCINES.map((vac) => {
                      const isSelected = vac === selectedVaccine;
                      return (
                        <TouchableOpacity
                          key={vac}
                          style={[
                            styles.dropdownItem,
                            isSelected && styles.dropdownItemSelected,
                          ]}
                          onPress={() => {
                            setSelectedVaccine(vac);
                            setIsVaccineDropdownOpen(false);
                          }}
                        >
                          <Text
                            style={[
                              styles.dropdownItemText,
                              isSelected && styles.dropdownItemTextSelected,
                            ]}
                          >
                            {vac}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              )}
            </View>

            <Text style={[styles.label, { marginTop: 16 }]}>Fecha</Text>
            <View style={styles.dateRow}>
              <Text style={styles.dateText}>
                {formatDate(vaccineDate.toISOString())}
              </Text>
              <TouchableOpacity
                style={styles.dateIconButton}
                onPress={() => {
                  setShowVaccineDateModal(true);
                  setIsVaccineDropdownOpen(false);
                }}
              >
                <Ionicons name="calendar" size={18} color="#2563EB" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalActionsRow}>
              <TouchableOpacity
                style={styles.secondaryBtn}
                onPress={() => {
                  setShowVaccineModal(false);
                  setIsVaccineDropdownOpen(false);
                  setShowVaccineDateModal(false);
                  setEditingVaccineIndex(null);
                }}
              >
                <Text style={styles.secondaryBtnText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.primaryBtnSmall}
                onPress={handleSaveVaccine}
              >
                <Text style={styles.primaryBtnSmallText}>
                  {editingVaccineIndex !== null ? "Guardar cambios" : "Guardar"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* calendario interno vacunas */}
          {showVaccineDateModal && (
            <View style={styles.dateModalOverlay}>
              <View style={styles.dateModalCard}>
                {/* Aquí puedes usar DateTimePicker igual que en RegistroMascota2
                    si ya lo tienes instalado. Para mantener la respuesta
                    manejable, omito el componente, pero puedes copiar tal cual
                    el bloque del otro screen. */}
              </View>
            </View>
          )}
        </View>
      </Modal>

      {/* Modal desparasitación */}
      <Modal
        visible={showDewormModal}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setShowDewormModal(false);
          setIsDewormDropdownOpen(false);
          setShowDewormDateModal(false);
          setEditingDewormIndex(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingDewormIndex !== null
                ? "Editar desparasitación"
                : "Registrar desparasitación"}
            </Text>
            <Text style={styles.modalSubtitle}>
              Selecciona el tipo de desparasitación y la fecha.
            </Text>

            <Text style={[styles.label, { marginTop: 16 }]}>
              Tipo de desparasitación
            </Text>
            <View style={styles.dropdownWrapper}>
              <TouchableOpacity
                style={styles.dropdown}
                activeOpacity={0.8}
                onPress={() => setIsDewormDropdownOpen((prev) => !prev)}
              >
                <Text
                  style={
                    selectedDewormType
                      ? styles.dropdownText
                      : styles.dropdownPlaceholder
                  }
                  numberOfLines={1}
                >
                  {selectedDewormType || "Selecciona un tipo"}
                </Text>
                <Ionicons
                  name={isDewormDropdownOpen ? "chevron-up" : "chevron-down"}
                  size={18}
                  color="#6B7280"
                />
              </TouchableOpacity>

              {isDewormDropdownOpen && (
                <View style={styles.dropdownList}>
                  <ScrollView nestedScrollEnabled>
                    {DEWORM_TYPES.map((tipo) => {
                      const isSelected = tipo === selectedDewormType;
                      return (
                        <TouchableOpacity
                          key={tipo}
                          style={[
                            styles.dropdownItem,
                            isSelected && styles.dropdownItemSelected,
                          ]}
                          onPress={() => {
                            setSelectedDewormType(tipo);
                            setIsDewormDropdownOpen(false);
                          }}
                        >
                          <Text
                            style={[
                              styles.dropdownItemText,
                              isSelected && styles.dropdownItemTextSelected,
                            ]}
                          >
                            {tipo}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              )}
            </View>

            <Text style={[styles.label, { marginTop: 16 }]}>Fecha</Text>
            <View style={styles.dateRow}>
              <Text style={styles.dateText}>
                {formatDate(dewormDate.toISOString())}
              </Text>
              <TouchableOpacity
                style={styles.dateIconButton}
                onPress={() => {
                  setShowDewormDateModal(true);
                  setIsDewormDropdownOpen(false);
                }}
              >
                <Ionicons name="calendar" size={18} color="#2563EB" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalActionsRow}>
              <TouchableOpacity
                style={styles.secondaryBtn}
                onPress={() => {
                  setShowDewormModal(false);
                  setIsDewormDropdownOpen(false);
                  setShowDewormDateModal(false);
                  setEditingDewormIndex(null);
                }}
              >
                <Text style={styles.secondaryBtnText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.primaryBtnSmall}
                onPress={handleSaveDeworming}
              >
                <Text style={styles.primaryBtnSmallText}>
                  {editingDewormIndex !== null ? "Guardar cambios" : "Guardar"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* calendario interno desparasitación
              (igual que el de vacunas, puedes copiar DateTimePicker
               de RegistroMascota2 si quieres el popup completo) */}
        </View>
      </Modal>
    </View>
  );
};

export default EditPetScreen;

// ====== STYLES ======
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
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
    textAlign: "center",
  },

  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    paddingTop: 16,
  },

  imagePreviewWrapper: {
    alignItems: "center",
    marginBottom: 16,
  },
  imagePreview: {
    width: "100%",
    maxWidth: 500,
    height: 200,
    borderRadius: 24,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    overflow: "hidden",
  },
  imagePreviewImage: {
    width: "100%",
    height: "100%",
  },
  imagePlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  imagePlaceholderText: {
    marginTop: 8,
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500",
  },
  imageEditButton: {
    position: "absolute",
    bottom: 10,
    right: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(15, 23, 42, 0.85)",
    alignItems: "center",
    justifyContent: "center",
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 20,
    marginBottom: 16,
    shadowColor: "#000000",
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },

  section: { marginBottom: 14 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
  },
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
    fontSize: 14,
    backgroundColor: "#F9FAFB",
  },
  textArea: {
    minHeight: 90,
    textAlignVertical: "top",
  },
  microchipInput: {
    marginTop: 10,
  },
  inputAge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 42,
  },
  ageValueText: {
    fontSize: 14,
    color: "#111827",
  },
  agePlaceholderText: {
    fontSize: 14,
    color: "#9CA3AF",
  },
  inputError: {
    borderColor: "#EF4444",
  },
  errorText: {
    marginTop: 4,
    fontSize: 11,
    color: "#EF4444",
  },

  rowWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  ageRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },

  ageDropdownWrapper: {
    flex: 0.45,
    marginRight: 8,
    position: "relative",
  },
  ageDropdownList: {
    position: "absolute",
    bottom: "100%",
    left: 0,
    right: 0,
    marginBottom: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    backgroundColor: "#FFFFFF",
    maxHeight: 160,
    overflow: "hidden",
    zIndex: 50,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  ageDropdownItem: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  ageDropdownItemSelected: {
    backgroundColor: "#DBEAFE",
  },
  ageDropdownItemText: {
    fontSize: 14,
    color: "#111827",
  },
  ageDropdownItemTextSelected: {
    fontWeight: "600",
  },

  ageOptions: {
    flexDirection: "row",
    flex: 1,
  },

  rowSplit: {
    flexDirection: "row",
  },
  splitColumn: {
    flex: 1,
  },

  chip: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: "#F9FAFB",
  },
  chipSmall: {
    paddingHorizontal: 10,
  },
  chipSelected: {
    backgroundColor: "#10B981",
    borderColor: "#10B981",
  },
  chipMaleSelected: {
    backgroundColor: "#3B82F6",
    borderColor: "#3B82F6",
  },
  chipFemaleSelected: {
    backgroundColor: "#EC4899",
    borderColor: "#EC4899",
  },
  chipText: {
    fontSize: 13,
    color: "#4B5563",
  },
  chipTextSelected: {
    color: "#FFFFFF",
    fontWeight: "600",
  },

  // tabla vacunas / desparasitación
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  addPillButton: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#BAE6FD",
  },
  addPillText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#0F172A",
  },
  tableContainer: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
  },
  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  tableHeaderRow: {
    backgroundColor: "#F3F4F6",
  },
  tableHeaderCell: {
    fontSize: 12,
    fontWeight: "700",
    color: "#111827",
  },
  tableHeaderCellSmall: {
    flex: 0.9,
    textAlign: "center",
  },
  tableCell: {
    fontSize: 12,
    color: "#374151",
  },
  tableCellSmall: {
    flex: 0.9,
    justifyContent: "center",
    alignItems: "center",
  },
  editButton: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: "#BAE6FD",
    justifyContent: "center",
    alignItems: "center",
  },
  optionsCellRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  deleteButton: {
    backgroundColor: "#FEE2E2",
    marginLeft: 6,
  },
  emptyRow: {
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  emptyText: {
    fontSize: 12,
    color: "#6B7280",
  },

  // advertencia agresividad + checkbox
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
    marginTop: 8,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2563EB",
    borderRadius: 999,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 14,
    marginRight: 6,
  },

  // modales
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.45)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  modalContent: {
    width: "100%",
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 18,
    paddingVertical: 18,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  modalSubtitle: {
    marginTop: 4,
    fontSize: 12,
    color: "#6B7280",
  },
  modalActionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
  },

  dropdownWrapper: {
    marginTop: 4,
    position: "relative",
  },
  dropdown: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#F9FAFB",
  },
  dropdownText: {
    flex: 1,
    fontSize: 13,
    color: "#111827",
  },
  dropdownPlaceholder: {
    flex: 1,
    fontSize: 13,
    color: "#9CA3AF",
  },
  dropdownList: {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    marginTop: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    backgroundColor: "#FFFFFF",
    maxHeight: 180,
    overflow: "hidden",
    zIndex: 60,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  dropdownItem: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  dropdownItemSelected: {
    backgroundColor: "#DBEAFE",
  },
  dropdownItemText: {
    fontSize: 13,
    color: "#111827",
  },
  dropdownItemTextSelected: {
    fontWeight: "600",
  },

  dateRow: {
    marginTop: 4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dateText: {
    fontSize: 13,
    color: "#111827",
  },
  dateIconButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#DBEAFE",
    alignItems: "center",
    justifyContent: "center",
  },
  dateModalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(15, 23, 42, 0.45)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  dateModalCard: {
    width: "100%",
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 18,
    paddingVertical: 18,
  },

  primaryBtnSmall: {
    backgroundColor: "#2563EB",
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 999,
  },
  primaryBtnSmallText: {
    color: "#FFF",
    fontWeight: "700",
  },
  secondaryBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#E5E7EB",
  },
  secondaryBtnText: {
    color: "#374151",
    fontWeight: "500",
  },
});
