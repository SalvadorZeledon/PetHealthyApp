// screens/RegisterScreen.js
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
  Modal,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db, auth } from "../../../../firebase/config";
import { COL_USUARIOS } from "../../../shared/utils/collections";
import { Dialog, ALERT_TYPE } from "react-native-alert-notification";
import { Ionicons } from "@expo/vector-icons";
import { useFonts, Poppins_700Bold } from "@expo-google-fonts/poppins";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
} from "firebase/auth";

const logo = require("../../../../assets/logoPH.png");

// Evalúa la fuerza de la contraseña
const evaluatePasswordStrength = (password) => {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/\d/.test(password) && /[^A-Za-z0-9]/.test(password)) score++;
  return score;
};

const getStrengthLabelAndColor = (score) => {
  switch (score) {
    case 0:
      return { label: "Muy débil", color: "#e53935" };
    case 1:
      return { label: "Débil", color: "#e53935" };
    case 2:
      return { label: "Media", color: "#fb8c00" };
    case 3:
      return { label: "Fuerte", color: "#43a047" };
    default:
      return { label: "", color: "#ccc" };
  }
};

const RegisterScreen = ({ navigation }) => {
  const [fontsLoaded] = useFonts({
    Poppins_700Bold,
  });

  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showPassword2, setShowPassword2] = useState(false);

  const [loading, setLoading] = useState(false);

  const [errorNombre, setErrorNombre] = useState("");
  const [errorEmail, setErrorEmail] = useState("");
  const [errorPassword, setErrorPassword] = useState("");
  const [errorPassword2, setErrorPassword2] = useState("");

  const [aceptaTerminos, setAceptaTerminos] = useState(false);
  const [errorTerminos, setErrorTerminos] = useState("");

  // 🔹 Estados para la pantalla/modal de verificación
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [verificationCooldown, setVerificationCooldown] = useState(0);
  const [registeredUser, setRegisteredUser] = useState(null);

  const passwordScore = evaluatePasswordStrength(password);
  const { label: strengthLabel, color: strengthColor } =
    password.length > 0
      ? getStrengthLabelAndColor(passwordScore)
      : { label: "", color: "#ccc" };

  const emailInputRef = useRef(null);
  const passwordInputRef = useRef(null);
  const password2InputRef = useRef(null);

  // ⏱️ Timer para el cooldown del reenvío
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
      <View style={styles.fontLoadingContainer}>
        <ActivityIndicator size="large" color="#365b6d" />
      </View>
    );
  }

  const clearErrors = () => {
    setErrorNombre("");
    setErrorEmail("");
    setErrorPassword("");
    setErrorPassword2("");
    setErrorTerminos("");
  };

  const validateForm = () => {
    clearErrors();
    let valid = true;

    if (!nombre.trim()) {
      setErrorNombre("Ingresa un nombre de usuario.");
      valid = false;
    }

    if (!email.trim()) {
      setErrorEmail("Ingresa tu correo electrónico.");
      valid = false;
    } else {
      const emailRegex = /\S+@\S+\.\S+/;
      if (!emailRegex.test(email.trim().toLowerCase())) {
        setErrorEmail("Correo electrónico no válido.");
        valid = false;
      }
    }

    if (!password) {
      setErrorPassword("Ingresa una contraseña.");
      valid = false;
    } else if (passwordScore < 2) {
      setErrorPassword(
        "Contraseña débil. Usa mayúsculas, minúsculas, números y símbolos."
      );
      valid = false;
    }

    if (!password2) {
      setErrorPassword2("Confirma tu contraseña.");
      valid = false;
    } else if (password && password !== password2) {
      setErrorPassword2("Las contraseñas no coinciden.");
      valid = false;
    }

    if (!aceptaTerminos) {
      setErrorTerminos(
        "Debes aceptar los Términos y Condiciones antes de registrarte."
      );
      valid = false;
    }

    if (!valid) {
      Dialog.show({
        type: ALERT_TYPE.WARNING,
        title: "Revisa los campos",
        textBody: "Algunos datos necesitan corrección.",
        button: "Entendido",
      });
    }

    return valid;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;
    setLoading(true);

    try {
      // 1) Crear usuario en Firebase Auth
      const cred = await createUserWithEmailAndPassword(
        auth,
        email.trim().toLowerCase(),
        password
      );
      const fbUser = cred.user;
      setRegisteredUser(fbUser);

      // 2) Crear documento en Firestore con el mismo uid
      await setDoc(doc(db, COL_USUARIOS, fbUser.uid), {
        nombre: nombre.trim(),
        email: fbUser.email,
        rol: "cliente",
        fechaRegistro: serverTimestamp(),
        perfilCompleto: false,
      });

      // 3) Enviar correo de verificación
      await sendEmailVerification(fbUser);

      // 4) Mostrar pantalla/modal de espera
      setVerificationCooldown(30); // 30s antes de poder reenviar
      setShowVerificationModal(true);
    } catch (error) {
      console.log("Error al registrar usuario:", error);

      let msg = "Ocurrió un problema al crear la cuenta.";
      if (error.code === "auth/email-already-in-use") {
        msg = "Este correo ya está registrado.";
        setErrorEmail("Este correo ya está registrado.");
      } else if (error.code === "auth/invalid-email") {
        msg = "El correo no es válido.";
        setErrorEmail("Correo electrónico no válido.");
      } else if (error.code === "auth/weak-password") {
        msg = "La contraseña es demasiado débil.";
        setErrorPassword("Contraseña débil. Usa más caracteres.");
      }

      Dialog.show({
        type: ALERT_TYPE.DANGER,
        title: "Error inesperado",
        textBody: msg,
        button: "Cerrar",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!registeredUser || verificationCooldown > 0) return;

    try {
      setLoading(true);
      await sendEmailVerification(registeredUser);
      setVerificationCooldown(30);

      Dialog.show({
        type: ALERT_TYPE.SUCCESS,
        title: "Correo reenviado",
        textBody:
          "Te enviamos un nuevo enlace de verificación. Revisa tu bandeja de entrada o spam.",
        button: "Entendido",
      });
    } catch (err) {
      console.log("Error al reenviar verificación (registro):", err);

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

  const handleGoToLogin = () => {
    setShowVerificationModal(false);
    navigation.replace("Login");
  };

  return (
    <>
      <KeyboardAwareScrollView
        style={styles.container}
        contentContainerStyle={styles.inner}
        enableOnAndroid={true}
        extraScrollHeight={32}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <View>
            <View style={styles.logoContainer}>
              <Image source={logo} style={styles.logo} resizeMode="contain" />
              <Text style={styles.appName}>PetHealthyApp</Text>
              <Text style={styles.appSubtitle}>
                Crea tu cuenta y acompáñanos en el cuidado de tus mascotas.
              </Text>
            </View>

            <View style={styles.card}>
              <View style={styles.pawBackground}>
                <Ionicons name="paw" size={90} color="#90A4AE" />
              </View>

              <Text style={styles.cardTitle}>Crear cuenta</Text>
              <Text style={styles.cardSubtitle}>
                Registra tus datos para llevar control de vacunas, consultas y
                más.
              </Text>

              {/* Nombre */}
              <TextInput
                style={styles.input}
                placeholder="Nombre de usuario"
                placeholderTextColor="#7a8b8c"
                value={nombre}
                onChangeText={(text) => {
                  setNombre(text);
                  if (errorNombre) setErrorNombre("");
                }}
                autoFocus={true}
                returnKeyType="next"
                onSubmitEditing={() => emailInputRef.current?.focus()}
              />
              {errorNombre ? (
                <Text style={styles.errorText}>{errorNombre}</Text>
              ) : null}

              {/* Email */}
              <TextInput
                ref={emailInputRef}
                style={styles.input}
                placeholder="Correo electrónico"
                placeholderTextColor="#7a8b8c"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (errorEmail) setErrorEmail("");
                }}
                autoCapitalize="none"
                keyboardType="email-address"
                returnKeyType="next"
                onSubmitEditing={() => passwordInputRef.current?.focus()}
              />
              {errorEmail ? (
                <Text style={styles.errorText}>{errorEmail}</Text>
              ) : null}

              {/* Password */}
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
                  returnKeyType="next"
                  onSubmitEditing={() => password2InputRef.current?.focus()}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowPassword((prev) => !prev)}
                >
                  <Ionicons
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color="#90A4AE"
                  />
                </TouchableOpacity>
              </View>
              {password.length > 0 && (
                <View style={styles.strengthContainer}>
                  <View
                    style={[
                      styles.strengthBar,
                      { backgroundColor: strengthColor },
                    ]}
                  />
                  <Text style={styles.strengthLabel}>{strengthLabel}</Text>
                </View>
              )}
              {errorPassword ? (
                <Text style={styles.errorText}>{errorPassword}</Text>
              ) : null}

              {/* Confirm password */}
              <View style={[styles.inputPasswordContainer, { marginTop: 8 }]}>
                <TextInput
                  ref={password2InputRef}
                  style={styles.inputPassword}
                  placeholder="Confirmar contraseña"
                  placeholderTextColor="#7a8b8c"
                  value={password2}
                  onChangeText={(text) => {
                    setPassword2(text);
                    if (errorPassword2) setErrorPassword2("");
                  }}
                  secureTextEntry={!showPassword2}
                  returnKeyType="done"
                  onSubmitEditing={handleRegister}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowPassword2((prev) => !prev)}
                >
                  <Ionicons
                    name={showPassword2 ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color="#90A4AE"
                  />
                </TouchableOpacity>
              </View>
              {errorPassword2 ? (
                <Text style={styles.errorText}>{errorPassword2}</Text>
              ) : null}

              {/* Aceptar términos */}
              <View style={styles.termsContainer}>
                <TouchableOpacity
                  style={styles.checkbox}
                  onPress={() => setAceptaTerminos((prev) => !prev)}
                >
                  <Ionicons
                    name={
                      aceptaTerminos ? "checkbox-outline" : "square-outline"
                    }
                    size={22}
                    color="#43A047"
                  />
                </TouchableOpacity>

                <Text style={styles.termsText}>
                  Acepto los{" "}
                  <Text
                    style={styles.termsLink}
                    onPress={() => navigation.navigate("Terms")}
                  >
                    Términos y Condiciones
                  </Text>{" "}
                  de la aplicación.
                </Text>
              </View>
              {errorTerminos ? (
                <Text style={styles.errorText}>{errorTerminos}</Text>
              ) : null}

              <TouchableOpacity
                style={[
                  styles.primaryButton,
                  (!aceptaTerminos || loading) && { opacity: 0.6 },
                ]}
                onPress={handleRegister}
                disabled={loading || !aceptaTerminos}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.primaryButtonText}>Registrarme</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity onPress={() => navigation.navigate("Login")}>
                <Text style={styles.linkText}>
                  ¿Ya tienes cuenta?{" "}
                  <Text style={styles.linkTextBold}>Inicia sesión</Text>
                </Text>
              </TouchableOpacity>

              <Text style={styles.helperText}>
                Solo tú y tu veterinario de confianza verán la información de
                tus mascotas.
              </Text>
            </View>
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
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Ionicons
              name="mail-open-outline"
              size={40}
              color="#4A85A5"
              style={{ marginBottom: 8 }}
            />
            <Text style={styles.modalTitle}>Verifica tu correo</Text>
            <Text style={styles.modalText}>
              Te enviamos un enlace de verificación a tu correo electrónico.
              {"\n\n"}
              1️⃣ Revisa tu bandeja de entrada y spam.{"\n"}
              2️⃣ Abre el mensaje de PetHealthyApp y abre el enlace.
              {"\n"}
              3️⃣ Luego vuelve aquí y entra con tu correo y contraseña.
            </Text>

            <Text style={styles.modalCooldownText}>
              {verificationCooldown > 0
                ? `Puedes reenviar otro correo en ${verificationCooldown} s`
                : "Si no te llegó, puedes reenviar el correo ahora."}
            </Text>

            <TouchableOpacity
              onPress={handleResendVerification}
              disabled={verificationCooldown > 0 || loading}
              style={[
                styles.modalButton,
                (verificationCooldown > 0 || loading) && { opacity: 0.6 },
              ]}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.modalButtonText}>Reenviar correo</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleGoToLogin}
              style={styles.modalSecondaryButton}
            >
              <Text style={styles.modalSecondaryButtonText}>
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
    backgroundColor: "#E8F5E9",
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    flex: 1,
    backgroundColor: "#E8F5E9",
  },
  inner: {
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 24,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 16,
  },
  logo: {
    width: 180,
    height: 180,
    marginBottom: 1,
  },
  appName: {
    fontSize: 26,
    fontFamily: "Poppins_700Bold",
    color: "#365b6d",
    marginTop: 4,
  },
  appSubtitle: {
    fontSize: 14,
    color: "#558B2F",
    marginTop: 2,
    textAlign: "center",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 20,
    elevation: 4,
    overflow: "hidden",
  },
  pawBackground: {
    position: "absolute",
    right: -10,
    top: -20,
    opacity: 0.05,
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
    backgroundColor: "#43A047",
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
  strengthContainer: {
    marginTop: 4,
    marginBottom: 4,
  },
  strengthBar: {
    height: 4,
    borderRadius: 4,
    backgroundColor: "#ccc",
    marginBottom: 4,
  },
  strengthLabel: {
    fontSize: 12,
    color: "#555",
  },
  errorText: {
    color: "#e53935",
    fontSize: 12,
    marginBottom: 4,
    marginTop: 2,
  },
  helperText: {
    fontSize: 11,
    color: "#90A4AE",
    textAlign: "center",
    marginTop: 8,
  },
  termsContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    marginBottom: 4,
  },
  checkbox: {
    marginRight: 8,
  },
  termsText: {
    flex: 1,
    fontSize: 12,
    color: "#455A64",
  },
  termsLink: {
    color: "#1E88E5",
    fontWeight: "600",
  },
  // 🔹 estilos modal
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

export default RegisterScreen;
