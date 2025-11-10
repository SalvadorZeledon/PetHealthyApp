// screens/HomeScreen.js
import React, { useState, useCallback } from 'react';
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

  // Cargar usuario + foto cada vez que la pantalla gana foco
  useFocusEffect(
    useCallback(() => {
      const loadUser = async () => {
        try {
          setLoadingUser(true);
          const stored = await getUserFromStorage();
          if (!stored) {
            setUser(null);
            setPhotoUri(null);
            return;
          }

          setUser(stored);

          // foto local
          if (stored.id) {
            const localPhoto = await AsyncStorage.getItem(
              `@userPhoto_${stored.id}`
            );
            if (localPhoto) {
              setPhotoUri(localPhoto);
            } else {
              setPhotoUri(null);
            }
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

  const handleOpenSettings = () => {
    navigation.navigate('Settings');
  };

  const handleOpenProfile = () => {
    navigation.navigate('UserInfo');
  };

  const displayName =
    (user && (user.nombre || user.username || user.nombres)) || 'Usuario';

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <View>
          <Text style={styles.helloText}>Hola,</Text>
          {loadingUser ? (
            <ActivityIndicator size="small" color="#365b6d" />
          ) : (
            <View style={styles.nameRow}>
              <Text style={styles.nameText}>{displayName}</Text>
              <Text style={styles.wave}> 👋</Text>
            </View>
          )}
        </View>

        <View style={styles.headerRight}>
          {/* Botón Configuración */}
          <TouchableOpacity
            style={styles.iconCircle}
            onPress={handleOpenSettings}
          >
            <Ionicons name="settings-outline" size={20} color="#365b6d" />
          </TouchableOpacity>

          {/* Avatar usuario */}
          <TouchableOpacity
            style={[styles.iconCircle, { marginLeft: 8 }]}
            onPress={handleOpenProfile}
          >
            <Image
              source={photoUri ? { uri: photoUri } : avatarPlaceholder}
              style={styles.avatar}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* CONTENIDO PRINCIPAL */}
      <ScrollView contentContainerStyle={styles.content}>
        {/* Tarjeta principal de cuidado de mascotas */}
        <View style={styles.mainCard}>
          <Text style={styles.mainCardTitle}>Cuidado de tus mascotas</Text>
          <Text style={styles.mainCardSubtitle}>
            Revisa sus vacunas, próximas citas y recomendaciones de bienestar.
          </Text>

          <TouchableOpacity style={styles.mainCardButton}>
            <Ionicons name="paw-outline" size={18} color="#FFFFFF" />
            <Text style={styles.mainCardButtonText}>
              3 mascotas registradas
            </Text>
          </TouchableOpacity>
        </View>

        {/* Aquí puedes mantener tus secciones de "Tu próxima cita", "Accesos rápidos", etc.
           Yo dejo una estructura base para que no pierdas nada de diseño. */}

        <Text style={styles.sectionTitle}>Tu próxima cita</Text>
        <View style={styles.card}>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>Consulta general</Text>
            <Text style={styles.cardSubtitle}>Con Max 🐶</Text>
            <Text style={styles.cardDetail}>Lunes 15 · 10:30 AM</Text>
            <Text style={styles.cardDetail}>Clínica PetHealthy</Text>
          </View>
          <View style={styles.cardIconWrapper}>
            <Ionicons name="calendar-outline" size={22} color="#365b6d" />
          </View>
        </View>

        <Text style={styles.sectionTitle}>Accesos rápidos</Text>
        <View style={styles.quickRow}>
          <TouchableOpacity style={styles.quickCard}>
            <Ionicons name="add-circle-outline" size={22} color="#4CAF50" />
            <Text style={styles.quickText}>Agregar mascota</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.quickCard}>
            <Ionicons name="medkit-outline" size={22} color="#1E88E5" />
            <Text style={styles.quickText}>Vacunas</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.quickCard}>
            <Ionicons name="time-outline" size={22} color="#FFB300" />
            <Text style={styles.quickText}>Próximas citas</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Resumen de salud</Text>
        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Ionicons name="heart-outline" size={22} color="#E91E63" />
            <Text style={styles.summaryTitle}>Vacunas al día</Text>
            <Text style={styles.summaryValue}>4 / 5</Text>
          </View>

          <View style={styles.summaryCard}>
            <Ionicons name="chatbubbles-outline" size={22} color="#00796B" />
            <Text style={styles.summaryTitle}>Consultas este año</Text>
            <Text style={styles.summaryValue}>3</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E3F2FD',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Platform.OS === 'ios' ? 40 : 0,
  },
  helloText: {
    fontSize: 14,
    color: '#607D8B',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  nameText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#263238',
  },
  wave: {
    fontSize: 20,
    marginLeft: 4,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  mainCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    elevation: 3,
  },
  mainCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#263238',
  },
  mainCardSubtitle: {
    marginTop: 4,
    fontSize: 13,
    color: '#607D8B',
  },
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
  sectionTitle: {
    marginTop: 8,
    marginBottom: 6,
    fontSize: 14,
    fontWeight: '600',
    color: '#365b6d',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#263238',
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#607D8B',
  },
  cardDetail: {
    fontSize: 12,
    color: '#90A4AE',
  },
  cardIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  quickCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 10,
    alignItems: 'center',
    marginHorizontal: 4,
    elevation: 2,
  },
  quickText: {
    marginTop: 4,
    fontSize: 12,
    color: '#455A64',
    textAlign: 'center',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 10,
    alignItems: 'center',
    marginHorizontal: 4,
    elevation: 2,
  },
  summaryTitle: {
    fontSize: 12,
    color: '#607D8B',
    marginTop: 4,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#263238',
    marginTop: 2,
  },
});
