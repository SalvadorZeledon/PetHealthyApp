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

const MyPetScreen = ({ navigation }) => {
  const handleOpenSettings = () => {
    navigation.navigate('Settings');
  };

  return (
    <View style={styles.container}>

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mis mascotas</Text>

        <TouchableOpacity
          style={styles.iconCircle}
          onPress={handleOpenSettings}
        >
          <Ionicons name="settings-outline" size={20} color="#365b6d" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Aquí ya luego metemos la lógica real de mascotas */}
        <View style={styles.placeholderCard}>
          <Ionicons name="paw-outline" size={40} color="#4CAF50" />
          <Text style={styles.placeholderTitle}>Tus mascotas</Text>
          <Text style={styles.placeholderText}>
            Aquí podrás ver, agregar y administrar las fichas de tus mascotas.
          </Text>

          <TouchableOpacity style={styles.primaryButton}>
            <Ionicons name="add-outline" size={18} color="#FFFFFF" />
            <Text style={styles.primaryButtonText}>Agregar mascota</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

export default MyPetScreen;

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
    backgroundColor: '#4CAF50',
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
});
