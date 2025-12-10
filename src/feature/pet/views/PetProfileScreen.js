import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Platform,
  Modal,
  Linking,
  Alert
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { doc, onSnapshot, collection, query, orderBy, getDoc } from "firebase/firestore";
import { ALERT_TYPE, Dialog } from "react-native-alert-notification";
import QRCode from 'react-native-qrcode-svg';
import * as Brightness from 'expo-brightness';

import { db } from "../../../../firebase/config";
import { COL_MASCOTAS } from "../../../shared/utils/collections";

const contextoLabels = { adentro: "Dentro de casa", afuera: "Fuera de casa", mixto: "Mixto" };
const frecuenciaLabels = { nulo: "Casi nunca", regular: "A veces", diario: "Diario" };
const relacionLabels = { juegan: "Juegan mucho", se_pelean: "A veces se pelean", no_unidos: "No son muy unidos", conviven_bien: "Conviven sin problema" };

// DATOS IBA EL SALVADOR
const IBA_PHONE = "22103334";
const IBA_EMAIL = "denuncias@iba.gob.sv";

const PetProfileScreen = ({ navigation, route }) => {
  const { petId, viewMode } = route.params || {};
  const isVet = viewMode === 'veterinarian';

  const [pet, setPet] = useState(null);
  const [owner, setOwner] = useState(null);
  const [history, setHistory] = useState(null);
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);

  // Estados QR
  const [qrVisible, setQrVisible] = useState(false);
  const [previousBrightness, setPreviousBrightness] = useState(null);

  // Estado Modal Detalles
  const [selectedConsultation, setSelectedConsultation] = useState(null);
  const [detailsVisible, setDetailsVisible] = useState(false);

  useEffect(() => {
    if (!petId) return;
    setLoading(true);

    // 1. Perfil
    const unsubscribePet = onSnapshot(doc(db, COL_MASCOTAS, petId), async (docSnap) => {
      if (docSnap.exists()) {
        const petData = { id: docSnap.id, ...docSnap.data() };
        setPet(petData);

        // Cargar datos del dueño
        if (petData.ownerId) {
            try {
                // 👇 AQUÍ ESTABA EL ERROR: Cambié "users" por "usuarios"
                const userDoc = await getDoc(doc(db, "usuarios", petData.ownerId));
                
                if (userDoc.exists()) {
                    setOwner(userDoc.data());
                } else {
                    console.log("El documento del dueño no existe en 'usuarios'");
                }
            } catch (error) {
                console.log("Error cargando dueño:", error);
            }
        }
      } else {
        navigation.goBack();
      }
      setLoading(false);
    });

    // 2. Historial Inicial
    const unsubscribeHistory = onSnapshot(doc(db, COL_MASCOTAS, petId, "historial", "inicial"), (docSnap) => {
      if (docSnap.exists()) setHistory({ id: docSnap.id, ...docSnap.data() });
    });

    // 3. Consultas Veterinarias
    const qConsultas = query(collection(db, COL_MASCOTAS, petId, "consultas"), orderBy("fecha", "desc"));
    const unsubscribeConsultas = onSnapshot(qConsultas, (snapshot) => {
        const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setConsultations(list);
    });

    return () => { unsubscribePet(); unsubscribeHistory(); unsubscribeConsultas(); };
  }, [petId]);

  const handleOpenQR = async () => {
    try {
      const { status } = await Brightness.requestPermissionsAsync();
      if (status === 'granted') {
        const current = await Brightness.getBrightnessAsync();
        setPreviousBrightness(current);
        await Brightness.setBrightnessAsync(1.0);
      }
    } catch (e) {}
    setQrVisible(true);
  };

  const handleCloseQR = async () => {
    try { if (previousBrightness !== null) await Brightness.setBrightnessAsync(previousBrightness); } catch (e) {}
    setQrVisible(false);
  };

  const handleCallOwner = () => {
      if (owner?.telefono) {
          Linking.openURL(`tel:${owner.telefono}`);
      } else {
          Dialog.show({ type: ALERT_TYPE.WARNING, title: "Sin teléfono", textBody: "El dueño no tiene un número registrado.", button: "Ok" });
      }
  };

  const handleReportAbuse = () => {
    Alert.alert(
        "⚠️ Reportar Maltrato Animal",
        "Selecciona el canal para contactar al Instituto de Bienestar Animal (IBA).",
        [
            { text: "Cancelar", style: "cancel" },
            {
                text: "Enviar Correo",
                onPress: () => {
                    const ownerName = getOwnerName();
                    const subject = `Denuncia posible maltrato - Mascota: ${pet.nombre}`;
                    const body = `Estimados IBA,\n\nComo médico veterinario, reporto un posible caso de maltrato o negligencia.\n\nDatos de la mascota:\nID: ${pet.id}\nNombre: ${pet.nombre}\nEspecie: ${pet.especie}\nPropietario: ${ownerName}\n\nObservaciones:\n`;
                    Linking.openURL(`mailto:${IBA_EMAIL}?subject=${subject}&body=${body}`);
                }
            },
            {
                text: "Llamar al IBA",
                onPress: () => Linking.openURL(`tel:${IBA_PHONE}`)
            }
        ]
    );
  };

  const openConsultationDetails = (consulta) => {
    setSelectedConsultation(consulta);
    setDetailsVisible(true);
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "-";
    const d = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    if (Number.isNaN(d.getTime())) return "-";
    return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
  };

  const formatAge = () => {
    if (!pet) return "";
    if (!pet.edadValor || !pet.edadTipo) return "Edad no especificada";
    const unidad = pet.edadTipo === "años" ? (pet.edadValor === 1 ? "año" : "años") : (pet.edadValor === 1 ? "mes" : "meses");
    return `${pet.edadValor} ${unidad}`;
  };

  const formatBool = (value) => (value ? "Sí" : "No");

  // Función auxiliar ajustada a tus campos de Firebase (nombre, nombres)
  const getOwnerName = () => {
    if (!owner) return "Nombre no disponible";
    // Tu imagen muestra que usas 'nombre' o 'nombres'
    return owner.nombre || owner.nombres || owner.fullName || owner.displayName || owner.email || "Sin Nombre";
  };

  if (loading && !pet) return <ActivityIndicator size="large" color="#365b6d" style={{flex:1}} />;
  if (!pet) return null;

  return (
    <View style={styles.container}>
     
      {/* MODAL QR */}
      <Modal visible={qrVisible} transparent animationType="fade" onRequestClose={handleCloseQR}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Código Médico</Text>
            <View style={styles.qrWrapper}><QRCode value={JSON.stringify({ type: 'pet_profile', petId: pet.id })} size={220} /></View>
            <TouchableOpacity style={styles.closeButton} onPress={handleCloseQR}><Text style={styles.closeButtonText}>Cerrar</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL DETALLES */}
      <Modal visible={detailsVisible} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.detailModalContainer}>
            <View style={styles.detailHeader}>
                <Text style={styles.detailHeaderTitle}>Reporte de Consulta</Text>
                <TouchableOpacity onPress={() => setDetailsVisible(false)} style={styles.closeIcon}>
                    <Ionicons name="close" size={28} color="#333" />
                </TouchableOpacity>
            </View>
           
            {selectedConsultation && (
                <ScrollView contentContainerStyle={styles.detailContent}>
                    <View style={styles.reportHeader}>
                        <View style={{flexDirection:'row', justifyContent:'space-between'}}>
                            <Text style={styles.reportDate}>{formatDate(selectedConsultation.fecha)}</Text>
                            <Text style={styles.reportTag}>CONSULTA</Text>
                        </View>
                        <View style={styles.vetInfoBox}>
                            <Text style={styles.vetNameLarge}>Dr. {selectedConsultation.veterinario?.nombre}</Text>
                            <Text style={styles.vetJunta}>Junta Vigilancia: {selectedConsultation.veterinario?.junta}</Text>
                            <Text style={styles.vetClinic}>{selectedConsultation.veterinario?.clinica}</Text>
                        </View>
                    </View>

                    {selectedConsultation.datosClinicos?.peso && (
                        <View style={styles.detailSection}>
                            <Text style={styles.detailLabel}>Peso del paciente:</Text>
                            <Text style={styles.detailValueLarge}>{selectedConsultation.datosClinicos.peso} Lb/Kg</Text>
                        </View>
                    )}

                    <View style={styles.detailSection}>
                        <Text style={styles.detailLabel}>Motivo de Consulta:</Text>
                        <Text style={styles.detailValue}>{selectedConsultation.datosClinicos?.motivo}</Text>
                    </View>

                    {selectedConsultation.datosClinicos?.sintomas && (
                        <View style={styles.detailSection}>
                            <Text style={styles.detailLabel}>Sintomatología:</Text>
                            <Text style={styles.detailValue}>{selectedConsultation.datosClinicos.sintomas}</Text>
                        </View>
                    )}

                    <View style={[styles.detailSection, {backgroundColor:'#E8F5E9', padding:10, borderRadius:8}]}>
                        <Text style={[styles.detailLabel, {color:'#2E7D32'}]}>DIAGNÓSTICO:</Text>
                        <Text style={[styles.detailValue, {fontWeight:'bold', color:'#1B5E20'}]}>
                            {selectedConsultation.datosClinicos?.diagnostico}
                        </Text>
                    </View>

                    {selectedConsultation.datosClinicos?.notas && (
                        <View style={styles.detailSection}>
                            <Text style={styles.detailLabel}>Notas / Observaciones:</Text>
                            <Text style={styles.detailValue}>{selectedConsultation.datosClinicos.notas}</Text>
                        </View>
                    )}

                    {(selectedConsultation.tratamientos?.vacunas?.length > 0 || selectedConsultation.tratamientos?.desparacitantes?.length > 0) && (
                        <View style={styles.detailSection}>
                            <Text style={styles.sectionTitleSmall}>Tratamientos Aplicados</Text>
                            {selectedConsultation.tratamientos.vacunas.map((v, i) => (
                                <View key={`v-${i}`} style={styles.treatmentRow}>
                                    <Ionicons name="medkit" size={16} color="#7B1FA2" />
                                    <Text style={styles.treatmentText}>Vacuna: {v.nombre} ({v.marca})</Text>
                                </View>
                            ))}
                            {selectedConsultation.tratamientos.desparacitantes.map((d, i) => (
                                <View key={`d-${i}`} style={styles.treatmentRow}>
                                    <Ionicons name="bug" size={16} color="#7B1FA2" />
                                    <Text style={styles.treatmentText}>Desp: {d.tipo} ({d.marca})</Text>
                                </View>
                            ))}
                        </View>
                    )}

                    {selectedConsultation.archivos && selectedConsultation.archivos.length > 0 && (
                        <View style={styles.detailSection}>
                            <Text style={styles.sectionTitleSmall}>Archivos Adjuntos</Text>
                            <View style={{marginTop:8}}>
                                {selectedConsultation.archivos.map((file, i) => {
                                    const isPdf = file.type === 'pdf' || (file.name && file.name.toLowerCase().endsWith('.pdf'));
                                    return (
                                        <View key={i} style={styles.fileRowContainer}>
                                            <View style={styles.fileInfo}>
                                                <Ionicons 
                                                    name={isPdf ? "document-text" : "image"} 
                                                    size={24} 
                                                    color={isPdf ? "#E53935" : "#1976D2"} 
                                                />
                                                <Text style={styles.fileNameText} numberOfLines={1}>
                                                    {file.name || "Sin nombre"}
                                                </Text>
                                            </View>

                                            <TouchableOpacity 
                                                style={styles.downloadButton}
                                                onPress={() => Linking.openURL(file.url)}
                                            >
                                                <Ionicons name="cloud-download-outline" size={20} color="#FFF" />
                                                <Text style={styles.downloadButtonText}>Abrir/Descargar</Text>
                                            </TouchableOpacity>
                                        </View>
                                    );
                                })}
                            </View>
                        </View>
                    )}

                    <TouchableOpacity style={styles.closeModalButton} onPress={() => setDetailsVisible(false)}>
                        <Text style={styles.closeModalText}>Cerrar Reporte</Text>
                    </TouchableOpacity>
                    <View style={{height:40}}/>
                </ScrollView>
            )}
        </View>
      </Modal>

      {/* HEADER PRINCIPAL */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerIconButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{pet.nombre}</Text>
        <View style={{flexDirection: 'row'}}>
            <TouchableOpacity style={[styles.headerIconButton, { marginRight: 8 }]} onPress={() => navigation.navigate("EditPet", { petId: pet.id })}>
              <Ionicons name="create-outline" size={20} color="#FFFFFF" />
            </TouchableOpacity>
            {isVet && (
                <TouchableOpacity style={[styles.headerIconButton, { backgroundColor: '#4CAF50' }]} onPress={() => navigation.navigate("VetConsultation", { petId: pet.id, petName: pet.nombre })}>
                  <Ionicons name="add" size={24} color="#FFFFFF" />
                </TouchableOpacity>
            )}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
       
        {/* 1. TARJETA PERFIL */}
        <View style={styles.card}>
          <View style={styles.photoWrapper}>
            {pet.fotoUrl ? <Image source={{ uri: pet.fotoUrl }} style={styles.petImage} contentFit="cover" /> : <View style={styles.petImagePlaceholder}><Ionicons name="paw-outline" size={40} color="#4B5563" /></View>}
          </View>

          <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12}}>
            <View style={{flex: 1, paddingRight: 10}}>
              <Text style={styles.petName}>{pet.nombre}</Text>
              <Text style={styles.petSubInfo}>{pet.especie ? pet.especie.toUpperCase() : "ESPECIE"} · {formatAge()}</Text>
            </View>
            {!isVet && (
              <TouchableOpacity style={styles.miniQrButton} onPress={handleOpenQR}>
                <Ionicons name="qr-code-outline" size={18} color="#4A85A5" /><Text style={styles.miniQrText}>Generar QR</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* 👇 PERFIL DUEÑO */}
          {isVet && owner && (
              <View style={styles.ownerCard}>
                  <View style={styles.ownerHeader}>
                      <Ionicons name="person" size={16} color="#7B1FA2" />
                      <Text style={styles.ownerTitle}>DATOS DEL PROPIETARIO</Text>
                  </View>
                  <View style={styles.ownerContentRow}>
                      <View style={{flex:1}}>
                          <Text style={styles.ownerName}>{getOwnerName()}</Text>
                          <Text style={styles.ownerPhoneText}>
                             {owner.telefono ? `Tel: ${owner.telefono}` : "Sin teléfono registrado"}
                          </Text>
                      </View>
                      
                      {owner.telefono && (
                          <TouchableOpacity style={styles.callButton} onPress={handleCallOwner}>
                              <Ionicons name="call" size={22} color="#FFF" />
                          </TouchableOpacity>
                      )}
                  </View>
              </View>
          )}

          <View style={styles.infoRow}>
            <View style={styles.infoItem}><Text style={styles.infoLabel}>Sexo</Text><Text style={styles.infoValue}>{pet.sexo === "macho" ? "Macho" : "Hembra"}</Text></View>
            <View style={styles.infoItem}><Text style={styles.infoLabel}>Microchip</Text><Text style={styles.infoValue}>{formatBool(pet.tieneMicrochip)}</Text></View>
          </View>
          <View style={styles.infoRow}>
            <View style={styles.infoItem}><Text style={styles.infoLabel}>Peso Base</Text><Text style={styles.infoValue}>{pet.peso ? `${pet.peso} Kg/Lb` : "N/A"}</Text></View>
            <View style={styles.infoItem}><Text style={styles.infoLabel}>Tatuaje</Text><Text style={styles.infoValue}>{formatBool(pet.poseeTatuaje)}</Text></View>
          </View>
          {pet.especie === 'ave' && (
             <View style={styles.infoRow}>
                <View style={styles.infoItem}><Text style={styles.infoLabel}>Anillado</Text><Text style={styles.infoValue}>{formatBool(pet.tieneAnillado)}</Text></View>
             </View>
          )}
        </View>

        {/* 2. HISTORIAL ORIGINAL */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Historial médico</Text>
          {!history ? (
            <Text style={styles.emptyText}>Aún no hay historial médico inicial.</Text>
          ) : (
            <>
              <Text style={styles.sectionSubtitle}>Vacunas aplicadas</Text>
              {history.vacunas && history.vacunas.length > 0 ? (
                history.vacunas.map((v, index) => (
                  <View key={index} style={styles.lineRow}><View style={styles.bullet} /><Text style={styles.lineText}>{v.nombre} {v.fecha && `· ${formatDate(v.fecha)}`}</Text></View>
                ))
              ) : <Text style={styles.emptySubText}>No se registraron vacunas.</Text>}

              <Text style={styles.sectionSubtitle}>Desparasitación</Text>
              {history.desparacitaciones && history.desparacitaciones.length > 0 ? (
                history.desparacitaciones.map((d, index) => (
                  <View key={index} style={styles.lineRow}><View style={styles.bullet} /><Text style={styles.lineText}>{d.tipo} {d.fecha && `· ${formatDate(d.fecha)}`}</Text></View>
                ))
              ) : <Text style={styles.emptySubText}>No se registraron desparasitaciones.</Text>}

              <Text style={styles.sectionSubtitle}>Condiciones y contexto</Text>
              <View style={styles.tagRow}>
                {history.contextoVivienda && <View style={styles.tag}><Text style={styles.tagText}>{contextoLabels[history.contextoVivienda]}</Text></View>}
                {history.frecuenciaPaseo && <View style={styles.tag}><Text style={styles.tagText}>Paseo: {frecuenciaLabels[history.frecuenciaPaseo]}</Text></View>}
              </View>
              {history.condicionesMedicas ? <Text style={styles.paragraph}>{history.condicionesMedicas}</Text> : <Text style={styles.emptySubText}>No se registraron condiciones médicas.</Text>}

              <Text style={styles.sectionSubtitle}>Convivencia</Text>
              <Text style={styles.paragraph}>Vive con otros animales: {formatBool(history.viveConOtrosAnimales)}</Text>
              {history.viveConOtrosAnimales && (
                <>
                  {history.relacionConOtrosAnimales && <Text style={styles.paragraph}>Relación: {relacionLabels[history.relacionConOtrosAnimales]}</Text>}
                  {history.descripcionConvivencia && <Text style={styles.paragraph}>{history.descripcionConvivencia}</Text>}
                </>
              )}

              <Text style={styles.sectionSubtitle}>Agresividad</Text>
              <Text style={styles.paragraph}>Es agresiva: {formatBool(history.esAgresivo)}</Text>
              {history.esAgresivo && history.descripcionAgresividad && <Text style={styles.paragraph}>{history.descripcionAgresividad}</Text>}

              <Text style={styles.sectionSubtitle}>Viajes</Text>
              <Text style={styles.paragraph}>Viaja regularmente: {formatBool(history.viajaRegularmente)}</Text>
              {history.viajaRegularmente && history.descripcionViajes && <Text style={styles.paragraph}>{history.descripcionViajes}</Text>}
            </>
          )}
        </View>

        {/* SEPARADOR VISUAL */}
        {consultations.length > 0 && (
            <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 16, marginTop: 10}}>
                <View style={{flex: 1, height: 1, backgroundColor: '#B0BEC5'}} />
                <Text style={{marginHorizontal: 10, color: '#546E7A', fontWeight: 'bold'}}>HISTORIAL CLÍNICO (CONSULTAS)</Text>
                <View style={{flex: 1, height: 1, backgroundColor: '#B0BEC5'}} />
            </View>
        )}

        {/* 3. LISTA DE CONSULTAS */}
        {consultations.map((consulta, index) => (
            <View key={consulta.id || index} style={styles.consultationCard}>
                <View style={styles.consultationHeader}>
                    <View style={{flexDirection:'row', alignItems:'center'}}>
                        <Ionicons name="calendar" size={16} color="#FFF" style={{marginRight:6}}/>
                        <Text style={styles.consultationDate}>{formatDate(consulta.fecha)}</Text>
                    </View>
                    <View style={{alignItems:'flex-end'}}>
                        <Text style={styles.consultationVet}>Dr. {consulta.veterinario?.nombre}</Text>
                        <Text style={styles.consultationJunta}>Junta: {consulta.veterinario?.junta}</Text>
                    </View>
                </View>
               
                <View style={styles.consultationBody}>
                    <View style={styles.dataRow}>
                        <Text style={styles.label}>Motivo:</Text>
                        <Text style={styles.value} numberOfLines={2}>{consulta.datosClinicos?.motivo}</Text>
                    </View>

                    <View style={styles.dataBlock}>
                        <Text style={styles.label}>Diagnóstico:</Text>
                        <Text style={[styles.value, {fontWeight:'700'}]} numberOfLines={1}>
                            {consulta.datosClinicos?.diagnostico}
                        </Text>
                    </View>

                    <TouchableOpacity style={styles.detailsButton} onPress={() => openConsultationDetails(consulta)}>
                        <Text style={styles.detailsButtonText}>Ver Detalles Completos</Text>
                        <Ionicons name="chevron-forward" size={16} color="#7B1FA2" />
                    </TouchableOpacity>
                </View>
            </View>
        ))}

        {/* 👇 ALERTA DE MALTRATO */}
        {isVet && (
            <View style={styles.dangerZone}>
                <View style={{flexDirection:'row', alignItems:'center', marginBottom:8}}>
                    <Ionicons name="shield-checkmark" size={20} color="#B71C1C" />
                    <Text style={styles.dangerTitle}>Zona de Protección Animal</Text>
                </View>
                <Text style={styles.dangerText}>Si detectas signos de maltrato o negligencia en esta mascota, contacta directamente a las autoridades.</Text>
                
                <TouchableOpacity style={styles.reportButtonEnhanced} onPress={handleReportAbuse}>
                    <Ionicons name="warning" size={22} color="#FFF" style={{marginRight: 10}} />
                    <Text style={styles.reportButtonText}>REPORTAR AL IBA</Text>
                </TouchableOpacity>
            </View>
        )}

        <View style={{height: 40}} />
      </ScrollView>
    </View>
  );
};

export default PetProfileScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#E3F2FD", paddingTop: 0 },
  loadingScreen: { flex: 1, backgroundColor: "#E3F2FD", alignItems: "center", justifyContent: "center" },
  loadingText: { marginTop: 8, fontSize: 13, color: "#607D8B" },
  header: { paddingTop: Platform.OS === "ios" ? 52 : 32, paddingHorizontal: 20, paddingBottom: 14, flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: "#4A85A5", elevation: 6 },
  headerIconButton: { width: 38, height: 38, borderRadius: 19, backgroundColor: "rgba(255,255,255,0.18)", justifyContent: "center", alignItems: "center" },
  headerTitle: { flex: 1, marginHorizontal: 12, fontSize: 18, fontWeight: "700", color: "#FFFFFF", textAlign: "center" },
  content: { paddingHorizontal: 20, paddingBottom: 24, paddingTop: 16 },
  card: { backgroundColor: "#FFFFFF", borderRadius: 20, padding: 16, marginBottom: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 3 },
  photoWrapper: { width: "100%", aspectRatio: 2, borderRadius: 16, overflow: "hidden", backgroundColor: "#E5E7EB", marginBottom: 12 },
  petImage: { width: "100%", height: "100%" },
  petImagePlaceholder: { flex: 1, alignItems: "center", justifyContent: "center" },
  petName: { fontSize: 22, fontWeight: "700", color: "#111827" },
  petSubInfo: { marginTop: 4, fontSize: 13, color: "#6B7280" },
 
  // ESTILOS NUEVOS PROPIETARIO
  ownerCard: { backgroundColor: '#F3E5F5', padding: 12, borderRadius: 12, marginBottom: 15, borderWidth: 1, borderColor: '#E1BEE7' },
  ownerHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  ownerTitle: { fontSize: 11, color: '#7B1FA2', fontWeight: 'bold', marginLeft: 6, letterSpacing: 0.5 },
  ownerContentRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  ownerName: { fontSize: 16, color: '#333', fontWeight: '700' },
  ownerPhoneText: { fontSize: 14, color: '#4CAF50', fontWeight: '600', marginTop: 2 },
  callButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#4CAF50', alignItems: 'center', justifyContent: 'center', elevation: 2 },

  // ESTILOS NUEVOS DENUNCIA (Danger Zone)
  dangerZone: { backgroundColor: '#FFEBEE', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#FFCDD2', marginTop: 10 },
  dangerTitle: { fontSize: 14, fontWeight: '700', color: '#B71C1C', marginLeft: 6 },
  dangerText: { fontSize: 12, color: '#B71C1C', marginBottom: 12, lineHeight: 18 },
  reportButtonEnhanced: { flexDirection: 'row', backgroundColor: '#D32F2F', paddingVertical: 14, paddingHorizontal: 20, borderRadius: 12, alignItems: 'center', justifyContent: 'center', elevation: 4 },
  reportButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 15, letterSpacing: 0.5 },

  infoRow: { flexDirection: "row", marginTop: 12 },
  infoItem: { flex: 1 },
  infoLabel: { fontSize: 12, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: 0.5 },
  infoValue: { fontSize: 14, fontWeight: "600", color: "#111827", marginTop: 2 },
  infoExtra: { fontSize: 12, color: "#4B5563", marginTop: 2 },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: "#111827", marginBottom: 8 },
  sectionSubtitle: { marginTop: 12, fontSize: 14, fontWeight: "600", color: "#111827" },
  emptyText: { marginTop: 4, fontSize: 13, color: "#6B7280" },
  emptySubText: { marginTop: 2, fontSize: 12, color: "#9CA3AF" },
  lineRow: { flexDirection: "row", alignItems: "center", marginTop: 4 },
  bullet: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#38BDF8", marginRight: 6 },
  lineText: { fontSize: 13, color: "#374151", flexShrink: 1 },
  paragraph: { marginTop: 4, fontSize: 13, color: "#374151" },
  tagRow: { flexDirection: "row", flexWrap: "wrap", marginTop: 6, marginBottom: 4 },
  tag: { backgroundColor: "#E0F2FE", borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4, marginRight: 6, marginBottom: 4 },
  tagText: { fontSize: 11, color: "#0369A1", fontWeight: "500" },
  miniQrButton: { flexDirection: "row", alignItems: "center", backgroundColor: "#FFFFFF", paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20, borderWidth: 1, borderColor: "#4A85A5", elevation: 2 },
  miniQrText: { fontSize: 12, fontWeight: "600", color: "#4A85A5", marginLeft: 6 },
 
  // CONSULTAS LISTA
  consultationCard: { backgroundColor: "#FFFFFF", borderRadius: 12, marginBottom: 15, borderWidth: 1, borderColor: "#E1BEE7", overflow: 'hidden', elevation: 2 },
  consultationHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: 'center', backgroundColor: "#7B1FA2", paddingVertical: 10, paddingHorizontal: 12 },
  consultationDate: { fontSize: 14, fontWeight: "700", color: "#FFFFFF" },
  consultationVet: { fontSize: 12, color: "#FFFFFF", fontWeight: '700' },
  consultationJunta: { fontSize: 10, color: "#E1BEE7" },
  consultationClinic: { fontSize: 10, color: "#E1BEE7" },
  consultationBody: { padding: 12 },
  dataRow: { flexDirection: 'row', marginBottom: 4 },
  dataBlock: { marginBottom: 8 },
  label: { fontSize: 12, fontWeight: '700', color: '#7B1FA2', marginRight: 5 },
  value: { fontSize: 13, color: '#333', flex: 1 },
 
  // BOTÓN VER DETALLES
  detailsButton: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 8, paddingVertical: 8, borderTopWidth: 1, borderTopColor: '#F3E5F5' },
  detailsButtonText: { fontSize: 13, color: '#7B1FA2', fontWeight: '700', marginRight: 4 },

  // --- ESTILOS DEL MODAL DE DETALLES (REPORTE) ---
  detailModalContainer: { flex: 1, backgroundColor: '#F5F5F5' },
  detailHeader: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: 16, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#EEE' },
  detailHeaderTitle: { fontSize: 18, fontWeight: '700', color: '#333' },
  closeIcon: { position: 'absolute', right: 16, top: 12, padding: 4 },
  detailContent: { padding: 20 },
 
  reportHeader: { backgroundColor: '#FFF', borderRadius: 12, padding: 16, marginBottom: 16, elevation: 2 },
  reportDate: { fontSize: 14, color: '#666' },
  reportTag: { fontSize: 12, fontWeight: 'bold', color: '#7B1FA2', backgroundColor: '#F3E5F5', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  vetInfoBox: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#EEE' },
  vetNameLarge: { fontSize: 18, fontWeight: '700', color: '#333' },
  vetJunta: { fontSize: 14, color: '#555', marginTop: 2 },
  vetClinic: { fontSize: 13, color: '#777', marginTop: 2, fontStyle: 'italic' },

  detailSection: { backgroundColor: '#FFF', borderRadius: 12, padding: 16, marginBottom: 12, elevation: 1 },
  detailLabel: { fontSize: 12, color: '#7B1FA2', fontWeight: '700', textTransform: 'uppercase', marginBottom: 4 },
  detailValue: { fontSize: 15, color: '#333', lineHeight: 22 },
  detailValueLarge: { fontSize: 18, fontWeight: '700', color: '#333' },
 
  sectionTitleSmall: { fontSize: 15, fontWeight: '700', color: '#333', marginBottom: 10, borderBottomWidth: 1, borderBottomColor: '#F0F0F0', paddingBottom: 6 },
  treatmentRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  treatmentText: { fontSize: 14, color: '#444', marginLeft: 8 },
 
  // ESTILOS NUEVOS PARA ARCHIVOS
  fileRowContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#F5F5F5', borderRadius: 10, padding: 10, marginBottom: 8 },
  fileInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  fileNameText: { fontSize: 13, color: '#333', marginLeft: 8, flexShrink: 1 },
  downloadButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#4CAF50', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, marginLeft: 8 },
  downloadButtonText: { color: '#FFF', fontWeight: '600', fontSize: 12, marginLeft: 4 },

  closeModalButton: { backgroundColor: '#333', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  closeModalText: { color: '#FFF', fontWeight: '700', fontSize: 16 },

  // MODAL QR
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.85)", justifyContent: "center", alignItems: "center" },
  modalContent: { width: "85%", backgroundColor: "white", borderRadius: 20, padding: 24, alignItems: "center" },
  modalTitle: { fontSize: 20, fontWeight: "bold", marginBottom: 8, color: "#333" },
  qrWrapper: { padding: 10, backgroundColor: "white", borderRadius: 10, elevation: 3 },
  closeButton: { marginTop: 24, backgroundColor: "#4A85A5", paddingVertical: 12, paddingHorizontal: 30, borderRadius: 50 },
  closeButtonText: { color: "white", fontWeight: "bold" },
});