// screens/HomeScreen.js
import React, { useState, useCallback } from 'react';
import { useTheme } from '../src/themes/ThemeContext';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { getUserFromStorage } from '../src/utils/storage';

const avatarPlaceholder = require('../assets/logo.png');

const HomeScreen = ({ navigation }) => {
  const [user, setUser] = useState(null);
  const [photoUri, setPhotoUri] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

  const { theme, darkMode } = useTheme();

  useFocusEffect(
    useCallback(() => {
      const loadUser = async () => {
        try {
          setLoadingUser(true);
          const stored = await getUserFromStorage();

          setUser(stored || null);

          if (stored?.id) {
            const localPhoto = await AsyncStorage.getItem(
              `@userPhoto_${stored.id}`
            );
            setPhotoUri(localPhoto || null);
          } else {
            setPhotoUri(null);
          }

        } catch (error) {
          console.log('Error al cargar usuario en HomeScreen:', error);
        } finally {
          setLoadingUser(false);
        }
      };

      loadUser();
    }, [])
  );

  const handleOpenSettings = () => navigation.navigate('Settings');
  const handleOpenProfile = () => navigation.navigate('UserInfo');

  const displayName =
    (user && (user.nombre || user.username || user.nombres)) || 'Usuario';

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>

      {/* HEADER */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.helloText, { color: theme.textSecondary }]}>Hola,</Text>

          {loadingUser ? (
            <ActivityIndicator size="small" color={theme.accent} />
          ) : (
            <View style={styles.nameRow}>
              <Text style={[styles.nameText, { color: theme.textPrimary }]}>
                {displayName}
              </Text>
              <Text style={styles.wave}> 👋</Text>
            </View>
          )}
        </View>

        <View style={styles.headerRight}>
          
          {/* Settings */}
          <TouchableOpacity
            style={[styles.iconCircle, { backgroundColor: theme.card }]}
            onPress={handleOpenSettings}
          >
            <Ionicons name="settings-outline" size={20} color={theme.accent} />
          </TouchableOpacity>

          {/* Avatar */}
          <TouchableOpacity
            style={[styles.iconCircle, { backgroundColor: theme.card, marginLeft: 8 }]}
            onPress={handleOpenProfile}
          >
            <Image
              source={photoUri ? { uri: photoUri } : avatarPlaceholder}
              style={styles.avatar}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* CONTENIDO */}
      <ScrollView contentContainerStyle={styles.content}>

        {/* Card principal */}
        <View style={[styles.mainCard, { backgroundColor: theme.card }]}>
          <Text style={[styles.mainCardTitle, { color: theme.textPrimary }]}>
            Cuidado de tus mascotas
          </Text>

          <Text style={[styles.mainCardSubtitle, { color: theme.textSecondary }]}>
            Revisa sus vacunas, próximas citas y recomendaciones de bienestar.
          </Text>

          <TouchableOpacity style={styles.mainCardButton}>
            <Ionicons name="paw-outline" size={18} color="#FFFFFF" />
            <Text style={styles.mainCardButtonText}>
              3 mascotas registradas
            </Text>
          </TouchableOpacity>
        </View>

        {/* Sección próxima cita */}
        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
          Tu próxima cita
        </Text>

        <View style={[styles.card, { backgroundColor: theme.card }]}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>
              Consulta general
            </Text>
            <Text style={[styles.cardSubtitle, { color: theme.textSecondary }]}>
              Con Max 🐶
            </Text>
            <Text style={[styles.cardDetail, { color: theme.textSecondary }]}>
              Lunes 15 · 10:30 AM
            </Text>
            <Text style={[styles.cardDetail, { color: theme.textSecondary }]}>
              Clínica PetHealthy
            </Text>
          </View>

          <View style={[styles.cardIconWrapper, { backgroundColor: theme.background }]}>
            <Ionicons name="calendar-outline" size={22} color={theme.accent} />
          </View>
        </View>

        {/* Accesos rápidos */}
        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
          Accesos rápidos
        </Text>

        <View style={styles.quickRow}>
          <TouchableOpacity style={[styles.quickCard, { backgroundColor: theme.card }]}>
            <Ionicons name="add-circle-outline" size={22} color={theme.accent} />
            <Text style={[styles.quickText, { color: theme.textPrimary }]}>
              Agregar mascota
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.quickCard, { backgroundColor: theme.card }]}>
            <Ionicons name="medkit-outline" size={22} color={theme.accent} />
            <Text style={[styles.quickText, { color: theme.textPrimary }]}>
              Vacunas
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.quickCard, { backgroundColor: theme.card }]}>
            <Ionicons name="time-outline" size={22} color={theme.accent} />
            <Text style={[styles.quickText, { color: theme.textPrimary }]}>
              Próximas citas
            </Text>
          </TouchableOpacity>
        </View>

        {/* Resumen de salud */}
        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
          Resumen de salud
        </Text>

        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, { backgroundColor: theme.card }]}>
            <Ionicons name="heart-outline" size={22} color={theme.accent} />
            <Text style={[styles.summaryTitle, { color: theme.textSecondary }]}>
              Vacunas al día
            </Text>
            <Text style={[styles.summaryValue, { color: theme.textPrimary }]}>
              4 / 5
            </Text>
          </View>

          <View style={[styles.summaryCard, { backgroundColor: theme.card }]}>
            <Ionicons name="chatbubbles-outline" size={22} color={theme.accent} />
            <Text style={[styles.summaryTitle, { color: theme.textSecondary }]}>
              Consultas este año
            </Text>
            <Text style={[styles.summaryValue, { color: theme.textPrimary }]}>
              3
            </Text>
          </View>
        </View>

      </ScrollView>
    </View>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Platform.OS === 'ios' ? 40 : 0,
  },
  helloText: { fontSize: 14 },
  nameRow: { flexDirection: 'row', alignItems: 'center' },
  nameText: { fontSize: 20, fontWeight: '700' },
  wave: { fontSize: 20, marginLeft: 4 },
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
  },
  avatar: { width: 28, height: 28, borderRadius: 14 },
  content: { paddingHorizontal: 20, paddingBottom: 24 },
  mainCard: {
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    elevation: 3,
  },
  mainCardTitle: { fontSize: 16, fontWeight: '700' },
  mainCardSubtitle: { marginTop: 4, fontSize: 13 },
  mainCardButton: {
    marginTop: 12,
    backgroundColor: '#4CAF50',
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  mainCardButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 13,
    marginLeft: 6,
  },
  sectionTitle: { marginTop: 8, marginBottom: 6, fontSize: 14, fontWeight: '600' },
  card: {
    borderRadius: 18,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    elevation: 2,
  },
  cardTitle: { fontSize: 15, fontWeight: '600' },
  cardSubtitle: { fontSize: 13 },
  cardDetail: { fontSize: 12 },
  cardIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 },
  quickCard: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 10,
    alignItems: 'center',
    marginHorizontal: 4,
    elevation: 2,
  },
  quickText: { marginTop: 4, fontSize: 12, textAlign: 'center' },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
  summaryCard: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 10,
    alignItems: 'center',
    marginHorizontal: 4,
    elevation: 2,
  },
  summaryTitle: { fontSize: 12, marginTop: 4 },
  summaryValue: { fontSize: 16, fontWeight: '700', marginTop: 2 },
});
