// screens/DogBasicInfoScreen.js
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";

import {
  SPECIES,
  DOG_BREEDS,
  PET_SEX_OPTIONS,
} from "../../../shared/utils/petConstants";


const DogBasicInfoScreen = ({ navigation, route }) => {
  // Por si en el futuro quieres reutilizar para edición
  const editingPet = route?.params?.pet || null;

  const [name, setName] = useState(editingPet?.nombre || "");
  const [imageUri, setImageUri] = useState(editingPet?.imageUri || null);

  const [sex, setSex] = useState(editingPet?.sexo || "macho");
  const [hasMicrochip, setHasMicrochip] = useState(
    editingPet?.tieneMicrochip ?? false
  );
  const [microchipId, setMicrochipId] = useState(
    editingPet?.identificadorMicrochip || ""
  );

  const [ageValue, setAgeValue] = useState(
    editingPet?.edadValor ? String(editingPet.edadValor) : ""
  );
  const [ageType, setAgeType] = useState(editingPet?.edadTipo || "años");

  const [selectedBreed, setSelectedBreed] = useState(
    editingPet?.razaEsOtra
      ? "Otra raza"
      : editingPet?.raza || "Labrador Retriever"
  );
  const [customBreed, setCustomBreed] = useState(
    editingPet?.razaEsOtra ? editingPet.raza : ""
  );

  const [weightLbs, setWeightLbs] = useState(
    editingPet?.pesoLbs ? String(editingPet.pesoLbs) : ""
  );
  const [heightCm, setHeightCm] = useState(
    editingPet?.alturaCm ? String(editingPet.alturaCm) : ""
  );
  const [description, setDescription] = useState(editingPet?.descripcion || "");

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
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleContinue = () => {
    if (!name.trim()) {
      alert("Ingresa el nombre del perrito.");
      return;
    }

    if (!ageValue.trim() || isNaN(Number(ageValue))) {
      alert("Ingresa una edad válida.");
      return;
    }

    const finalBreed =
      selectedBreed === "Otra raza" ? customBreed.trim() : selectedBreed;

    if (!finalBreed) {
      alert("Selecciona o escribe la raza del perrito.");
      return;
    }

    const draftPet = {
      especie: SPECIES.PERRO,
      nombre: name.trim(),
      sexo: sex,
      tieneMicrochip: hasMicrochip,
      identificadorMicrochip: microchipId.trim() || null,
      edadValor: Number(ageValue),
      edadTipo: ageType,
      raza: finalBreed,
      razaEsOtra: selectedBreed === "Otra raza",
      pesoLbs: weightLbs ? Number(weightLbs) : null,
      alturaCm: heightCm ? Number(heightCm) : null,
      descripcion: description.trim(),
      imageUri: imageUri || null,
    };

    navigation.navigate("DogMedicalForm", { draftPet });
  };

  const renderSexOption = (option) => {
    const isSelected = sex === option.value;
    return (
      <TouchableOpacity
        key={option.value}
        style={[styles.chip, isSelected && styles.chipSelected]}
        onPress={() => setSex(option.value)}
      >
        <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
          {option.label}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderBreedChip = (breed) => {
    const isSelected = breed === selectedBreed;
    return (
      <TouchableOpacity
        key={breed}
        style={[styles.breedChip, isSelected && styles.breedChipSelected]}
        onPress={() => setSelectedBreed(breed)}
      >
        <Text
          style={[
            styles.breedChipText,
            isSelected && styles.breedChipTextSelected,
          ]}
        >
          {breed}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header superior solo con botón back */}
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.iconCircle} onPress={handleGoBack}>
          <Ionicons name="arrow-back" size={18} color="#37474F" />
        </TouchableOpacity>
      </View>
      <Text style={{ fontSize: 22, color: "red" }}>
        DEBUG: ESTA ES LA NUEVA PANTALLA
      </Text>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Tarjeta principal con título + foto */}
        <View style={styles.heroCard}>
          <View style={styles.heroTextWrapper}>
            <Text style={styles.heroTitle}>Registrar Mascota</Text>
            <Text style={styles.heroSubtitle}>
              Completa la información de tu mascota para un mejor seguimiento
              médico.
            </Text>
          </View>

          <TouchableOpacity
            style={styles.heroPhotoWrapper}
            onPress={handlePickImage}
          >
            <View style={styles.heroPhotoInner}>
              <Ionicons
                name={imageUri ? "image" : "add-circle-outline"}
                size={26}
                color="#26A69A"
              />
              <Text style={styles.heroPhotoText}>
                {imageUri ? "Cambiar foto" : "Agregar foto"}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Nombre */}
        <View style={styles.section}>
          <Text style={styles.label}>Nombre del perrito</Text>
          <TextInput
            style={styles.input}
            placeholder="Firulais"
            value={name}
            onChangeText={setName}
          />
        </View>

        {/* Sexo */}
        <View style={styles.section}>
          <Text style={styles.label}>Sexo</Text>
          <View style={styles.rowWrap}>
            {PET_SEX_OPTIONS.map(renderSexOption)}
          </View>
        </View>

        {/* Microchip */}
        <View style={styles.section}>
          <Text style={styles.label}>¿Posee microchip o tatuaje?</Text>
          <View style={styles.rowWrap}>
            <TouchableOpacity
              style={[styles.chip, hasMicrochip && styles.chipSelected]}
              onPress={() => setHasMicrochip(true)}
            >
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
              style={[styles.chip, !hasMicrochip && styles.chipSelected]}
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

          {hasMicrochip && (
            <TextInput
              style={[styles.input, { marginTop: 8 }]}
              placeholder="Código de microchip o tatuaje (opcional)"
              value={microchipId}
              onChangeText={setMicrochipId}
            />
          )}
        </View>

        {/* Edad */}
        <View style={styles.section}>
          <Text style={styles.label}>Edad</Text>
          <View style={styles.ageRow}>
            <TextInput
              style={[styles.input, styles.inputAge]}
              keyboardType="numeric"
              placeholder="2"
              value={ageValue}
              onChangeText={setAgeValue}
            />
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
        </View>

        {/* Raza */}
        <View style={styles.section}>
          <Text style={styles.label}>Raza</Text>
          <View style={styles.breedsContainer}>
            {DOG_BREEDS.map(renderBreedChip)}
          </View>

          {selectedBreed === "Otra raza" && (
            <TextInput
              style={[styles.input, { marginTop: 8 }]}
              placeholder="Escribe la raza"
              value={customBreed}
              onChangeText={setCustomBreed}
            />
          )}
        </View>

        {/* Peso */}
        <View style={styles.section}>
          <Text style={styles.label}>Peso (libras)</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            placeholder="Ej: 25"
            value={weightLbs}
            onChangeText={setWeightLbs}
          />
          <Text style={styles.helperText}>
            Más adelante podrás ver el peso también en kilogramos.
          </Text>
        </View>

        {/* Altura */}
        <View style={styles.section}>
          <Text style={styles.label}>Altura (cm)</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            placeholder="Ej: 45"
            value={heightCm}
            onChangeText={setHeightCm}
          />
          <Text style={styles.helperText}>
            La altura se mide desde las patas hasta el hombro, no en dos patas.
            🐶
          </Text>
        </View>

        {/* Descripción */}
        <View style={styles.section}>
          <Text style={styles.label}>Descripción de la mascota</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Color blanco con manchas cafés, muy juguetón..."
            value={description}
            onChangeText={setDescription}
            multiline
          />
        </View>

        {/* Botón continuar */}
        <TouchableOpacity style={styles.primaryButton} onPress={handleContinue}>
          <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
          <Text style={styles.primaryButtonText}>
            Continuar a historial médico
          </Text>
        </TouchableOpacity>

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
};

export default DogBasicInfoScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FA",
  },

  // Header solo con botón back
  headerRow: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 48 : 20,
    paddingBottom: 8,
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
  },

  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#ECEFF1",
    alignItems: "center",
    justifyContent: "center",
  },

  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },

  // Tarjeta azul con título + foto
  heroCard: {
    backgroundColor: "#B2EBF2",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 20,
    flexDirection: "row",
    alignItems: "center",
  },
  heroTextWrapper: {
    flex: 1,
    marginRight: 12,
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#004D40",
  },
  heroSubtitle: {
    marginTop: 4,
    fontSize: 12,
    color: "#00695C",
  },
  heroPhotoWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#E0F7FA",
    borderWidth: 1,
    borderColor: "#80DEEA",
    alignItems: "center",
    justifyContent: "center",
  },
  heroPhotoInner: {
    alignItems: "center",
    justifyContent: "center",
  },
  heroPhotoText: {
    marginTop: 4,
    fontSize: 10,
    color: "#00796B",
    fontWeight: "600",
    textAlign: "center",
  },

  section: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#455A64",
    marginBottom: 6,
  },
  input: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#CFD8DC",
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    backgroundColor: "#FFFFFF",
  },
  inputAge: {
    flex: 0.35,
    marginRight: 8,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  helperText: {
    marginTop: 4,
    fontSize: 11,
    color: "#90A4AE",
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  rowWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 8,
  },

  // fila especial para la edad
  ageRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  ageOptions: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },

  chip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#CFD8DC",
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: "#FFFFFF",
  },
  chipSmall: {
    paddingHorizontal: 12,
  },
  chipSelected: {
    backgroundColor: "#4CAF50",
    borderColor: "#4CAF50",
  },
  chipText: {
    fontSize: 13,
    color: "#455A64",
  },
  chipTextSelected: {
    color: "#FFFFFF",
    fontWeight: "600",
  },

  breedsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  breedChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#CFD8DC",
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: "#FFFFFF",
  },
  breedChipSelected: {
    backgroundColor: "#E8F5E9",
    borderColor: "#4CAF50",
  },
  breedChipText: {
    fontSize: 12,
    color: "#455A64",
  },
  breedChipTextSelected: {
    color: "#2E7D32",
    fontWeight: "600",
  },

  primaryButton: {
    marginTop: 12,
    alignSelf: "flex-end",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#4CAF50",
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 13,
    marginLeft: 6,
  },
});
