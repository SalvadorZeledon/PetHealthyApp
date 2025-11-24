// src/screens/RegistroMascota.js
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { Dialog, ALERT_TYPE } from 'react-native-alert-notification';

const SPECIES_OPTIONS = [
  { id: 'perro',  label: 'Perro',  iconName: 'dog',        family: 'FontAwesome5',           enabled: true },
  { id: 'gato',   label: 'Gato',   iconName: 'cat',        family: 'FontAwesome5',           enabled: true },
  { id: 'ave',    label: 'Ave',    iconName: 'crow',       family: 'FontAwesome5',           enabled: false },
  { id: 'roedor', label: 'Roedor', iconName: 'otter',      family: 'FontAwesome5',           enabled: false },
  { id: 'reptil', label: 'Reptil', iconName: 'turtle',     family: 'MaterialCommunityIcons', enabled: false },
  { id: 'otro',   label: 'Otro',   iconName: 'ellipsis-h', family: 'FontAwesome5',           enabled: false },
];

const RegistroMascota = ({ navigation, route }) => {
  const [selectedSpecies, setSelectedSpecies] = useState(null);

  const userName = route?.params?.userName || '';

  const handleContinue = () => {
    if (!selectedSpecies) {
      Dialog.show({
        type: ALERT_TYPE.WARNING,
        title: 'Selecciona una especie',
        textBody: 'Por favor elige una especie para continuar con el registro.',
        button: 'Entendido',
      });
      return;
    }

    navigation.navigate('RegistroMascota1', {
      initialSpecies: selectedSpecies,
    });
  };

  const isContinueDisabled = !selectedSpecies;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Image
            source={require('../assets/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.appName}>PETHEALTHY</Text>
        </View>

        {/* Saludo */}
        <View style={styles.headerTextContainer}>
          <View style={styles.greetingRow}>
            <Text style={styles.greetingText}>
              ¡Hola{userName ? `, ${userName}` : ''}!
            </Text>
            <FontAwesome5 name="paw" size={28} color="#111827" style={styles.pawIcon} />
          </View>
          <Text style={styles.subtitleText}>
            Nos alegra darte la bienvenida a la familia PetHealthy.{"\n"}
            Para comenzar, cuéntanos sobre tu nuevo compañero.
          </Text>
        </View>

        {/* Selector de especie */}
        <View style={styles.gridContainer}>
          {SPECIES_OPTIONS.map(option => {
            const IconComponent =
              option.family === 'MaterialCommunityIcons'
                ? MaterialCommunityIcons
                : FontAwesome5;

            const isSelected = selectedSpecies === option.id;
            const isDisabled = !option.enabled;

            return (
              <TouchableOpacity
                key={option.id}
                activeOpacity={0.85}
                disabled={isDisabled}
                onPress={() => {
                  if (!isDisabled) {
                    setSelectedSpecies(option.id);
                  }
                }}
                style={[
                  styles.speciesCard,
                  isSelected && styles.speciesCardSelected,
                  isDisabled && styles.speciesCardDisabled,
                ]}
              >
                <View style={styles.iconContainer}>
                  <IconComponent
                    name={option.iconName}
                    size={34}
                    color={
                      isDisabled
                        ? '#9CA3AF'
                        : isSelected
                        ? '#111827'
                        : '#1F2933'
                    }
                  />
                </View>
                <Text
                  style={[
                    styles.speciesLabel,
                    isDisabled && styles.speciesLabelDisabled,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Botón principal */}
        <TouchableOpacity
          activeOpacity={0.9}
          disabled={isContinueDisabled}
          style={[
            styles.primaryButton,
            isContinueDisabled && styles.primaryButtonDisabled,
          ]}
          onPress={handleContinue}
        >
          <View style={styles.primaryButtonContent}>
            <Text
              style={[
                styles.primaryButtonText,
                isContinueDisabled && styles.primaryButtonTextDisabled,
              ]}
            >
              Continuar
            </Text>
            <FontAwesome5
              name="arrow-right"
              size={18}
              color={isContinueDisabled ? '#E5E7EB' : '#FFFFFF'}
              style={styles.primaryButtonIcon}
            />
          </View>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

export default RegistroMascota;


const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#DCFFFF', // pastel
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingVertical: 32,
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logo: {
    width: 100,
    height: 70,
    marginBottom: 8,
  },
  appName: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 3,
    color: '#111827',
  },
  headerTextContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 24,
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  greetingText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
  },
  pawIcon: {
    marginLeft: 8,
  },
  subtitleText: {
    marginTop: 12,
    fontSize: 14,
    textAlign: 'center',
    color: '#4B5563',
    lineHeight: 20,
  },
  gridContainer: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 32,
  },
  speciesCard: {
    width: '30%',
    aspectRatio: 0.9,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 8,
    marginBottom: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  speciesCardSelected: {
    borderWidth: 2,
    borderColor: '#0EA5E9',
    backgroundColor: '#E0F2FE',
  },
  speciesCardDisabled: {
    opacity: 0.45,
    shadowOpacity: 0.02,
    elevation: 0,
  },
  iconContainer: {
    marginBottom: 8,
  },
  speciesLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  speciesLabelDisabled: {
    color: '#9CA3AF',
  },
  primaryButton: {
    width: '100%',
    backgroundColor: '#0EA5E9', // azul activo
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonDisabled: {
    backgroundColor: '#BFDBFE', // azul muy claro
    shadowOpacity: 0,
    elevation: 0,
  },
  primaryButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.15)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  primaryButtonTextDisabled: {
    color: '#E5E7EB',
    textShadowOpacity: 0,
  },
  primaryButtonIcon: {
    marginLeft: 10,
  },
});
