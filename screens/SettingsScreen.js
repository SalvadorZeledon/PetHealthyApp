// screens/SettingsScreen.js
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Alert,             // 👈 IMPORTAMOS Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { clearUserFromStorage } from '../src/utils/storage';

const SettingsScreen = ({ navigation }) => {
  const handleBack = () => {
    navigation.goBack();
  };

  const handleOpenProfile = () => {
    navigation.navigate('UserInfo');
  };

  const handleLogout = async () => {
    try {
      // Opcional: preguntar confirmación
      Alert.alert(
        'Cerrar sesión',
        '¿Seguro que deseas salir de tu cuenta?',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Cerrar sesión',
            style: 'destructive',
            onPress: async () => {
              await clearUserFromStorage(); // Borra @userData
              await AsyncStorage.clear();   // (opcional) limpia todo lo demás

              navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
              });
            },
          },
        ]
      );
    } catch (error) {
      console.log('Error al cerrar sesión:', error);
      Alert.alert(
        'Error',
        'No se pudo cerrar la sesión. Inténtalo más tarde.'
      );
    }
  };

  return (
    <View style={styles.container}>
      {/* top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={handleBack} style={styles.topIconButton}>
          <Ionicons name="arrow-back" size={22} color="#365b6d" />
        </TouchableOpacity>

        <Text style={styles.topTitle}>Configuración</Text>

        <View style={styles.topIconButton} />
      </View>

      <View style={styles.content}>
        <Text style={styles.sectionTitle}>Cuenta</Text>

        <TouchableOpacity
          style={styles.optionCard}
          onPress={handleOpenProfile}
        >
          <Ionicons name="person-circle-outline" size={24} color="#365b6d" />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.optionTitle}>Perfil</Text>
            <Text style={styles.optionSubtitle}>
              Ver y editar tu información personal.
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#90A4AE" />
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Sesión</Text>

        <TouchableOpacity
          style={[styles.optionCard, { backgroundColor: '#FFEBEE' }]}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={24} color="#E53935" />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={[styles.optionTitle, { color: '#C62828' }]}>
              Cerrar sesión
            </Text>
            <Text style={[styles.optionSubtitle, { color: '#C62828' }]}>
              Salir de tu cuenta en este dispositivo.
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default SettingsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E3F2FD',
    marginTop: Platform.OS === 'ios' ? 40 : 0,
  },
  topBar: {
    paddingTop: 18,
    paddingHorizontal: 14,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topIconButton: {
    padding: 6,
    borderRadius: 999,
    backgroundColor: '#E0E9F5',
  },
  topTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#365b6d',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#607D8B',
    marginBottom: 8,
    marginTop: 12,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
    elevation: 2,
  },
  optionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#263238',
  },
  optionSubtitle: {
    fontSize: 12,
    color: '#607D8B',
  },
});
