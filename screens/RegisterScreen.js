// screens/RegisterScreen.js
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Image,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { COL_USUARIOS } from '../src/utils/collections';
import { Dialog, ALERT_TYPE } from 'react-native-alert-notification';
import { Ionicons } from '@expo/vector-icons';
import { useFonts, Poppins_700Bold } from '@expo-google-fonts/poppins';

const logo = require('../assets/logoregister.png');

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
      return { label: 'Muy débil', color: '#e53935' };
    case 1:
      return { label: 'Débil', color: '#e53935' };
    case 2:
      return { label: 'Media', color: '#fb8c00' };
    case 3:
      return { label: 'Fuerte', color: '#43a047' };
    default:
      return { label: '', color: '#ccc' };
  }
};

const RegisterScreen = ({ navigation }) => {
  const [fontsLoaded] = useFonts({
    Poppins_700Bold,
  });

  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showPassword2, setShowPassword2] = useState(false);

  const [loading, setLoading] = useState(false);

  const [errorNombre, setErrorNombre] = useState('');
  const [errorEmail, setErrorEmail] = useState('');
  const [errorPassword, setErrorPassword] = useState('');
  const [errorPassword2, setErrorPassword2] = useState('');

  const passwordScore = evaluatePasswordStrength(password);
  const { label: strengthLabel, color: strengthColor } =
    password.length > 0
      ? getStrengthLabelAndColor(passwordScore)
      : { label: '', color: '#ccc' };

  const emailInputRef = useRef(null);
  const passwordInputRef = useRef(null);
  const password2InputRef = useRef(null);

  if (!fontsLoaded) {
    return (
      <View style={styles.fontLoadingContainer}>
        <ActivityIndicator size="large" color="#365b6d" />
      </View>
    );
  }

  const clearErrors = () => {
    setErrorNombre('');
    setErrorEmail('');
    setErrorPassword('');
    setErrorPassword2('');
  };

  const validateForm = () => {
    clearErrors();
    let valid = true;

    if (!nombre.trim()) {
      setErrorNombre('Ingresa un nombre de usuario.');
      valid = false;
    }

    if (!email.trim()) {
      setErrorEmail('Ingresa tu correo electrónico.');
      valid = false;
    } else {
      const emailRegex = /\S+@\S+\.\S+/;
      if (!emailRegex.test(email.trim().toLowerCase())) {
        setErrorEmail('Correo electrónico no válido.');
        valid = false;
      }
    }

    if (!password) {
      setErrorPassword('Ingresa una contraseña.');
      valid = false;
    } else if (passwordScore < 2) {
      setErrorPassword(
        'Contraseña débil. Usa mayúsculas, minúsculas, números y símbolos.'
      );
      valid = false;
    }

    if (!password2) {
      setErrorPassword2('Confirma tu contraseña.');
      valid = false;
    } else if (password && password !== password2) {
      setErrorPassword2('Las contraseñas no coinciden.');
      valid = false;
    }

    if (!valid) {
      Dialog.show({
        type: ALERT_TYPE.WARNING,
        title: 'Revisa los campos',
        textBody: 'Algunos datos necesitan corrección.',
        button: 'Entendido',
      });
    }

    return valid;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;
    setLoading(true);

    try {
      const usuariosRef = collection(db, COL_USUARIOS);
      const q = query(
        usuariosRef,
        where('email', '==', email.trim().toLowerCase())
      );
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        setErrorEmail('Este correo ya está registrado.');
        Dialog.show({
          type: ALERT_TYPE.WARNING,
          title: 'Correo en uso',
          textBody: 'Ya existe una cuenta registrada con este correo.',
          button: 'Entendido',
        });
        setLoading(false);
        return;
      }

      await addDoc(usuariosRef, {
        nombre: nombre.trim(),
        email: email.trim().toLowerCase(),
        password,
        rol: 'cliente',
        fechaRegistro: serverTimestamp(),
      });

      Dialog.show({
        type: ALERT_TYPE.SUCCESS,
        title: 'Cuenta creada',
        textBody:
          'Tu cuenta se creó correctamente. Ya puedes agendar consultas y revisar el historial de tus mascotas.',
        button: 'Ir al login',
        onHide: () => navigation.navigate('Login'),
      });
    } catch (error) {
      console.log('Error al registrar usuario:', error);
      Dialog.show({
        type: ALERT_TYPE.DANGER,
        title: 'Error inesperado',
        textBody: 'Ocurrió un problema al crear la cuenta. Inténtalo más tarde.',
        button: 'Cerrar',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.inner}>
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
              Registra tus datos para llevar control de vacunas, consultas y más.
            </Text>

            {/* Nombre */}
            <TextInput
              style={styles.input}
              placeholder="Nombre de usuario"
              placeholderTextColor="#7a8b8c"
              value={nombre}
              onChangeText={text => {
                setNombre(text);
                if (errorNombre) setErrorNombre('');
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
              onChangeText={text => {
                setEmail(text);
                if (errorEmail) setErrorEmail('');
              }}
              autoCapitalize="none"
              keyboardType="email-address"
              returnKeyType="next"
              onSubmitEditing={() => passwordInputRef.current?.focus()}
            />
            {errorEmail ? <Text style={styles.errorText}>{errorEmail}</Text> : null}

            {/* Password */}
            <View style={styles.inputPasswordContainer}>
              <TextInput
                ref={passwordInputRef}
                style={styles.inputPassword}
                placeholder="Contraseña"
                placeholderTextColor="#7a8b8c"
                value={password}
                onChangeText={text => {
                  setPassword(text);
                  if (errorPassword) setErrorPassword('');
                }}
                secureTextEntry={!showPassword}
                returnKeyType="next"
                onSubmitEditing={() => password2InputRef.current?.focus()}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowPassword(prev => !prev)}
              >
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color="#90A4AE"
                />
              </TouchableOpacity>
            </View>
            {password.length > 0 && (
              <View style={styles.strengthContainer}>
                <View
                  style={[styles.strengthBar, { backgroundColor: strengthColor }]}
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
                onChangeText={text => {
                  setPassword2(text);
                  if (errorPassword2) setErrorPassword2('');
                }}
                secureTextEntry={!showPassword2}
                returnKeyType="done"
                onSubmitEditing={handleRegister}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowPassword2(prev => !prev)}
              >
                <Ionicons
                  name={showPassword2 ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color="#90A4AE"
                />
              </TouchableOpacity>
            </View>
            {errorPassword2 ? (
              <Text style={styles.errorText}>{errorPassword2}</Text>
            ) : null}

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryButtonText}>Registrarme</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.linkText}>
                ¿Ya tienes cuenta?{' '}
                <Text style={styles.linkTextBold}>Inicia sesión</Text>
              </Text>
            </TouchableOpacity>

            <Text style={styles.helperText}>
              Solo tú y tu veterinario de confianza verán la información de tus
              mascotas.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  fontLoadingContainer: {
    flex: 1,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flex: 1,
    backgroundColor: '#E8F5E9',
  },
  inner: {
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 24,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  logo: {
    width: 180,
    height: 180,
    marginBottom: 1,
  },
  appName: {
    fontSize: 26,
    fontFamily: 'Poppins_700Bold',
    color: '#365b6d',
    marginTop: 4,
  },
  appSubtitle: {
    fontSize: 14,
    color: '#558B2F',
    marginTop: 2,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 20,
    elevation: 4,
    overflow: 'hidden',
  },
  pawBackground: {
    position: 'absolute',
    right: -10,
    top: -20,
    opacity: 0.05,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
    color: '#263238',
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#607D8B',
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: '#CFD8DC',
    fontSize: 14,
    color: '#263238',
  },
  inputPasswordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CFD8DC',
    paddingHorizontal: 8,
    marginTop: 8,
  },
  inputPassword: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 4,
    fontSize: 14,
    color: '#263238',
  },
  eyeButton: {
    padding: 4,
  },
  primaryButton: {
    backgroundColor: '#43A047',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 12,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  linkText: {
    textAlign: 'center',
    color: '#455A64',
    fontSize: 13,
  },
  linkTextBold: {
    color: '#1E88E5',
    fontWeight: '600',
  },
  strengthContainer: {
    marginTop: 4,
    marginBottom: 4,
  },
  strengthBar: {
    height: 4,
    borderRadius: 4,
    backgroundColor: '#ccc',
    marginBottom: 4,
  },
  strengthLabel: {
    fontSize: 12,
    color: '#555',
  },
  errorText: {
    color: '#e53935',
    fontSize: 12,
    marginBottom: 4,
    marginTop: 2,
  },
  helperText: {
    fontSize: 11,
    color: '#90A4AE',
    textAlign: 'center',
    marginTop: 8,
  },
});

export default RegisterScreen;
