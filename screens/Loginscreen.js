// screens/LoginScreen.js
import React, { useState, useRef } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
  TouchableWithoutFeedback,
  Keyboard,
  Platform,
  StatusBar,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../firebase/config";
import { COL_USUARIOS } from "../src/utils/collections";
import { Dialog, ALERT_TYPE } from "react-native-alert-notification";
import { Ionicons } from "@expo/vector-icons";
import { useFonts, Poppins_700Bold } from "@expo-google-fonts/poppins";
import { saveUserToStorage } from "../src/utils/storage";
import { useTheme } from "../src/themes/useTheme";
import AppText from "../src/components/ui/AppText";
import AppButton from "../src/components/ui/AppButton";
import AppCard from "../src/components/ui/AppCard";

const logo = require("../assets/logoPH.png");

const LoginScreen = ({ navigation }) => {
  const { colors } = useTheme();

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

  if (!fontsLoaded) {
    return (
      <View style={[styles.fontLoadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
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
        textBody: "Algunos datos están incompletos o son inválidos.",
        button: "Entendido",
      });
    }

    return valid;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;
    setLoading(true);

    try {
      const usuariosRef = collection(db, COL_USUARIOS);
      const q = query(
        usuariosRef,
        where("email", "==", email.trim().toLowerCase()),
        where("password", "==", password)
      );
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        setErrorPassword("Email o contraseña incorrectos.");
        Dialog.show({
          type: ALERT_TYPE.DANGER,
          title: "Error al iniciar sesión",
          textBody: "Email o contraseña incorrectos. Inténtalo de nuevo.",
          button: "Cerrar",
        });
        setLoading(false);
        return;
      }

      const userDoc = snapshot.docs[0];
      const userData = { id: userDoc.id, ...userDoc.data() };

      // Guardar en AsyncStorage
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

      // 🔥 RUTA ESPECIAL PARA VETERINARIO
      if (userData.rol === "veterinario") {
        Dialog.show({
          type: ALERT_TYPE.SUCCESS,
          title: "Bienvenido doctor",
          textBody: `Hola ${userData.nombre || ""}, entrando al panel profesional 🐾`,
          button: "Continuar",
          onHide: () => {
            navigation.reset({
              index: 0,
              routes: [{ name: "VetDashboard" }],
            });
          },
        });
        setLoading(false);
        return;
      }

      // 🔥 Flujo normal para cliente
      const hasPhoto = userData.fotoPerfilUrl || userData.tieneFotoLocal;

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
        textBody: `Hola ${userData.nombre || ""}, nos alegra verte 🐶💚`,
        button: "Continuar",
        onHide: () => {
          navigation.reset({
            index: 0,
            routes: [{ name: nextRoute, params: nextParams }],
          });
        },
      });

    } catch (error) {
      Dialog.show({
        type: ALERT_TYPE.DANGER,
        title: "Error inesperado",
        textBody: "Ocurrió un problema al iniciar sesión. Inténtalo más tarde.",
        button: "Cerrar",
      });
    } finally {
      setLoading(false);
    }
  };

  // 🔥 Botón “Eres veterinario”
  const handleVetLoginInfo = () => {
    navigation.navigate("VetRegister");
  };

  return (
    <KeyboardAwareScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.scrollContent}
      enableOnAndroid={true}
      extraScrollHeight={32}
      keyboardShouldPersistTaps="handled"
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.inner}>
          {/* LOGO */}
          <View style={styles.logoContainer}>
            <Image source={logo} style={styles.logo} resizeMode="contain" />
            <AppText style={styles.appName}>PetHealthyApp</AppText>
            <AppText small style={styles.appSubtitle}>
              Tu clínica veterinaria en el bolsillo 🐶💚
            </AppText>
          </View>

          {/* CARD */}
          <AppCard style={styles.card}>
            <View style={styles.pawBackground}>
              <Ionicons name="paw" size={80} color="#90A4AE" />
            </View>

            <AppText title style={styles.cardTitle}>
              Iniciar sesión
            </AppText>

            <AppText small style={styles.cardSubtitle}>
              Ingresa con tu correo para ver la información de tus mascotas.
            </AppText>

            {/* EMAIL */}
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
              onChangeText={(t) => {
                setEmail(t);
                setErrorEmail("");
              }}
              autoCapitalize="none"
              keyboardType="email-address"
              returnKeyType="next"
              onSubmitEditing={() => passwordInputRef.current?.focus()}
            />
            {errorEmail ? <AppText small style={styles.errorText}>{errorEmail}</AppText> : null}

            {/* PASSWORD */}
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
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={(t) => {
                  setPassword(t);
                  setErrorPassword("");
                }}
                returnKeyType="done"
                onSubmitEditing={handleLogin}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color={colors.textSmall}
                />
              </TouchableOpacity>
            </View>
            {errorPassword ? <AppText small style={styles.errorText}>{errorPassword}</AppText> : null}

            {/* BUTTON */}
            <AppButton
              title={loading ? "" : "Ingresar"}
              onPress={handleLogin}
              style={{ marginTop: 16, marginBottom: 12 }}
            />
            {loading && <ActivityIndicator color="#fff" />}

            {/* LINKS */}
            <TouchableOpacity onPress={() => navigation.navigate("Register")}>
              <AppText small style={styles.linkText}>
                ¿Es tu primera vez?{" "}
                <AppText small style={styles.linkTextBold}>Crea una cuenta</AppText>
              </AppText>
            </TouchableOpacity>

            {/* Veterinarios */}
            <TouchableOpacity onPress={handleVetLoginInfo}>
              <AppText small style={styles.vetLinkText}>
                ¿Eres veterinario?{" "}
                <AppText small style={styles.vetLinkBold}>Acceso profesional</AppText>
              </AppText>
            </TouchableOpacity>

            <AppText small style={styles.helperText}>
              Al iniciar sesión podrás ver el historial de vacunas y consultas.
            </AppText>
          </AppCard>

          <AppText small style={styles.footerText}>
            Hecho con ❤️ para tus mascotas
          </AppText>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAwareScrollView>
  );
};

const styles = StyleSheet.create({
  fontLoadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  container: { flex: 1 },
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
    marginTop: 2,
    marginBottom: 12,
    textAlign: "center",
  },
  card: {
    width: "100%",
    marginBottom: 16,
    overflow: "hidden",
  },
  pawBackground: {
    position: "absolute",
    right: -10,
    top: -10,
    opacity: 0.06,
  },
  cardTitle: { marginBottom: 4 },
  cardSubtitle: {
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 4,
    fontSize: 14,
    borderWidth: 1,
  },
  inputPasswordContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 8,
    marginTop: 8,
  },
  inputPassword: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 4,
    fontSize: 14,
  },
  errorText: {
    color: "#e53935",
    marginBottom: 4,
    marginTop: 2,
  },
  linkText: {
    textAlign: "center",
    marginTop: 8,
  },
  linkTextBold: { fontWeight: "600" },
  vetLinkText: { textAlign: "center", marginTop: 8 },
  vetLinkBold: { fontWeight: "600" },
  helperText: { textAlign: "center", marginTop: 8 },
  footerText: { textAlign: "center", marginBottom: 4 },
});

export default LoginScreen;
