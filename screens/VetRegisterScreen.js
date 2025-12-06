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
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { Dialog, ALERT_TYPE } from "react-native-alert-notification";
import { addDoc, collection, getDocs, query, where, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase/config";
import { COL_USUARIOS } from "../src/utils/collections";
import { useTheme } from "../src/themes/useTheme";

const logo = require("../assets/logoPH.png");

export default function VetRegisterScreen({ navigation }) {
  const { colors } = useTheme();

  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [clinica, setClinica] = useState("");
  const [telefono, setTelefono] = useState("");
  const [numeroRegistro, setNumeroRegistro] = useState("");

  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showPassword2, setShowPassword2] = useState(false);
  const [loading, setLoading] = useState(false);

  const emailRef = useRef();
  const clinicaRef = useRef();
  const telefonoRef = useRef();
  const registroRef = useRef();
  const passRef = useRef();
  const pass2Ref = useRef();

  const validate = () => {
    if (!nombre.trim()) return "Ingresa tu nombre completo.";
    if (!clinica.trim()) return "Ingresa el nombre de tu clínica.";
    if (!telefono.trim()) return "Ingresa tu número de teléfono.";
    if (!numeroRegistro.trim()) return "Debes ingresar tu número de registro profesional.";

    const emailRegex = /\S+@\S+\.\S+/;
    if (!emailRegex.test(email.trim().toLowerCase()))
      return "Correo electrónico no válido.";

    if (password.length < 8)
      return "La contraseña debe tener al menos 8 caracteres.";

    if (password !== password2) return "Las contraseñas no coinciden.";

    return null;
  };

  const handleRegister = async () => {
    const error = validate();
    if (error) {
      Dialog.show({
        type: ALERT_TYPE.WARNING,
        title: "Revisa los campos",
        textBody: error,
        button: "Entendido",
      });
      return;
    }

    setLoading(true);

    try {
      const usuariosRef = collection(db, COL_USUARIOS);

      const q = query(usuariosRef, where("email", "==", email.trim().toLowerCase()));
      const exists = await getDocs(q);
      if (!exists.empty) {
        Dialog.show({
          type: ALERT_TYPE.WARNING,
          title: "Correo en uso",
          textBody: "Ya existe una cuenta con este correo.",
          button: "Cerrar",
        });
        setLoading(false);
        return;
      }

      const vetDoc = await addDoc(usuariosRef, {
        nombre: nombre.trim(),
        email: email.trim().toLowerCase(),
        clinica: clinica.trim(),
        telefono: telefono.trim(),
        numeroRegistro: numeroRegistro.trim(),
        password,
        rol: "veterinario",
        fechaRegistro: serverTimestamp(),
        perfilCompleto: false,
      });

      Dialog.show({
        type: ALERT_TYPE.SUCCESS,
        title: "Cuenta profesional creada",
        textBody: "Ahora completa tu perfil profesional.",
        button: "Continuar",
        onHide: () => navigation.replace("VetCompleteProfile", { vetId: vetDoc.id }),
      });
    } catch (error) {
      console.log("Error creando veterinario:", error);
      Dialog.show({
        type: ALERT_TYPE.DANGER,
        title: "Error inesperado",
        textBody: "Hubo un problema al crear la cuenta.",
        button: "Cerrar",
      });
    }

    setLoading(false);
  };

  return (
    <KeyboardAwareScrollView
      contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}
      keyboardShouldPersistTaps="handled"
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={{ padding: 20 }}>
          <View style={styles.logoContainer}>
            <Image source={logo} style={styles.logo} />
            <Text style={[styles.appName, { color: colors.text }]}>PetHealthyApp</Text>
            <Text style={[styles.subtitle, { color: colors.primary }]}>
              Registro profesional veterinario
            </Text>
          </View>

          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <Text style={[styles.title, { color: colors.text }]}>Crear cuenta profesional</Text>

            <TextInput
              style={[styles.input, { backgroundColor: colors.input, color: colors.text }]}
              placeholder="Nombre completo"
              placeholderTextColor={colors.placeholder}
              value={nombre}
              onChangeText={setNombre}
              returnKeyType="next"
              onSubmitEditing={() => clinicaRef.current?.focus()}
            />

            <TextInput
              ref={clinicaRef}
              style={[styles.input, { backgroundColor: colors.input, color: colors.text }]}
              placeholder="Nombre de la clínica"
              placeholderTextColor={colors.placeholder}
              value={clinica}
              onChangeText={setClinica}
              returnKeyType="next"
              onSubmitEditing={() => telefonoRef.current?.focus()}
            />

            <TextInput
              ref={telefonoRef}
              style={[styles.input, { backgroundColor: colors.input, color: colors.text }]}
              placeholder="Teléfono"
              keyboardType="phone-pad"
              placeholderTextColor={colors.placeholder}
              value={telefono}
              onChangeText={setTelefono}
              returnKeyType="next"
              onSubmitEditing={() => registroRef.current?.focus()}
            />

            <TextInput
              ref={registroRef}
              style={[styles.input, { backgroundColor: colors.input, color: colors.text }]}
              placeholder="Número de registro profesional"
              placeholderTextColor={colors.placeholder}
              value={numeroRegistro}
              onChangeText={setNumeroRegistro}
              returnKeyType="next"
              onSubmitEditing={() => emailRef.current?.focus()}
            />

            <TextInput
              ref={emailRef}
              style={[styles.input, { backgroundColor: colors.input, color: colors.text }]}
              placeholder="Correo electrónico"
              autoCapitalize="none"
              keyboardType="email-address"
              placeholderTextColor={colors.placeholder}
              value={email}
              onChangeText={setEmail}
              returnKeyType="next"
              onSubmitEditing={() => passRef.current?.focus()}
            />

            {/* CONTRASEÑA */}
            <View style={[styles.passwordContainer, { backgroundColor: colors.input }]}>
              <TextInput
                ref={passRef}
                style={[styles.passwordInput, { color: colors.text }]}
                placeholder="Contraseña"
                secureTextEntry={!showPassword}
                placeholderTextColor={colors.placeholder}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(v => !v)}>
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={22}
                  color={colors.icon}
                />
              </TouchableOpacity>
            </View>

            <View style={[styles.passwordContainer, { backgroundColor: colors.input }]}>
              <TextInput
                ref={pass2Ref}
                style={[styles.passwordInput, { color: colors.text }]}
                placeholder="Confirmar contraseña"
                secureTextEntry={!showPassword2}
                placeholderTextColor={colors.placeholder}
                value={password2}
                onChangeText={setPassword2}
              />
              <TouchableOpacity onPress={() => setShowPassword2(v => !v)}>
                <Ionicons
                  name={showPassword2 ? "eye-off-outline" : "eye-outline"}
                  size={22}
                  color={colors.icon}
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.button, { backgroundColor: colors.primary }]}
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Crear cuenta</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={[styles.linkText, { color: colors.link }]}>
                ¿Ya tienes cuenta? Inicia sesión
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 30,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 16,
  },
  logo: {
    width: 130,
    height: 130,
  },
  appName: {
    fontSize: 24,
    fontWeight: "700",
    marginTop: 4,
  },
  subtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  card: {
    padding: 20,
    borderRadius: 16,
    elevation: 3,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 14,
  },
  input: {
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 10,
  },
  button: {
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  linkText: {
    marginTop: 12,
    textAlign: "center",
    fontSize: 14,
  },
});
