import React, { useState, useEffect } from 'react';
import { Text, View, StyleSheet, Button, Alert, TouchableOpacity, ActivityIndicator } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from "@expo/vector-icons";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

// 👇 CORRECCIÓN DE RUTAS:
// Firebase está en la raíz, necesitamos 5 niveles de retroceso:
import { db } from "../../../../../firebase/config"; 
// Shared está en src, necesitamos 4 niveles de retroceso:
import { getUserFromStorage } from "../../../../shared/utils/storage";

const VetScannerScreen = ({ navigation }) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [processing, setProcessing] = useState(false);

  // Esperando a que carguen los permisos
  if (!permission) {
    return <View style={{ flex: 1, backgroundColor: 'black' }} />;
  }

  // Si no hay permiso
  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.permissionText}>Necesitamos acceso a la cámara para escanear pacientes.</Text>
        <Button onPress={requestPermission} title="Dar permiso" color="#4A85A5" />
        <TouchableOpacity style={styles.closeButtonTextOnly} onPress={() => navigation.goBack()}>
            <Text style={{color: 'white', marginTop: 20}}>Cancelar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleBarCodeScanned = async ({ type, data }) => {
    setScanned(true);
    try {
      // 1. Parsear la data del QR
      const parsedData = JSON.parse(data);
      
      // 2. Verificar que sea un QR de mascota válido
      if (parsedData.type === 'pet_profile' && parsedData.petId) {
        setProcessing(true);
        const petId = parsedData.petId;

        // 3. Obtener ID del Veterinario actual
        const vetUser = await getUserFromStorage();
        if (!vetUser || !vetUser.id) {
            Alert.alert("Error", "No se identificó al veterinario. Por favor inicia sesión nuevamente.");
            setProcessing(false);
            return;
        }
        const vetId = vetUser.id;

        // 4. Guardar la relación en Firebase (Colección 'vet_patients')
        // Usamos un ID compuesto para no duplicar relaciones
        const relationId = `${vetId}_${petId}`;
        
        await setDoc(doc(db, "vet_patients", relationId), {
            vetId: vetId,
            petId: petId,
            linkedAt: serverTimestamp(),
            active: true
        });

        // 5. Redirigir a la lista de pacientes
        // Navegamos al stack principal del veterinario, pantalla de pacientes
        navigation.navigate("VetMain", { screen: "VetPatients" });

      } else {
        Alert.alert("QR Inválido", "Este código no pertenece a una mascota registrada en PetHealthy.", [
            { text: "OK", onPress: () => { setScanned(false); setProcessing(false); } }
        ]);
      }
    } catch (error) {
        console.error(error);
        Alert.alert("Error", "No se pudo procesar el código QR.", [
            { text: "Intentar de nuevo", onPress: () => { setScanned(false); setProcessing(false); } }
        ]);
    }
  };

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ["qr"],
        }}
      />
      
      {/* Overlay Visual (Marco de escaneo) */}
      <View style={styles.overlay}>
        <View style={styles.topOverlay} />
        <View style={styles.middleOverlay}>
            <View style={styles.sideOverlay} />
            <View style={styles.scanFrame}>
                {/* Esquinas del marco */}
                <View style={styles.cornerTL} />
                <View style={styles.cornerTR} />
                <View style={styles.cornerBL} />
                <View style={styles.cornerBR} />
                
                {/* Indicador de carga si está procesando */}
                {processing && <ActivityIndicator size="large" color="#4A85A5" style={{flex:1}} />}
            </View>
            <View style={styles.sideOverlay} />
        </View>
        <View style={styles.bottomOverlay}>
            <Text style={styles.instructions}>
                {processing ? "Vinculando paciente..." : "Escanea el QR del paciente"}
            </Text>
        </View>
      </View>

      {/* Botón X para cerrar */}
      <TouchableOpacity style={styles.closeButton} onPress={() => navigation.goBack()}>
        <Ionicons name="close" size={28} color="white" />
      </TouchableOpacity>
    </View>
  );
};

export default VetScannerScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'black' },
  permissionText: { textAlign: 'center', color: 'white', marginBottom: 20, paddingHorizontal: 20 },
  closeButtonTextOnly: { padding: 10 },
  
  // Estilos del Overlay (Máscara oscura)
  overlay: { ...StyleSheet.absoluteFillObject },
  topOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  middleOverlay: { flexDirection: 'row', height: 280 },
  sideOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  bottomOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', paddingTop: 20 },
  
  // Marco central
  scanFrame: { width: 280, height: 280, justifyContent: 'space-between' },
  
  // Esquinas decorativas
  cornerTL: { position: 'absolute', top: 0, left: 0, width: 40, height: 40, borderTopWidth: 4, borderLeftWidth: 4, borderColor: '#4A85A5' },
  cornerTR: { position: 'absolute', top: 0, right: 0, width: 40, height: 40, borderTopWidth: 4, borderRightWidth: 4, borderColor: '#4A85A5' },
  cornerBL: { position: 'absolute', bottom: 0, left: 0, width: 40, height: 40, borderBottomWidth: 4, borderLeftWidth: 4, borderColor: '#4A85A5' },
  cornerBR: { position: 'absolute', bottom: 0, right: 0, width: 40, height: 40, borderBottomWidth: 4, borderRightWidth: 4, borderColor: '#4A85A5' },

  instructions: { color: 'white', fontSize: 16, fontWeight: '500' },
  
  closeButton: { 
      position: 'absolute', 
      top: 50, 
      right: 20, 
      width: 40, 
      height: 40, 
      backgroundColor: 'rgba(0,0,0,0.5)', 
      borderRadius: 20, 
      justifyContent: 'center', 
      alignItems: 'center' 
  },
});