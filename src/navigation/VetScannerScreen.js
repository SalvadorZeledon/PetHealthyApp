// src/feature/directory/views/VetScannerScreen.js
import React, { useState } from 'react';
import { Text, View, StyleSheet, Button, Alert, TouchableOpacity } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from "@expo/vector-icons";

const VetScannerScreen = ({ navigation }) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  // 1. Manejo de Permisos 🔒
  if (!permission) {
    return <View />; // Cargando permisos...
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.permissionText}>Necesitamos acceso a la cámara para escanear</Text>
        <Button onPress={requestPermission} title="Dar permiso" color="#4A85A5" />
      </View>
    );
  }

  // 2. Lógica al detectar un QR 🔍
  const handleBarCodeScanned = ({ type, data }) => {
    setScanned(true);
    try {
      const parsedData = JSON.parse(data);

      if (parsedData.type === 'pet_profile' && parsedData.petId) {
        // ✅ ÉXITO: Navegamos al perfil
        navigation.navigate('PetProfile', { 
            petId: parsedData.petId, 
            viewMode: 'veterinarian' 
        });
      } else {
        Alert.alert("QR Inválido", "Este código no es de PetHealthy.");
        setScanned(false);
      }
    } catch (error) {
      setScanned(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* CÁMARA */}
      <CameraView
        style={StyleSheet.absoluteFillObject}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
      />
      
      {/* UI SOBRE LA CÁMARA */}
      <View style={styles.overlay}>
        <View style={styles.scanFrame} />
        <Text style={styles.instructions}>Escanea el QR de la mascota</Text>
      </View>

      {/* Botón para reintentar */}
      {scanned && (
        <View style={styles.rescanContainer}>
          <Button title={'Escanear de nuevo'} onPress={() => setScanned(false)} />
        </View>
      )}

      {/* Botón Salir */}
      <TouchableOpacity style={styles.closeButton} onPress={() => navigation.goBack()}>
        <Ionicons name="close" size={30} color="white" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', backgroundColor: 'black' },
  permissionText: { textAlign: 'center', marginBottom: 20, color: 'white' },
  overlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center' },
  scanFrame: { width: 250, height: 250, borderWidth: 2, borderColor: '#4A85A5', borderRadius: 20, backgroundColor: 'transparent' },
  instructions: { color: 'white', fontSize: 16, marginTop: 20, backgroundColor: 'rgba(0,0,0,0.6)', padding: 10, borderRadius: 5 },
  rescanContainer: { position: 'absolute', bottom: 100, width: '100%', alignItems: 'center' },
  closeButton: { position: 'absolute', top: 50, right: 20, padding: 10, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 20 },
});

export default VetScannerScreen;