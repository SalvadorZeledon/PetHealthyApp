// screens/Loginscreen.js
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
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../../../firebase/config";
import { COL_USUARIOS } from "../../../shared/utils/collections";
import { saveUserToStorage } from "../../../shared/utils/storage";
import { Dialog, ALERT_TYPE } from "react-native-alert-notification";
import { Ionicons } from "@expo/vector-icons";
import { useFonts, Poppins_700Bold } from "@expo-google-fonts/poppins";


const logo = require("../../../../assets/logoPH.png");

const LoginScreen = ({ navigation }) => {
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
      <View style={styles.fontLoadingContainer}>
        <ActivityIndicator size="large" color="#365b6d" />
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
        textBody: `Hola ${userData.nombre || ""}, nos alegra verte de nuevo 🐾`,
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

  const handleVetLoginInfo = () => {
    Dialog.show({
      type: ALERT_TYPE.INFO,
      title: "Acceso para veterinarios",
      textBody:
        "El módulo de acceso para veterinarios estará disponible en una próxima versión. Por ahora, esta sección es solo para clientes.",
      button: "Entendido",
    });
  };

  return (
    <KeyboardAwareScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      enableOnAndroid={true}
      extraScrollHeight={32} // cuánto subir cuando aparece el teclado
      keyboardShouldPersistTaps="handled"
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View style={styles.inner}>
          <View style={styles.logoContainer}>
            <Image source={logo} style={styles.logo} resizeMode="contain" />
            <Text style={styles.appName}>PetHealthyApp</Text>
            <Text style={styles.appSubtitle}>
              Tu clínica veterinaria en el bolsillo 🐶💚
            </Text>
          </View>

          <View style={styles.card}>
            <View style={styles.pawBackground}>
              <Ionicons name="paw" size={80} color="#90A4AE" />
            </View>

            <Text style={styles.cardTitle}>Iniciar sesión</Text>
            <Text style={styles.cardSubtitle}>
              Ingresa con tu correo para ver la información de tus mascotas y
              sus consultas.
            </Text>

            <TextInput
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
              autoFocus={true}
              onSubmitEditing={() => passwordInputRef.current?.focus()}
            />
            {errorEmail ? (
              <Text style={styles.errorText}>{errorEmail}</Text>
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
                  color="#90A4AE"
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
                <Text style={styles.primaryButtonText}>Ingresar</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.navigate("Register")}>
              <Text style={styles.linkText}>
                ¿Es tu primera vez?{" "}
                <Text style={styles.linkTextBold}>Crea una cuenta</Text>
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleVetLoginInfo}
              style={{ marginTop: 8 }}
            >
              <Text style={styles.vetLinkText}>
                ¿Eres veterinario?{" "}
                <Text style={styles.vetLinkBold}>Acceso profesional</Text>
              </Text>
            </TouchableOpacity>

            <Text style={styles.helperText}>
              Al iniciar sesión podrás ver el historial de vacunas y consultas
              de tus mascotas.
            </Text>
          </View>

          <Text style={styles.footerText}>Hecho con ❤️ para tus mascotas</Text>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAwareScrollView>
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
    justifyContent: "space-between", // logo arriba, card centro, footer abajo
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
});

export default LoginScreen;
