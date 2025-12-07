// src/feature/pet/views/EditPetScreen.js 
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
  KeyboardAvoidingView,
} from "react-native";
import { Ionicons, FontAwesome5 } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
// 👇 IMPORTANTE: Asegúrate de haber instalado esto: npx expo install @react-native-community/datetimepicker
import DateTimePicker from '@react-native-community/datetimepicker';

import { doc, getDoc, updateDoc, setDoc } from "firebase/firestore";
import { ALERT_TYPE, Dialog } from "react-native-alert-notification";

import { db } from "../../../../firebase/config";
import { COL_MASCOTAS } from "../../../shared/utils/collections";
import { PET_SEX_OPTIONS } from "../../../shared/utils/petConstants";
import { uploadImageToCloudinary } from "../../../shared/services/cloudinary";

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
  const [vaccines, setVaccines] = useState([]); 
  const [dewormings, setDewormings] = useState([]); 
  const [conditions, setConditions] = useState("");
  const [housing, setHousing] = useState(null); 
  const [walkFrequency, setWalkFrequency] = useState(null); 

  // -------- PERSONALIDAD / CONTEXTO --------
  const [livesWithOthers, setLivesWithOthers] = useState(null);
  const [othersRelation, setOthersRelation] = useState(null);
  const [othersDescription, setOthersDescription] = useState("");
  const [isAggressive, setIsAggressive] = useState(null);
  const [aggressionDescription, setAggressionDescription] = useState("");
  const [travelsRegularly, setTravelsRegularly] = useState(null);
  const [travelDescription, setTravelDescription] = useState("");
  const [honestyChecked, setHonestyChecked] = useState(false);

  // -------- MODALES Y DATOS VACUNAS --------
  const [showVaccineModal, setShowVaccineModal] = useState(false);
  const [isVaccineDropdownOpen, setIsVaccineDropdownOpen] = useState(false);
  
  const [selectedVaccine, setSelectedVaccine] = useState(COMMON_VACCINES[0]);
  const [vaccineDate, setVaccineDate] = useState(new Date());
  
  // Campos nuevos
  const [vaccineSerial, setVaccineSerial] = useState("");
  const [vaccineBrand, setVaccineBrand] = useState("");
  const [vaccineMfgDate, setVaccineMfgDate] = useState(new Date());
  const [vaccineExpDate, setVaccineExpDate] = useState(new Date());
  
  const [editingVaccineIndex, setEditingVaccineIndex] = useState(null);

  // -------- MODALES Y DATOS DESPARASITACIÓN --------
  const [showDewormModal, setShowDewormModal] = useState(false);
  const [isDewormDropdownOpen, setIsDewormDropdownOpen] = useState(false);
  const [selectedDewormType, setSelectedDewormType] = useState(DEWORM_TYPES[0]);
  const [dewormDate, setDewormDate] = useState(new Date());
  const [editingDewormIndex, setEditingDewormIndex] = useState(null);

  // -------- LÓGICA DE DATE PICKER (UNIFICADA) --------
  const [pickerState, setPickerState] = useState({
    show: false,
    mode: 'date',
    target: null, // 'vaccine', 'mfg', 'exp', 'deworm'
  });

  const showDatePicker = (target) => {
    setPickerState({ show: true, mode: 'date', target });
  };

  const onDateChange = (event, selectedDate) => {
    // Si el usuario cancela (Android)
    if (event.type === 'dismissed') {
      setPickerState({ ...pickerState, show: false });
      return;
    }

    const currentDate = selectedDate || new Date();
    
    // En Android cerramos el picker inmediatamente. En iOS se maneja diferente (ver render).
    if (Platform.OS === 'android') {
      setPickerState({ ...pickerState, show: false });
    }

    // Asignar fecha al estado correcto
    if (pickerState.target === 'vaccine') setVaccineDate(currentDate);
    else if (pickerState.target === 'mfg') setVaccineMfgDate(currentDate);
    else if (pickerState.target === 'exp') setVaccineExpDate(currentDate);
    else if (pickerState.target === 'deworm') setDewormDate(currentDate);
  };

  // Helper para cerrar picker en iOS
  const closeIosDatePicker = () => {
    setPickerState({ ...pickerState, show: false });
  };

  // ====== HELPERS GENERALES ======
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
        Dialog.show({ type: ALERT_TYPE.DANGER, title: "Error", textBody: "No se pudo identificar la mascota.", button: "Volver", onPressButton: () => { Dialog.hide(); navigation.goBack(); }, });
        return;
      }
      try {
        setLoading(true);
        const petRef = doc(db, COL_MASCOTAS, petId);
        const petSnap = await getDoc(petRef);
        if (!petSnap.exists()) throw new Error("La mascota no existe o fue eliminada.");
        const petData = { id: petSnap.id, ...petSnap.data() };

        setName(petData.nombre || "");
        setSex(petData.sexo || "macho");
        setHasMicrochip(!!petData.tieneMicrochip);
        setMicrochipId(petData.identificadorMicrochip || "");
        setHasTattoo(!!petData.poseeTatuaje);
        setAgeValue(petData.edadValor !== undefined && petData.edadValor !== null ? String(petData.edadValor) : "");
        setAgeType(petData.edadTipo || "años");
        setImageUri(petData.fotoUrl || null);

        const historyRef = doc(db, COL_MASCOTAS, petId, "historial", "inicial");
        const historySnap = await getDoc(historyRef);
        if (historySnap.exists()) {
          const h = historySnap.data();
          setVaccines(h.vacunas || []);
          setDewormings(h.desparacitaciones || []);
          setConditions(h.condicionesMedicas || "");
          setHousing(h.contextoVivienda || null);
          setWalkFrequency(h.frecuenciaPaseo || null);
          setLivesWithOthers(typeof h.viveConOtrosAnimales === "boolean" ? h.viveConOtrosAnimales : null);
          setOthersRelation(h.relacionConOtrosAnimales || null);
          setOthersDescription(h.descripcionConvivencia || "");
          setIsAggressive(typeof h.esAgresivo === "boolean" ? h.esAgresivo : null);
          setAggressionDescription(h.descripcionAgresividad || "");
          setTravelsRegularly(typeof h.viajaRegularmente === "boolean" ? h.viajaRegularmente : null);
          setTravelDescription(h.descripcionViajes || "");
          setHonestyChecked(!!h.compromisoVeracidad);
        }
      } catch (err) {
        console.error("Error cargando mascota:", err);
        Dialog.show({ type: ALERT_TYPE.DANGER, title: "Error", textBody: err.message || "Ocurrió un problema.", button: "Volver", onPressButton: () => { Dialog.hide(); navigation.goBack(); }, });
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
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImageUri(result.assets[0].uri);
    }
  };

  // ====== VALIDACIONES BÁSICAS ======
  const validate = () => {
    const newErrors = {};
    if (!name.trim()) newErrors.name = "Ingresa el nombre del perrito.";
    else if (!NAME_REGEX.test(name.trim())) newErrors.name = "El nombre solo puede contener letras y espacios.";
    if (!ageValue.trim()) newErrors.age = "Ingresa la edad.";
    else if (!/^\d+$/.test(ageValue.trim())) newErrors.age = "La edad debe ser un número entero.";
    else if (Number(ageValue) <= 0) newErrors.age = "La edad debe ser mayor que 0.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ====== MANEJO VACUNAS ======
  const handleSaveVaccine = () => {
    if (!selectedVaccine) {
      Dialog.show({ type: ALERT_TYPE.WARNING, title: "Vacuna requerida", textBody: "Selecciona una vacuna.", button: "Cerrar" });
      return;
    }
    if (isFutureDate(vaccineDate)) {
      Dialog.show({ type: ALERT_TYPE.WARNING, title: "Fecha no válida", textBody: "La fecha de la vacuna no puede ser futura.", button: "Entendido" });
      return;
    }

    const isoDate = vaccineDate.toISOString();
    const isoMfg = vaccineMfgDate.toISOString();
    const isoExp = vaccineExpDate.toISOString();

    const newVaccineObj = {
      nombre: selectedVaccine,
      fecha: isoDate,
      // Nuevos campos
      numeroSerie: vaccineSerial.trim(),
      marca: vaccineBrand.trim(),
      fechaFabricacion: isoMfg,
      fechaVencimiento: isoExp,
    };

    if (editingVaccineIndex !== null) {
      const updated = [...vaccines];
      updated[editingVaccineIndex] = newVaccineObj;
      setVaccines(updated);
    } else {
      setVaccines((prev) => [...prev, newVaccineObj]);
    }
    resetVaccineForm();
  };

  const resetVaccineForm = () => {
    setShowVaccineModal(false);
    setIsVaccineDropdownOpen(false);
    setEditingVaccineIndex(null);
    setVaccineSerial("");
    setVaccineBrand("");
    setVaccineMfgDate(new Date());
    setVaccineExpDate(new Date());
  };

  const handleDeleteVaccine = (index) => {
    const v = vaccines[index];
    if (!v) return;
    Dialog.show({
      type: ALERT_TYPE.DANGER,
      title: "Eliminar vacuna",
      textBody: `¿Seguro que deseas eliminar la vacuna "${v.nombre}"?`,
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
      Dialog.show({ type: ALERT_TYPE.WARNING, title: "Tipo requerido", textBody: "Selecciona un tipo.", button: "Cerrar" });
      return;
    }
    if (isFutureDate(dewormDate)) {
      Dialog.show({ type: ALERT_TYPE.WARNING, title: "Fecha no válida", textBody: "La fecha no puede ser futura.", button: "Entendido" });
      return;
    }
    const isoDate = dewormDate.toISOString();
    if (editingDewormIndex !== null) {
      const updated = [...dewormings];
      updated[editingDewormIndex] = { tipo: selectedDewormType, fecha: isoDate };
      setDewormings(updated);
    } else {
      setDewormings((prev) => [...prev, { tipo: selectedDewormType, fecha: isoDate }]);
    }
    setShowDewormModal(false);
    setIsDewormDropdownOpen(false);
    setEditingDewormIndex(null);
  };

  const handleDeleteDeworming = (index) => {
    const d = dewormings[index];
    if (!d) return;
    Dialog.show({
      type: ALERT_TYPE.DANGER,
      title: "Eliminar",
      textBody: `¿Eliminar desparasitación "${d.tipo}"?`,
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
    if (livesWithOthers === true) {
      if (!othersRelation) { Dialog.show({ type: ALERT_TYPE.WARNING, title: "Convivencia", textBody: "Falta relación con otros animales.", button: "Entendido" }); return; }
      if (!othersDescription.trim()) { Dialog.show({ type: ALERT_TYPE.WARNING, title: "Convivencia", textBody: "Falta descripción convivencia.", button: "Entendido" }); return; }
    }
    if (isAggressive === true && !aggressionDescription.trim()) { Dialog.show({ type: ALERT_TYPE.WARNING, title: "Agresividad", textBody: "Describe la agresividad.", button: "Entendido" }); return; }
    if (travelsRegularly === true && !travelDescription.trim()) { Dialog.show({ type: ALERT_TYPE.WARNING, title: "Viajes", textBody: "Describe los viajes.", button: "Entendido" }); return; }
    if (!honestyChecked) { Dialog.show({ type: ALERT_TYPE.WARNING, title: "Compromiso", textBody: "Confirma la veracidad.", button: "Entendido" }); return; }

    try {
      setSaving(true);
      let finalFotoUrl = imageUri;
      if (imageUri && imageUri.startsWith("file")) {
        try {
            finalFotoUrl = await uploadImageToCloudinary(imageUri);
        } catch (uploadError) {
            console.error("Error subiendo imagen:", uploadError);
            Dialog.show({ type: ALERT_TYPE.WARNING, title: "Error de imagen", textBody: "No se pudo subir la foto, se guardará el resto.", button: "Continuar" });
            finalFotoUrl = null; 
        }
      }

      const petRef = doc(db, COL_MASCOTAS, petId);
      await updateDoc(petRef, {
        nombre: name.trim(),
        sexo: sex,
        tieneMicrochip: hasMicrochip,
        identificadorMicrochip: microchipId.trim() || null,
        poseeTatuaje: hasTattoo,
        edadValor: Number(ageValue),
        edadTipo: ageType,
        fotoUrl: finalFotoUrl, 
      });

      const historyRef = doc(db, COL_MASCOTAS, petId, "historial", "inicial");
      const historyPayload = {
        vacunas: vaccines,
        desparacitaciones: dewormings,
        condicionesMedicas: conditions.trim(),
        contextoVivienda: housing || null,
        frecuenciaPaseo: walkFrequency || null,
        viveConOtrosAnimales: livesWithOthers === null ? null : !!livesWithOthers,
        relacionConOtrosAnimales: othersRelation || null,
        descripcionConvivencia: othersDescription.trim() || "",
        esAgresivo: isAggressive === null ? null : !!isAggressive,
        descripcionAgresividad: aggressionDescription.trim() || "",
        viajaRegularmente: travelsRegularly === null ? null : !!travelsRegularly,
        descripcionViajes: travelDescription.trim() || "",
        compromisoVeracidad: !!honestyChecked,
      };

      await setDoc(historyRef, historyPayload, { merge: true });

      Dialog.show({ type: ALERT_TYPE.SUCCESS, title: "Guardado", textBody: "Actualizado correctamente.", button: "Volver", onPressButton: () => { Dialog.hide(); navigation.goBack(); }, });
    } catch (err) {
      console.error("Error actualizando:", err);
      Dialog.show({ type: ALERT_TYPE.DANGER, title: "Error", textBody: err.message, button: "Entendido" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color="#365b6d" />
        <Text style={styles.loadingText}>Cargando datos...</Text>
      </View>
    );
  }

  // Helper para obtener el valor actual del DatePicker según el target
  const getPickerValue = () => {
    if (pickerState.target === 'vaccine') return vaccineDate;
    if (pickerState.target === 'mfg') return vaccineMfgDate;
    if (pickerState.target === 'exp') return vaccineExpDate;
    if (pickerState.target === 'deworm') return dewormDate;
    return new Date();
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
    >
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerIconButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>Editar mascota</Text>
        <View style={styles.headerIconButton} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ==== INFO BÁSICA ==== */}
        <View style={styles.imagePreviewWrapper}>
          <TouchableOpacity style={styles.imagePreview} activeOpacity={0.8} onPress={handlePickImage}>
            {imageUri ? (
              <>
                <Image source={{ uri: imageUri }} style={styles.imagePreviewImage} />
                <TouchableOpacity style={styles.imageEditButton} onPress={handlePickImage}>
                  <FontAwesome5 name="pen" size={14} color="#FFFFFF" />
                </TouchableOpacity>
              </>
            ) : (
              <View style={styles.imagePlaceholder}>
                <FontAwesome5 name="camera" size={28} color="#9CA3AF" />
                <Text style={styles.imagePlaceholderText}>Toca para agregar foto</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Información básica</Text>
          </View>
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
          <View style={styles.section}>
            <Text style={styles.label}>Sexo</Text>
            <View style={styles.rowWrap}>
              {PET_SEX_OPTIONS.map((option) => {
                const isSelected = sex === option.value;
                const iconName = option.value === "macho" ? "mars" : "venus";
                const isMale = option.value === "macho";
                return (
                  <TouchableOpacity
                    key={option.value}
                    style={[styles.chip, isSelected ? (isMale ? styles.chipMaleSelected : styles.chipFemaleSelected) : null]}
                    onPress={() => setSex(option.value)}
                  >
                    <FontAwesome5 name={iconName} size={14} color={isSelected ? "#FFFFFF" : "#607D8B"} style={{ marginRight: 6 }} />
                    <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>{option.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
          <View style={styles.section}>
            <View style={styles.rowSplit}>
              <View style={styles.splitColumn}>
                <Text style={styles.label}>¿Posee microchip?</Text>
                <View style={styles.rowWrap}>
                  <TouchableOpacity style={[styles.chip, hasMicrochip && styles.chipSelected]} onPress={() => setHasMicrochip(true)}>
                    <FontAwesome5 name="microchip" size={14} color={hasMicrochip ? "#FFFFFF" : "#607D8B"} style={{ marginRight: 6 }} />
                    <Text style={[styles.chipText, hasMicrochip && styles.chipTextSelected]}>Sí</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.chip, !hasMicrochip && styles.chipSelected]} onPress={() => setHasMicrochip(false)}>
                    <Text style={[styles.chipText, !hasMicrochip && styles.chipTextSelected]}>No</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <View style={[styles.splitColumn, { marginLeft: 12 }]}>
                <Text style={styles.label}>¿Posee tatuaje?</Text>
                <View style={styles.rowWrap}>
                  <TouchableOpacity style={[styles.chip, hasTattoo && styles.chipSelected]} onPress={() => setHasTattoo(true)}>
                    <Text style={[styles.chipText, hasTattoo && styles.chipTextSelected]}>Sí</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.chip, !hasTattoo && styles.chipSelected]} onPress={() => setHasTattoo(false)}>
                    <Text style={[styles.chipText, !hasTattoo && styles.chipTextSelected]}>No</Text>
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
          <View style={styles.section}>
            <Text style={styles.label}>Edad</Text>
            <View style={styles.ageRow}>
              <View style={styles.ageDropdownWrapper}>
                <TouchableOpacity
                  style={[styles.input, styles.inputAge, errors.age && styles.inputError]}
                  onPress={() => setIsAgeDropdownOpen((prev) => !prev)}
                  activeOpacity={0.8}
                >
                  <Text style={ageValue ? styles.ageValueText : styles.agePlaceholderText}>{ageValue || "Elegir"}</Text>
                  <Ionicons name={isAgeDropdownOpen ? "chevron-up" : "chevron-down"} size={16} color="#6B7280" />
                </TouchableOpacity>
                {isAgeDropdownOpen && (
                  <View style={styles.ageDropdownList}>
                    <ScrollView nestedScrollEnabled>
                      {Array.from({ length: MAX_AGE }, (_, i) => i + 1).map((num) => {
                        const selected = ageValue === String(num);
                        return (
                          <TouchableOpacity
                            key={num}
                            style={[styles.ageDropdownItem, selected && styles.ageDropdownItemSelected]}
                            onPress={() => {
                              setAgeValue(String(num));
                              setErrors((prev) => ({ ...prev, age: undefined }));
                              setIsAgeDropdownOpen(false);
                            }}
                          >
                            <Text style={[styles.ageDropdownItemText, selected && styles.ageDropdownItemTextSelected]}>{num}</Text>
                          </TouchableOpacity>
                        );
                      })}
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
                      style={[styles.chip, styles.chipSmall, isSelected && styles.chipSelected]}
                      onPress={() => setAgeType(type)}
                    >
                      <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>{type}</Text>
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
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.label}>Vacunas aplicadas</Text>
              <TouchableOpacity
                style={styles.addPillButton}
                onPress={() => {
                  setEditingVaccineIndex(null);
                  setSelectedVaccine(COMMON_VACCINES[0]);
                  setVaccineDate(new Date());
                  // Reset campos nuevos
                  setVaccineSerial("");
                  setVaccineBrand("");
                  setVaccineMfgDate(new Date());
                  setVaccineExpDate(new Date());
                  setShowVaccineModal(true);
                }}
              >
                <Text style={styles.addPillText}>Add +</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.tableContainer}>
              <View style={[styles.tableRow, styles.tableHeaderRow]}>
                <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Vacuna</Text>
                <Text style={[styles.tableHeaderCell, { flex: 1.2 }]}>Fecha</Text>
                <Text style={[styles.tableHeaderCell, styles.tableHeaderCellSmall]}>Opciones</Text>
              </View>
              {vaccines.length === 0 ? (
                <View style={styles.emptyRow}>
                  <Text style={styles.emptyText}>Aún no has agregado vacunas.</Text>
                </View>
              ) : (
                vaccines.map((v, index) => (
                  <View key={index} style={styles.tableRow}>
                    <Text style={[styles.tableCell, { flex: 2 }]} numberOfLines={1}>{v.nombre}</Text>
                    <Text style={[styles.tableCell, { flex: 1.2 }]}>{formatDate(v.fecha)}</Text>
                    <View style={[styles.tableCell, styles.tableCellSmall]}>
                      <View style={styles.optionsCellRow}>
                        <TouchableOpacity
                          style={styles.editButton}
                          onPress={() => {
                            setSelectedVaccine(v.nombre);
                            setVaccineDate(new Date(v.fecha));
                            // Cargar datos extra para editar
                            setVaccineSerial(v.numeroSerie || "");
                            setVaccineBrand(v.marca || "");
                            setVaccineMfgDate(v.fechaFabricacion ? new Date(v.fechaFabricacion) : new Date());
                            setVaccineExpDate(v.fechaVencimiento ? new Date(v.fechaVencimiento) : new Date());
                            setEditingVaccineIndex(index);
                            setShowVaccineModal(true);
                          }}
                        >
                          <Ionicons name="create-outline" size={16} color="#111827" />
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.editButton, styles.deleteButton]} onPress={() => handleDeleteVaccine(index)}>
                          <Ionicons name="trash-outline" size={16} color="#B91C1C" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                ))
              )}
            </View>
          </View>

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
                <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Desparasitación</Text>
                <Text style={[styles.tableHeaderCell, { flex: 1.2 }]}>Fecha</Text>
                <Text style={[styles.tableHeaderCell, styles.tableHeaderCellSmall]}>Opciones</Text>
              </View>
              {dewormings.length === 0 ? (
                <View style={styles.emptyRow}>
                  <Text style={styles.emptyText}>Aún no has agregado desparasitaciones.</Text>
                </View>
              ) : (
                dewormings.map((d, index) => (
                  <View key={index} style={styles.tableRow}>
                    <Text style={[styles.tableCell, { flex: 2 }]} numberOfLines={1}>{d.tipo}</Text>
                    <Text style={[styles.tableCell, { flex: 1.2 }]}>{formatDate(d.fecha)}</Text>
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
                          <Ionicons name="create-outline" size={16} color="#111827" />
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.editButton, styles.deleteButton]} onPress={() => handleDeleteDeworming(index)}>
                          <Ionicons name="trash-outline" size={16} color="#B91C1C" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                ))
              )}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Condiciones médicas o alergias</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Describe cualquier condición médica..."
              value={conditions}
              onChangeText={setConditions}
              multiline
            />
          </View>
          <View style={styles.section}>
            <Text style={styles.label}>Contexto de vivienda</Text>
            <View style={styles.rowWrap}>
              {renderChip("Vive adentro", "adentro", housing, setHousing, "#10B981")}
              {renderChip("Vive afuera", "afuera", housing, setHousing, "#10B981")}
              {renderChip("Adentro y afuera", "mixto", housing, setHousing, "#10B981")}
            </View>
          </View>
          <View style={styles.section}>
            <Text style={styles.label}>Frecuencia de paseo</Text>
            <View style={styles.rowWrap}>
              {renderChip("Casi no se pasea", "nulo", walkFrequency, setWalkFrequency, "#10B981")}
              {renderChip("Paseos regulares", "regular", walkFrequency, setWalkFrequency, "#10B981")}
              {renderChip("Todos los días", "diario", walkFrequency, setWalkFrequency, "#10B981")}
            </View>
          </View>
        </View>

        {/* ==== PERSONALIDAD Y CONTEXTO ==== */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Personalidad y contexto</Text>
          <View style={styles.section}>
            <Text style={styles.label}>¿Tu mascota vive con otros animales?</Text>
            <View style={styles.rowWrap}>
              {renderChip("Sí", true, livesWithOthers, setLivesWithOthers)}
              {renderChip("No", false, livesWithOthers, setLivesWithOthers)}
            </View>
            {livesWithOthers === true && (
              <>
                <Text style={[styles.label, { marginTop: 12 }]}>¿Cómo es la relación?</Text>
                <View style={styles.rowWrap}>
                  {renderChip("Juegan mucho", "juegan", othersRelation, setOthersRelation)}
                  {renderChip("A veces se pelean", "se_pelean", othersRelation, setOthersRelation)}
                  {renderChip("No son muy unidos", "no_unidos", othersRelation, setOthersRelation)}
                  {renderChip("Conviven sin problema", "conviven_bien", othersRelation, setOthersRelation)}
                </View>
                <Text style={[styles.label, { marginTop: 12 }]}>Describe brevemente la convivencia</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={othersDescription}
                  onChangeText={setOthersDescription}
                  multiline
                />
              </>
            )}
          </View>
          <View style={styles.section}>
            <Text style={styles.label}>¿Tu mascota es agresiva?</Text>
            <View style={styles.infoWarningBox}>
              <Text style={styles.infoWarningText}>Por favor sé sincero.</Text>
            </View>
            <View style={[styles.rowWrap, { marginTop: 8 }]}>
              {renderChip("Sí", true, isAggressive, setIsAggressive, "#DC2626")}
              {renderChip("No", false, isAggressive, setIsAggressive, "#10B981")}
            </View>
            {isAggressive === true && (
              <>
                <Text style={[styles.label, { marginTop: 12 }]}>¿En qué situaciones?</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={aggressionDescription}
                  onChangeText={setAggressionDescription}
                  multiline
                />
              </>
            )}
            <TouchableOpacity style={styles.checkboxRow} onPress={() => setHonestyChecked((prev) => !prev)}>
              <View style={[styles.checkboxBox, honestyChecked && styles.checkboxBoxChecked]}>
                {honestyChecked && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
              </View>
              <Text style={styles.checkboxText}>Confirmo que la información es verdadera.</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.section}>
            <Text style={styles.label}>¿Tu mascota viaja regularmente?</Text>
            <View style={styles.rowWrap}>
              {renderChip("Sí", true, travelsRegularly, setTravelsRegularly)}
              {renderChip("No", false, travelsRegularly, setTravelsRegularly)}
            </View>
            {travelsRegularly === true && (
              <>
                <Text style={[styles.label, { marginTop: 12 }]}>Describe a dónde viajas</Text>
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

        <TouchableOpacity style={[styles.primaryButton, saving && { opacity: 0.8 }]} onPress={handleSaveAll} disabled={saving}>
          {saving ? (
            <><ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 8 }} /><Text style={styles.primaryButtonText}>Guardando...</Text></>
          ) : (
            <><Text style={styles.primaryButtonText}>Guardar cambios</Text><Ionicons name="checkmark" size={18} color="#FFFFFF" /></>
          )}
        </TouchableOpacity>
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ===== MODALES VACUNAS ===== */}
      <Modal
        visible={showVaccineModal}
        transparent
        animationType="fade"
        onRequestClose={resetVaccineForm}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{editingVaccineIndex !== null ? "Editar vacuna" : "Registrar vacuna"}</Text>
            <Text style={styles.modalSubtitle}>Ingresa los datos de la vacuna.</Text>

            <Text style={[styles.label, { marginTop: 16 }]}>Tipo de vacuna</Text>
            <View style={styles.dropdownWrapper}>
              <TouchableOpacity
                style={styles.dropdown}
                onPress={() => setIsVaccineDropdownOpen((prev) => !prev)}
                activeOpacity={0.8}
              >
                <Text style={selectedVaccine ? styles.dropdownText : styles.dropdownPlaceholder} numberOfLines={1}>
                  {selectedVaccine || "Selecciona una vacuna"}
                </Text>
                <Ionicons name={isVaccineDropdownOpen ? "chevron-up" : "chevron-down"} size={18} color="#6B7280" />
              </TouchableOpacity>
              {isVaccineDropdownOpen && (
                <View style={styles.dropdownList}>
                  <ScrollView nestedScrollEnabled>
                    {COMMON_VACCINES.map((vac) => {
                      const isSelected = vac === selectedVaccine;
                      return (
                        <TouchableOpacity
                          key={vac}
                          style={[styles.dropdownItem, isSelected && styles.dropdownItemSelected]}
                          onPress={() => {
                            setSelectedVaccine(vac);
                            setIsVaccineDropdownOpen(false);
                          }}
                        >
                          <Text style={[styles.dropdownItemText, isSelected && styles.dropdownItemTextSelected]}>{vac}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              )}
            </View>

            {/* Numero de Serie */}
            <Text style={[styles.label, { marginTop: 12 }]}>Número de serie</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: SN-12345"
              value={vaccineSerial}
              onChangeText={setVaccineSerial}
            />

            {/* Marca */}
            <Text style={[styles.label, { marginTop: 12 }]}>Marca</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: Pfizer / Nobivac"
              value={vaccineBrand}
              onChangeText={setVaccineBrand}
            />

            {/* Fecha Aplicacion */}
            <Text style={[styles.label, { marginTop: 12 }]}>Fecha Aplicación</Text>
            <View style={styles.dateRow}>
              <Text style={styles.dateText}>{formatDate(vaccineDate.toISOString())}</Text>
              <TouchableOpacity style={styles.dateIconButton} onPress={() => showDatePicker('vaccine')}>
                <Ionicons name="calendar" size={18} color="#2563EB" />
              </TouchableOpacity>
            </View>

            {/* Fecha Fabricación */}
            <Text style={[styles.label, { marginTop: 12 }]}>Fecha Fabricación</Text>
            <View style={styles.dateRow}>
              <Text style={styles.dateText}>{formatDate(vaccineMfgDate.toISOString())}</Text>
              <TouchableOpacity style={styles.dateIconButton} onPress={() => showDatePicker('mfg')}>
                <Ionicons name="calendar" size={18} color="#2563EB" />
              </TouchableOpacity>
            </View>

            {/* Fecha Vencimiento */}
            <Text style={[styles.label, { marginTop: 12 }]}>Fecha Vencimiento</Text>
            <View style={styles.dateRow}>
              <Text style={styles.dateText}>{formatDate(vaccineExpDate.toISOString())}</Text>
              <TouchableOpacity style={styles.dateIconButton} onPress={() => showDatePicker('exp')}>
                <Ionicons name="calendar" size={18} color="#2563EB" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalActionsRow}>
              <TouchableOpacity style={styles.secondaryBtn} onPress={resetVaccineForm}>
                <Text style={styles.secondaryBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.primaryBtnSmall} onPress={handleSaveVaccine}>
                <Text style={styles.primaryBtnSmallText}>{editingVaccineIndex !== null ? "Guardar cambios" : "Guardar"}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal desparasitación */}
      <Modal
        visible={showDewormModal}
        transparent
        animationType="fade"
        onRequestClose={() => { setShowDewormModal(false); setIsDewormDropdownOpen(false); setEditingDewormIndex(null); }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{editingDewormIndex !== null ? "Editar desparasitación" : "Registrar desparasitación"}</Text>
            <Text style={styles.modalSubtitle}>Selecciona el tipo y fecha.</Text>
            <Text style={[styles.label, { marginTop: 16 }]}>Tipo</Text>
            <View style={styles.dropdownWrapper}>
              <TouchableOpacity
                style={styles.dropdown}
                activeOpacity={0.8}
                onPress={() => setIsDewormDropdownOpen((prev) => !prev)}
              >
                <Text style={selectedDewormType ? styles.dropdownText : styles.dropdownPlaceholder} numberOfLines={1}>{selectedDewormType || "Selecciona un tipo"}</Text>
                <Ionicons name={isDewormDropdownOpen ? "chevron-up" : "chevron-down"} size={18} color="#6B7280" />
              </TouchableOpacity>
              {isDewormDropdownOpen && (
                <View style={styles.dropdownList}>
                  <ScrollView nestedScrollEnabled>
                    {DEWORM_TYPES.map((tipo) => {
                      const isSelected = tipo === selectedDewormType;
                      return (
                        <TouchableOpacity
                          key={tipo}
                          style={[styles.dropdownItem, isSelected && styles.dropdownItemSelected]}
                          onPress={() => { setSelectedDewormType(tipo); setIsDewormDropdownOpen(false); }}
                        >
                          <Text style={[styles.dropdownItemText, isSelected && styles.dropdownItemTextSelected]}>{tipo}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              )}
            </View>
            <Text style={[styles.label, { marginTop: 16 }]}>Fecha</Text>
            <View style={styles.dateRow}>
              <Text style={styles.dateText}>{formatDate(dewormDate.toISOString())}</Text>
              <TouchableOpacity style={styles.dateIconButton} onPress={() => showDatePicker('deworm')}>
                <Ionicons name="calendar" size={18} color="#2563EB" />
              </TouchableOpacity>
            </View>
            <View style={styles.modalActionsRow}>
              <TouchableOpacity style={styles.secondaryBtn} onPress={() => { setShowDewormModal(false); setIsDewormDropdownOpen(false); setEditingDewormIndex(null); }}>
                <Text style={styles.secondaryBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.primaryBtnSmall} onPress={handleSaveDeworming}>
                <Text style={styles.primaryBtnSmallText}>{editingDewormIndex !== null ? "Guardar cambios" : "Guardar"}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* RENDERIZADO DEL PICKER FUERA DE LOS MODALES DE CONTENIDO (Importante para iOS) */}
      {pickerState.show && (
        Platform.OS === 'ios' ? (
          // Modal especial para iOS para que se vea bien
          <Modal transparent animationType="slide">
             <View style={styles.iosDateModalOverlay}>
                <View style={styles.iosDateModalContent}>
                   <DateTimePicker
                      testID="dateTimePicker"
                      value={getPickerValue()}
                      mode={pickerState.mode}
                      display="spinner"
                      onChange={onDateChange}
                      textColor="black"
                   />
                   <TouchableOpacity style={styles.iosDateCloseBtn} onPress={closeIosDatePicker}>
                      <Text style={styles.iosDateCloseText}>Confirmar</Text>
                   </TouchableOpacity>
                </View>
             </View>
          </Modal>
        ) : (
          // Android lo maneja nativo sin Modal wrapper
          <DateTimePicker
            testID="dateTimePicker"
            value={getPickerValue()}
            mode={pickerState.mode}
            is24Hour={true}
            display="default"
            onChange={onDateChange}
          />
        )
      )}

    </KeyboardAvoidingView>
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
  loadingScreen: { flex: 1, backgroundColor: "#E3F2FD", alignItems: "center", justifyContent: "center" },
  loadingText: { marginTop: 8, fontSize: 13, color: "#607D8B" },
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
  headerIconButton: { width: 38, height: 38, borderRadius: 19, backgroundColor: "rgba(255,255,255,0.18)", alignItems: "center", justifyContent: "center" },
  headerTitle: { flex: 1, marginHorizontal: 12, fontSize: 18, fontWeight: "700", color: "#FFFFFF", textAlign: "center" },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 24, paddingTop: 16 },
  imagePreviewWrapper: { alignItems: "center", marginBottom: 16 },
  imagePreview: { width: "100%", maxWidth: 500, height: 200, borderRadius: 24, backgroundColor: "#F1F5F9", borderWidth: 1, borderColor: "#E2E8F0", overflow: "hidden" },
  imagePreviewImage: { width: "100%", height: "100%" },
  imagePlaceholder: { flex: 1, alignItems: "center", justifyContent: "center" },
  imagePlaceholderText: { marginTop: 8, fontSize: 12, color: "#6B7280", fontWeight: "500" },
  imageEditButton: { position: "absolute", bottom: 10, right: 10, width: 32, height: 32, borderRadius: 16, backgroundColor: "rgba(15, 23, 42, 0.85)", alignItems: "center", justifyContent: "center" },
  card: { backgroundColor: "#FFFFFF", borderRadius: 20, paddingHorizontal: 18, paddingVertical: 20, marginBottom: 16, shadowColor: "#000000", shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 4 }, elevation: 3 },
  section: { marginBottom: 14 },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: "#111827", marginBottom: 8 },
  label: { fontSize: 13, fontWeight: "600", color: "#374151", marginBottom: 6 },
  input: { borderRadius: 10, borderWidth: 1, borderColor: "#E5E7EB", paddingHorizontal: 12, paddingVertical: 8, fontSize: 14, backgroundColor: "#F9FAFB" },
  textArea: { minHeight: 90, textAlignVertical: "top" },
  microchipInput: { marginTop: 10 },
  inputAge: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", height: 42 },
  ageValueText: { fontSize: 14, color: "#111827" },
  agePlaceholderText: { fontSize: 14, color: "#9CA3AF" },
  inputError: { borderColor: "#EF4444" },
  errorText: { marginTop: 4, fontSize: 11, color: "#EF4444" },
  rowWrap: { flexDirection: "row", flexWrap: "wrap" },
  ageRow: { flexDirection: "row", alignItems: "flex-start" },
  ageDropdownWrapper: { flex: 0.45, marginRight: 8, position: "relative" },
  ageDropdownList: { position: "absolute", bottom: "100%", left: 0, right: 0, marginBottom: 4, borderRadius: 10, borderWidth: 1, borderColor: "#D1D5DB", backgroundColor: "#FFFFFF", maxHeight: 160, overflow: "hidden", zIndex: 50, elevation: 8, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8 },
  ageDropdownItem: { paddingHorizontal: 12, paddingVertical: 8 },
  ageDropdownItemSelected: { backgroundColor: "#DBEAFE" },
  ageDropdownItemText: { fontSize: 14, color: "#111827" },
  ageDropdownItemTextSelected: { fontWeight: "600" },
  ageOptions: { flexDirection: "row", flex: 1 },
  rowSplit: { flexDirection: "row" },
  splitColumn: { flex: 1 },
  chip: { flexDirection: "row", alignItems: "center", borderRadius: 999, borderWidth: 1, borderColor: "#E5E7EB", paddingHorizontal: 14, paddingVertical: 6, marginRight: 8, marginBottom: 8, backgroundColor: "#F9FAFB" },
  chipSmall: { paddingHorizontal: 10 },
  chipSelected: { backgroundColor: "#10B981", borderColor: "#10B981" },
  chipMaleSelected: { backgroundColor: "#3B82F6", borderColor: "#3B82F6" },
  chipFemaleSelected: { backgroundColor: "#EC4899", borderColor: "#EC4899" },
  chipText: { fontSize: 13, color: "#4B5563" },
  chipTextSelected: { color: "#FFFFFF", fontWeight: "600" },
  sectionHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  addPillButton: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 999, backgroundColor: "#BAE6FD" },
  addPillText: { fontSize: 13, fontWeight: "600", color: "#0F172A" },
  tableContainer: { borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 12, overflow: "hidden", backgroundColor: "#FFFFFF" },
  tableRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#E5E7EB" },
  tableHeaderRow: { backgroundColor: "#F3F4F6" },
  tableHeaderCell: { fontSize: 12, fontWeight: "700", color: "#111827" },
  tableHeaderCellSmall: { flex: 0.9, textAlign: "center" },
  tableCell: { fontSize: 12, color: "#374151" },
  tableCellSmall: { flex: 0.9, justifyContent: "center", alignItems: "center" },
  editButton: { width: 30, height: 30, borderRadius: 8, backgroundColor: "#BAE6FD", justifyContent: "center", alignItems: "center" },
  optionsCellRow: { flexDirection: "row", alignItems: "center", justifyContent: "center" },
  deleteButton: { backgroundColor: "#FEE2E2", marginLeft: 6 },
  emptyRow: { paddingHorizontal: 12, paddingVertical: 12 },
  emptyText: { fontSize: 12, color: "#6B7280" },
  infoWarningBox: { marginTop: 2, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8, backgroundColor: "#FEF3C7", borderWidth: 1, borderColor: "#FBBF24" },
  infoWarningText: { fontSize: 11, color: "#92400E" },
  checkboxRow: { flexDirection: "row", alignItems: "flex-start", marginTop: 14 },
  checkboxBox: { width: 20, height: 20, borderRadius: 5, borderWidth: 1.5, borderColor: "#9CA3AF", backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center", marginRight: 8, marginTop: 2 },
  checkboxBoxChecked: { backgroundColor: "#2563EB", borderColor: "#2563EB" },
  checkboxText: { flex: 1, fontSize: 12, color: "#374151" },
  primaryButton: { marginTop: 8, alignSelf: "center", flexDirection: "row", alignItems: "center", backgroundColor: "#2563EB", borderRadius: 999, paddingHorizontal: 20, paddingVertical: 10 },
  primaryButtonText: { color: "#FFFFFF", fontWeight: "600", fontSize: 14, marginRight: 6 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(15, 23, 42, 0.45)", justifyContent: "center", alignItems: "center", paddingHorizontal: 24 },
  modalContent: { width: "100%", borderRadius: 20, backgroundColor: "#FFFFFF", paddingHorizontal: 18, paddingVertical: 18 },
  modalTitle: { fontSize: 16, fontWeight: "700", color: "#111827" },
  modalSubtitle: { marginTop: 4, fontSize: 12, color: "#6B7280" },
  modalActionsRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 16 },
  dropdownWrapper: { marginTop: 4, position: "relative" },
  dropdown: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderRadius: 10, borderWidth: 1, borderColor: "#D1D5DB", paddingHorizontal: 12, paddingVertical: 10, backgroundColor: "#F9FAFB" },
  dropdownText: { flex: 1, fontSize: 13, color: "#111827" },
  dropdownPlaceholder: { flex: 1, fontSize: 13, color: "#9CA3AF" },
  dropdownList: { position: "absolute", top: "100%", left: 0, right: 0, marginTop: 4, borderRadius: 10, borderWidth: 1, borderColor: "#D1D5DB", backgroundColor: "#FFFFFF", maxHeight: 180, overflow: "hidden", zIndex: 60, elevation: 10, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8 },
  dropdownItem: { paddingHorizontal: 12, paddingVertical: 10 },
  dropdownItemSelected: { backgroundColor: "#DBEAFE" },
  dropdownItemText: { fontSize: 13, color: "#111827" },
  dropdownItemTextSelected: { fontWeight: "600" },
  dateRow: { marginTop: 4, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  dateText: { fontSize: 13, color: "#111827" },
  dateIconButton: { width: 32, height: 32, borderRadius: 16, backgroundColor: "#DBEAFE", alignItems: "center", justifyContent: "center" },
  primaryBtnSmall: { backgroundColor: "#2563EB", paddingHorizontal: 18, paddingVertical: 8, borderRadius: 999 },
  primaryBtnSmallText: { color: "#FFF", fontWeight: "700" },
  secondaryBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999, backgroundColor: "#E5E7EB" },
  secondaryBtnText: { color: "#374151", fontWeight: "500" },

  // Estilos específicos para iOS date picker Modal
  iosDateModalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.3)' },
  iosDateModalContent: { backgroundColor: 'white', padding: 16, paddingBottom: 40 },
  iosDateCloseBtn: { marginTop: 10, backgroundColor: '#2563EB', padding: 12, borderRadius: 10, alignItems: 'center' },
  iosDateCloseText: { color: 'white', fontWeight: 'bold' },
});




