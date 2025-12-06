// screens/UserInfoScreen.js
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
import { Dialog, ALERT_TYPE } from "react-native-alert-notification";
import * as Location from "expo-location";
import * as ImagePicker from "expo-image-picker";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getUserFromStorage, saveUserToStorage } from "../src/utils/storage";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

import { db } from "../firebase/config";
import { COL_USUARIOS } from "../src/utils/collections";

const avatarPlaceholder = require("../assets/logo.png");

const UserInfoScreen = ({ navigation }) => {
  const [isEditing, setIsEditing] = useState(false);

  const [userId, setUserId] = useState(null);
  const [userData, setUserData] = useState(null);
  const [originalData, setOriginalData] = useState(null); // para detectar cambios

  const [photoUri, setPhotoUri] = useState(null);

  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingPhoto, setLoadingPhoto] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [saving, setSaving] = useState(false);

  // errores por campo
  const [errorUsername, setErrorUsername] = useState("");
  const [errorNombres, setErrorNombres] = useState("");
  const [errorApellidos, setErrorApellidos] = useState("");
  const [errorEmail, setErrorEmail] = useState("");
  const [errorEdad, setErrorEdad] = useState("");
  const [errorTelefono, setErrorTelefono] = useState("");
  const [errorDui, setErrorDui] = useState("");
  const [errorDireccion, setErrorDireccion] = useState("");

  // =========================
  //   CARGAR DATOS INICIALES
  // =========================
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const stored = await getUserFromStorage();
        if (!stored) {
          Dialog.show({
            type: ALERT_TYPE.WARNING,
            title: "Sesión no encontrada",
            textBody:
              "No pudimos encontrar tus datos de sesión. Vuelve a iniciar sesión.",
            button: "Ir al inicio",
            onHide: () => {
              navigation.reset({
                index: 0,
                routes: [{ name: "Login" }],
              });
            },
          });
          return;
        }

        const parsed = stored;

        if (!parsed.id) {
          console.log("userData en AsyncStorage no tiene id:", parsed);
        }
        const uid = parsed.id;
        setUserId(uid);

        // Obtener datos actualizados desde Firestore
        const userRef = doc(db, COL_USUARIOS, uid);
        const snap = await getDoc(userRef);

        if (!snap.exists()) {
          Dialog.show({
            type: ALERT_TYPE.DANGER,
            title: "Usuario no encontrado",
            textBody:
              "No encontramos tu perfil en la base de datos. Vuelve a iniciar sesión.",
            button: "Aceptar",
            onHide: () => {
              navigation.reset({
                index: 0,
                routes: [{ name: "Login" }],
              });
            },
          });
          return;
        }

        const data = snap.data();

        // Combinamos datos de Firestore con algunos del stored (por si acaso)
        const merged = {
          username: data.username || parsed.username || "",
          nombres: data.nombres || "",
          apellidos: data.apellidos || "",
          email: data.email || parsed.email || "",
          edad: (data.edad && String(data.edad)) || "",
          dui: data.dui || "",
          telefono: data.telefono || "",
          direccion: data.direccion || "",
          rol: data.rol || parsed.rol || "cliente",
        };

        setUserData(merged);
        setOriginalData(merged); // snapshot inicial

        // Cargar foto local (si existe), si no, desde Firestore
        const localPhoto = await AsyncStorage.getItem(`@userPhoto_${uid}`);

        if (localPhoto) {
          setPhotoUri(localPhoto);
        } else if (data.fotoPerfilUrl) {
          setPhotoUri(data.fotoPerfilUrl);
        } else {
          setPhotoUri(null);
        }
      } catch (error) {
        console.log(
          "Error al cargar datos de usuario en UserInfoScreen:",
          error
        );
        Dialog.show({
          type: ALERT_TYPE.DANGER,
          title: "Error",
          textBody:
            "Ocurrió un error al cargar tu información. Intenta de nuevo más tarde.",
          button: "Cerrar",
        });
      } finally {
        setLoadingInitial(false);
      }
    };

    loadUserData();
  }, [navigation]);

  const handleChangeField = (field, value) => {
    setUserData((prev) => ({ ...prev, [field]: value }));
    if (field === "username") setErrorUsername("");
    if (field === "nombres") setErrorNombres("");
    if (field === "apellidos") setErrorApellidos("");
    if (field === "email") setErrorEmail("");
    if (field === "edad") setErrorEdad("");
    if (field === "telefono") setErrorTelefono("");
    if (field === "dui") setErrorDui("");
    if (field === "direccion") setErrorDireccion("");
  };

  // helper para saber si hay cambios sin guardar (solo campos de texto)
  const hasUnsavedChanges = useCallback(() => {
    if (!originalData || !userData) return false;
    const fields = [
      "username",
      "nombres",
      "apellidos",
      "email",
      "edad",
      "dui",
      "telefono",
      "direccion",
    ];
    return fields.some(
      (f) => String(originalData[f] ?? "") !== String(userData[f] ?? "")
    );
  }, [originalData, userData]);

  // =========================
  //     FORMATEOS CAMPOS
  // =========================
  const handleChangeDui = (text) => {
    let digits = text.replace(/\D/g, "");
    digits = digits.slice(0, 9);

    let formatted = digits;
    if (digits.length > 8) {
      formatted = digits.slice(0, 8) + "-" + digits.slice(8);
    }

    setUserData((prev) => ({ ...prev, dui: formatted }));
    if (errorDui) setErrorDui("");
  };

  const handleChangeTelefono = (text) => {
    let digits = text.replace(/\D/g, "");
    digits = digits.slice(0, 8);

    let formatted = digits;
    if (digits.length > 4) {
      formatted = digits.slice(0, 4) + "-" + digits.slice(4);
    }

    setUserData((prev) => ({ ...prev, telefono: formatted }));
    if (errorTelefono) setErrorTelefono("");
  };

  const handleChangeEdad = (text) => {
    const digits = text.replace(/\D/g, "");
    setUserData((prev) => ({ ...prev, edad: digits }));
    if (errorEdad) setErrorEdad("");
  };

  // =========================
  //     CAMBIAR FOTO PERFIL
  // =========================
  const handleChangePhoto = async () => {
    if (!isEditing) return;

    try {
      setLoadingPhoto(true);

      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Dialog.show({
          type: ALERT_TYPE.WARNING,
          title: "Permiso requerido",
          textBody:
            "Necesitamos acceso a tu galería para cambiar tu foto de perfil.",
          button: "Entendido",
        });
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.7,
        allowsEditing: true,
        aspect: [1, 1],
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setPhotoUri(asset.uri);
      }
    } catch (error) {
      console.log("Error al cambiar foto de perfil:", error);
      Dialog.show({
        type: ALERT_TYPE.DANGER,
        title: "Error",
        textBody: "No se pudo abrir la galería. Intenta nuevamente.",
        button: "Cerrar",
      });
    } finally {
      setLoadingPhoto(false);
    }
  };

  // =========================
  //          UBICACIÓN
  // =========================
  const handleUseLocation = async () => {
    if (!isEditing) return;

    try {
      setLoadingLocation(true);

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Dialog.show({
          type: ALERT_TYPE.WARNING,
          title: "Permiso requerido",
          textBody:
            "Necesitamos permiso de ubicación para sugerir tu dirección. También puedes escribirla o elegirla en el mapa.",
          button: "Entendido",
        });
        return;
      }

      const position = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = position.coords;

      const places = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      if (places && places.length > 0) {
        const place = places[0];
        const parts = [
          place.name,
          place.street,
          place.subregion || place.city,
          place.region,
          place.country,
        ].filter(Boolean);
        const addr = parts.join(", ");
        setUserData((prev) => ({ ...prev, direccion: addr }));
        setErrorDireccion("");
      } else {
        Dialog.show({
          type: ALERT_TYPE.WARNING,
          title: "Sin resultados",
          textBody:
            "No pudimos obtener una dirección a partir de tu ubicación. Intenta escribirla o buscarla en el mapa.",
          button: "Entendido",
        });
      }
    } catch (error) {
      console.log("Error al obtener ubicación (UserInfo):", error);
      Dialog.show({
        type: ALERT_TYPE.DANGER,
        title: "Error de ubicación",
        textBody:
          "Ocurrió un error al obtener tu ubicación. Verifica tu conexión e inténtalo de nuevo.",
        button: "Cerrar",
      });
    } finally {
      setLoadingLocation(false);
    }
  };

  const handleOpenLocationPicker = () => {
    if (!isEditing) return;

    navigation.navigate("LocationPicker", {
      onSelectLocation: (addr) => {
        setUserData((prev) => ({ ...prev, direccion: addr }));
        setErrorDireccion("");
      },
    });
  };

  // =========================
  //     VALIDACIÓN Y GUARDAR
  // =========================
  const clearErrors = () => {
    setErrorUsername("");
    setErrorNombres("");
    setErrorApellidos("");
    setErrorEmail("");
    setErrorEdad("");
    setErrorTelefono("");
    setErrorDui("");
    setErrorDireccion("");
  };

  const validateForm = () => {
    if (!userData) return false;
    clearErrors();
    let valid = true;

    if (!userData.username.trim()) {
      setErrorUsername("Ingresa un nombre de usuario.");
      valid = false;
    }

    if (!userData.nombres.trim()) {
      setErrorNombres("Ingresa tus nombres.");
      valid = false;
    }

    if (!userData.apellidos.trim()) {
      setErrorApellidos("Ingresa tus apellidos.");
      valid = false;
    }

    if (!userData.email.trim()) {
      setErrorEmail("Ingresa tu correo electrónico.");
      valid = false;
    } else {
      const emailRegex = /^\S+@\S+\.\S+$/;
      if (!emailRegex.test(userData.email.trim())) {
        setErrorEmail("Ingresa un correo electrónico válido.");
        valid = false;
      }
    }

    const edadNum = parseInt(userData.edad, 10);
    if (!userData.edad) {
      setErrorEdad("Ingresa tu edad.");
      valid = false;
    } else if (isNaN(edadNum) || edadNum < 18 || edadNum > 120) {
      setErrorEdad("Debes tener 18 años o más.");
      valid = false;
    }

    const duiDigits = userData.dui.replace(/\D/g, "");
    if (!duiDigits) {
      setErrorDui("Ingresa tu DUI.");
      valid = false;
    } else if (duiDigits.length !== 9) {
      setErrorDui("El DUI debe tener 9 dígitos.");
      valid = false;
    }

    const telDigits = userData.telefono.replace(/\D/g, "");
    if (!telDigits) {
      setErrorTelefono("Ingresa tu número de teléfono.");
      valid = false;
    } else if (telDigits.length !== 8) {
      setErrorTelefono("El teléfono debe tener 8 dígitos.");
      valid = false;
    }

    if (!userData.direccion || !userData.direccion.trim()) {
      setErrorDireccion("Ingresa tu dirección.");
      valid = false;
    }

    if (!valid) {
      Dialog.show({
        type: ALERT_TYPE.WARNING,
        title: "Revisa la información",
        textBody: "Algunos datos necesitan corrección antes de guardar.",
        button: "Entendido",
      });
    }

    return valid;
  };

  const handleSave = async () => {
    if (!userId || !userData) return;
    if (!validateForm()) return;

    try {
      setSaving(true);

      const userRef = doc(db, COL_USUARIOS, userId);

      const updates = {
        username: userData.username.trim(),
        nombres: userData.nombres.trim(),
        apellidos: userData.apellidos.trim(),
        email: userData.email.trim(),
        edad: parseInt(userData.edad, 10),
        dui: userData.dui.trim(),
        telefono: userData.telefono.trim(),
        direccion: userData.direccion.trim(),
      };

      // 👉 si tenemos una foto seleccionada, también la persistimos
      if (photoUri) {
        updates.fotoPerfilUrl = photoUri;
      }

      await updateDoc(userRef, updates);

      // Guardar foto local si hubo foto (aquí no borramos nada)
      if (photoUri) {
        await AsyncStorage.setItem(`@userPhoto_${userId}`, photoUri);
      }

      const updatedForStorage = {
        id: userId,
        username: userData.username.trim(),
        email: userData.email.trim(),
        rol: userData.rol || "cliente",
        nombres: userData.nombres.trim(),
        apellidos: userData.apellidos.trim(),
        edad: parseInt(userData.edad, 10),
        dui: userData.dui.trim(),
        telefono: userData.telefono.trim(),
        direccion: userData.direccion.trim(),
        fotoPerfilUrl: photoUri || null,
      };
      await saveUserToStorage(updatedForStorage);

      // actualizamos referencia para comparar cambios
      setOriginalData(userData);

      Dialog.show({
        type: ALERT_TYPE.SUCCESS,
        title: "Cambios guardados",
        textBody: "Tu información se actualizó correctamente.",
        button: "Aceptar",
      });

      setIsEditing(false);
    } catch (error) {
      console.log("Error al guardar cambios en UserInfoScreen:", error);
      Dialog.show({
        type: ALERT_TYPE.DANGER,
        title: "Error al guardar",
        textBody:
          "Ocurrió un error al guardar tus datos. Intenta nuevamente más tarde.",
        button: "Cerrar",
      });
    } finally {
      setSaving(false);
    }
  };

  // =========================
  //   MANEJAR BOTÓN ATRÁS
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

    return () => {
      subscription.remove();
    };
  }, [isEditing, hasUnsavedChanges, confirmDiscard]);

  const handleGoBack = () => {
    if (isEditing && hasUnsavedChanges()) {
      confirmDiscard();
    } else {
      navigation.goBack();
    }
  };

  const handleToggleEdit = () => {
    if (!userData) return;
    setIsEditing((prev) => !prev);
  };

  if (loadingInitial || !userData) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#365b6d" />
        <Text style={styles.loadingText}>Cargando información...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Barra superior fija */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={handleGoBack} style={styles.topIconButton}>
          <Ionicons name="arrow-back" size={22} color="#365b6d" />
        </TouchableOpacity>

        <Text style={styles.topTitle}>Información de usuario</Text>

        <TouchableOpacity
          onPress={handleToggleEdit}
          style={styles.topIconButton}
        >
          <Ionicons
            name={isEditing ? "close-outline" : "create-outline"}
            size={22}
            color="#365b6d"
          />
        </TouchableOpacity>
      </View>

      {/* Contenido scrollable y keyboard-aware */}
      <KeyboardAwareScrollView
        contentContainerStyle={styles.content}
        enableOnAndroid={true}
        extraScrollHeight={32}
        keyboardShouldPersistTaps="handled"
      >
        {/* Cabecera con foto */}
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

          <Text style={styles.username}>@{userData.username}</Text>
          <Text style={styles.fullName}>
            {userData.nombres} {userData.apellidos}
          </Text>
          <Text style={styles.email}>{userData.email}</Text>

          {isEditing && (
            <Text style={styles.photoHint}>
              Toca la foto para cambiar tu imagen de perfil.
            </Text>
          )}
        </View>

        {/* Datos */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Datos personales</Text>

          {/* Usuario */}
          <View style={styles.field}>
            <Text style={styles.label}>Nombre de usuario</Text>
            {isEditing ? (
              <TextInput
                style={styles.input}
                value={userData.username}
                onChangeText={(text) => handleChangeField("username", text)}
              />
            ) : (
              <Text style={styles.value}>@{userData.username}</Text>
            )}
            {errorUsername ? (
              <Text style={styles.errorText}>{errorUsername}</Text>
            ) : null}
          </View>

          {/* Nombres */}
          <View style={styles.field}>
            <Text style={styles.label}>Nombres</Text>
            {isEditing ? (
              <TextInput
                style={styles.input}
                value={userData.nombres}
                onChangeText={(text) => handleChangeField("nombres", text)}
              />
            ) : (
              <Text style={styles.value}>{userData.nombres}</Text>
            )}
            {errorNombres ? (
              <Text style={styles.errorText}>{errorNombres}</Text>
            ) : null}
          </View>

          {/* Apellidos */}
          <View style={styles.field}>
            <Text style={styles.label}>Apellidos</Text>
            {isEditing ? (
              <TextInput
                style={styles.input}
                value={userData.apellidos}
                onChangeText={(text) => handleChangeField("apellidos", text)}
              />
            ) : (
              <Text style={styles.value}>{userData.apellidos}</Text>
            )}
            {errorApellidos ? (
              <Text style={styles.errorText}>{errorApellidos}</Text>
            ) : null}
          </View>

          {/* Email */}
          <View style={styles.field}>
            <Text style={styles.label}>Correo electrónico</Text>
            {isEditing ? (
              <TextInput
                style={styles.input}
                value={userData.email}
                onChangeText={(text) => handleChangeField("email", text)}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            ) : (
              <Text style={styles.value}>{userData.email}</Text>
            )}
            {errorEmail ? (
              <Text style={styles.errorText}>{errorEmail}</Text>
            ) : null}
          </View>

          {/* Edad y teléfono */}
          <View style={styles.fieldRow}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={styles.label}>Edad</Text>
              {isEditing ? (
                <TextInput
                  style={styles.input}
                  value={userData.edad}
                  onChangeText={handleChangeEdad}
                  keyboardType="number-pad"
                />
              ) : (
                <Text style={styles.value}>{userData.edad} años</Text>
              )}
              {errorEdad ? (
                <Text style={styles.errorText}>{errorEdad}</Text>
              ) : null}
            </View>

            <View style={{ flex: 1, marginLeft: 8 }}>
              <Text style={styles.label}>Teléfono</Text>
              {isEditing ? (
                <TextInput
                  style={styles.input}
                  value={userData.telefono}
                  onChangeText={handleChangeTelefono}
                  keyboardType="phone-pad"
                />
              ) : (
                <Text style={styles.value}>{userData.telefono}</Text>
              )}
              {errorTelefono ? (
                <Text style={styles.errorText}>{errorTelefono}</Text>
              ) : null}
            </View>
          </View>

          {/* DUI */}
          <View style={styles.field}>
            <Text style={styles.label}>DUI</Text>
            {isEditing ? (
              <TextInput
                style={styles.input}
                value={userData.dui}
                onChangeText={handleChangeDui}
                keyboardType="number-pad"
              />
            ) : (
              <Text style={styles.value}>{userData.dui}</Text>
            )}
            {errorDui ? <Text style={styles.errorText}>{errorDui}</Text> : null}
          </View>

          {/* Dirección */}
          <View style={styles.field}>
            <Text style={styles.label}>Dirección</Text>
            {isEditing ? (
              <>
                <TextInput
                  style={[styles.input, { minHeight: 48 }]}
                  value={userData.direccion}
                  onChangeText={(text) => handleChangeField("direccion", text)}
                  placeholder="Ej. Colonia, ciudad, país"
                  multiline
                />
                <View style={styles.locationButtonsRow}>
                  <TouchableOpacity
                    style={styles.locationButton}
                    onPress={handleUseLocation}
                    disabled={loadingLocation}
                  >
                    {loadingLocation ? (
                      <ActivityIndicator size="small" color="#365b6d" />
                    ) : (
                      <>
                        <Ionicons
                          name="location-outline"
                          size={18}
                          color="#365b6d"
                        />
                        <Text style={styles.locationButtonText}>
                          Usar mi ubicación actual
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.locationButtonOutline}
                    onPress={handleOpenLocationPicker}
                  >
                    <Ionicons name="map-outline" size={18} color="#365b6d" />
                    <Text style={styles.locationButtonOutlineText}>
                      Buscar una ubicación
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <Text style={styles.value}>
                {userData.direccion || "Sin dirección registrada"}
              </Text>
            )}
            {errorDireccion ? (
              <Text style={styles.errorText}>{errorDireccion}</Text>
            ) : null}
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

export default UserInfoScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#E3F2FD",
    paddingTop: Platform.OS === "ios" ? 40 : 24,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#E3F2FD",
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 8,
    color: "#365b6d",
    fontSize: 14,
  },
  topBar: {
    paddingTop: 18,
    paddingHorizontal: 14,
    paddingBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  topIconButton: {
    padding: 6,
    borderRadius: 999,
    backgroundColor: "#E0E9F5",
  },
  topTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#365b6d",
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
    backgroundColor: "#4CAF50",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#E3F2FD",
  },
  username: {
    fontSize: 14,
    color: "#607D8B",
    marginTop: 8,
  },
  fullName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#263238",
  },
  email: {
    fontSize: 13,
    color: "#607D8B",
    marginTop: 2,
  },
  photoHint: {
    fontSize: 12,
    color: "#90A4AE",
    marginTop: 4,
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
    color: "#365b6d",
    marginBottom: 10,
  },
  field: {
    marginBottom: 10,
  },
  fieldRow: {
    flexDirection: "row",
    marginBottom: 10,
  },
  label: {
    fontSize: 12,
    color: "#607D8B",
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
    borderColor: "#CFD8DC",
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    color: "#263238",
  },
  saveButton: {
    marginTop: 12,
    backgroundColor: "#4CAF50",
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
  locationButtonsRow: {
    marginTop: 6,
  },
  locationButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "stretch",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#E0F7FA",
    marginBottom: 8,
  },
  locationButtonText: {
    marginLeft: 6,
    fontSize: 12,
    color: "#365b6d",
  },
  locationButtonOutline: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "stretch",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#B0BEC5",
    backgroundColor: "#FFFFFF",
  },
  locationButtonOutlineText: {
    marginLeft: 6,
    fontSize: 12,
    color: "#365b6d",
  },
});
