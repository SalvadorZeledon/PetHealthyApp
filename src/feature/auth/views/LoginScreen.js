// src/feature/auth/views/Loginscreen.js
import React, { useState, useRef, useEffect } from "react";
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
import { doc, getDoc } from "firebase/firestore";
import { db, auth } from "../../../../firebase/config";
import { COL_USUARIOS } from "../../../shared/utils/collections";
import { saveUserToStorage } from "../../../shared/utils/storage";
import { Dialog, ALERT_TYPE } from "react-native-alert-notification";
import { Ionicons } from "@expo/vector-icons";
import { useFonts, Poppins_700Bold } from "@expo-google-fonts/poppins";
import { useTheme } from "../../../themes/useTheme";
import {
  signInWithEmailAndPassword,
  sendEmailVerification,
} from "firebase/auth";

const logo = require("../../../../assets/logoPH.png");

const LoginScreen = ({ navigation }) => {
  // 👇 usar el tema
  const { colors, mode } = useTheme();
  const isDark = mode === "dark";

  const [fontsLoaded] = useFonts({
    Poppins_700Bold,
  });

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorEmail, setErrorEmail] = useState("");
  const [errorPassword, setErrorPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const passwordInputRef = useRef(null);

  // 🔹 Modal + cooldown para correo no verificado
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [verificationCooldown, setVerificationCooldown] = useState(0);
  const [unverifiedUser, setUnverifiedUser] = useState(null);

  // ⏱️ Timer del cooldown
  useEffect(() => {
    let timer;
    if (showVerificationModal && verificationCooldown > 0) {
      timer = setInterval(() => {
        setVerificationCooldown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [showVerificationModal, verificationCooldown]);

  if (!fontsLoaded) {
    return (
      <View
        style={[
          styles.fontLoadingContainer,
          { backgroundColor: colors.background },
        ]}
      >
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  const clearErrors = () => {
    setErrorEmail("");
    setErrorPassword("");
  };

  const validateForm = () => {
    clearErrors();
    let valid = true;

    if (!email.trim()) {
      setErrorEmail("Ingresa tu correo.");
      valid = false;
    } else {
      const emailRegex = /\S+@\S+\.\S+/;
      if (!emailRegex.test(email.trim().toLowerCase())) {
        setErrorEmail("Correo electrónico no válido.");
        valid = false;
      }
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
    if (!validateForm()) return;
    setLoading(true);

    try {
      const cred = await signInWithEmailAndPassword(
        auth,
        email.trim().toLowerCase(),
        password
      );

      const fbUser = cred.user;
      await fbUser.reload();

      if (!fbUser.emailVerified) {
        setUnverifiedUser(fbUser);
        setVerificationCooldown(30);
        setShowVerificationModal(true);
        setLoading(false);
        return;
      }

      const userDocRef = doc(db, COL_USUARIOS, fbUser.uid);
      const snap = await getDoc(userDocRef);

      if (!snap.exists()) {
        setLoading(false);
        Dialog.show({
          type: ALERT_TYPE.DANGER,
          title: "Error",
          textBody:
            "Tu cuenta está verificada pero falta información de perfil. Contacta soporte.",
          button: "Entendido",
        });
        return;
      }

      const userData = { id: fbUser.uid, ...snap.data() };
      console.log("Usuario logueado:", userData);

      await saveUserToStorage({
        id: userData.id,
        email: userData.email,
        nombre: userData.nombre || "",
        rol: userData.rol || "cliente",
        perfilCompleto: !!userData.perfilCompleto,
        tieneFotoLocal: !!userData.tieneFotoLocal,
        username: userData.username || "",
        nombres: userData.nombres || "",
        apellidos: userData.apellidos || "",
        edad: userData.edad || "",
        dui: userData.dui || "",
        telefono: userData.telefono || "",
        direccion: userData.direccion || "",
      });

      const hasPhoto =
        userData.fotoPerfilUrl || userData.tieneFotoLocal === true;

      const needsProfile = !userData.perfilCompleto;
      const needsPhoto = userData.perfilCompleto && !hasPhoto;

      let nextRoute = "MainTabs";
      let nextParams = {};

      if (needsProfile) {
        nextRoute = "CompleteProfile";
        nextParams = { userId: userData.id };
      } else if (needsPhoto) {
        nextRoute = "ProfilePhotoSetup";
        nextParams = { userId: userData.id };
      }

      Dialog.show({
        type: ALERT_TYPE.SUCCESS,
        title: "Bienvenido",
        textBody: `Hola ${userData.nombre || ""}, nos alegra verte 🐾`,
        button: "Continuar",
        onHide: () => {
          if (nextRoute === "MainTabs") {
            navigation.reset({
              index: 0,
              routes: [{ name: "MainTabs" }],
            });
          } else {
            navigation.reset({
              index: 0,
              routes: [{ name: nextRoute, params: nextParams }],
            });
          }
        },
      });
    } catch (error) {
      console.log("Error en login:", error);

      let msg = "Email o contraseña incorrectos. Inténtalo de nuevo.";
      if (error.code === "auth/invalid-email") {
        msg = "El correo no es válido.";
        setErrorEmail("Correo electrónico no válido.");
      } else if (
        error.code === "auth/user-not-found" ||
        error.code === "auth/wrong-password"
      ) {
        setErrorPassword("Email o contraseña incorrectos.");
      }

      Dialog.show({
        type: ALERT_TYPE.DANGER,
        title: "Error al iniciar sesión",
        textBody: msg,
        button: "Cerrar",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVetLoginPress = () => {
    // Nuevo flujo: ir a la pantalla de login para veterinarios
    navigation.navigate("VetLogin");
  };

  const handleResendVerification = async () => {
    if (!unverifiedUser || verificationCooldown > 0) return;

    try {
      setLoading(true);
      await sendEmailVerification(unverifiedUser);
      setVerificationCooldown(30);

      Dialog.show({
        type: ALERT_TYPE.SUCCESS,
        title: "Correo reenviado",
        textBody:
          "Te enviamos un nuevo enlace de verificación. Revisa tu bandeja de entrada o spam.",
        button: "Entendido",
      });
    } catch (err) {
      console.log("Error al reenviar verificación (login):", err);

      let msg =
        "No pudimos reenviar el correo de verificación. Inténtalo más tarde.";
      if (err.code === "auth/too-many-requests") {
        msg =
          "Has solicitado varios correos de verificación en poco tiempo. Espera unos minutos antes de intentarlo de nuevo.";
      }

      Dialog.show({
        type: ALERT_TYPE.DANGER,
        title: "Error",
        textBody: msg,
        button: "Entendido",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCloseVerificationModal = () => {
    setShowVerificationModal(false);
  };

  return (
    <>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle={isDark ? "light-content" : "dark-content"}
      />

      <KeyboardAwareScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.scrollContent}
        enableOnAndroid={true}
        extraScrollHeight={32}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <View style={styles.inner}>
            <View style={styles.logoContainer}>
              <Image source={logo} style={styles.logo} resizeMode="contain" />
              <Text
                style={[
                  styles.appName,
                  { color: colors.accent }, // antes #365b6d
                ]}
              >
                PetHealthyApp
              </Text>
              <Text
                style={[
                  styles.appSubtitle,
                  { color: colors.success }, // antes #558B2F
                ]}
              >
                Tu clínica veterinaria en el bolsillo 🐶💚
              </Text>
            </View>

            <View
              style={[
                styles.card,
                {
                  backgroundColor: colors.card,
                  shadowColor: isDark ? "#000" : "#000",
                },
              ]}
            >
              <View style={styles.pawBackground}>
                <Ionicons
                  name="paw"
                  size={80}
                  color={isDark ? "#546E7A" : "#90A4AE"}
                />
              </View>

              <Text
                style={[
                  styles.cardTitle,
                  { color: colors.text }, // antes #263238
                ]}
              >
                Iniciar sesión
              </Text>
              <Text
                style={[
                  styles.cardSubtitle,
                  { color: colors.subtitle }, // antes #607D8B
                ]}
              >
                Ingresa con tu correo para ver la información de tus mascotas y
                sus consultas.
              </Text>

              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.inputBackground,
                    borderColor: colors.inputBorder,
                    color: colors.text,
                  },
                ]}
                placeholder="Correo electrónico"
                placeholderTextColor={colors.placeholder}
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (errorEmail) setErrorEmail("");
                }}
                autoCapitalize="none"
                keyboardType="email-address"
                returnKeyType="next"
                autoFocus={true}
                onSubmitEditing={() => passwordInputRef.current?.focus()}
              />
              {errorEmail ? (
                <Text style={[styles.errorText, { color: colors.error }]}>
                  {errorEmail}
                </Text>
              ) : null}

              <View
                style={[
                  styles.inputPasswordContainer,
                  {
                    backgroundColor: colors.inputBackground,
                    borderColor: colors.inputBorder,
                  },
                ]}
              >
                <TextInput
                  ref={passwordInputRef}
                  style={[styles.inputPassword, { color: colors.text }]}
                  placeholder="Contraseña"
                  placeholderTextColor={colors.placeholder}
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
                    color={colors.subtitle}
                  />
                </TouchableOpacity>
              </View>
              {errorPassword ? (
                <Text style={[styles.errorText, { color: colors.error }]}>
                  {errorPassword}
                </Text>
              ) : null}

              <TouchableOpacity
                style={[
                  styles.primaryButton,
                  { backgroundColor: colors.primary },
                ]}
                onPress={handleLogin}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={colors.primaryText} />
                ) : (
                  <Text
                    style={[
                      styles.primaryButtonText,
                      { color: colors.primaryText },
                    ]}
                  >
                    Ingresar
                  </Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity onPress={() => navigation.navigate("Register")}>
                <Text style={[styles.linkText, { color: colors.subtitle }]}>
                  ¿Es tu primera vez?{" "}
                  <Text style={[styles.linkTextBold, { color: colors.link }]}>
                    Crea una cuenta
                  </Text>
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleVetLoginPress}
                style={{ marginTop: 8 }}
              >
                <Text style={[styles.vetLinkText, { color: colors.subtitle }]}>
                  ¿Eres veterinario?{" "}
                  <Text style={[styles.vetLinkBold, { color: colors.vetLink }]}>
                    Acceso profesional
                  </Text>
                </Text>
              </TouchableOpacity>

              <Text style={[styles.helperText, { color: colors.footerText }]}>
                Al iniciar sesión podrás ver el historial de vacunas y consultas
                de tus mascotas.
              </Text>
            </View>

            <Text style={[styles.footerText, { color: colors.footerText }]}>
              Hecho con ❤️ para tus mascotas
            </Text>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAwareScrollView>

      {/* 🔹 Modal de verificación de correo */}
      <Modal
        visible={showVerificationModal}
        transparent
        animationType="fade"
        onRequestClose={() => {}}
      >
        <View
          style={[
            styles.modalOverlay,
            { backgroundColor: colors.modalOverlay },
          ]}
        >
          <View
            style={[styles.modalCard, { backgroundColor: colors.modalCard }]}
          >
            <Ionicons
              name="mail-open-outline"
              size={40}
              color={colors.accent}
              style={{ marginBottom: 8 }}
            />
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Verifica tu correo
            </Text>
            <Text style={[styles.modalText, { color: colors.subtitle }]}>
              Te enviamos un enlace de verificación a tu correo electrónico.
              {"\n\n"}
              1️⃣ Revisa tu bandeja de entrada y spam.{"\n"}
              2️⃣ Abre el mensaje de PetHealthyApp y abre el enlace.
              {"\n"}
              3️⃣ Luego vuelve aquí e intenta iniciar sesión nuevamente con tu
              correo y contraseña.
            </Text>

            <Text
              style={[styles.modalCooldownText, { color: colors.subtitle }]}
            >
              {verificationCooldown > 0
                ? `Puedes reenviar otro correo en ${verificationCooldown} s`
                : "Si no te llegó, puedes reenviar el correo ahora."}
            </Text>

            <TouchableOpacity
              onPress={handleResendVerification}
              disabled={verificationCooldown > 0 || loading}
              style={[
                styles.modalButton,
                {
                  backgroundColor: colors.accent,
                  opacity: verificationCooldown > 0 || loading ? 0.6 : 1,
                },
              ]}
            >
              {loading ? (
                <ActivityIndicator color={colors.primaryText} />
              ) : (
                <Text
                  style={[
                    styles.modalButtonText,
                    { color: colors.primaryText },
                  ]}
                >
                  Reenviar correo
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleVetLoginPress}
              style={{ marginTop: 8 }}
            >
              <Text
                style={[
                  styles.modalSecondaryButtonText,
                  { color: colors.link },
                ]}
              >
                Ya verifiqué mi correo
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  fontLoadingContainer: {
    flex: 1,
    backgroundColor: "#E3F2FD",
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    flex: 1,
    backgroundColor: "#E3F2FD",
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
    color: "#365b6d",
  },
  appSubtitle: {
    fontSize: 14,
    color: "#558B2F",
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
    opacity: 0.06,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 4,
    color: "#263238",
  },
  cardSubtitle: {
    fontSize: 13,
    color: "#607D8B",
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
    borderColor: "#CFD8DC",
    fontSize: 14,
    color: "#263238",
  },
  inputPasswordContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#CFD8DC",
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
    backgroundColor: "#4CAF50",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 16,
    marginBottom: 12,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
  linkText: {
    textAlign: "center",
    color: "#455A64",
    fontSize: 13,
  },
  linkTextBold: {
    color: "#1E88E5",
    fontWeight: "600",
  },
  vetLinkText: {
    textAlign: "center",
    color: "#607D8B",
    fontSize: 12,
  },
  vetLinkBold: {
    color: "#00897B",
    fontWeight: "600",
  },
  helperText: {
    fontSize: 11,
    color: "#90A4AE",
    textAlign: "center",
    marginTop: 8,
  },
  footerText: {
    fontSize: 12,
    color: "#78909C",
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
    backgroundColor: "rgba(15,23,42,0.45)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  modalCard: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 20,
    alignItems: "center",
    elevation: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
    marginBottom: 8,
  },
  modalText: {
    fontSize: 13,
    color: "#4B5563",
    textAlign: "left",
    marginBottom: 16,
  },
  modalCooldownText: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 12,
    textAlign: "center",
  },
  modalButton: {
    backgroundColor: "#4A85A5",
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 999,
    alignItems: "center",
    marginBottom: 10,
    alignSelf: "stretch",
  },
  modalButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  modalSecondaryButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  modalSecondaryButtonText: {
    color: "#1E88E5",
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
  },
});

export default LoginScreen;
