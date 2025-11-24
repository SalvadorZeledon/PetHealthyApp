// screens/RegistroMascota1.js
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Platform,
  Image,
  KeyboardAvoidingView,
} from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { PET_SEX_OPTIONS } from '../src/utils/petConstants';

// Solo letras (con acentos), ñ y espacios
const NAME_REGEX = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ ]+$/;

const RegistroMascota1 = ({ navigation, route }) => {
  const [imageUri, setImageUri] = useState(null);
  const initialSpecies = route?.params?.initialSpecies || 'perro';

  const [name, setName] = useState('');
  const [sex, setSex] = useState('macho');

  const [hasMicrochip, setHasMicrochip] = useState(false);
  const [microchipId, setMicrochipId] = useState('');
  const [hasTattoo, setHasTattoo] = useState(false);

  const [ageValue, setAgeValue] = useState('');
  const [ageType, setAgeType] = useState('años');

  const [errors, setErrors] = useState({});

  const scrollRef = useRef(null);

  const handleGoBack = () => {
    navigation.goBack();
  };

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== 'granted') {
      alert('Necesitamos permiso para acceder a tus fotos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,   // 👈 quitamos recorte obligatorio
      quality: 0.9,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImageUri(result.assets[0].uri);
    }
  };

  const validate = () => {
    const newErrors = {};

    // Nombre: requerido + solo letras y espacios
    if (!name.trim()) {
      newErrors.name = 'Ingresa el nombre del perrito.';
    } else if (!NAME_REGEX.test(name.trim())) {
      newErrors.name =
        'El nombre solo puede contener letras y espacios (sin números ni símbolos).';
    }

    // Edad: requerida, entero positivo
    if (!ageValue.trim()) {
      newErrors.age = 'Ingresa la edad de tu mascota.';
    } else if (!/^\d+$/.test(ageValue.trim())) {
      newErrors.age = 'La edad debe ser un número entero positivo.';
    } else if (Number(ageValue) <= 0) {
      newErrors.age = 'La edad debe ser mayor que 0.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

const handleContinue = () => {
  if (!validate()) return;

  const draftPetStep1 = {
    especie: initialSpecies,            // 👈 NUEVO
    nombre: name.trim(),
    sexo: sex,
    tieneMicrochip: hasMicrochip,
    identificadorMicrochip: microchipId.trim() || null,
    poseeTatuaje: hasTattoo,
    edadValor: Number(ageValue),
    edadTipo: ageType,
    imageUri: imageUri || null,
  };

  navigation.navigate('RegistroMascota2', { draftPet: draftPetStep1 });
};


  const renderSexOption = (option) => {
    const isSelected = sex === option.value;
    const iconName = option.value === 'macho' ? 'mars' : 'venus';
    const isMale = option.value === 'macho';

    const selectedBackgroundStyle = isSelected
      ? isMale
        ? styles.chipMaleSelected
        : styles.chipFemaleSelected
      : null;

    return (
      <TouchableOpacity
        key={option.value}
        style={[styles.chip, selectedBackgroundStyle]}
        onPress={() => setSex(option.value)}
      >
        <FontAwesome5
          name={iconName}
          size={14}
          color={isSelected ? '#FFFFFF' : '#607D8B'}
          style={{ marginRight: 6 }}
        />
        <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
          {option.label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
    >
      <View style={styles.screen}>
        {/* Header */}
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.iconCircle} onPress={handleGoBack}>
            <Ionicons name="arrow-back" size={18} color="#37474F" />
          </TouchableOpacity>
          <Text style={styles.stepText}>Paso 1 de 3</Text>
        </View>

        <ScrollView
          ref={scrollRef}
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Contenedor de imagen siempre visible */}
          <View style={styles.imagePreviewWrapper}>
            <TouchableOpacity
              style={styles.imagePreview}
              activeOpacity={0.8}
              onPress={handlePickImage}
            >
              {imageUri ? (
                <>
                  <Image
                    source={{ uri: imageUri }}
                    style={styles.imagePreviewImage}
                  />
                  {/* Botón lápiz para editar en la esquina inferior derecha */}
                  <TouchableOpacity
                    style={styles.imageEditButton}
                    onPress={handlePickImage}
                  >
                    <FontAwesome5 name="pen" size={14} color="#FFFFFF" />
                  </TouchableOpacity>
                </>
              ) : (
                <View style={styles.imagePlaceholder}>
                  <FontAwesome5 name="camera" size={28} color="#9CA3AF" />
                  <Text style={styles.imagePlaceholderText}>
                    Toca para agregar una foto
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Contenedor principal del formulario */}
          <View style={styles.card}>
            {/* Títulos */}
            <View style={styles.headerTextBlock}>
              <Text style={styles.title}>Registrar mascota</Text>
              <Text style={styles.subtitle}>
                Empecemos con los datos básicos de tu perrito.
              </Text>
            </View>

            {/* Nombre */}
            <View style={styles.section}>
              <Text style={styles.label}>Nombre del perrito</Text>
              <TextInput
                style={[
                  styles.input,
                  errors.name && styles.inputError,
                ]}
                placeholder="Ej: Firulais"
                value={name}
                onChangeText={(text) => {
                  // Solo letras, espacios y acentos
                  const cleaned = text.replace(
                    /[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ ]/g,
                    ''
                  );
                  setName(cleaned);
                }}
              />
              {errors.name && (
                <Text style={styles.errorText}>{errors.name}</Text>
              )}
            </View>

            {/* Sexo */}
            <View style={styles.section}>
              <Text style={styles.label}>Sexo</Text>
              <View style={styles.rowWrap}>
                {PET_SEX_OPTIONS.map(renderSexOption)}
              </View>
            </View>

            {/* Microchip + Tatuaje en la misma fila */}
            <View style={styles.section}>
              <View style={styles.rowSplit}>
                {/* Columna izquierda: microchip */}
                <View style={styles.splitColumn}>
                  <Text style={styles.label}>¿Posee microchip?</Text>
                  <View style={styles.rowWrap}>
                    <TouchableOpacity
                      style={[
                        styles.chip,
                        hasMicrochip && styles.chipSelected,
                      ]}
                      onPress={() => setHasMicrochip(true)}
                    >
                      <FontAwesome5
                        name="microchip"
                        size={14}
                        color={hasMicrochip ? '#FFFFFF' : '#607D8B'}
                        style={{ marginRight: 6 }}
                      />
                      <Text
                        style={[
                          styles.chipText,
                          hasMicrochip && styles.chipTextSelected,
                        ]}
                      >
                        Sí
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.chip,
                        !hasMicrochip && styles.chipSelected,
                      ]}
                      onPress={() => setHasMicrochip(false)}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          !hasMicrochip && styles.chipTextSelected,
                        ]}
                      >
                        No
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <TextInput
                    style={[
                      styles.input,
                      { marginTop: 8 },
                      !hasMicrochip && styles.inputDisabled,
                    ]}
                    placeholder="Código de microchip"
                    value={microchipId}
                    onChangeText={setMicrochipId}
                    editable={hasMicrochip}
                  />
                </View>

                {/* Columna derecha: tatuaje */}
                <View style={[styles.splitColumn, { marginLeft: 12 }]}>
                  <Text style={styles.label}>¿Posee tatuaje?</Text>
                  <View style={styles.rowWrap}>
                    <TouchableOpacity
                      style={[
                        styles.chip,
                        hasTattoo && styles.chipSelected,
                      ]}
                      onPress={() => setHasTattoo(true)}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          hasTattoo && styles.chipTextSelected,
                        ]}
                      >
                        Sí
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.chip,
                        !hasTattoo && styles.chipSelected,
                      ]}
                      onPress={() => setHasTattoo(false)}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          !hasTattoo && styles.chipTextSelected,
                        ]}
                      >
                        No
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>

            {/* Edad */}
            <View style={styles.section}>
              <Text style={styles.label}>Edad</Text>
              <View style={styles.ageRow}>
                <TextInput
                  style={[
                    styles.input,
                    styles.inputAge,
                    errors.age && styles.inputError,
                  ]}
                  keyboardType="numeric"
                  placeholder="Ej: 2"
                  value={ageValue}
                  onChangeText={(text) => {
                    // Solo dígitos 0–9, nada de puntos ni signos
                    const cleaned = text.replace(/[^0-9]/g, '');
                    setAgeValue(cleaned);
                  }}
                  onFocus={() => {
                    // 👇 cuando enfoca, hacemos scroll para que quede visible
                    scrollRef.current?.scrollToEnd({ animated: true });
                  }}
                />
                <View style={styles.ageOptions}>
                  {['años', 'meses'].map((type) => {
                    const isSelected = ageType === type;
                    return (
                      <TouchableOpacity
                        key={type}
                        style={[
                          styles.chip,
                          styles.chipSmall,
                          isSelected && styles.chipSelected,
                        ]}
                        onPress={() => setAgeType(type)}
                      >
                        <Text
                          style={[
                            styles.chipText,
                            isSelected && styles.chipTextSelected,
                          ]}
                        >
                          {type}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
              {errors.age && <Text style={styles.errorText}>{errors.age}</Text>}
            </View>

            {/* Botón continuar */}
            <TouchableOpacity style={styles.primaryButton} onPress={handleContinue}>
              <Text style={styles.primaryButtonText}>Continuar</Text>
              <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <View style={{ height: 24 }} />
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
};

export default RegistroMascota1;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#D0E8F2'
  },
  headerRow: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 48 : 20,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E4E9F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepText: {
    marginLeft: 12,
    fontSize: 12,
    color: '#7B8794',
    fontWeight: '500',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 20,
  },

  // Imagen
  imagePreviewWrapper: {
    alignItems: 'center',
    marginBottom: 16,
  },
  imagePreview: {
    width: '100%',
    maxWidth: 500,
    marginBottom: 1,
    marginTop: 1,
    height: 200,
    borderRadius: 24,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  imagePreviewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover', // mantiene la imagen centrada
  },
  imagePlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePlaceholderText: {
    marginTop: 8,
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  imageEditButton: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Card formulario
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginTop: 1,
    paddingHorizontal: 18,
    paddingVertical: 20,
    elevation: 3,
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  headerTextBlock: {
    alignItems: 'center',
    marginBottom: 18,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  subtitle: {
    marginTop: 4,
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  section: {
    marginBottom: 14,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  input: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    backgroundColor: '#F9FAFB',
  },
  inputAge: {
    flex: 0.35,
    marginRight: 8,
  },
  inputDisabled: {
    backgroundColor: '#E5E7EB',
    color: '#9CA3AF',
  },
  inputError: {
    borderColor: '#EF4444',
  },
  errorText: {
    marginTop: 4,
    fontSize: 11,
    color: '#EF4444',
  },

  rowWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
  },
  ageRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ageOptions: {
    flexDirection: 'row',
    flex: 1,
  },

  // Fila microchip / tatuaje
  rowSplit: {
    flexDirection: 'row',
  },
  splitColumn: {
    flex: 1,
  },

  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: '#F9FAFB',
  },
  chipSmall: {
    paddingHorizontal: 10,
  },
  chipSelected: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  chipMaleSelected: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  chipFemaleSelected: {
    backgroundColor: '#EC4899',
    borderColor: '#EC4899',
  },
  chipText: {
    fontSize: 13,
    color: '#4B5563',
  },
  chipTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },

  primaryButton: {
    marginTop: 8,
    marginBottom: 20,
    alignSelf: 'flex-end',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563EB',
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 13,
    marginRight: 6,
  },
});
