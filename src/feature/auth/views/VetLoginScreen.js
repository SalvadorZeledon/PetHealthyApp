import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
  TouchableWithoutFeedback,
  Keyboard,
  Platform,
  StatusBar,
  Modal,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { Dialog, ALERT_TYPE } from "react-native-alert-notification";
import { Ionicons } from "@expo/vector-icons";
import { useFonts, Poppins_700Bold } from "@expo-google-fonts/poppins";
import * as ImagePicker from "expo-image-picker";
import * as MailComposer from "expo-mail-composer";

const logo = require("../../../../assets/logoPH.png");
const SUPPORT_EMAIL = "soporte@pethealthy.com";

const VetLoginScreen = ({ navigation }) => {
  const [fontsLoaded] = useFonts({
    Poppins_700Bold,
  });

  // login veterinario
  const [licenseNumber, setLicenseNumber] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorLicense, setErrorLicense] = useState("");
  const [errorPassword, setErrorPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // modal / solicitud
  const [modalVisible, setModalVisible] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // formulario de solicitud
  const [fullName, setFullName] = useState("");
  const [duiNumber, setDuiNumber] = useState("");
  const [juntaNumber, setJuntaNumber] = useState("");
  const [clinic, setClinic] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [motivation, setMotivation] = useState("");

  // aceptación de términos
  const [acceptTerms, setAcceptTerms] = useState(false);

  // imágenes
  const [duiFront, setDuiFront] = useState(null);
  const [duiBack, setDuiBack] = useState(null);
  const [juntaFront, setJuntaFront] = useState(null);
  const [juntaBack, setJuntaBack] = useState(null);
  const [profilePhoto, setProfilePhoto] = useState(null);

  const passwordInputRef = useRef(null);

  if (!fontsLoaded) {
    return (
      <View style={styles.fontLoadingContainer}>
        <ActivityIndicator size="large" color="#4527A0" />
      </View>
    );
  }

  // ====== LOGIN VETERINARIO ======
  const clearErrors = () => {
    setErrorLicense("");
    setErrorPassword("");
  };

  const validateFormLogin = () => {
    clearErrors();
    let valid = true;

    if (!licenseNumber.trim()) {
      setErrorLicense("Ingresa tu número de junta.");
      valid = false;
    }

    if (!password) {
      setErrorPassword("Ingresa tu contraseña.");
      valid = false;
    }

    if (!valid) {
      Dialog.show({
        type: ALERT_TYPE.WARNING,
        title: "Revisa los campos",
        textBody: "Algunos datos son incorrectos o están incompletos.",
        button: "Entendido",
      });
    }

    return valid;
  };

  const handleLogin = async () => {
    if (!validateFormLogin()) return;

    setLoading(true);

    try {
      // Aquí luego pondrás la lógica real de autenticación del veterinario
      // (Firebase, backend, etc). Si las credenciales son correctas:

      navigation.reset({
        index: 0,
        routes: [{ name: "VetTabs" }], // 👈 nombre del Stack.Screen en AppNavigator
      });
    } catch (error) {
      Dialog.show({
        type: ALERT_TYPE.DANGER,
        title: "Error inesperado",
        textBody:
          "Ocurrió un problema al intentar iniciar sesión. Inténtalo más tarde.",
        button: "Cerrar",
      });
    } finally {
      setLoading(false);
    }
  };

  // ====== FORMATTERS (DUI / TELÉFONO / JUNTA / NOMBRE) ======

  // DUI: 00000000-0
  const handleDuiChange = (text) => {
    let digits = text.replace(/\D/g, "");
    if (digits.length > 9) digits = digits.slice(0, 9);

    let formatted = digits;
    if (digits.length > 8) {
      formatted = digits.slice(0, 8) + "-" + digits.slice(8);
    }
    setDuiNumber(formatted);
  };

  // Teléfono: 1234-5678
  const handlePhoneChange = (text) => {
    let digits = text.replace(/\D/g, "");
    if (digits.length > 8) digits = digits.slice(0, 8);

    let formatted = digits;
    if (digits.length > 4) {
      formatted = digits.slice(0, 4) + "-" + digits.slice(4);
    }
    setPhone(formatted);
  };

  // Junta: solo números, máx 8
  const handleJuntaChange = (text) => {
    let digits = text.replace(/\D/g, "");
    if (digits.length > 8) digits = digits.slice(0, 8);
    setJuntaNumber(digits);
  };

  // Nombre según DUI: guardar siempre en MAYÚSCULAS
  const handleFullNameChange = (text) => {
    setFullName(text.toUpperCase());
  };

  // ====== IMAGE PICKER HELPERS ======
  const requestPermission = async (type) => {
    if (type === "camera") {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      return status === "granted";
    } else {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      return status === "granted";
    }
  };

  const handleSelectImage = async (target, mode) => {
    const hasPermission = await requestPermission(mode);
    if (!hasPermission) {
      Dialog.show({
        type: ALERT_TYPE.WARNING,
        title: "Permiso requerido",
        textBody:
          "Necesitamos acceso a la cámara o a tus fotos para adjuntar los documentos.",
        button: "Entendido",
      });
      return;
    }

    let result;
    if (mode === "camera") {
      result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
    } else {
      result = await ImagePicker.launchImageLibraryAsync({ quality: 0.7 });
    }

    if (result.canceled) return;

    const uri = result.assets[0]?.uri;
    if (!uri) return;

    switch (target) {
      case "duiFront":
        setDuiFront(uri);
        break;
      case "duiBack":
        setDuiBack(uri);
        break;
      case "juntaFront":
        setJuntaFront(uri);
        break;
      case "juntaBack":
        setJuntaBack(uri);
        break;
      case "profilePhoto":
        setProfilePhoto(uri);
        break;
      default:
        break;
    }
  };

  // ====== VALIDAR Y ENVIAR SOLICITUD ======
  const isDuiValid = duiNumber.length === 10;
  const isPhoneValid = phone.length === 9;
  const isJuntaValid = juntaNumber.length > 0 && juntaNumber.length <= 8;

  const isFormFilled =
    fullName.trim() &&
    duiNumber.trim() &&
    juntaNumber.trim() &&
    clinic.trim() &&
    phone.trim() &&
    city.trim() &&
    motivation.trim();

  const hasAllDocs =
    duiFront && duiBack && juntaFront && juntaBack && profilePhoto;

  const isSolicitudReady = Boolean(
    isFormFilled &&
      hasAllDocs &&
      isDuiValid &&
      isPhoneValid &&
      isJuntaValid &&
      acceptTerms
  );

  const validateSolicitud = () => {
    if (!isFormFilled) {
      Dialog.show({
        type: ALERT_TYPE.WARNING,
        title: "Formulario incompleto",
        textBody:
          "Por favor completa todos los campos del formulario de solicitud.",
        button: "Entendido",
      });
      return false;
    }

    if (!isDuiValid) {
      Dialog.show({
        type: ALERT_TYPE.WARNING,
        title: "DUI no válido",
        textBody:
          "El número de DUI debe tener el formato 00000000-0. Verifica los dígitos ingresados.",
        button: "Entendido",
      });
      return false;
    }

    if (!isPhoneValid) {
      Dialog.show({
        type: ALERT_TYPE.WARNING,
        title: "Teléfono no válido",
        textBody:
          "El número de teléfono debe tener el formato 1234-5678. Verifica los dígitos ingresados.",
        button: "Entendido",
      });
      return false;
    }

    if (!isJuntaValid) {
      Dialog.show({
        type: ALERT_TYPE.WARNING,
        title: "Número de junta no válido",
        textBody:
          "El número de junta debe contener solo dígitos y tener un máximo de 8 caracteres.",
        button: "Entendido",
      });
      return false;
    }

    if (!hasAllDocs) {
      Dialog.show({
        type: ALERT_TYPE.WARNING,
        title: "Faltan documentos",
        textBody:
          "Por favor adjunta todas las fotos solicitadas (DUI, carnet de junta y foto personal).",
        button: "Entendido",
      });
      return false;
    }

    if (!acceptTerms) {
      Dialog.show({
        type: ALERT_TYPE.WARNING,
        title: "Términos y condiciones",
        textBody:
          "Debes confirmar que aceptas los términos y condiciones de PetHealthy para continuar.",
        button: "Entendido",
      });
      return false;
    }

    return true;
  };

  const handleSendRequest = async () => {
    if (!validateSolicitud()) return;

    const subject = "Solicitud de cuenta profesional - Veterinario";

    const body = `
Buenas tardes a quien corresponda,

Mi nombre es ${fullName}, con número de DUI ${duiNumber} y número de junta veterinaria ${juntaNumber}. 
Por medio de la presente, solicito muy respetuosamente ser considerado como miembro de la aplicación PetHealthy 
en calidad de asesor veterinario.

Como profesional de la salud animal, estoy interesado en colaborar con la plataforma para brindar atención,
orientación y acompañamiento responsable a los tutores de mascotas que forman parte de la comunidad de PetHealthy.

A continuación detallo mis datos personales y de contacto:

Nombre según DUI: ${fullName}
Número de DUI: ${duiNumber}
Número de junta veterinaria: ${juntaNumber}
Clínica donde laboro: ${clinic}
Teléfono de contacto: ${phone}
Ciudad/País: ${city}

Motivo por el cual deseo ser parte de PetHealthy:
${motivation}

Adjunto a este correo la siguiente documentación de respaldo:

- Fotografía de mi DUI (frente y reverso).
- Fotografía de mi carnet de junta veterinaria (frente y reverso).
- Fotografía personal reciente, la cual puede ser utilizada como foto de perfil dentro de la aplicación.

Agradezco de antemano el tiempo dedicado a la revisión de mi solicitud y quedo atento(a) a cualquier información
adicional que consideren necesaria.

Atentamente,

${fullName}
`;

    const isAvailable = await MailComposer.isAvailableAsync();
    if (!isAvailable) {
      Dialog.show({
        type: ALERT_TYPE.WARNING,
        title: "Correo no disponible",
        textBody:
          "No pudimos abrir el editor de correo. Copia esta información y envíala manualmente a " +
          SUPPORT_EMAIL,
        button: "Entendido",
      });
      return;
    }

    const attachments = [
      duiFront,
      duiBack,
      juntaFront,
      juntaBack,
      profilePhoto,
    ].filter(Boolean);

    try {
      await MailComposer.composeAsync({
        recipients: [SUPPORT_EMAIL],
        subject,
        body,
        attachments,
      });

      setModalVisible(false);
    } catch (error) {
      Dialog.show({
        type: ALERT_TYPE.DANGER,
        title: "Error al enviar",
        textBody:
          "Ocurrió un problema al intentar preparar el correo. Inténtalo de nuevo.",
        button: "Cerrar",
      });
    }
  };

  return (
    <KeyboardAwareScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      enableOnAndroid={true}
      extraScrollHeight={32}
      keyboardShouldPersistTaps="handled"
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View style={styles.inner}>
          <View style={styles.logoContainer}>
            <Image source={logo} style={styles.logo} resizeMode="contain" />
            <Text style={styles.appName}>PetHealthyApp</Text>
            <Text style={styles.appSubtitle}>
              Ingreso profesional para veterinarios 🩺🐾
            </Text>
          </View>

          <View style={styles.card}>
            <View style={styles.pawBackground}>
              <Ionicons name="paw" size={80} color="#B39DDB" />
            </View>

            <Text style={styles.cardTitle}>Ingreso para profesionales</Text>
            <Text style={styles.cardSubtitle}>
              Ingresa con tu número de junta y la contraseña que te proporcionó
              el equipo de PetHealthy.
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Número de junta"
              placeholderTextColor="#7a8b8c"
              value={licenseNumber}
              onChangeText={(text) => {
                setLicenseNumber(text);
                if (errorLicense) setErrorLicense("");
              }}
              autoCapitalize="none"
              keyboardType={Platform.OS === "ios" ? "number-pad" : "numeric"}
              returnKeyType="next"
              onSubmitEditing={() => passwordInputRef.current?.focus()}
            />
            {errorLicense ? (
              <Text style={styles.errorText}>{errorLicense}</Text>
            ) : null}

            <View style={styles.inputPasswordContainer}>
              <TextInput
                ref={passwordInputRef}
                style={styles.inputPassword}
                placeholder="Contraseña"
                placeholderTextColor="#7a8b8c"
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (errorPassword) setErrorPassword("");
                }}
                secureTextEntry={!showPassword}
                returnKeyType="done"
                onSubmitEditing={handleLogin}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color="#B0BEC5"
                />
              </TouchableOpacity>
            </View>
            {errorPassword ? (
              <Text style={styles.errorText}>{errorPassword}</Text>
            ) : null}

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryButtonText}>Iniciar sesión</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setModalVisible(true)}
              style={{ marginTop: 8 }}
            >
              <Text style={styles.vetLinkText}>
                ¿Quisieras tener una cuenta con nosotros?{" "}
                <Text style={styles.vetLinkBold}>Formulario de solicitud</Text>
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={{ marginTop: 8 }}
            >
              <Text style={styles.linkText}>
                Volver al{" "}
                <Text style={styles.linkTextBold}>
                  inicio de sesión de clientes
                </Text>
              </Text>
            </TouchableOpacity>

            <Text style={styles.helperText}>
              El acceso profesional es exclusivo para veterinarios validados por
              el equipo de PetHealthy.
            </Text>
          </View>

          <Text style={styles.footerText}>
            Cuidando la salud de tus pacientes con PetHealthy 💜
          </Text>
        </View>
      </TouchableWithoutFeedback>

      {/* MODAL SOLICITUD */}
      <Modal
        visible={modalVisible}
        animationType="fade"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback
            onPress={Keyboard.dismiss}
            accessible={false}
          >
            <View style={styles.modalCard}>
              <KeyboardAwareScrollView
                enableOnAndroid
                extraScrollHeight={24}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={styles.modalScrollContent}
              >
                <Text style={styles.modalTitle}>
                  Solicitud de cuenta profesional
                </Text>

                <Text style={styles.modalIntro}>
                  Para formar parte de PetHealthy como veterinario, necesitamos
                  validar tu información profesional.
                </Text>

                <Text style={styles.modalSectionTitle}>¿Cómo funciona?</Text>
                <Text style={styles.modalText}>
                  Completa brevemente el siguiente formulario{" "}
                  <Text style={styles.required}>*</Text>, adjunta las fotos
                  solicitadas y luego tocaremos en{" "}
                  <Text style={styles.bold}>“Enviar solicitud”</Text> para crear
                  un correo con toda la información lista para enviar.
                </Text>

                <TouchableOpacity
                  style={styles.formToggleButton}
                  onPress={() => setShowForm((prev) => !prev)}
                >
                  <Ionicons
                    name={showForm ? "chevron-up" : "chevron-down"}
                    size={18}
                    color="#7B1FA2"
                  />
                  <Text style={styles.formToggleText}>
                    {showForm
                      ? "Ocultar formulario de solicitud"
                      : "Mostrar formulario de solicitud"}
                  </Text>
                </TouchableOpacity>

                {showForm && (
                  <>
                    {/* DATOS PERSONALES */}
                    <Text style={[styles.modalSectionTitle, { marginTop: 12 }]}>
                      Datos personales
                    </Text>

                    <View style={styles.fieldGroup}>
                      <Text style={styles.fieldLabel}>
                        Nombre según DUI <Text style={styles.required}>*</Text>
                      </Text>
                      <TextInput
                        style={styles.fieldInput}
                        placeholder="NOMBRE COMPLETO SEGÚN TU DUI"
                        placeholderTextColor="#9CA3AF"
                        value={fullName}
                        onChangeText={handleFullNameChange}
                        autoCapitalize="characters"
                      />
                    </View>

                    <View style={styles.fieldGroup}>
                      <Text style={styles.fieldLabel}>
                        Número de DUI <Text style={styles.required}>*</Text>
                      </Text>
                      <TextInput
                        style={styles.fieldInput}
                        placeholder="05843324-3"
                        placeholderTextColor="#9CA3AF"
                        value={duiNumber}
                        onChangeText={handleDuiChange}
                        keyboardType="number-pad"
                        maxLength={10}
                      />
                    </View>

                    <View style={styles.fieldGroup}>
                      <Text style={styles.fieldLabel}>
                        Número de junta / registro profesional{" "}
                        <Text style={styles.required}>*</Text>
                      </Text>
                      <TextInput
                        style={styles.fieldInput}
                        placeholder="Ej. 76655"
                        placeholderTextColor="#9CA3AF"
                        value={juntaNumber}
                        onChangeText={handleJuntaChange}
                        keyboardType="number-pad"
                        maxLength={8}
                      />
                    </View>

                    <View style={styles.fieldGroup}>
                      <Text style={styles.fieldLabel}>
                        Clínica donde laboras{" "}
                        <Text style={styles.required}>*</Text>
                      </Text>
                      <TextInput
                        style={styles.fieldInput}
                        placeholder="Nombre de la clínica"
                        placeholderTextColor="#9CA3AF"
                        value={clinic}
                        onChangeText={setClinic}
                      />
                    </View>

                    <View style={styles.fieldGroup}>
                      <Text style={styles.fieldLabel}>
                        Teléfono de contacto{" "}
                        <Text style={styles.required}>*</Text>
                      </Text>
                      <TextInput
                        style={styles.fieldInput}
                        placeholder="1234-5678"
                        placeholderTextColor="#9CA3AF"
                        value={phone}
                        onChangeText={handlePhoneChange}
                        keyboardType="phone-pad"
                        maxLength={9}
                      />
                    </View>

                    <View style={styles.fieldGroup}>
                      <Text style={styles.fieldLabel}>
                        Ciudad / País <Text style={styles.required}>*</Text>
                      </Text>
                      <TextInput
                        style={styles.fieldInput}
                        placeholder="Ej. San Salvador, El Salvador"
                        placeholderTextColor="#9CA3AF"
                        value={city}
                        onChangeText={setCity}
                      />
                    </View>

                    <View style={styles.fieldGroup}>
                      <Text style={styles.fieldLabel}>
                        ¿Por qué quieres ser parte de PetHealthy?{" "}
                        <Text style={styles.required}>*</Text>
                      </Text>
                      <TextInput
                        style={[styles.fieldInput, { height: 80 }]}
                        placeholder="Cuéntanos brevemente tu motivación"
                        placeholderTextColor="#9CA3AF"
                        value={motivation}
                        onChangeText={setMotivation}
                        multiline
                      />
                    </View>

                    <View style={styles.sectionDivider} />

                    {/* DOCUMENTOS */}
                    <View style={styles.attachmentHeader}>
                      <View style={styles.attachmentIconWrapper}>
                        <Ionicons
                          name="document-text-outline"
                          size={18}
                          color="#7B1FA2"
                        />
                      </View>
                      <Text style={styles.modalSectionTitle}>
                        Documentos que debes adjuntar{" "}
                        <Text style={styles.required}>*</Text>
                      </Text>
                    </View>

                    {/* DUI */}
                    <View style={styles.docBlock}>
                      <Text style={styles.docTitle}>
                        DUI (frente y reverso){" "}
                        <Text style={styles.required}>*</Text>
                      </Text>
                      <Text style={styles.docSubtitle}>
                        Toma o selecciona fotos claras de ambas caras de tu DUI.
                      </Text>

                      <View style={styles.docRow}>
                        <View style={styles.docItem}>
                          <Text style={styles.docLabel}>Frente</Text>
                          <View style={styles.docPreviewWrapper}>
                            {duiFront ? (
                              <Image
                                source={{ uri: duiFront }}
                                style={styles.docPreview}
                              />
                            ) : (
                              <Ionicons
                                name="image-outline"
                                size={24}
                                color="#B0BEC5"
                              />
                            )}
                          </View>
                          <View style={styles.docButtonsRow}>
                            <TouchableOpacity
                              style={styles.docButton}
                              onPress={() =>
                                handleSelectImage("duiFront", "camera")
                              }
                            >
                              <Ionicons
                                name="camera-outline"
                                size={16}
                                color="#7B1FA2"
                              />
                              <Text style={styles.docButtonText}>Cámara</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={styles.docButton}
                              onPress={() =>
                                handleSelectImage("duiFront", "gallery")
                              }
                            >
                              <Ionicons
                                name="images-outline"
                                size={16}
                                color="#7B1FA2"
                              />
                              <Text style={styles.docButtonText}>Galería</Text>
                            </TouchableOpacity>
                          </View>
                        </View>

                        <View style={styles.docItem}>
                          <Text style={styles.docLabel}>Reverso</Text>
                          <View style={styles.docPreviewWrapper}>
                            {duiBack ? (
                              <Image
                                source={{ uri: duiBack }}
                                style={styles.docPreview}
                              />
                            ) : (
                              <Ionicons
                                name="image-outline"
                                size={24}
                                color="#B0BEC5"
                              />
                            )}
                          </View>
                          <View style={styles.docButtonsRow}>
                            <TouchableOpacity
                              style={styles.docButton}
                              onPress={() =>
                                handleSelectImage("duiBack", "camera")
                              }
                            >
                              <Ionicons
                                name="camera-outline"
                                size={16}
                                color="#7B1FA2"
                              />
                              <Text style={styles.docButtonText}>Cámara</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={styles.docButton}
                              onPress={() =>
                                handleSelectImage("duiBack", "gallery")
                              }
                            >
                              <Ionicons
                                name="images-outline"
                                size={16}
                                color="#7B1FA2"
                              />
                              <Text style={styles.docButtonText}>Galería</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      </View>
                    </View>

                    {/* CARNET JUNTA */}
                    <View style={styles.docBlock}>
                      <Text style={styles.docTitle}>
                        Carnet de junta veterinaria{" "}
                        <Text style={styles.required}>*</Text>
                      </Text>
                      <Text style={styles.docSubtitle}>
                        Adjunta fotos de tu carnet profesional (frente y
                        reverso).
                      </Text>

                      <View style={styles.docRow}>
                        <View style={styles.docItem}>
                          <Text style={styles.docLabel}>Frente</Text>
                          <View style={styles.docPreviewWrapper}>
                            {juntaFront ? (
                              <Image
                                source={{ uri: juntaFront }}
                                style={styles.docPreview}
                              />
                            ) : (
                              <Ionicons
                                name="image-outline"
                                size={24}
                                color="#B0BEC5"
                              />
                            )}
                          </View>
                          <View style={styles.docButtonsRow}>
                            <TouchableOpacity
                              style={styles.docButton}
                              onPress={() =>
                                handleSelectImage("juntaFront", "camera")
                              }
                            >
                              <Ionicons
                                name="camera-outline"
                                size={16}
                                color="#7B1FA2"
                              />
                              <Text style={styles.docButtonText}>Cámara</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={styles.docButton}
                              onPress={() =>
                                handleSelectImage("juntaFront", "gallery")
                              }
                            >
                              <Ionicons
                                name="images-outline"
                                size={16}
                                color="#7B1FA2"
                              />
                              <Text style={styles.docButtonText}>Galería</Text>
                            </TouchableOpacity>
                          </View>
                        </View>

                        <View style={styles.docItem}>
                          <Text style={styles.docLabel}>Reverso</Text>
                          <View style={styles.docPreviewWrapper}>
                            {juntaBack ? (
                              <Image
                                source={{ uri: juntaBack }}
                                style={styles.docPreview}
                              />
                            ) : (
                              <Ionicons
                                name="image-outline"
                                size={24}
                                color="#B0BEC5"
                              />
                            )}
                          </View>
                          <View style={styles.docButtonsRow}>
                            <TouchableOpacity
                              style={styles.docButton}
                              onPress={() =>
                                handleSelectImage("juntaBack", "camera")
                              }
                            >
                              <Ionicons
                                name="camera-outline"
                                size={16}
                                color="#7B1FA2"
                              />
                              <Text style={styles.docButtonText}>Cámara</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={styles.docButton}
                              onPress={() =>
                                handleSelectImage("juntaBack", "gallery")
                              }
                            >
                              <Ionicons
                                name="images-outline"
                                size={16}
                                color="#7B1FA2"
                              />
                              <Text style={styles.docButtonText}>Galería</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      </View>
                    </View>

                    {/* FOTO PERSONAL */}
                    <View style={styles.docBlock}>
                      <Text style={styles.docTitle}>
                        Foto personal reciente{" "}
                        <Text style={styles.required}>*</Text>
                      </Text>
                      <Text style={styles.docSubtitle}>
                        Esta foto se utilizará también como foto de perfil en
                        PetHealthy.
                      </Text>

                      <View style={styles.docRow}>
                        <View style={[styles.docItem, { flex: 1 }]}>
                          <Text style={styles.docLabel}>Foto</Text>
                          <View style={styles.docPreviewWrapper}>
                            {profilePhoto ? (
                              <Image
                                source={{ uri: profilePhoto }}
                                style={styles.docPreview}
                              />
                            ) : (
                              <Ionicons
                                name="person-circle-outline"
                                size={32}
                                color="#B0BEC5"
                              />
                            )}
                          </View>
                          <View style={styles.docButtonsRow}>
                            <TouchableOpacity
                              style={styles.docButton}
                              onPress={() =>
                                handleSelectImage("profilePhoto", "camera")
                              }
                            >
                              <Ionicons
                                name="camera-outline"
                                size={16}
                                color="#7B1FA2"
                              />
                              <Text style={styles.docButtonText}>Cámara</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={styles.docButton}
                              onPress={() =>
                                handleSelectImage("profilePhoto", "gallery")
                              }
                            >
                              <Ionicons
                                name="images-outline"
                                size={16}
                                color="#7B1FA2"
                              />
                              <Text style={styles.docButtonText}>Galería</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      </View>
                    </View>

                    {/* CHECKBOX TÉRMINOS */}
                    <View style={styles.sectionDivider} />
                    <TouchableOpacity
                      style={styles.checkboxRow}
                      onPress={() => setAcceptTerms((prev) => !prev)}
                      activeOpacity={0.7}
                    >
                      <View
                        style={[
                          styles.checkboxBox,
                          acceptTerms && styles.checkboxBoxChecked,
                        ]}
                      >
                        {acceptTerms && (
                          <Ionicons
                            name="checkmark"
                            size={16}
                            color="#FFFFFF"
                          />
                        )}
                      </View>
                      <Text style={styles.checkboxText}>
                        Confirmo que he leído y acepto los{" "}
                        <Text style={styles.checkboxLinkText}>
                          términos y condiciones
                        </Text>{" "}
                        de PetHealthy.
                      </Text>
                    </TouchableOpacity>
                  </>
                )}

                <Text style={styles.modalFooterText}>
                  Todos los campos marcados con{" "}
                  <Text style={styles.required}>*</Text> son obligatorios. Al
                  tocar en <Text style={styles.bold}>“Enviar solicitud”</Text>,
                  se abrirá tu aplicación de correo con toda la información y
                  las fotos adjuntas listas para enviar.
                </Text>

                <TouchableOpacity
                  style={[
                    styles.primaryButton,
                    { marginTop: 12 },
                    !isSolicitudReady && styles.primaryButtonDisabled,
                  ]}
                  onPress={handleSendRequest}
                  disabled={!isSolicitudReady}
                >
                  <Text style={styles.primaryButtonText}>Enviar solicitud</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.secondaryButtonText}>Cerrar</Text>
                </TouchableOpacity>
              </KeyboardAwareScrollView>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </Modal>
    </KeyboardAwareScrollView>
  );
};

export default VetLoginScreen;

// ====== ESTILOS ======
const styles = StyleSheet.create({
  fontLoadingContainer: {
    flex: 1,
    backgroundColor: "#F3E5F5",
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    flex: 1,
    backgroundColor: "#F3E5F5",
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  inner: {
    flex: 1,
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  logo: {
    width: 190,
    height: 190,
    marginBottom: 6,
  },
  appName: {
    fontSize: 26,
    fontFamily: "Poppins_700Bold",
    color: "#4527A0",
  },
  appSubtitle: {
    fontSize: 14,
    color: "#7B1FA2",
    marginTop: 2,
    marginBottom: 12,
    textAlign: "center",
  },
  card: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 20,
    marginBottom: 16,
    elevation: 4,
    overflow: "hidden",
  },
  pawBackground: {
    position: "absolute",
    right: -10,
    top: -10,
    opacity: 0.12,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 4,
    color: "#311B92",
  },
  cardSubtitle: {
    fontSize: 13,
    color: "#5E35B1",
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    backgroundColor: "#F9FAFB",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: "#D1C4E9",
    fontSize: 14,
    color: "#263238",
  },
  inputPasswordContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#D1C4E9",
    paddingHorizontal: 8,
    marginTop: 8,
  },
  inputPassword: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 4,
    fontSize: 14,
    color: "#263238",
  },
  eyeButton: {
    padding: 4,
  },
  primaryButton: {
    backgroundColor: "#7B1FA2",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 16,
    marginBottom: 12,
  },
  primaryButtonDisabled: {
    backgroundColor: "#CE93D8",
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
  linkText: {
    textAlign: "center",
    color: "#4527A0",
    fontSize: 13,
  },
  linkTextBold: {
    color: "#303F9F",
    fontWeight: "600",
  },
  vetLinkText: {
    textAlign: "center",
    color: "#5E35B1",
    fontSize: 12,
  },
  vetLinkBold: {
    color: "#7B1FA2",
    fontWeight: "600",
  },
  helperText: {
    fontSize: 11,
    color: "#9575CD",
    textAlign: "center",
    marginTop: 8,
  },
  footerText: {
    fontSize: 12,
    color: "#8E24AA",
    textAlign: "center",
    marginBottom: 4,
  },
  errorText: {
    color: "#e53935",
    fontSize: 12,
    marginBottom: 4,
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  modalCard: {
    maxHeight: "90%",
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
  },
  modalScrollContent: {
    paddingBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#311B92",
    marginBottom: 8,
    textAlign: "center",
  },
  modalIntro: {
    fontSize: 14,
    color: "#4B5563",
    marginBottom: 8,
  },
  modalSectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#7B1FA2",
    marginTop: 4,
    marginBottom: 4,
  },
  modalText: {
    fontSize: 13,
    color: "#4B5563",
    marginBottom: 6,
  },
  modalFooterText: {
    fontSize: 12,
    color: "#607D8B",
    marginTop: 6,
  },
  bold: {
    fontWeight: "700",
  },
  required: {
    color: "#e53935",
    fontWeight: "700",
  },
  formToggleButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#EDE7F6",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: 8,
  },
  formToggleText: {
    marginLeft: 6,
    fontSize: 12,
    color: "#7B1FA2",
    fontWeight: "600",
  },
  fieldGroup: {
    marginBottom: 8,
  },
  fieldLabel: {
    fontSize: 13,
    color: "#374151",
    marginBottom: 4,
  },
  fieldInput: {
    backgroundColor: "#F9FAFB",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#D1C4E9",
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    color: "#263238",
  },
  sectionDivider: {
    height: 1,
    backgroundColor: "#ECEFF1",
    marginVertical: 10,
  },
  attachmentHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  attachmentIconWrapper: {
    width: 28,
    height: 28,
    borderRadius: 999,
    backgroundColor: "#EDE7F6",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  docBlock: {
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    padding: 10,
    marginTop: 8,
  },
  docTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#263238",
    marginBottom: 2,
  },
  docSubtitle: {
    fontSize: 11,
    color: "#607D8B",
    marginBottom: 6,
  },
  docRow: {
    flexDirection: "row",
    gap: 8,
  },
  docItem: {
    flex: 1,
  },
  docLabel: {
    fontSize: 11,
    color: "#455A64",
    marginBottom: 4,
  },
  docPreviewWrapper: {
    height: 70,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#D1C4E9",
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
    overflow: "hidden",
  },
  docPreview: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  docButtonsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 4,
  },
  docButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#D1C4E9",
    paddingVertical: 4,
    paddingHorizontal: 6,
    backgroundColor: "#EDE7F6",
  },
  docButtonText: {
    fontSize: 11,
    marginLeft: 4,
    color: "#7B1FA2",
    fontWeight: "600",
  },
  secondaryButton: {
    marginTop: 10,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#D1C4E9",
    alignItems: "center",
  },
  secondaryButtonText: {
    fontSize: 14,
    color: "#4527A0",
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },
  checkboxBox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: "#90A4AE",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
    backgroundColor: "#FFFFFF",
  },
  checkboxBoxChecked: {
    backgroundColor: "#7B1FA2",
    borderColor: "#7B1FA2",
  },
  checkboxText: {
    flex: 1,
    fontSize: 12,
    color: "#455A64",
  },
  checkboxLinkText: {
    color: "#303F9F",
    fontWeight: "600",
  },
});
