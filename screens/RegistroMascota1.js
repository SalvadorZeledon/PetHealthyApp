// screens/RegistroMascota1.js
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Platform,
  Image,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
} from "react-native";
import { Ionicons, FontAwesome5 } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { PET_SEX_OPTIONS } from "../src/utils/petConstants";

// Solo letras (con acentos), ñ y espacios
const NAME_REGEX = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ ]+$/;
const MAX_AGE = 30; // máximo para el listado de edad

const RegistroMascota1 = ({ navigation, route }) => {
  const [imageUri, setImageUri] = useState(null);
  const initialSpecies = route?.params?.initialSpecies || "perro";

  const [name, setName] = useState("");
  const [sex, setSex] = useState("macho");

  const [hasMicrochip, setHasMicrochip] = useState(false);
  const [microchipId, setMicrochipId] = useState("");
  const [hasTattoo, setHasTattoo] = useState(false);

  const [ageValue, setAgeValue] = useState(""); // valor final (1,2,3...)
  const [ageType, setAgeType] = useState("años");

  const [errors, setErrors] = useState({});

  // dropdown pequeño de edad
  const [isAgeDropdownOpen, setIsAgeDropdownOpen] = useState(false);

  const handleGoBack = () => {
    navigation.goBack();
  };

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== "granted") {
      alert("Necesitamos permiso para acceder a tus fotos.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.9,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImageUri(result.assets[0].uri);
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!name.trim()) {
      newErrors.name = "Ingresa el nombre del perrito.";
    } else if (!NAME_REGEX.test(name.trim())) {
      newErrors.name =
        "El nombre solo puede contener letras y espacios (sin números ni símbolos).";
    }

    if (!ageValue.trim()) {
      newErrors.age = "Ingresa la edad de tu mascota.";
    } else if (!/^\d+$/.test(ageValue.trim())) {
      newErrors.age = "La edad debe ser un número entero positivo.";
    } else if (Number(ageValue) <= 0) {
      newErrors.age = "La edad debe ser mayor que 0.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContinue = () => {
    if (!validate()) return;

    const draftPetStep1 = {
      especie: initialSpecies,
      nombre: name.trim(),
      sexo: sex,
      tieneMicrochip: hasMicrochip,
      identificadorMicrochip: microchipId.trim() || null,
      poseeTatuaje: hasTattoo,
      edadValor: Number(ageValue),
      edadTipo: ageType,
      imageUri: imageUri || null,
    };

    navigation.navigate("RegistroMascota2", { draftPet: draftPetStep1 });
  };

  const renderSexOption = (option) => {
    const isSelected = sex === option.value;
    const iconName = option.value === "macho" ? "mars" : "venus";
    const isMale = option.value === "macho";

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
          color={isSelected ? "#FFFFFF" : "#607D8B"}
          style={{ marginRight: 6 }}
        />
        <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
          {option.label}
        </Text>
      </TouchableOpacity>
    );
  };

  const toggleAgeDropdown = () => {
    Keyboard.dismiss();
    setIsAgeDropdownOpen((prev) => !prev);
  };

  const handleSelectAge = (num) => {
    setAgeValue(String(num));
    setErrors((prev) => ({ ...prev, age: undefined }));
    setIsAgeDropdownOpen(false);
  };

  return (
    <KeyboardAwareScrollView
      style={styles.container}
      contentContainerStyle={styles.inner}
      enableOnAndroid={true}
      extraScrollHeight={32}
      keyboardShouldPersistTaps="handled"
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View>
          {/* Header */}
          <View style={styles.headerRow}>
            <TouchableOpacity style={styles.iconCircle} onPress={handleGoBack}>
              <Ionicons name="arrow-back" size={18} color="#37474F" />
            </TouchableOpacity>
            <Text style={styles.stepText}>Paso 1 de 3</Text>
          </View>

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

          {/* Card formulario */}
          <View style={styles.card}>
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
                style={[styles.input, errors.name && styles.inputError]}
                placeholder="Ej: Firulais"
                value={name}
                onChangeText={(text) => {
                  const cleaned = text.replace(/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ ]/g, "");
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

            {/* Microchip + Tatuaje */}
            <View style={styles.section}>
              <View style={styles.rowSplit}>
                <View style={styles.splitColumn}>
                  <Text style={styles.label}>¿Posee microchip?</Text>
                  <View style={styles.rowWrap}>
                    <TouchableOpacity
                      style={[styles.chip, hasMicrochip && styles.chipSelected]}
                      onPress={() => setHasMicrochip(true)}
                    >
                      <FontAwesome5
                        name="microchip"
                        size={14}
                        color={hasMicrochip ? "#FFFFFF" : "#607D8B"}
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
                </View>

                <View style={[styles.splitColumn, { marginLeft: 12 }]}>
                  <Text style={styles.label}>¿Posee tatuaje?</Text>
                  <View style={styles.rowWrap}>
                    <TouchableOpacity
                      style={[styles.chip, hasTattoo && styles.chipSelected]}
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
                      style={[styles.chip, !hasTattoo && styles.chipSelected]}
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

              {/* Input de microchip a TODO el ancho, solo si tiene microchip */}
              {hasMicrochip && (
                <TextInput
                  style={[styles.input, styles.microchipInput]}
                  placeholder="Código microchip"
                  placeholderTextColor="#9CA3AF"
                  value={microchipId}
                  onChangeText={(text) =>
                    setMicrochipId(text.replace(/\D/g, ""))
                  }
                  keyboardType="number-pad"
                />
              )}
            </View>

            {/* Edad */}
            <View style={styles.section}>
              <Text style={styles.label}>Edad</Text>
              <View style={styles.ageRow}>
                {/* Dropdown pequeño de edad */}
                <View style={styles.ageDropdownWrapper}>
                  <TouchableOpacity
                    style={[
                      styles.input,
                      styles.inputAge,
                      errors.age && styles.inputError,
                    ]}
                    onPress={toggleAgeDropdown}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={
                        ageValue
                          ? styles.ageValueText
                          : styles.agePlaceholderText
                      }
                    >
                      {ageValue ? ageValue : "Elegir"}
                    </Text>
                    <Ionicons
                      name={isAgeDropdownOpen ? "chevron-up" : "chevron-down"}
                      size={16}
                      color="#6B7280"
                    />
                  </TouchableOpacity>

                  {isAgeDropdownOpen && (
                    <View style={styles.ageDropdownList}>
                      <ScrollView
                        nestedScrollEnabled
                        showsVerticalScrollIndicator={true}
                      >
                        {Array.from({ length: MAX_AGE }, (_, i) => i + 1).map(
                          (num) => {
                            const selected = ageValue === String(num);
                            return (
                              <TouchableOpacity
                                key={num}
                                style={[
                                  styles.ageDropdownItem,
                                  selected && styles.ageDropdownItemSelected,
                                ]}
                                onPress={() => handleSelectAge(num)}
                              >
                                <Text
                                  style={[
                                    styles.ageDropdownItemText,
                                    selected &&
                                      styles.ageDropdownItemTextSelected,
                                  ]}
                                >
                                  {num}
                                </Text>
                              </TouchableOpacity>
                            );
                          }
                        )}
                      </ScrollView>
                    </View>
                  )}
                </View>

                {/* Años / meses */}
                <View style={styles.ageOptions}>
                  {["años", "meses"].map((type) => {
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
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleContinue}
            >
              <Text style={styles.primaryButtonText}>Continuar</Text>
              <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* espacio extra al final para que el botón no quede pegado */}
          <View style={{ height: 24 }} />
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAwareScrollView>
  );
};

export default RegistroMascota1;

const styles = StyleSheet.create({
  // igual que en Register: fondo + scroll aware
  container: {
    flex: 1,
    backgroundColor: "#D0E8F2",
  },
  inner: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 40 : 24,
    paddingBottom: 32,
  },

  headerRow: {
    paddingTop: 8,
    paddingBottom: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#E4E9F2",
    alignItems: "center",
    justifyContent: "center",
  },
  stepText: {
    marginLeft: 12,
    fontSize: 12,
    color: "#7B8794",
    fontWeight: "500",
  },

  // Imagen
  imagePreviewWrapper: {
    alignItems: "center",
    marginBottom: 16,
  },
  imagePreview: {
    width: "100%",
    maxWidth: 500,
    marginBottom: 1,
    marginTop: 1,
    height: 200,
    borderRadius: 24,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    overflow: "hidden",
  },
  imagePreviewImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  imagePlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  imagePlaceholderText: {
    marginTop: 8,
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500",
  },
  imageEditButton: {
    position: "absolute",
    bottom: 10,
    right: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(15, 23, 42, 0.85)",
    alignItems: "center",
    justifyContent: "center",
  },

  // Card formulario
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    marginTop: 1,
    paddingHorizontal: 18,
    paddingVertical: 20,
    elevation: 3,
    shadowColor: "#000000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  headerTextBlock: {
    alignItems: "center",
    marginBottom: 18,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  subtitle: {
    marginTop: 4,
    fontSize: 12,
    color: "#6B7280",
    textAlign: "center",
  },
  section: {
    marginBottom: 14,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 6,
  },
  input: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    backgroundColor: "#F9FAFB",
  },
  microchipInput: {
    marginTop: 10,
  },
  inputAge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 42,
  },
  ageValueText: {
    fontSize: 14,
    color: "#111827",
  },
  agePlaceholderText: {
    fontSize: 14,
    color: "#9CA3AF",
  },
  inputDisabled: {
    backgroundColor: "#E5E7EB",
    color: "#9CA3AF",
  },
  inputError: {
    borderColor: "#EF4444",
  },
  errorText: {
    marginTop: 4,
    fontSize: 11,
    color: "#EF4444",
  },

  rowWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 4,
  },
  ageRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },

  // wrapper del dropdown de edad (mismo ancho del recuadro)
  ageDropdownWrapper: {
    flex: 0.45,
    marginRight: 8,
    position: "relative",
  },
  ageDropdownList: {
    position: "absolute",
    // ⬇️ ahora se abre HACIA ARRIBA
    bottom: "100%",
    left: 0,
    right: 0,
    marginBottom: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    backgroundColor: "#FFFFFF",
    maxHeight: 160,
    overflow: "hidden",
    zIndex: 50,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  ageDropdownItem: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  ageDropdownItemSelected: {
    backgroundColor: "#DBEAFE",
  },
  ageDropdownItemText: {
    fontSize: 14,
    color: "#111827",
  },
  ageDropdownItemTextSelected: {
    fontWeight: "600",
  },

  ageOptions: {
    flexDirection: "row",
    flex: 1,
  },

  rowSplit: {
    flexDirection: "row",
  },
  splitColumn: {
    flex: 1,
  },

  chip: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: "#F9FAFB",
  },
  chipSmall: {
    paddingHorizontal: 10,
  },
  chipSelected: {
    backgroundColor: "#10B981",
    borderColor: "#10B981",
  },
  chipMaleSelected: {
    backgroundColor: "#3B82F6",
    borderColor: "#3B82F6",
  },
  chipFemaleSelected: {
    backgroundColor: "#EC4899",
    borderColor: "#EC4899",
  },
  chipText: {
    fontSize: 13,
    color: "#4B5563",
  },
  chipTextSelected: {
    color: "#FFFFFF",
    fontWeight: "600",
  },

  primaryButton: {
    marginTop: 8,
    marginBottom: 20,
    alignSelf: "flex-end",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2563EB",
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 13,
    marginRight: 6,
  },
});
