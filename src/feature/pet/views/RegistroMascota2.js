// screens/RegistroMascota2.js
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Platform,
  Modal,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import { ALERT_TYPE, Dialog } from "react-native-alert-notification";

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

const RegistroMascota2 = ({ navigation, route }) => {
  const draftPet = route?.params?.draftPet;

  /* ======================================================
     ESTADO: VACUNAS
     ====================================================== */
  const [showVaccineDateModal, setShowVaccineDateModal] = useState(false); // fecha aplicacion
  const [showVaccineMfgModal, setShowVaccineMfgModal] = useState(false); // fecha fabricacion
  const [showVaccineExpModal, setShowVaccineExpModal] = useState(false); // fecha vencimiento

  const [selectedVaccine, setSelectedVaccine] = useState(COMMON_VACCINES[0]);
  const [vaccineDate, setVaccineDate] = useState(new Date());
  const [vaccineMfgDate, setVaccineMfgDate] = useState(new Date());
  const [vaccineExpDate, setVaccineExpDate] = useState(new Date());

  const [isVaccineDropdownOpen, setIsVaccineDropdownOpen] = useState(false);
  const [vaccines, setVaccines] = useState([]); // { nombre, fecha, numeroSerie, marca, fechaFabricacion, fechaVencimiento }
  const [showVaccineModal, setShowVaccineModal] = useState(false);
  const [editingVaccineIndex, setEditingVaccineIndex] = useState(null);

  const [vaccineSerial, setVaccineSerial] = useState("");
  const [vaccineBrand, setVaccineBrand] = useState("");

  /* ======================================================
     ESTADO: DESPARASITACIÓN (ahora con campos similares a vacunas)
     ====================================================== */
  const [showDewormDateModal, setShowDewormDateModal] = useState(false);
  const [showDewormMfgModal, setShowDewormMfgModal] = useState(false);
  const [showDewormExpModal, setShowDewormExpModal] = useState(false);

  const [dewormDate, setDewormDate] = useState(new Date());
  const [dewormMfgDate, setDewormMfgDate] = useState(new Date());
  const [dewormExpDate, setDewormExpDate] = useState(new Date());

  const [dewormSerial, setDewormSerial] = useState("");
  const [dewormBrand, setDewormBrand] = useState("");

  const [dewormings, setDewormings] = useState([]); // { tipo, fecha, numeroSerie, marca, fechaFabricacion, fechaVencimiento }
  const [showDewormModal, setShowDewormModal] = useState(false);
  const [editingDewormIndex, setEditingDewormIndex] = useState(null);
  const [selectedDewormType, setSelectedDewormType] = useState(DEWORM_TYPES[0]);
  const [isDewormDropdownOpen, setIsDewormDropdownOpen] = useState(false);

  /* ======================================================
     OTROS CAMPOS
     ====================================================== */
  const [conditions, setConditions] = useState("");
  const [housing, setHousing] = useState(null);
  const [walkFrequency, setWalkFrequency] = useState(null);

  /* ======================================================
     HELPERS FECHAS
     ====================================================== */
  const isFutureDate = (date) => {
    if (!date) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const d = new Date(date);
    d.setHours(0, 0, 0, 0);

    return d.getTime() > today.getTime();
  };

  const formatDate = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  /* ======================================================
     VACUNAS: AGREGAR / EDITAR / ELIMINAR (AHORA CON CAMPOS EXTRA)
     ====================================================== */
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

    // preparar ISO strings
    const isoDate = vaccineDate.toISOString();
    const isoMfg = vaccineMfgDate ? vaccineMfgDate.toISOString() : null;
    const isoExp = vaccineExpDate ? vaccineExpDate.toISOString() : null;

    const newVaccineObj = {
      nombre: selectedVaccine,
      fecha: isoDate,
      numeroSerie: vaccineSerial.trim(),
      marca: vaccineBrand.trim(),
      fechaFabricacion: isoMfg,
      fechaVencimiento: isoExp,
    };

    if (editingVaccineIndex !== null) {
      const updated = [...vaccines];
      updated[editingVaccineIndex] = newVaccineObj;
      setVaccines(updated);

      Dialog.show({
        type: ALERT_TYPE.SUCCESS,
        title: "Vacuna actualizada",
        textBody: "Los cambios se guardaron correctamente.",
        button: "Perfecto",
      });
    } else {
      setVaccines((prev) => [...prev, newVaccineObj]);

      Dialog.show({
        type: ALERT_TYPE.SUCCESS,
        title: "Vacuna registrada",
        textBody: "La vacuna se agregó correctamente.",
        button: "Listo",
      });
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
    setVaccineDate(new Date());
    setShowVaccineDateModal(false);
    setShowVaccineMfgModal(false);
    setShowVaccineExpModal(false);
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

  /* ======================================================
     DESPARASITACIÓN: AGREGAR / EDITAR / ELIMINAR (AHORA CON CAMPOS EXTRA)
     ====================================================== */
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
    const isoMfg = dewormMfgDate ? dewormMfgDate.toISOString() : null;
    const isoExp = dewormExpDate ? dewormExpDate.toISOString() : null;

    const newDewormObj = {
      tipo: selectedDewormType,
      fecha: isoDate,
      numeroSerie: dewormSerial.trim(),
      marca: dewormBrand.trim(),
      fechaFabricacion: isoMfg,
      fechaVencimiento: isoExp,
    };

    if (editingDewormIndex !== null) {
      const updated = [...dewormings];
      updated[editingDewormIndex] = newDewormObj;
      setDewormings(updated);

      Dialog.show({
        type: ALERT_TYPE.SUCCESS,
        title: "Desparasitación actualizada",
        textBody: "Los cambios se guardaron correctamente.",
        button: "Perfecto",
      });
    } else {
      setDewormings((prev) => [...prev, newDewormObj]);

      Dialog.show({
        type: ALERT_TYPE.SUCCESS,
        title: "Desparasitación registrada",
        textBody: "La desparasitación se agregó correctamente.",
        button: "Listo",
      });
    }

    resetDewormForm();
  };

  const resetDewormForm = () => {
    setShowDewormModal(false);
    setIsDewormDropdownOpen(false);
    setEditingDewormIndex(null);
    setDewormSerial("");
    setDewormBrand("");
    setDewormMfgDate(new Date());
    setDewormExpDate(new Date());
    setDewormDate(new Date());
    setShowDewormDateModal(false);
    setShowDewormMfgModal(false);
    setShowDewormExpModal(false);
  };

  const handleDeleteDeworming = (index) => {
    const d = dewormings[index];
    if (!d) return;

    Dialog.show({
      type: ALERT_TYPE.DANGER,
      title: "Eliminar desparasitación",
      textBody: `¿Seguro que deseas eliminar la desparasitación "${d.tipo}" con fecha ${formatDate(d.fecha)}?`,
      button: "Eliminar",
      onPressButton: () => {
        setDewormings((prev) => prev.filter((_, i) => i !== index));
        Dialog.hide();
        Dialog.show({
          type: ALERT_TYPE.SUCCESS,
          title: "Desparasitación eliminada",
          textBody: "La desparasitación se eliminó correctamente.",
          button: "Ok",
        });
      },
    });
  };

  /* ======================================================
     CONTINUAR A PASO 3
     ====================================================== */
  const handleContinue = () => {
    if (!housing) {
      alert("Selecciona el contexto de vivienda.");
      return;
    }

    if (!walkFrequency) {
      alert("Selecciona la frecuencia de paseo.");
      return;
    }

    const draftPetStep2 = {
      ...draftPet,
      vacunas: vaccines,
      desparacitaciones: dewormings,
      condicionesMedicas: conditions.trim(),
      contextoVivienda: housing,
      frecuenciaPaseo: walkFrequency,
    };

    navigation.navigate("RegistroMascota3", { draftPet: draftPetStep2 });
  };

  /* ======================================================
     CHIP HELPER
     ====================================================== */
  const renderChip = (label, value, current, setter, color = "#10B981") => {
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
        <Text style={styles.headerTitle}>Paso 2 de 3</Text>
        <View style={styles.headerIconButton} />
      </View>

      {/* CONTENIDO PRINCIPAL */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          {/* TÍTULO */}
          <View style={styles.headerTextBlock}>
            <Text style={styles.title}>Historial médico</Text>
            <Text style={styles.subtitle}>
              Completemos información importante sobre su salud.
            </Text>
          </View>

          {/* VACUNAS APLICADAS */}
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.label}>Vacunas aplicadas</Text>

              <TouchableOpacity
                style={styles.addPillButton}
                onPress={() => {
                  setEditingVaccineIndex(null); // modo agregar
                  setSelectedVaccine(COMMON_VACCINES[0]);
                  setVaccineDate(new Date());
                  setVaccineMfgDate(new Date());
                  setVaccineExpDate(new Date());
                  setVaccineSerial("");
                  setVaccineBrand("");
                  setShowVaccineModal(true);
                  setIsVaccineDropdownOpen(false);
                  setShowVaccineDateModal(false);
                  setShowVaccineMfgModal(false);
                  setShowVaccineExpModal(false);
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
                  <Text style={styles.emptyText}>
                    Aún no has agregado vacunas. Toca &quot;Add +&quot; para registrar una.
                  </Text>
                </View>
              ) : (
                vaccines.map((v, index) => (
                  <View key={index} style={styles.tableRow}>
                    <View style={{ flex: 2 }}>
                      <Text style={styles.tableCell} numberOfLines={1}>
                        {v.nombre}
                      </Text>
                      {v.marca ? <Text style={{ fontSize: 11, color: "#6B7280" }}>{v.marca}{v.numeroSerie ? ` • ${v.numeroSerie}` : ""}</Text> : null}
                    </View>

                    <Text style={[styles.tableCell, { flex: 1.2 }]}>{formatDate(v.fecha)}</Text>

                    <View style={[styles.tableCell, styles.tableCellSmall]}>
                      <View style={styles.optionsCellRow}>
                        {/* EDITAR */}
                        <TouchableOpacity
                          style={styles.editButton}
                          onPress={() => {
                            setSelectedVaccine(v.nombre);
                            setVaccineDate(v.fecha ? new Date(v.fecha) : new Date());
                            // cargar datos extra para editar
                            setVaccineSerial(v.numeroSerie || "");
                            setVaccineBrand(v.marca || "");
                            setVaccineMfgDate(v.fechaFabricacion ? new Date(v.fechaFabricacion) : new Date());
                            setVaccineExpDate(v.fechaVencimiento ? new Date(v.fechaVencimiento) : new Date());
                            setEditingVaccineIndex(index);
                            setShowVaccineModal(true);
                            setIsVaccineDropdownOpen(false);
                            setShowVaccineDateModal(false);
                            setShowVaccineMfgModal(false);
                            setShowVaccineExpModal(false);
                          }}
                        >
                          <Ionicons name="create-outline" size={16} color="#111827" />
                        </TouchableOpacity>

                        {/* ELIMINAR */}
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

          {/* DESPARASITACIÓN */}
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.label}>Desparasitación</Text>

              <TouchableOpacity
                style={styles.addPillButton}
                onPress={() => {
                  setEditingDewormIndex(null); // modo agregar
                  setSelectedDewormType(DEWORM_TYPES[0]);
                  setDewormDate(new Date());
                  setDewormMfgDate(new Date());
                  setDewormExpDate(new Date());
                  setDewormSerial("");
                  setDewormBrand("");
                  setShowDewormModal(true);
                  setIsDewormDropdownOpen(false);
                  setShowDewormDateModal(false);
                  setShowDewormMfgModal(false);
                  setShowDewormExpModal(false);
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
                  <Text style={styles.emptyText}>
                    Aún no has agregado desparasitaciones. Toca &quot;Add +&quot; para registrar una.
                  </Text>
                </View>
              ) : (
                dewormings.map((d, index) => (
                  <View key={index} style={styles.tableRow}>
                    <View style={{ flex: 2 }}>
                      <Text style={styles.tableCell} numberOfLines={1}>
                        {d.tipo}
                      </Text>
                      {d.marca ? <Text style={{ fontSize: 11, color: "#6B7280" }}>{d.marca}{d.numeroSerie ? ` • ${d.numeroSerie}` : ""}</Text> : null}
                    </View>

                    <Text style={[styles.tableCell, { flex: 1.2 }]}>{formatDate(d.fecha)}</Text>

                    <View style={[styles.tableCell, styles.tableCellSmall]}>
                      <View style={styles.optionsCellRow}>
                        <TouchableOpacity
                          style={styles.editButton}
                          onPress={() => {
                            setSelectedDewormType(d.tipo);
                            setDewormDate(d.fecha ? new Date(d.fecha) : new Date());
                            setDewormSerial(d.numeroSerie || "");
                            setDewormBrand(d.marca || "");
                            setDewormMfgDate(d.fechaFabricacion ? new Date(d.fechaFabricacion) : new Date());
                            setDewormExpDate(d.fechaVencimiento ? new Date(d.fechaVencimiento) : new Date());
                            setEditingDewormIndex(index);
                            setShowDewormModal(true);
                            setIsDewormDropdownOpen(false);
                            setShowDewormDateModal(false);
                            setShowDewormMfgModal(false);
                            setShowDewormExpModal(false);
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

          {/* CONDICIONES MÉDICAS */}
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

          {/* CONTEXTO DE VIVIENDA */}
          <View style={styles.section}>
            <Text style={styles.label}>Contexto de vivienda</Text>
            <View style={styles.rowWrap}>
              {renderChip("Vive adentro", "adentro", housing, setHousing)}
              {renderChip("Vive afuera", "afuera", housing, setHousing)}
              {renderChip("Adentro y afuera", "mixto", housing, setHousing)}
            </View>
          </View>

          {/* FRECUENCIA DE PASEO */}
          <View style={styles.section}>
            <Text style={styles.label}>Frecuencia de paseo</Text>
            <View style={styles.rowWrap}>
              {renderChip("Casi no se pasea", "nulo", walkFrequency, setWalkFrequency)}
              {renderChip("Paseos regulares", "regular", walkFrequency, setWalkFrequency)}
              {renderChip("Todos los días", "diario", walkFrequency, setWalkFrequency)}
            </View>
          </View>

          {/* BOTÓN FINAL */}
          <TouchableOpacity style={styles.primaryButton} onPress={handleContinue}>
            <Text style={styles.primaryButtonText}>Continuar</Text>
            <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>

      {/* MODAL VACUNAS (REGISTRAR / EDITAR) + CALENDARIO */}
      <Modal
        visible={showVaccineModal}
        transparent
        animationType="fade"
        onRequestClose={() => {
          resetVaccineForm();
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{editingVaccineIndex !== null ? "Editar vacuna" : "Registrar vacuna"}</Text>
            <Text style={styles.modalSubtitle}>Ingresa los datos de la vacuna.</Text>

            {/* Tipo de vacuna */}
            <Text style={[styles.label, { marginTop: 16 }]}>Tipo de vacuna</Text>
            <View style={styles.dropdownWrapper}>
              <TouchableOpacity style={styles.dropdown} onPress={() => setIsVaccineDropdownOpen((prev) => !prev)} activeOpacity={0.8}>
                <Text style={selectedVaccine ? styles.dropdownText : styles.dropdownPlaceholder} numberOfLines={1}>
                  {selectedVaccine || "Selecciona una vacuna"}
                </Text>
                <Ionicons name={isVaccineDropdownOpen ? "chevron-up" : "chevron-down"} size={18} color="#6B7280" />
              </TouchableOpacity>

              {isVaccineDropdownOpen && (
                <View style={styles.dropdownList}>
                  <ScrollView nestedScrollEnabled showsVerticalScrollIndicator={false}>
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

            {/* Número de Serie */}
            <Text style={[styles.label, { marginTop: 12 }]}>Número de serie</Text>
            <TextInput style={styles.input} placeholder="Ej: SN-12345" value={vaccineSerial} onChangeText={setVaccineSerial} />

            {/* Marca */}
            <Text style={[styles.label, { marginTop: 12 }]}>Marca</Text>
            <TextInput style={styles.input} placeholder="Ej: Pfizer / Nobivac" value={vaccineBrand} onChangeText={setVaccineBrand} />

            {/* Fecha Aplicación */}
            <Text style={[styles.label, { marginTop: 12 }]}>Fecha Aplicación</Text>
            <View style={styles.dateRow}>
              <Text style={styles.dateText}>{formatDate(vaccineDate.toISOString())}</Text>
              <TouchableOpacity style={styles.dateIconButton} onPress={() => { setShowVaccineDateModal(true); setIsVaccineDropdownOpen(false); }}>
                <Ionicons name="calendar" size={18} color="#2563EB" />
              </TouchableOpacity>
            </View>

            {/* Fecha Fabricación */}
            <Text style={[styles.label, { marginTop: 12 }]}>Fecha Fabricación</Text>
            <View style={styles.dateRow}>
              <Text style={styles.dateText}>{formatDate(vaccineMfgDate.toISOString())}</Text>
              <TouchableOpacity style={styles.dateIconButton} onPress={() => { setShowVaccineMfgModal(true); setIsVaccineDropdownOpen(false); }}>
                <Ionicons name="calendar" size={18} color="#2563EB" />
              </TouchableOpacity>
            </View>

            {/* Fecha Vencimiento */}
            <Text style={[styles.label, { marginTop: 12 }]}>Fecha Vencimiento</Text>
            <View style={styles.dateRow}>
              <Text style={styles.dateText}>{formatDate(vaccineExpDate.toISOString())}</Text>
              <TouchableOpacity style={styles.dateIconButton} onPress={() => { setShowVaccineExpModal(true); setIsVaccineDropdownOpen(false); }}>
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

          {/* Fecha Aplicación - popup */}
          {showVaccineDateModal && (
            <View style={styles.dateModalOverlay}>
              <View style={styles.dateModalCard}>
                <Text style={styles.modalTitle}>Selecciona la fecha</Text>
                <Text style={styles.modalSubtitle}>Elige la fecha en la que se aplicó la vacuna.</Text>
                <View style={{ marginTop: 12, alignSelf: "stretch" }}>
                  <DateTimePicker
                    value={vaccineDate}
                    mode="date"
                    display={Platform.OS === "ios" ? "inline" : "calendar"}
                    maximumDate={new Date()}
                    locale="es-ES"
                    onChange={(event, date) => {
                      // En Android y iOS nos aseguramos de cerrar el modal al seleccionar o descartar.
                      if (event?.type === "dismissed") {
                        setShowVaccineDateModal(false);
                        return;
                      }
                      if (date) {
                        if (isFutureDate(date)) {
                          Dialog.show({ type: ALERT_TYPE.WARNING, title: "Fecha no válida", textBody: "La fecha de la vacuna no puede ser futura.", button: "Entendido" });
                          return;
                        }
                        setVaccineDate(date);
                      }
                      // Siempre cerramos el popup tras la interacción para evitar "doble aceptar"
                      setShowVaccineDateModal(false);
                    }}
                    textColor={Platform.OS === "ios" ? "#111827" : undefined}
                    themeVariant={Platform.OS === "ios" ? "light" : undefined}
                    style={styles.datePicker}
                  />
                </View>
                <View style={styles.dateModalButtonsRow}>
                  <TouchableOpacity style={styles.secondaryBtn} onPress={() => setShowVaccineDateModal(false)}>
                    <Text style={styles.secondaryBtnText}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.primaryBtnSmall} onPress={() => setShowVaccineDateModal(false)}>
                    <Text style={styles.primaryBtnSmallText}>Listo</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}

          {/* Fecha Fabricación - popup */}
          {showVaccineMfgModal && (
            <View style={styles.dateModalOverlay}>
              <View style={styles.dateModalCard}>
                <Text style={styles.modalTitle}>Selecciona la fecha de fabricación</Text>
                <Text style={styles.modalSubtitle}>Elige la fecha de fabricación de la vacuna.</Text>
                <View style={{ marginTop: 12, alignSelf: "stretch" }}>
                  <DateTimePicker
                    value={vaccineMfgDate}
                    mode="date"
                    display={Platform.OS === "ios" ? "inline" : "calendar"}
                    maximumDate={new Date()}
                    locale="es-ES"
                    onChange={(event, date) => {
                      if (event?.type === "dismissed") {
                        setShowVaccineMfgModal(false);
                        return;
                      }
                      if (date) {
                        setVaccineMfgDate(date);
                      }
                      setShowVaccineMfgModal(false);
                    }}
                    textColor={Platform.OS === "ios" ? "#111827" : undefined}
                    themeVariant={Platform.OS === "ios" ? "light" : undefined}
                    style={styles.datePicker}
                  />
                </View>
                <View style={styles.dateModalButtonsRow}>
                  <TouchableOpacity style={styles.secondaryBtn} onPress={() => setShowVaccineMfgModal(false)}>
                    <Text style={styles.secondaryBtnText}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.primaryBtnSmall} onPress={() => setShowVaccineMfgModal(false)}>
                    <Text style={styles.primaryBtnSmallText}>Listo</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}

          {/* Fecha Vencimiento - popup */}
          {showVaccineExpModal && (
            <View style={styles.dateModalOverlay}>
              <View style={styles.dateModalCard}>
                <Text style={styles.modalTitle}>Selecciona la fecha de vencimiento</Text>
                <Text style={styles.modalSubtitle}>Elige la fecha de vencimiento de la vacuna.</Text>
                <View style={{ marginTop: 12, alignSelf: "stretch" }}>
                  <DateTimePicker
                    value={vaccineExpDate}
                    mode="date"
                    display={Platform.OS === "ios" ? "inline" : "calendar"}
                    minimumDate={new Date(1900, 0, 1)}
                    locale="es-ES"
                    onChange={(event, date) => {
                      if (event?.type === "dismissed") {
                        setShowVaccineExpModal(false);
                        return;
                      }
                      if (date) {
                        setVaccineExpDate(date);
                      }
                      setShowVaccineExpModal(false);
                    }}
                    textColor={Platform.OS === "ios" ? "#111827" : undefined}
                    themeVariant={Platform.OS === "ios" ? "light" : undefined}
                    style={styles.datePicker}
                  />
                </View>
                <View style={styles.dateModalButtonsRow}>
                  <TouchableOpacity style={styles.secondaryBtn} onPress={() => setShowVaccineExpModal(false)}>
                    <Text style={styles.secondaryBtnText}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.primaryBtnSmall} onPress={() => setShowVaccineExpModal(false)}>
                    <Text style={styles.primaryBtnSmallText}>Listo</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        </View>
      </Modal>

      {/* MODAL DESPARASITACIÓN (REGISTRAR / EDITAR) + CALENDARIO */}
      <Modal
        visible={showDewormModal}
        transparent
        animationType="fade"
        onRequestClose={() => {
          resetDewormForm();
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{editingDewormIndex !== null ? "Editar desparasitación" : "Registrar desparasitación"}</Text>
            <Text style={styles.modalSubtitle}>Ingresa los datos de la desparasitación.</Text>

            {/* Tipo de desparasitación */}
            <Text style={[styles.label, { marginTop: 16 }]}>Tipo de desparasitación</Text>

            <View style={styles.dropdownWrapper}>
              <TouchableOpacity style={styles.dropdown} activeOpacity={0.8} onPress={() => setIsDewormDropdownOpen((prev) => !prev)}>
                <Text style={selectedDewormType ? styles.dropdownText : styles.dropdownPlaceholder} numberOfLines={1}>
                  {selectedDewormType || "Selecciona un tipo"}
                </Text>
                <Ionicons name={isDewormDropdownOpen ? "chevron-up" : "chevron-down"} size={18} color="#6B7280" />
              </TouchableOpacity>

              {isDewormDropdownOpen && (
                <View style={styles.dropdownList}>
                  <ScrollView nestedScrollEnabled showsVerticalScrollIndicator={false}>
                    {DEWORM_TYPES.map((tipo) => {
                      const isSelected = tipo === selectedDewormType;
                      return (
                        <TouchableOpacity key={tipo} style={[styles.dropdownItem, isSelected && styles.dropdownItemSelected]} onPress={() => { setSelectedDewormType(tipo); setIsDewormDropdownOpen(false); }}>
                          <Text style={[styles.dropdownItemText, isSelected && styles.dropdownItemTextSelected]}>{tipo}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              )}
            </View>

            {/* Número de Serie */}
            <Text style={[styles.label, { marginTop: 12 }]}>Número de serie</Text>
            <TextInput style={styles.input} placeholder="Ej: SN-12345" value={dewormSerial} onChangeText={setDewormSerial} />

            {/* Marca */}
            <Text style={[styles.label, { marginTop: 12 }]}>Marca</Text>
            <TextInput style={styles.input} placeholder="Ej: Marca del antiparasitario" value={dewormBrand} onChangeText={setDewormBrand} />

            {/* Fecha Aplicación */}
            <Text style={[styles.label, { marginTop: 12 }]}>Fecha</Text>
            <View style={styles.dateRow}>
              <Text style={styles.dateText}>{formatDate(dewormDate.toISOString())}</Text>
              <TouchableOpacity style={styles.dateIconButton} onPress={() => { setShowDewormDateModal(true); setIsDewormDropdownOpen(false); }}>
                <Ionicons name="calendar" size={18} color="#2563EB" />
              </TouchableOpacity>
            </View>

            {/* Fecha Fabricación */}
            <Text style={[styles.label, { marginTop: 12 }]}>Fecha Fabricación</Text>
            <View style={styles.dateRow}>
              <Text style={styles.dateText}>{formatDate(dewormMfgDate.toISOString())}</Text>
              <TouchableOpacity style={styles.dateIconButton} onPress={() => { setShowDewormMfgModal(true); setIsDewormDropdownOpen(false); }}>
                <Ionicons name="calendar" size={18} color="#2563EB" />
              </TouchableOpacity>
            </View>

            {/* Fecha Vencimiento */}
            <Text style={[styles.label, { marginTop: 12 }]}>Fecha Vencimiento</Text>
            <View style={styles.dateRow}>
              <Text style={styles.dateText}>{formatDate(dewormExpDate.toISOString())}</Text>
              <TouchableOpacity style={styles.dateIconButton} onPress={() => { setShowDewormExpModal(true); setIsDewormDropdownOpen(false); }}>
                <Ionicons name="calendar" size={18} color="#2563EB" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalActionsRow}>
              <TouchableOpacity style={styles.secondaryBtn} onPress={resetDewormForm}>
                <Text style={styles.secondaryBtnText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.primaryBtnSmall} onPress={handleSaveDeworming}>
                <Text style={styles.primaryBtnSmallText}>{editingDewormIndex !== null ? "Guardar cambios" : "Guardar"}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Popup calendario desparasitación */}
          {showDewormDateModal && (
            <View style={styles.dateModalOverlay}>
              <View style={styles.dateModalCard}>
                <Text style={styles.modalTitle}>Selecciona la fecha</Text>
                <Text style={styles.modalSubtitle}>Elige la fecha en la que se realizó la desparasitación.</Text>

                <View style={{ marginTop: 12, alignSelf: "stretch" }}>
                  <DateTimePicker
                    value={dewormDate}
                    mode="date"
                    display={Platform.OS === "ios" ? "inline" : "calendar"}
                    maximumDate={new Date()}
                    locale="es-ES"
                    onChange={(event, date) => {
                      if (event?.type === "dismissed") {
                        setShowDewormDateModal(false);
                        return;
                      }
                      if (date) {
                        if (isFutureDate(date)) {
                          Dialog.show({
                            type: ALERT_TYPE.WARNING,
                            title: "Fecha no válida",
                            textBody: "La fecha de desparasitación no puede ser futura.",
                            button: "Entendido",
                          });
                          return;
                        }
                        setDewormDate(date);
                      }
                      setShowDewormDateModal(false);
                    }}
                    textColor={Platform.OS === "ios" ? "#111827" : undefined}
                    themeVariant={Platform.OS === "ios" ? "light" : undefined}
                    style={styles.datePicker}
                  />
                </View>

                <View style={styles.dateModalButtonsRow}>
                  <TouchableOpacity style={styles.secondaryBtn} onPress={() => setShowDewormDateModal(false)}>
                    <Text style={styles.secondaryBtnText}>Cancelar</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.primaryBtnSmall} onPress={() => setShowDewormDateModal(false)}>
                    <Text style={styles.primaryBtnSmallText}>Listo</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}

          {/* Fecha Fabricación - popup */}
          {showDewormMfgModal && (
            <View style={styles.dateModalOverlay}>
              <View style={styles.dateModalCard}>
                <Text style={styles.modalTitle}>Selecciona la fecha de fabricación</Text>
                <Text style={styles.modalSubtitle}>Elige la fecha de fabricación.</Text>
                <View style={{ marginTop: 12, alignSelf: "stretch" }}>
                  <DateTimePicker
                    value={dewormMfgDate}
                    mode="date"
                    display={Platform.OS === "ios" ? "inline" : "calendar"}
                    maximumDate={new Date()}
                    locale="es-ES"
                    onChange={(event, date) => {
                      if (event?.type === "dismissed") {
                        setShowDewormMfgModal(false);
                        return;
                      }
                      if (date) {
                        setDewormMfgDate(date);
                      }
                      setShowDewormMfgModal(false);
                    }}
                    textColor={Platform.OS === "ios" ? "#111827" : undefined}
                    themeVariant={Platform.OS === "ios" ? "light" : undefined}
                    style={styles.datePicker}
                  />
                </View>
                <View style={styles.dateModalButtonsRow}>
                  <TouchableOpacity style={styles.secondaryBtn} onPress={() => setShowDewormMfgModal(false)}>
                    <Text style={styles.secondaryBtnText}>Cancelar</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.primaryBtnSmall} onPress={() => setShowDewormMfgModal(false)}>
                    <Text style={styles.primaryBtnSmallText}>Listo</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}

          {/* Fecha Vencimiento - popup */}
          {showDewormExpModal && (
            <View style={styles.dateModalOverlay}>
              <View style={styles.dateModalCard}>
                <Text style={styles.modalTitle}>Selecciona la fecha de vencimiento</Text>
                <Text style={styles.modalSubtitle}>Elige la fecha de vencimiento.</Text>
                <View style={{ marginTop: 12, alignSelf: "stretch" }}>
                  <DateTimePicker
                    value={dewormExpDate}
                    mode="date"
                    display={Platform.OS === "ios" ? "inline" : "calendar"}
                    minimumDate={new Date(1900, 0, 1)}
                    locale="es-ES"
                    onChange={(event, date) => {
                      if (event?.type === "dismissed") {
                        setShowDewormExpModal(false);
                        return;
                      }
                      if (date) {
                        setDewormExpDate(date);
                      }
                      setShowDewormExpModal(false);
                    }}
                    textColor={Platform.OS === "ios" ? "#111827" : undefined}
                    themeVariant={Platform.OS === "ios" ? "light" : undefined}
                    style={styles.datePicker}
                  />
                </View>
                <View style={styles.dateModalButtonsRow}>
                  <TouchableOpacity style={styles.secondaryBtn} onPress={() => setShowDewormExpModal(false)}>
                    <Text style={styles.secondaryBtnText}>Cancelar</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.primaryBtnSmall} onPress={() => setShowDewormExpModal(false)}>
                    <Text style={styles.primaryBtnSmallText}>Listo</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
};

export default RegistroMascota2;

/* ----------------------- STYLES ----------------------- */
const styles = StyleSheet.create({
  /* ================================
     LAYOUT GENERAL / HEADER
     ================================ */
  screen: {
    flex: 1,
    backgroundColor: "#DBF4E8",
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
     TIPOGRAFÍA GENERAL
     ================================ */
  headerTextBlock: { alignItems: "center", marginBottom: 18 },
  title: { fontSize: 18, fontWeight: "700", color: "#111827" },
  subtitle: { marginTop: 4, fontSize: 12, color: "#6B7280" },
  section: { marginBottom: 16 },
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
     CHIPS (CONTEXTOS / PASEO)
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
    flexShrink: 1,
  },
  chipText: { fontSize: 12, color: "#374151" },
  rowWrap: { flexDirection: "row", flexWrap: "wrap" },

  /* ================================
     BOTÓN CONTINUAR (INFERIOR)
     ================================ */
  primaryButton: {
    marginTop: 20,
    alignSelf: "flex-end",
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

  /* ================================
     BOTONES GENERALES PEQUEÑOS
     ================================ */
  primaryBtnSmall: {
    backgroundColor: "#2563EB",
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 999,
  },
  primaryBtnSmallText: { color: "#FFF", fontWeight: "700" },
  secondaryBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#E5E7EB",
  },
  secondaryBtnText: { color: "#374151", fontWeight: "500" },

  /* ================================
     VACUNAS - HEADER SECCIÓN
     ================================ */
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

  /* ================================
     TABLA VACUNAS
     ================================ */
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

  /* ================================
     MODAL / DROPDOWNS / FECHAS
     ================================ */
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
  dateModalButtonsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
  },

  datePicker: {
    alignSelf: "stretch",
    height: Platform.OS === "ios" ? 320 : 260,
  },
});
