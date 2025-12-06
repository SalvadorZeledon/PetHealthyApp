import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { Dialog, ALERT_TYPE } from "react-native-alert-notification";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase/config";
import { useTheme } from "../src/themes/useTheme";

const logoPlaceholder = require("../assets/logoPH.png");

export default function VetCompleteProfileScreen({ route, navigation }) {
  const { colors } = useTheme();
  const { vetId } = route.params;

  // CAMPOS DEL PERFIL PROFESIONAL
  const [clinicName, setClinicName] = useState("");
  const [vetName, setVetName] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [experienceYears, setExperienceYears] = useState("");
  const [specialties, setSpecialties] = useState("");

  // CONTACTO
  const [phone, setPhone] = useState("");
  const [emergencyPhone, setEmergencyPhone] = useState("");
  const [email, setEmail] = useState("");

  // DIRECCIÓN
  const [address, setAddress] = useState("");
  const [hours, setHours] = useState("");

  // LOGO
  const [logoUri, setLogoUri] = useState(null);

  const [loading, setLoading] = useState(false);

  // === SELECTOR DE IMAGEN ===
  const pickLogo = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });

    if (!result.canceled) {
      setLogoUri(result.assets[0].uri);
    }
  };

  // === GUARDAR PERFIL COMPLETO ===
  const handleSave = async () => {
    if (!clinicName || !vetName || !phone || !address) {
      return Dialog.show({
        type: ALERT_TYPE.WARNING,
        title: "Datos incompletos",
        textBody: "Completa todos los campos obligatorios (*)",
        button: "Entendido",
      });
    }

    setLoading(true);

    try {
      const vetRef = doc(db, "usuarios", vetId);

      await updateDoc(vetRef, {
        rol: "veterinario",
        profesional: true,
        clinicName,
        vetName,
        licenseNumber,
        experienceYears,
        specialties,
        phone,
        emergencyPhone,
        email,
        address,
        hours,
        logoUri: logoUri || null,
        perfilProfesionalCompleto: true,
        updatedAt: new Date(),
      });

      Dialog.show({
        type: ALERT_TYPE.SUCCESS,
        title: "Perfil completado",
        textBody: "Tu perfil profesional ha sido configurado exitosamente.",
        button: "Continuar",
        onHide: () => navigation.replace("VetDashboard"),
      });
    } catch (error) {
      console.log(error);
      Dialog.show({
        type: ALERT_TYPE.DANGER,
        title: "Error",
        textBody: "Ocurrió un error guardando tu perfil.",
        button: "Cerrar",
      });
    }

    setLoading(false);
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
    >
      <Text style={[styles.title, { color: colors.text }]}>
        Completar perfil profesional
      </Text>
      <Text style={[styles.subtitle, { color: colors.subtitle }]}>
        Ingresa los datos de tu clínica veterinaria.
      </Text>

      {/* LOGO */}
      <TouchableOpacity
        style={[styles.logoContainer, { borderColor: colors.border }]}
        onPress={pickLogo}
      >
        {logoUri ? (
          <Image source={{ uri: logoUri }} style={styles.logo} />
        ) : (
          <Ionicons name="camera-outline" size={40} color={colors.icon} />
        )}
      </TouchableOpacity>

      <Text style={[styles.logoLabel, { color: colors.subtitle }]}>
        Logo de la clínica (opcional)
      </Text>

      {/* CAMPOS DEL FORMULARIO */}
      <View style={styles.group}>
        <TextInput
          placeholder="Nombre de la clínica *"
          placeholderTextColor={colors.placeholder}
          style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
          value={clinicName}
          onChangeText={setClinicName}
        />

        <TextInput
          placeholder="Nombre del veterinario *"
          placeholderTextColor={colors.placeholder}
          style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
          value={vetName}
          onChangeText={setVetName}
        />

        <TextInput
          placeholder="Número de colegiado"
          placeholderTextColor={colors.placeholder}
          style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
          value={licenseNumber}
          onChangeText={setLicenseNumber}
        />

        <TextInput
          placeholder="Años de experiencia"
          placeholderTextColor={colors.placeholder}
          style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
          value={experienceYears}
          onChangeText={setExperienceYears}
        />

        <TextInput
          placeholder="Especialidades (separadas por comas)"
          placeholderTextColor={colors.placeholder}
          style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
          value={specialties}
          onChangeText={setSpecialties}
        />
      </View>

      {/* CONTACTO */}
      <View style={styles.group}>
        <TextInput
          placeholder="Teléfono *"
          placeholderTextColor={colors.placeholder}
          style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
          value={phone}
          onChangeText={setPhone}
        />

        <TextInput
          placeholder="Teléfono de emergencias"
          placeholderTextColor={colors.placeholder}
          style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
          value={emergencyPhone}
          onChangeText={setEmergencyPhone}
        />

        <TextInput
          placeholder="Correo profesional"
          placeholderTextColor={colors.placeholder}
          style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
          value={email}
          onChangeText={setEmail}
        />
      </View>

      {/* DIRECCIÓN */}
      <View style={styles.group}>
        <TextInput
          placeholder="Dirección de la clínica *"
          placeholderTextColor={colors.placeholder}
          style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
          value={address}
          onChangeText={setAddress}
        />

        <TextInput
          placeholder="Horario (ej: Lun-Dom 8am–6pm)"
          placeholderTextColor={colors.placeholder}
          style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
          value={hours}
          onChangeText={setHours}
        />
      </View>

      {/* BOTÓN GUARDAR */}
      <TouchableOpacity
        style={[styles.button, { backgroundColor: colors.primary }]}
        onPress={handleSave}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Guardar perfil</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 20,
  },
  group: {
    marginBottom: 16,
  },
  input: {
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
    borderWidth: 1,
  },
  button: {
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  logoContainer: {
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 2,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    marginBottom: 8,
    overflow: "hidden",
  },
  logo: {
    width: "100%",
    height: "100%",
  },
  logoLabel: {
    textAlign: "center",
    marginBottom: 16,
  },
});
