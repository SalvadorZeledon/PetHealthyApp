// screens/CompleteProfileScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Dialog, ALERT_TYPE } from 'react-native-alert-notification';
import { doc, updateDoc } from 'firebase/firestore';
import * as Location from 'expo-location';
import { useTheme } from '../src/themes/ThemeContext';
import { db } from '../firebase/config';
import { COL_USUARIOS } from '../src/utils/collections';

const CompleteProfileScreen = ({ route, navigation }) => {
  const { userId } = route.params;
 const { theme, darkMode } = useTheme();
  const [nombres, setNombres] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [edad, setEdad] = useState('');
  const [dui, setDui] = useState('');
  const [telefono, setTelefono] = useState('');
  const [direccion, setDireccion] = useState('');

  const [loadingSave, setLoadingSave] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(false);

  const [errorNombres, setErrorNombres] = useState('');
  const [errorApellidos, setErrorApellidos] = useState('');
  const [errorEdad, setErrorEdad] = useState('');
  const [errorDui, setErrorDui] = useState('');
  const [errorTelefono, setErrorTelefono] = useState('');
  const [errorDireccion, setErrorDireccion] = useState('');

  const clearErrors = () => {
    setErrorNombres('');
    setErrorApellidos('');
    setErrorEdad('');
    setErrorDui('');
    setErrorTelefono('');
    setErrorDireccion('');
  };

  // --- formateo ---
  const handleChangeDui = (text) => {
    let digits = text.replace(/\D/g, '');
    digits = digits.slice(0, 9);
    let formatted = digits;
    if (digits.length > 8) {
      formatted = digits.slice(0, 8) + '-' + digits.slice(8);
    }
    setDui(formatted);
    if (errorDui) setErrorDui('');
  };

  const handleChangeTelefono = (text) => {
    let digits = text.replace(/\D/g, '');
    digits = digits.slice(0, 8);
    let formatted = digits;
    if (digits.length > 4) {
      formatted = digits.slice(0, 4) + '-' + digits.slice(4);
    }
    setTelefono(formatted);
    if (errorTelefono) setErrorTelefono('');
  };

  const handleChangeEdad = (text) => {
    const digits = text.replace(/\D/g, '');
    setEdad(digits);
    if (errorEdad) setErrorEdad('');
  };

  // --- botón "Usar mi ubicación actual" ---
  const handleUseLocation = async () => {
    try {
      setLoadingLocation(true);

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Dialog.show({
          type: ALERT_TYPE.WARNING,
          title: 'Permiso requerido',
          textBody:
            'Necesitamos permiso de ubicación para sugerir tu dirección. También puedes escribirla o elegirla en el mapa.',
          button: 'Entendido',
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
        const addr = parts.join(', ');
        setDireccion(addr);
        setErrorDireccion('');
      } else {
        Dialog.show({
          type: ALERT_TYPE.WARNING,
          title: 'Sin resultados',
          textBody:
            'No pudimos obtener una dirección a partir de tu ubicación. Intenta escribirla o buscarla en el mapa.',
          button: 'Entendido',
        });
      }
    } catch (error) {
      console.log('Error al obtener ubicación:', error);
      Dialog.show({
        type: ALERT_TYPE.DANGER,
        title: 'Error de ubicación',
        textBody:
          'Ocurrió un error al obtener tu ubicación. Verifica tu conexión e inténtalo de nuevo.',
        button: 'Cerrar',
      });
    } finally {
      setLoadingLocation(false);
    }
  };

  // --- botón "Buscar una ubicación" (abre mapa) ---
  const handleOpenLocationPicker = () => {
    navigation.navigate('LocationPicker', {
      onSelectLocation: (addr) => {
        setDireccion(addr);
        setErrorDireccion('');
      },
    });
  };

  // --- validación completa (incluye edad >= 18) ---
  const validateForm = () => {
    clearErrors();
    let valid = true;

    if (!nombres.trim()) {
      setErrorNombres('Ingresa tus nombres.');
      valid = false;
    }

    if (!apellidos.trim()) {
      setErrorApellidos('Ingresa tus apellidos.');
      valid = false;
    }

    if (!edad.trim()) {
      setErrorEdad('Ingresa tu edad.');
      valid = false;
    } else {
      const edadNum = parseInt(edad, 10);
      if (isNaN(edadNum) || edadNum < 18 || edadNum > 120) {
        setErrorEdad('Debes tener 18 años o más.');
        valid = false;
      }
    }

    const duiDigits = dui.replace(/\D/g, '');
    if (!duiDigits) {
      setErrorDui('Ingresa tu número de DUI.');
      valid = false;
    } else if (duiDigits.length !== 9) {
      setErrorDui('El DUI debe tener 9 dígitos.');
      valid = false;
    }

    const telDigits = telefono.replace(/\D/g, '');
    if (!telDigits) {
      setErrorTelefono('Ingresa tu número de teléfono.');
      valid = false;
    } else if (telDigits.length !== 8) {
      setErrorTelefono('El teléfono debe tener 8 dígitos.');
      valid = false;
    }

    if (!direccion.trim()) {
      setErrorDireccion('Ingresa tu dirección.');
      valid = false;
    }

    if (!valid) {
      Dialog.show({
        type: ALERT_TYPE.WARNING,
        title: 'Revisa tu información',
        textBody:
          'Algunos campos necesitan corrección antes de continuar.',
        button: 'Entendido',
      });
    }

    return valid;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      setLoadingSave(true);

      const userRef = doc(db, COL_USUARIOS, userId);
      await updateDoc(userRef, {
        nombres: nombres.trim(),
        apellidos: apellidos.trim(),
        edad: parseInt(edad, 10),
        dui: dui.trim(),
        telefono: telefono.trim(),
        direccion: direccion.trim(),
        perfilCompleto: true,
      });

      Dialog.show({
        type: ALERT_TYPE.SUCCESS,
        title: '¡Perfil completado!',
        textBody: 'Ahora subamos una foto de perfil para terminar.',
        button: 'Continuar',
        onHide: () => {
          navigation.replace('ProfilePhotoSetup', { userId });
        },
      });
    } catch (error) {
      console.log('Error al completar perfil:', error);
      Dialog.show({
        type: ALERT_TYPE.DANGER,
        title: 'Error al guardar',
        textBody:
          'Ocurrió un error al guardar tu información. Intenta de nuevo más tarde.',
        button: 'Cerrar',
      });
    } finally {
      setLoadingSave(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#E3F2FD' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.header}>
          <Text style={styles.title}>Completar perfil</Text>
          <Text style={styles.subtitle}>
            Cuéntanos un poco más sobre ti para personalizar tu experiencia.
          </Text>
        </View>

        <View style={styles.card}>
          {/* Nombres */}
          <View className="field" style={styles.field}>
            <Text style={styles.label}>Nombres</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej. Carlos Eduardo"
              value={nombres}
              onChangeText={(text) => {
                setNombres(text);
                if (errorNombres) setErrorNombres('');
              }}
            />
            {errorNombres ? (
              <Text style={styles.errorText}>{errorNombres}</Text>
            ) : null}
          </View>

          {/* Apellidos */}
          <View style={styles.field}>
            <Text style={styles.label}>Apellidos</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej. López Sánchez"
              value={apellidos}
              onChangeText={(text) => {
                setApellidos(text);
                if (errorApellidos) setErrorApellidos('');
              }}
            />
            {errorApellidos ? (
              <Text style={styles.errorText}>{errorApellidos}</Text>
            ) : null}
          </View>

          {/* Edad y teléfono */}
          <View style={styles.row}>
            <View style={[styles.field, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>Edad</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej. 28"
                value={edad}
                onChangeText={handleChangeEdad}
                keyboardType="number-pad"
              />
              {errorEdad ? (
                <Text style={styles.errorText}>{errorEdad}</Text>
              ) : null}
            </View>

            <View style={[styles.field, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.label}>Teléfono</Text>
              <TextInput
                style={styles.input}
                placeholder="1234-5678"
                value={telefono}
                onChangeText={handleChangeTelefono}
                keyboardType="phone-pad"
              />
              {errorTelefono ? (
                <Text style={styles.errorText}>{errorTelefono}</Text>
              ) : null}
            </View>
          </View>

          {/* DUI */}
          <View style={styles.field}>
            <Text style={styles.label}>DUI</Text>
            <TextInput
              style={styles.input}
              placeholder="00000000-0"
              value={dui}
              onChangeText={handleChangeDui}
              keyboardType="number-pad"
            />
            {errorDui ? <Text style={styles.errorText}>{errorDui}</Text> : null}
          </View>

          {/* Dirección + botones de ubicación */}
          <View style={styles.field}>
            <Text style={styles.label}>Dirección</Text>
            <TextInput
              style={[styles.input, { minHeight: 48 }]}
              placeholder="Ej. Colonia, ciudad, país"
              value={direccion}
              onChangeText={(text) => {
                setDireccion(text);
                if (errorDireccion) setErrorDireccion('');
              }}
              multiline
            />
            {errorDireccion ? (
              <Text style={styles.errorText}>{errorDireccion}</Text>
            ) : null}

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
          </View>

          {/* Botón guardar */}
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSave}
            disabled={loadingSave}
          >
            {loadingSave ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.saveButtonText}>Guardar y continuar</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default CompleteProfileScreen;

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 24,
  },
  header: {
    marginBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#365b6d',
  },
  subtitle: {
    fontSize: 13,
    color: '#607D8B',
    marginTop: 4,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    elevation: 3,
  },
  field: {
    marginBottom: 12,
  },
  label: {
    fontSize: 12,
    color: '#607D8B',
    marginBottom: 2,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CFD8DC',
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    color: '#263238',
  },
  row: {
    flexDirection: 'row',
  },
  saveButton: {
    marginTop: 8,
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  errorText: {
    color: '#E53935',
    fontSize: 12,
    marginTop: 2,
  },
  locationButtonsRow: {
    flexDirection: 'row',
    marginTop: 6,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#E0F7FA',
    marginRight: 8,
  },
  locationButtonText: {
    marginLeft: 6,
    fontSize: 12,
    color: '#365b6d',
  },
  locationButtonOutline: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#B0BEC5',
    backgroundColor: '#FFFFFF',
  },
  locationButtonOutlineText: {
    marginLeft: 6,
    fontSize: 12,
    color: '#365b6d',
  },
});
