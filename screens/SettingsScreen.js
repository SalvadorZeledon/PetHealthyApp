// screens/SettingsScreen.js
import React from 'react';
import { useTheme } from '../src/themes/ThemeContext';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { clearUserFromStorage } from '../src/utils/storage';

const SettingsScreen = ({ navigation }) => {
  const { theme, toggleTheme } = useTheme();

  const handleBack = () => navigation.goBack();
  const handleOpenProfile = () => navigation.navigate('UserInfo');

  const handleLogout = async () => {
    Alert.alert(
      'Cerrar sesión',
      '¿Seguro que deseas salir de tu cuenta?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar sesión',
          style: 'destructive',
          onPress: async () => {
            await clearUserFromStorage();
            await AsyncStorage.clear();

            navigation.reset({
              index: 0,
              routes: [{ name: 'Login' }],
            });
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>

      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={handleBack}
          style={[styles.topIconButton, { backgroundColor: theme.card }]}
        >
          <Ionicons name="arrow-back" size={22} color={theme.accent} />
        </TouchableOpacity>

        <Text style={[styles.topTitle, { color: theme.textPrimary }]}>
          Configuración
        </Text>

        <View style={styles.topIconButton} />
      </View>

      <View style={styles.content}>
        <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
          Cuenta
        </Text>

        {/* Perfil */}
        <TouchableOpacity
          style={[styles.optionCard, { backgroundColor: theme.card }]}
          onPress={handleOpenProfile}
        >
          <Ionicons name="person-circle-outline" size={24} color={theme.accent} />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={[styles.optionTitle, { color: theme.textPrimary }]}>
              Perfil
            </Text>
            <Text style={[styles.optionSubtitle, { color: theme.textSecondary }]}>
              Ver y editar tu información personal.
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
        </TouchableOpacity>

        {/* Cambiar tema */}
        <TouchableOpacity
          style={[styles.optionCard, { backgroundColor: theme.card }]}
          onPress={toggleTheme}
        >
          <Ionicons name="contrast-outline" size={24} color={theme.accent} />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={[styles.optionTitle, { color: theme.textPrimary }]}>
              Cambiar tema
            </Text>
            <Text style={[styles.optionSubtitle, { color: theme.textSecondary }]}>
              Alternar entre modo claro y oscuro.
            </Text>
          </View>
        </TouchableOpacity>

        <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
          Sesión
        </Text>

        {/* Cerrar sesión */}
        <TouchableOpacity
          style={[
            styles.optionCard,
            { backgroundColor: '#FFEBEE', borderColor: '#C62828', borderWidth: 1 },
          ]}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={24} color="#D32F2F" />
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
  container: { flex: 1, marginTop: Platform.OS === 'ios' ? 40 : 0 },
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
  },
  topTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 12,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
    elevation: 2,
  },
  optionTitle: { fontSize: 14, fontWeight: '600' },
  optionSubtitle: { fontSize: 12 },
});
