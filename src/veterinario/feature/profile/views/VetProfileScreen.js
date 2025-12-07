import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
  Platform,
  BackHandler,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import * as ImagePicker from "expo-image-picker";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
} from "firebase/firestore";

// 👇 OJO: aquí son 5 puntos hacia atrás hasta firebase/config
import { db } from "../../../../../firebase/config";

// 👇 AQUÍ ESTABA EL ERROR: son 4 niveles, no 3
import {
  getUserFromStorage,
  saveUserToStorage,
} from "../../../../shared/utils/storage";

// 👇 Igual, 4 niveles
import { COL_VETERINARIOS } from "../../../../shared/utils/collections";

import { uploadImageToCloudinary } from "../../../../services/cloudinary";

const avatarPlaceholder = require("../../../../../assets/logoPH.png");

const VetProfileScreen = ({ navigation }) => {
  const [isEditing, setIsEditing] = useState(false);

  const [sessionUser, setSessionUser] = useState(null);
  const [vetDocId, setVetDocId] = useState(null);

  const [vetData, setVetData] = useState(null);
  const [originalData, setOriginalData] = useState(null);

  const [photoUri, setPhotoUri] = useState(null);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingPhoto, setLoadingPhoto] = useState(false);
  const [saving, setSaving] = useState(false);

  // errores
  const [errorFullname, setErrorFullname] = useState("");
  const [errorClinic, setErrorClinic] = useState("");
  const [errorCity, setErrorCity] = useState("");
  const [errorEmail, setErrorEmail] = useState("");
  const [errorPhone, setErrorPhone] = useState("");

  // =========================
  //   CARGAR DATOS VETERINARIO
  // =========================
  useEffect(() => {
    const loadVet = async () => {
      try {
        const stored = await getUserFromStorage();
        if (!stored || stored.rol !== "veterinario") {
          Alert.alert(
            "Sesión inválida",
            "No encontramos una sesión de veterinario. Vuelve a iniciar sesión.",
            [
              {
                text: "Aceptar",
                onPress: () =>
                  navigation.reset({ index: 0, routes: [{ name: "Login" }] }),
              },
            ]
          );
          return;
        }

        setSessionUser(stored);

        const juntaNumber =
          stored.juntanumber || stored.juntaNumber || stored.junta;

        if (!juntaNumber) {
          Alert.alert(
            "Datos incompletos",
            "No se encontró tu número de junta en la sesión. Vuelve a iniciar sesión."
          );
          return;
        }

        const vetsRef = collection(db, COL_VETERINARIOS);
        const q = query(
          vetsRef,
          where("juntanumber", "==", String(juntaNumber))
        );
        const snap = await getDocs(q);

        if (snap.empty) {
          Alert.alert(
            "Perfil no encontrado",
            "No encontramos tu perfil de veterinario en la base de datos."
          );
          return;
        }

        const docSnap = snap.docs[0];
        setVetDocId(docSnap.id);

        const data = docSnap.data();

        const merged = {
          fullname: data.fullname || "",
          clinic: data.clinic || "",
          city: data.city || "",
          email: data.email || "",
          phone: data.phone || "",
          juntanumber: data.juntanumber || String(juntaNumber),
          dui: data.dui || "", // opcional, si lo agregas a la colección
          fotoPerfilUrl: data.fotoPerfilUrl || null,
          rol: data.rol || "veterinario",
        };

        setVetData(merged);
        setOriginalData(merged);

        // Foto (primero local cache, luego Cloudinary)
        const localPhoto = await AsyncStorage.getItem(
          `@vetPhoto_${docSnap.id}`
        );
        if (localPhoto) {
          setPhotoUri(localPhoto);
        } else if (merged.fotoPerfilUrl) {
          setPhotoUri(merged.fotoPerfilUrl);
        } else {
          setPhotoUri(null);
        }
      } catch (error) {
        console.log("Error cargando perfil veterinario:", error);
        Alert.alert(
          "Error",
          "Ocurrió un error al cargar tu información. Intenta más tarde."
        );
      } finally {
        setLoadingInitial(false);
      }
    };

    loadVet();
  }, [navigation]);

  const handleChangeField = (field, value) => {
    setVetData((prev) => ({ ...prev, [field]: value }));
    if (field === "fullname") setErrorFullname("");
    if (field === "clinic") setErrorClinic("");
    if (field === "city") setErrorCity("");
    if (field === "email") setErrorEmail("");
    if (field === "phone") setErrorPhone("");
  };

  const hasUnsavedChanges = useCallback(() => {
    if (!originalData || !vetData) return false;
    const fields = ["fullname", "clinic", "city", "email", "phone"];
    return fields.some(
      (f) => String(originalData[f] ?? "") !== String(vetData[f] ?? "")
    );
  }, [originalData, vetData]);

  // =========================
  //     FOTO DE PERFIL
  // =========================
  const handleChangePhoto = async () => {
    if (!isEditing) return;

    try {
      setLoadingPhoto(true);

      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permiso requerido",
          "Necesitamos acceso a tu galería para cambiar la foto de perfil."
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        allowsEditing: true, // 👈 aquí puedes recortar y mover la imagen
        aspect: [1, 1], // cuadrado
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setPhotoUri(asset.uri);
      }
    } catch (error) {
      console.log("Error al cambiar foto de perfil (vet):", error);
      Alert.alert("Error", "No se pudo abrir la galería. Intenta nuevamente.");
    } finally {
      setLoadingPhoto(false);
    }
  };

  // =========================
  //   VALIDAR Y GUARDAR
  // =========================
  const clearErrors = () => {
    setErrorFullname("");
    setErrorClinic("");
    setErrorCity("");
    setErrorEmail("");
    setErrorPhone("");
  };

  const validateForm = () => {
    if (!vetData) return false;
    clearErrors();
    let valid = true;

    if (!vetData.fullname.trim()) {
      setErrorFullname("Ingresa tu nombre completo.");
      valid = false;
    }

    if (!vetData.clinic.trim()) {
      setErrorClinic("Ingresa el nombre de tu clínica o lugar de trabajo.");
      valid = false;
    }

    if (!vetData.city.trim()) {
      setErrorCity("Ingresa tu ciudad.");
      valid = false;
    }

    if (!vetData.email.trim()) {
      setErrorEmail("Ingresa tu correo electrónico.");
      valid = false;
    } else {
      const emailRegex = /^\S+@\S+\.\S+$/;
      if (!emailRegex.test(vetData.email.trim())) {
        setErrorEmail("Ingresa un correo electrónico válido.");
        valid = false;
      }
    }

    const phoneDigits = vetData.phone.replace(/\D/g, "");
    if (!phoneDigits) {
      setErrorPhone("Ingresa tu teléfono.");
      valid = false;
    } else if (phoneDigits.length !== 8) {
      setErrorPhone("El teléfono debe tener 8 dígitos.");
      valid = false;
    }

    if (!valid) {
      Alert.alert(
        "Revisa la información",
        "Algunos datos necesitan corrección antes de guardar."
      );
    }

    return valid;
  };

  const handleSave = async () => {
    if (!vetDocId || !vetData) return;
    if (!validateForm()) return;

    try {
      setSaving(true);

      // Subir foto a Cloudinary si es local
      let fotoUrl = vetData.fotoPerfilUrl || null;
      if (photoUri && !photoUri.startsWith("http")) {
        const uploadedUrl = await uploadImageToCloudinary(photoUri);
        fotoUrl = uploadedUrl;
      }

      const vetRef = doc(db, COL_VETERINARIOS, vetDocId);
      const updates = {
        fullname: vetData.fullname.trim(),
        clinic: vetData.clinic.trim(),
        city: vetData.city.trim(),
        email: vetData.email.trim(),
        phone: vetData.phone.trim(),
      };

      if (fotoUrl) {
        updates.fotoPerfilUrl = fotoUrl;
      }

      await updateDoc(vetRef, updates);

      if (fotoUrl) {
        await AsyncStorage.setItem(`@vetPhoto_${vetDocId}`, fotoUrl);
      }

      // Actualizar lo que guardas en AsyncStorage para la sesión
      if (sessionUser) {
        const updatedSession = {
          ...sessionUser,
          fullname: vetData.fullname.trim(),
          clinic: vetData.clinic.trim(),
          city: vetData.city.trim(),
          phone: vetData.phone.trim(),
          juntanumber: vetData.juntanumber,
          rol: "veterinario",
          fotoPerfilUrl: fotoUrl || null,
        };
        await saveUserToStorage(updatedSession);
        setSessionUser(updatedSession);
      }

      setVetData((prev) => ({
        ...prev,
        fotoPerfilUrl: fotoUrl || prev.fotoPerfilUrl,
      }));
      setOriginalData((prev) => ({
        ...vetData,
        fotoPerfilUrl: fotoUrl || prev?.fotoPerfilUrl || null,
      }));

      if (fotoUrl) {
        setPhotoUri(fotoUrl);
      }

      Alert.alert("Listo", "Tu perfil se actualizó correctamente.");
      setIsEditing(false);
    } catch (error) {
      console.log("Error al guardar perfil veterinario:", error);
      Alert.alert(
        "Error al guardar",
        "Ocurrió un error al guardar tus datos. Intenta nuevamente."
      );
    } finally {
      setSaving(false);
    }
  };

  // =========================
  //      BOTÓN ATRÁS
  // =========================
  const confirmDiscard = useCallback(() => {
    Alert.alert(
      "Descartar cambios",
      'Tienes cambios sin guardar. Para guardarlos, toca "Guardar cambios". ¿Deseas salir sin guardar?',
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Salir sin guardar",
          style: "destructive",
          onPress: () => navigation.goBack(),
        },
      ]
    );
  }, [navigation]);

  useEffect(() => {
    const onBackPress = () => {
      if (isEditing && hasUnsavedChanges()) {
        confirmDiscard();
        return true;
      }
      return false;
    };

    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      onBackPress
    );

    return () => subscription.remove();
  }, [isEditing, hasUnsavedChanges, confirmDiscard]);

  const handleGoBack = () => {
    if (isEditing && hasUnsavedChanges()) {
      confirmDiscard();
    } else {
      navigation.goBack();
    }
  };

  const handleToggleEdit = () => {
    if (!vetData) return;
    setIsEditing((prev) => !prev);
  };

  if (loadingInitial || !vetData) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7B1FA2" />
        <Text style={styles.loadingText}>Cargando información...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* HEADER MORADO */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleGoBack} style={styles.topIconButton}>
          <Ionicons name="arrow-back" size={22} color="#4A148C" />
        </TouchableOpacity>

        <Text style={styles.topTitle}>Perfil profesional</Text>

        <TouchableOpacity
          onPress={handleToggleEdit}
          style={styles.topIconButton}
        >
          <Ionicons
            name={isEditing ? "close-outline" : "create-outline"}
            size={22}
            color="#4A148C"
          />
        </TouchableOpacity>
      </View>

      <KeyboardAwareScrollView
        contentContainerStyle={styles.content}
        enableOnAndroid={true}
        extraScrollHeight={32}
        keyboardShouldPersistTaps="handled"
      >
        {/* CABECERA CON FOTO */}
        <View style={styles.profileHeader}>
          <TouchableOpacity onPress={handleChangePhoto} activeOpacity={0.8}>
            <View>
              <Image
                source={photoUri ? { uri: photoUri } : avatarPlaceholder}
                style={styles.avatar}
              />
              {loadingPhoto && (
                <View style={styles.avatarOverlay}>
                  <ActivityIndicator size="small" color="#FFFFFF" />
                </View>
              )}
              {isEditing && !loadingPhoto && (
                <View style={styles.cameraBadge}>
                  <Ionicons name="camera-outline" size={16} color="#FFFFFF" />
                </View>
              )}
            </View>
          </TouchableOpacity>

          <Text style={styles.fullName}>{vetData.fullname}</Text>
          <Text style={styles.clinic}>{vetData.clinic}</Text>
          <Text style={styles.city}>{vetData.city}</Text>
          <Text style={styles.email}>{vetData.email}</Text>

          <Text style={styles.juntaLabel}>
            Nº de junta:{" "}
            <Text style={styles.juntaValue}>{vetData.juntanumber}</Text>
          </Text>

          {isEditing && (
            <Text style={styles.photoHint}>
              Toca la foto para cambiar tu imagen de perfil (puedes recortarla).
            </Text>
          )}
        </View>

        {/* DATOS EDITABLES */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Datos del profesional</Text>

          {/* Nombre completo */}
          <View style={styles.field}>
            <Text style={styles.label}>Nombre completo</Text>
            {isEditing ? (
              <TextInput
                style={styles.input}
                value={vetData.fullname}
                onChangeText={(text) => handleChangeField("fullname", text)}
              />
            ) : (
              <Text style={styles.value}>{vetData.fullname}</Text>
            )}
            {errorFullname ? (
              <Text style={styles.errorText}>{errorFullname}</Text>
            ) : null}
          </View>

          {/* Clínica */}
          <View style={styles.field}>
            <Text style={styles.label}>Clínica / centro</Text>
            {isEditing ? (
              <TextInput
                style={styles.input}
                value={vetData.clinic}
                onChangeText={(text) => handleChangeField("clinic", text)}
              />
            ) : (
              <Text style={styles.value}>{vetData.clinic}</Text>
            )}
            {errorClinic ? (
              <Text style={styles.errorText}>{errorClinic}</Text>
            ) : null}
          </View>

          {/* Ciudad */}
          <View style={styles.field}>
            <Text style={styles.label}>Ciudad</Text>
            {isEditing ? (
              <TextInput
                style={styles.input}
                value={vetData.city}
                onChangeText={(text) => handleChangeField("city", text)}
              />
            ) : (
              <Text style={styles.value}>{vetData.city}</Text>
            )}
            {errorCity ? (
              <Text style={styles.errorText}>{errorCity}</Text>
            ) : null}
          </View>

          {/* Email */}
          <View style={styles.field}>
            <Text style={styles.label}>Correo electrónico</Text>
            {isEditing ? (
              <TextInput
                style={styles.input}
                value={vetData.email}
                onChangeText={(text) => handleChangeField("email", text)}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            ) : (
              <Text style={styles.value}>{vetData.email}</Text>
            )}
            {errorEmail ? (
              <Text style={styles.errorText}>{errorEmail}</Text>
            ) : null}
          </View>

          {/* Teléfono */}
          <View style={styles.field}>
            <Text style={styles.label}>Teléfono</Text>
            {isEditing ? (
              <TextInput
                style={styles.input}
                value={vetData.phone}
                onChangeText={(text) => handleChangeField("phone", text)}
                keyboardType="phone-pad"
              />
            ) : (
              <Text style={styles.value}>{vetData.phone}</Text>
            )}
            {errorPhone ? (
              <Text style={styles.errorText}>{errorPhone}</Text>
            ) : null}
          </View>

          {/* DUI (si lo manejas, solo lectura) */}
          {vetData.dui ? (
            <View style={styles.field}>
              <Text style={styles.label}>DUI (no editable)</Text>
              <Text style={styles.value}>{vetData.dui}</Text>
            </View>
          ) : null}

          {/* Junta (no editable) */}
          <View style={styles.field}>
            <Text style={styles.label}>Número de junta (no editable)</Text>
            <Text style={styles.value}>{vetData.juntanumber}</Text>
          </View>

          {isEditing && (
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.saveButtonText}>Guardar cambios</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAwareScrollView>
    </View>
  );
};

export default VetProfileScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3E5F5",
    paddingTop: 0,
  },
  header: {
    paddingTop: Platform.OS === "ios" ? 52 : 32,
    paddingHorizontal: 20,
    paddingBottom: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#7B1FA2",
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#F3E5F5",
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 8,
    color: "#4A148C",
    fontSize: 14,
  },
  topIconButton: {
    padding: 6,
    borderRadius: 999,
    backgroundColor: "#EDE7F6",
  },
  topTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  profileHeader: {
    alignItems: "center",
    marginBottom: 16,
  },
  avatar: {
    marginTop: 15,
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 3,
    borderColor: "#FFFFFF",
    backgroundColor: "#FFFFFF",
  },
  avatarOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#00000055",
    borderRadius: 45,
    alignItems: "center",
    justifyContent: "center",
  },
  cameraBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#7B1FA2",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#F3E5F5",
  },
  fullName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#311B92",
    marginTop: 8,
  },
  clinic: {
    fontSize: 14,
    color: "#5E35B1",
  },
  city: {
    fontSize: 13,
    color: "#7E57C2",
  },
  email: {
    fontSize: 13,
    color: "#7E57C2",
    marginTop: 2,
  },
  juntaLabel: {
    marginTop: 6,
    fontSize: 13,
    color: "#5E35B1",
  },
  juntaValue: {
    fontWeight: "700",
  },
  photoHint: {
    fontSize: 12,
    color: "#9575CD",
    marginTop: 4,
    textAlign: "center",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#4527A0",
    marginBottom: 10,
  },
  field: {
    marginBottom: 10,
  },
  label: {
    fontSize: 12,
    color: "#7E57C2",
    marginBottom: 2,
  },
  value: {
    fontSize: 14,
    color: "#263238",
  },
  input: {
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#D1C4E9",
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    color: "#263238",
  },
  saveButton: {
    marginTop: 12,
    backgroundColor: "#7B1FA2",
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: "center",
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  errorText: {
    color: "#E53935",
    fontSize: 12,
    marginTop: 2,
  },
});
