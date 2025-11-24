import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const AppointmentsScreen = ({ navigation }) => {
  const handleOpenSettings = () => {
    navigation.navigate('Settings');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Citas</Text>

        <TouchableOpacity
          style={styles.iconCircle}
          onPress={handleOpenSettings}
        >
          <Ionicons name="settings-outline" size={20} color="#365b6d" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Diseño de ejemplo para futuras citas */}
        <View style={styles.placeholderCard}>
          <Ionicons name="calendar-outline" size={40} color="#1E88E5" />
          <Text style={styles.placeholderTitle}>Tus citas médicas</Text>
          <Text style={styles.placeholderText}>
            Revisa y administra las consultas, vacunas y controles de tus
            mascotas.
          </Text>

          <TouchableOpacity style={styles.primaryButton}>
            <Ionicons name="add-outline" size={18} color="#FFFFFF" />
            <Text style={styles.primaryButtonText}>Agendar nueva cita</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <View>
            <Text style={styles.cardTitle}>Consulta general</Text>
            <Text style={styles.cardSubtitle}>Con Max 🐶</Text>
            <Text style={styles.cardDetail}>Lunes 15 · 10:30 AM</Text>
            <Text style={styles.cardDetail}>Clínica PetHealthy</Text>
          </View>
          <View style={styles.cardIconWrapper}>
            <Ionicons name="time-outline" size={22} color="#365b6d" />
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default AppointmentsScreen;

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
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#263238',
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
  content: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  placeholderCard: {
    marginTop: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    alignItems: 'center',
    elevation: 3,
    marginBottom: 16,
  },
  placeholderTitle: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#263238',
  },
  placeholderText: {
    marginTop: 4,
    fontSize: 13,
    color: '#607D8B',
    textAlign: 'center',
  },
  primaryButton: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E88E5',
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 13,
    marginLeft: 6,
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
});
