import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Button
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { ALERT_TYPE, Dialog } from "react-native-alert-notification";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";

// 👇👇👇 RUTAS CORREGIDAS AQUI 👇👇👇
import { db } from "../../../../../firebase/config"; // 5 niveles para ir a la raíz
import { COL_MASCOTAS } from "../../../../shared/utils/collections"; // 4 niveles para ir a src/shared
import { getUserFromStorage } from "../../../../shared/utils/storage"; // 4 niveles para ir a src/shared
import { uploadImageToCloudinary } from "../../../../shared/services/cloudinary"; // 4 niveles para ir a src/shared

const COMMON_VACCINES = ["Parvovirus", "Moquillo", "Antirrábica", "Adenovirus", "Parainfluenza", "Leptospira", "Bordetella"];
const DEWORM_TYPES = ["Interna", "Externa"];
const MAX_FILE_SIZE = 10485760; // 10 MB

const VetConsultationScreen = ({ navigation, route }) => {
  const { petId, petName } = route.params;
  const [loading, setLoading] = useState(false);

  // --- DATOS VETERINARIO ---
  const [vetName, setVetName] = useState("");
  const [clinicName, setClinicName] = useState("");
  const [licenseNumber, setLicenseNumber] = useState(""); 

  // --- DATOS CLINICOS ---
  const [reason, setReason] = useState("");
  const [weight, setWeight] = useState("");
  const [symptoms, setSymptoms] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [notes, setNotes] = useState("");
  const [currentDate] = useState(new Date());

  // --- ADJUNTOS ---
  const [attachments, setAttachments] = useState([]);

  /* ======================================================
     ESTADO: VACUNAS
     ====================================================== */
  const [showVaccineDateModal, setShowVaccineDateModal] = useState(false);
  const [showVaccineMfgModal, setShowVaccineMfgModal] = useState(false);
  const [showVaccineExpModal, setShowVaccineExpModal] = useState(false);

  const [selectedVaccine, setSelectedVaccine] = useState(COMMON_VACCINES[0]);
  const [vaccineDate, setVaccineDate] = useState(new Date());
  const [vaccineMfgDate, setVaccineMfgDate] = useState(new Date());
  const [vaccineExpDate, setVaccineExpDate] = useState(new Date());

  const [isVaccineDropdownOpen, setIsVaccineDropdownOpen] = useState(false);
  const [vaccines, setVaccines] = useState([]); 
  const [showVaccineModal, setShowVaccineModal] = useState(false);
  const [editingVaccineIndex, setEditingVaccineIndex] = useState(null);

  const [vaccineSerial, setVaccineSerial] = useState("");
  const [vaccineBrand, setVaccineBrand] = useState("");

  /* ======================================================
     ESTADO: DESPARASITACIÓN
     ====================================================== */
  const [showDewormDateModal, setShowDewormDateModal] = useState(false);
  const [showDewormMfgModal, setShowDewormMfgModal] = useState(false);
  const [showDewormExpModal, setShowDewormExpModal] = useState(false);

  const [dewormDate, setDewormDate] = useState(new Date());
  const [dewormMfgDate, setDewormMfgDate] = useState(new Date());
  const [dewormExpDate, setDewormExpDate] = useState(new Date());

  const [dewormSerial, setDewormSerial] = useState("");
  const [dewormBrand, setDewormBrand] = useState("");

  const [dewormings, setDewormings] = useState([]); 
  const [showDewormModal, setShowDewormModal] = useState(false);
  const [editingDewormIndex, setEditingDewormIndex] = useState(null);
  const [selectedDewormType, setSelectedDewormType] = useState(DEWORM_TYPES[0]);
  const [isDewormDropdownOpen, setIsDewormDropdownOpen] = useState(false);

  // --- CARGAR USUARIO ---
  useEffect(() => {
    const loadVet = async () => {
      const user = await getUserFromStorage();
      if (user) {
        setVetName(user.fullName || user.nombre || "");
        setClinicName(user.clinic || "");
        setLicenseNumber(user.juntaNumber || user.licenseNumber || "N/A");
      }
    };
    loadVet();
  }, []);

  // --- HELPERS FECHAS ---
  const isFutureDate = (date) => {
    if (!date) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d.getTime() > today.getTime();
  };

  const formatDate = (iso) => {
    if (!iso) return "-";
    const d = typeof iso === 'string' ? new Date(iso) : iso; 
    if (Number.isNaN(d.getTime())) return "-";
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  /* ======================================================
     LOGICA VACUNAS
     ====================================================== */
  const handleSaveVaccine = () => {
    if (!selectedVaccine) return;

    // Validaciones de fechas
    if (isFutureDate(vaccineDate)) {
      Dialog.show({ type: ALERT_TYPE.WARNING, title: "Fecha Incorrecta", textBody: "La fecha de aplicación no puede ser futura.", button: "Entendido" });
      return;
    }
    if (isFutureDate(vaccineMfgDate)) {
      Dialog.show({ type: ALERT_TYPE.WARNING, title: "Fecha Incorrecta", textBody: "La fecha de fabricación no puede ser futura.", button: "Entendido" });
      return;
    }
    if (!isFutureDate(vaccineExpDate)) {
        Dialog.show({ type: ALERT_TYPE.WARNING, title: "Producto Vencido", textBody: "La fecha de vencimiento debe ser futura.", button: "Entendido" });
        return;
    }
    if (vaccineMfgDate >= vaccineExpDate) {
        Dialog.show({ type: ALERT_TYPE.WARNING, title: "Incoherencia", textBody: "La fecha de fabricación debe ser anterior al vencimiento.", button: "Corregir" });
        return;
    }

    const newVaccineObj = {
      nombre: selectedVaccine,
      fecha: vaccineDate.toISOString(),
      numeroSerie: vaccineSerial.trim(),
      marca: vaccineBrand.trim(),
      fechaFabricacion: vaccineMfgDate.toISOString(),
      fechaVencimiento: vaccineExpDate.toISOString(),
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
    
    // Fechas por defecto
    const today = new Date();
    const future = new Date(); 
    future.setFullYear(today.getFullYear() + 1);

    setVaccineDate(today);
    setVaccineMfgDate(today);
    setVaccineExpDate(future);

    setShowVaccineDateModal(false);
    setShowVaccineMfgModal(false);
    setShowVaccineExpModal(false);
  };

  /* ======================================================
     LOGICA DESPARASITACIÓN
     ====================================================== */
  const handleSaveDeworming = () => {
    if (!selectedDewormType) return;

    if (isFutureDate(dewormDate)) {
        Dialog.show({ type: ALERT_TYPE.WARNING, title: "Fecha Incorrecta", textBody: "La fecha de aplicación no puede ser futura.", button: "Entendido" });
        return;
    }
    if (isFutureDate(dewormMfgDate)) {
        Dialog.show({ type: ALERT_TYPE.WARNING, title: "Fecha Incorrecta", textBody: "La fecha de fabricación no puede ser futura.", button: "Entendido" });
        return;
    }
    if (!isFutureDate(dewormExpDate)) {
        Dialog.show({ type: ALERT_TYPE.WARNING, title: "Producto Vencido", textBody: "La fecha de vencimiento debe ser futura.", button: "Entendido" });
        return;
    }
    if (dewormMfgDate >= dewormExpDate) {
        Dialog.show({ type: ALERT_TYPE.WARNING, title: "Incoherencia", textBody: "La fecha de fabricación debe ser anterior al vencimiento.", button: "Corregir" });
        return;
    }

    const newDewormObj = {
      tipo: selectedDewormType,
      fecha: dewormDate.toISOString(),
      numeroSerie: dewormSerial.trim(),
      marca: dewormBrand.trim(),
      fechaFabricacion: dewormMfgDate.toISOString(),
      fechaVencimiento: dewormExpDate.toISOString(),
    };

    if (editingDewormIndex !== null) {
      const updated = [...dewormings];
      updated[editingDewormIndex] = newDewormObj;
      setDewormings(updated);
    } else {
      setDewormings((prev) => [...prev, newDewormObj]);
    }
    resetDewormForm();
  };

  const resetDewormForm = () => {
    setShowDewormModal(false);
    setIsDewormDropdownOpen(false);
    setEditingDewormIndex(null);
    setDewormSerial("");
    setDewormBrand("");
    
    const today = new Date();
    const future = new Date(); 
    future.setFullYear(today.getFullYear() + 1);

    setDewormDate(today);
    setDewormMfgDate(today);
    setDewormExpDate(future);

    setShowDewormDateModal(false);
    setShowDewormMfgModal(false);
    setShowDewormExpModal(false);
  };

  // --- ADJUNTOS CON VALIDACIÓN 10MB ---
  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: "application/pdf", copyToCacheDirectory: true });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        
        if (file.size && file.size > MAX_FILE_SIZE) {
            Dialog.show({ type: ALERT_TYPE.DANGER, title: "Archivo muy pesado", textBody: "El PDF supera los 10MB permitidos.", button: "Entendido" });
            return;
        }
        setAttachments([...attachments, { uri: file.uri, type: 'pdf', name: file.name }]);
      }
    } catch (err) { console.log(err); }
  };

  const pickImage = async (useCamera = false) => {
    try {
      if (useCamera) await ImagePicker.requestCameraPermissionsAsync();
      else await ImagePicker.requestMediaLibraryPermissionsAsync();

      const result = await (useCamera ? ImagePicker.launchCameraAsync : ImagePicker.launchImageLibraryAsync)({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 1,
        allowsEditing: true,
        aspect: [4, 3],
      });

      if (!result.canceled && result.assets.length > 0) {
        const asset = result.assets[0];
        
        if (asset.fileSize && asset.fileSize > MAX_FILE_SIZE) {
            Dialog.show({ type: ALERT_TYPE.DANGER, title: "Imagen muy pesada", textBody: "La foto supera los 10MB permitidos.", button: "Entendido" });
            return;
        }
        const uri = asset.uri;
        const name = uri.split('/').pop();
        setAttachments([...attachments, { uri, type: 'image', name }]);
      }
    } catch (err) { console.log(err); }
  };

  const removeAttachment = (index) => {
    const updated = [...attachments];
    updated.splice(index, 1);
    setAttachments(updated);
  };

  // --- GUARDAR FINAL ---
  const handleFinalSave = async () => {
    if (!reason.trim() || !diagnosis.trim() || !vetName.trim()) {
      Dialog.show({ type: ALERT_TYPE.WARNING, title: "Faltan datos", textBody: "Motivo, Diagnóstico y Nombre del médico son obligatorios.", button: "Ok" });
      return;
    }

    setLoading(true);
    try {
      const uploadedFiles = [];
      for (const file of attachments) {
        const url = await uploadImageToCloudinary(file.uri); 
        if (url) uploadedFiles.push({ url, type: file.type, name: file.name });
      }

      const consultationData = {
        fecha: serverTimestamp(),
        fechaTexto: formatDate(currentDate),
        veterinario: {
            id: licenseNumber, 
            nombre: vetName, 
            junta: licenseNumber, 
            clinica: clinicName 
        },
        datosClinicos: {
            motivo: reason,
            peso: weight,
            sintomas: symptoms,
            diagnostico: diagnosis,
            notas: notes
        },
        tratamientos: {
            vacunas: vaccines,
            desparacitantes: dewormings
        },
        archivos: uploadedFiles
      };

      await addDoc(collection(db, COL_MASCOTAS, petId, "consultas"), consultationData);

      Dialog.show({
        type: ALERT_TYPE.SUCCESS,
        title: "Consulta Registrada",
        textBody: "Historial actualizado correctamente.",
        button: "Finalizar",
        onPressButton: () => { Dialog.hide(); navigation.goBack(); }
      });

    } catch (error) {
      console.error(error);
      Dialog.show({ type: ALERT_TYPE.DANGER, title: "Error", textBody: "No se pudo guardar la consulta.", button: "Cerrar" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: "#F3E5F5" }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="arrow-back" size={24} color="#FFF" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Nueva Consulta</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        
        {/* VETERINARIO */}
        <View style={styles.card}>
            <View style={{flexDirection:'row', alignItems:'center', marginBottom:10}}>
                <Ionicons name="person-outline" size={20} color="#7B1FA2" style={{marginRight:8}} />
                <Text style={styles.sectionTitleNoMargin}>Datos del Profesional</Text>
            </View>
            <View style={styles.rowInputs}>
                <View style={{flex:1, marginRight:8}}>
                    <Text style={styles.label}>Nombre Médico <Text style={{color:'red'}}>*</Text></Text>
                    <TextInput style={styles.input} value={vetName} onChangeText={setVetName} placeholder="Dr. Nombre" />
                </View>
                <View style={{flex:1}}>
                    <Text style={styles.label}>Junta</Text>
                    <TextInput style={[styles.input, {backgroundColor:'#EEE', color:'#555'}]} value={licenseNumber} editable={false} />
                </View>
            </View>
            <Text style={styles.label}>Clínica / Lugar</Text>
            <TextInput style={styles.input} value={clinicName} onChangeText={setClinicName} placeholder="Nombre de la veterinaria" />
            <Text style={[styles.label, {marginTop:8}]}>Fecha: {formatDate(currentDate)}</Text>
        </View>

        {/* CLINICOS */}
        <View style={styles.card}>
            <Text style={styles.sectionTitle}>Datos Clínicos</Text>
            <Text style={styles.label}>Razón de la visita <Text style={{color:'red'}}>*</Text></Text>
            <TextInput style={styles.input} value={reason} onChangeText={setReason} />
            <Text style={styles.label}>Peso (Lb/Kg)</Text>
            <TextInput style={styles.input} value={weight} onChangeText={setWeight} keyboardType="numeric" placeholder="0.0" />
            <Text style={styles.label}>Sintomatología</Text>
            <TextInput style={[styles.input, styles.textArea]} value={symptoms} onChangeText={setSymptoms} multiline />
            <Text style={styles.label}>Diagnóstico Médico <Text style={{color:'red'}}>*</Text></Text>
            <TextInput style={[styles.input, styles.textArea]} value={diagnosis} onChangeText={setDiagnosis} multiline />
            <Text style={styles.label}>Notas adicionales</Text>
            <TextInput style={[styles.input, styles.textArea]} value={notes} onChangeText={setNotes} multiline />
        </View>

        {/* VACUNAS APLICADAS */}
        <View style={styles.card}>
            <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitleNoMargin}>Vacunas aplicadas</Text>
                <TouchableOpacity style={styles.addPillButton} onPress={() => {
                    setEditingVaccineIndex(null); setSelectedVaccine(COMMON_VACCINES[0]);
                    resetVaccineForm();
                    setShowVaccineModal(true);
                }}>
                    <Text style={styles.addPillText}>Add +</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.tableContainer}>
                {vaccines.length === 0 ? (
                    <View style={styles.emptyRow}><Text style={styles.emptyText}>Sin vacunas hoy.</Text></View>
                ) : (
                    vaccines.map((v, index) => (
                        <View key={index} style={styles.tableRow}>
                            <View style={{ flex: 2 }}>
                                <Text style={styles.tableCell}>{v.nombre}</Text>
                                {v.marca ? <Text style={{ fontSize: 11, color: "#6B7280" }}>{v.marca}</Text> : null}
                            </View>
                            <Text style={[styles.tableCell, { flex: 1.2 }]}>{formatDate(v.fecha)}</Text>
                            <TouchableOpacity onPress={() => {
                                const updated = [...vaccines]; updated.splice(index, 1); setVaccines(updated);
                            }}><Ionicons name="trash-outline" size={18} color="#B91C1C" /></TouchableOpacity>
                        </View>
                    ))
                )}
            </View>
        </View>

        {/* DESPARASITACIÓN */}
        <View style={styles.card}>
            <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitleNoMargin}>Desparasitación</Text>
                <TouchableOpacity style={styles.addPillButton} onPress={() => {
                    setEditingDewormIndex(null); setSelectedDewormType(DEWORM_TYPES[0]);
                    resetDewormForm();
                    setShowDewormModal(true);
                }}>
                    <Text style={styles.addPillText}>Add +</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.tableContainer}>
                {dewormings.length === 0 ? (
                    <View style={styles.emptyRow}><Text style={styles.emptyText}>Sin desparasitaciones hoy.</Text></View>
                ) : (
                    dewormings.map((d, index) => (
                        <View key={index} style={styles.tableRow}>
                            <View style={{ flex: 2 }}>
                                <Text style={styles.tableCell}>{d.tipo}</Text>
                                {d.marca ? <Text style={{ fontSize: 11, color: "#6B7280" }}>{d.marca}</Text> : null}
                            </View>
                            <Text style={[styles.tableCell, { flex: 1.2 }]}>{formatDate(d.fecha)}</Text>
                            <TouchableOpacity onPress={() => {
                                const updated = [...dewormings]; updated.splice(index, 1); setDewormings(updated);
                            }}><Ionicons name="trash-outline" size={18} color="#B91C1C" /></TouchableOpacity>
                        </View>
                    ))
                )}
            </View>
        </View>

        {/* ANEXOS */}
        <View style={styles.card}>
            <Text style={styles.sectionTitle}>Anexos y Resultados</Text>
            <View style={{flexDirection:'row', justifyContent:'space-around', marginVertical:10}}>
                <TouchableOpacity style={styles.attachButton} onPress={() => pickImage(true)}>
                    <Ionicons name="camera" size={20} color="#FFF" /><Text style={styles.attachText}>Cámara</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.attachButton} onPress={() => pickImage(false)}>
                    <Ionicons name="images" size={20} color="#FFF" /><Text style={styles.attachText}>Galería</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.attachButton} onPress={pickDocument}>
                    <Ionicons name="document-text" size={20} color="#FFF" /><Text style={styles.attachText}>PDF</Text>
                </TouchableOpacity>
            </View>
            {attachments.map((file, i) => (
                <View key={i} style={styles.fileRow}>
                    <Ionicons name={file.type === 'pdf' ? "document" : "image"} size={20} color="#555" />
                    <Text style={styles.fileName} numberOfLines={1}>{file.name || "Archivo"}</Text>
                    <TouchableOpacity onPress={() => removeAttachment(i)}><Ionicons name="close-circle" size={20} color="red" /></TouchableOpacity>
                </View>
            ))}
        </View>

        <TouchableOpacity style={styles.saveButton} onPress={handleFinalSave} disabled={loading}>
            {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.saveButtonText}>Guardar Consulta</Text>}
        </TouchableOpacity>
        <View style={{height: 40}} />
      </ScrollView>

      {/* MODAL VACUNAS */}
      <Modal visible={showVaccineModal} transparent animationType="fade" onRequestClose={() => setShowVaccineModal(false)}>
        <View style={styles.modalOverlay}><View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Registrar Vacuna</Text>
            <ScrollView>
                <Text style={styles.label}>Vacuna</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginBottom:10}}>
                    {COMMON_VACCINES.map(v => (
                        <TouchableOpacity key={v} style={[styles.chip, selectedVaccine===v && styles.chipSelected]} onPress={()=>setSelectedVaccine(v)}>
                            <Text style={{color: selectedVaccine===v?'white':'black'}}>{v}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
                <Text style={styles.label}>Marca</Text><TextInput style={styles.input} value={vaccineBrand} onChangeText={setVaccineBrand}/>
                <Text style={styles.label}>Lote</Text><TextInput style={styles.input} value={vaccineSerial} onChangeText={setVaccineSerial}/>
                <View style={styles.dateButtonsRow}>
                    <TouchableOpacity style={styles.dateBtn} onPress={()=>setShowVaccineDateModal(true)}><Text style={{fontSize:11}}>Aplic: {formatDate(vaccineDate)}</Text></TouchableOpacity>
                    <TouchableOpacity style={styles.dateBtn} onPress={()=>setShowVaccineMfgModal(true)}><Text style={{fontSize:11}}>Fab: {formatDate(vaccineMfgDate)}</Text></TouchableOpacity>
                    <TouchableOpacity style={styles.dateBtn} onPress={()=>setShowVaccineExpModal(true)}><Text style={{fontSize:11}}>Venc: {formatDate(vaccineExpDate)}</Text></TouchableOpacity>
                </View>
                {showVaccineDateModal && <DateTimePicker value={vaccineDate} mode="date" maximumDate={new Date()} onChange={(e,d)=>{setShowVaccineDateModal(false); if(d) setVaccineDate(d)}} />}
                {showVaccineMfgModal && <DateTimePicker value={vaccineMfgDate} mode="date" maximumDate={new Date()} onChange={(e,d)=>{setShowVaccineMfgModal(false); if(d) setVaccineMfgDate(d)}} />}
                {showVaccineExpModal && <DateTimePicker value={vaccineExpDate} mode="date" minimumDate={new Date()} onChange={(e,d)=>{setShowVaccineExpModal(false); if(d) setVaccineExpDate(d)}} />}
            </ScrollView>
            <View style={{flexDirection:'row', justifyContent:'space-between', marginTop:15}}>
                <TouchableOpacity onPress={() => setShowVaccineModal(false)}><Text style={{color:'red'}}>Cancelar</Text></TouchableOpacity>
                <TouchableOpacity onPress={handleSaveVaccine}><Text style={{color:'#7B1FA2', fontWeight:'bold'}}>Guardar</Text></TouchableOpacity>
            </View>
        </View></View>
      </Modal>

      {/* MODAL DESPARASITANTE */}
      <Modal visible={showDewormModal} transparent animationType="fade" onRequestClose={() => setShowDewormModal(false)}>
        <View style={styles.modalOverlay}><View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Registrar Desparasitación</Text>
            <ScrollView>
                <View style={{flexDirection:'row', marginBottom:10}}>
                    {DEWORM_TYPES.map(t => (
                        <TouchableOpacity key={t} style={[styles.chip, selectedDewormType===t && styles.chipSelected]} onPress={()=>setSelectedDewormType(t)}>
                            <Text style={{color: selectedDewormType===t?'white':'black'}}>{t}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
                <Text style={styles.label}>Marca</Text><TextInput style={styles.input} value={dewormBrand} onChangeText={setDewormBrand}/>
                <Text style={styles.label}>Lote</Text><TextInput style={styles.input} value={dewormSerial} onChangeText={setDewormSerial}/>
                <View style={styles.dateButtonsRow}>
                    <TouchableOpacity style={styles.dateBtn} onPress={()=>setShowDewormDateModal(true)}><Text style={{fontSize:11}}>Aplic: {formatDate(dewormDate)}</Text></TouchableOpacity>
                    <TouchableOpacity style={styles.dateBtn} onPress={()=>setShowDewormMfgModal(true)}><Text style={{fontSize:11}}>Fab: {formatDate(dewormMfgDate)}</Text></TouchableOpacity>
                    <TouchableOpacity style={styles.dateBtn} onPress={()=>setShowDewormExpModal(true)}><Text style={{fontSize:11}}>Venc: {formatDate(dewormExpDate)}</Text></TouchableOpacity>
                </View>
                {showDewormDateModal && <DateTimePicker value={dewormDate} mode="date" maximumDate={new Date()} onChange={(e,d)=>{setShowDewormDateModal(false); if(d) setDewormDate(d)}} />}
                {showDewormMfgModal && <DateTimePicker value={dewormMfgDate} mode="date" maximumDate={new Date()} onChange={(e,d)=>{setShowDewormMfgModal(false); if(d) setDewormMfgDate(d)}} />}
                {showDewormExpModal && <DateTimePicker value={dewormExpDate} mode="date" minimumDate={new Date()} onChange={(e,d)=>{setShowDewormExpModal(false); if(d) setDewormExpDate(d)}} />}
            </ScrollView>
            <View style={{flexDirection:'row', justifyContent:'space-between', marginTop:15}}>
                <TouchableOpacity onPress={() => setShowDewormModal(false)}><Text style={{color:'red'}}>Cancelar</Text></TouchableOpacity>
                <TouchableOpacity onPress={handleSaveDeworming}><Text style={{color:'#7B1FA2', fontWeight:'bold'}}>Guardar</Text></TouchableOpacity>
            </View>
        </View></View>
      </Modal>

    </KeyboardAvoidingView>
  );
};

export default VetConsultationScreen;

const styles = StyleSheet.create({
  header: { paddingTop: 50, paddingBottom: 15, paddingHorizontal: 20, backgroundColor: "#7B1FA2", flexDirection: 'row', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#FFF', marginLeft: 15 },
  content: { padding: 20 },
  card: { backgroundColor: '#FFF', borderRadius: 15, padding: 15, marginBottom: 15, elevation: 3 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#7B1FA2', marginBottom: 10, borderBottomWidth: 1, borderBottomColor: '#EEE', paddingBottom: 5 },
  sectionTitleNoMargin: { fontSize: 16, fontWeight: '700', color: '#7B1FA2' },
  label: { fontSize: 13, fontWeight: '600', color: '#444', marginBottom: 5, marginTop: 10 },
  input: { borderWidth: 1, borderColor: '#DDD', borderRadius: 8, padding: 8, backgroundColor: '#FAFAFA', fontSize: 14 },
  textArea: { height: 60, textAlignVertical: 'top' },
  rowInputs: { flexDirection: 'row', justifyContent: 'space-between' },
  
  tableContainer: { borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 12, overflow: "hidden", backgroundColor: "#FFFFFF" },
  tableRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#E5E7EB" },
  tableCell: { fontSize: 12, color: "#374151" },
  emptyRow: { padding: 12 },
  emptyText: { fontSize: 12, color: "#6B7280" },
  
  sectionHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  addPillButton: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 999, backgroundColor: "#BAE6FD" },
  addPillText: { fontSize: 12, fontWeight: "600", color: "#0F172A" },

  attachButton: { backgroundColor: '#9575CD', padding: 10, borderRadius: 10, alignItems: 'center', width: 80 },
  attachText: { color: 'white', fontSize: 10, marginTop: 4 },
  fileRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, backgroundColor: '#EEE', padding: 8, borderRadius: 5 },
  fileName: { flex: 1, marginLeft: 10, fontSize: 12 },
  saveButton: { backgroundColor: '#4CAF50', padding: 15, borderRadius: 25, alignItems: 'center', elevation: 5 },
  saveButtonText: { color: 'white', fontWeight: '700', fontSize: 16 },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: 'white', padding: 20, borderRadius: 15, maxHeight: '80%' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
  chip: { padding: 8, borderRadius: 20, backgroundColor: '#EEE', marginRight: 5 },
  chipSelected: { backgroundColor: '#7B1FA2' },
  
  dateButtonsRow: { flexDirection:'row', justifyContent:'space-between', marginBottom:10 },
  dateBtn: { backgroundColor:'#E1BEE7', padding:5, borderRadius:5 }
});