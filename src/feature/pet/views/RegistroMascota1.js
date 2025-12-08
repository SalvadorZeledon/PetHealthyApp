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
  StatusBar,
} from "react-native";
import { Ionicons, FontAwesome5, MaterialCommunityIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { PET_SEX_OPTIONS } from "../../../shared/utils/petConstants";

const NAME_REGEX = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ ]+$/;
const MAX_AGE = 30;

const OTHER_TYPES = [
  { id: "roedor", label: "Roedor", icon: "otter", family: "FontAwesome5" },
  { id: "ave", label: "Ave", icon: "crow", family: "FontAwesome5" },
  { id: "reptil", label: "Reptil", icon: "turtle", family: "MaterialCommunityIcons" },
  { id: "otro_tipo", label: "Otro", icon: "paw", family: "FontAwesome5" }, 
];

const RegistroMascota1 = ({ navigation, route }) => {
  const [imageUri, setImageUri] = useState(null);
  const initialSpecies = route?.params?.initialSpecies || "perro";

  const [otherType, setOtherType] = useState(
    initialSpecies === "otro" ? null : initialSpecies
  );
  const [customOtherText, setCustomOtherText] = useState("");

  const [name, setName] = useState("");
  const [sex, setSex] = useState("macho");

  const [hasMicrochip, setHasMicrochip] = useState(false);
  const [microchipId, setMicrochipId] = useState("");
  const [hasTattoo, setHasTattoo] = useState(false);

  const [hasRing, setHasRing] = useState(false);
  const [ringId, setRingId] = useState("");

  const [ageValue, setAgeValue] = useState(""); 
  const [ageType, setAgeType] = useState("años");
  
  // 👇 1. NUEVO ESTADO PARA PESO
  const [weight, setWeight] = useState("");

  const [errors, setErrors] = useState({});
  const [isAgeDropdownOpen, setIsAgeDropdownOpen] = useState(false);

  const handleGoBack = () => navigation.goBack();

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

  const validate = () => {
    const newErrors = {};
    if (!name.trim()) newErrors.name = "Ingresa el nombre.";
    else if (!NAME_REGEX.test(name.trim())) newErrors.name = "Solo letras y espacios.";
    
    if (!ageValue.trim()) newErrors.age = "Ingresa la edad.";
    
    // 👇 VALIDACIÓN DE PESO
    if (!weight.trim()) newErrors.weight = "Ingresa el peso.";
    else if (isNaN(weight) || Number(weight) <= 0) newErrors.weight = "Peso inválido.";

    if (initialSpecies === "otro") {
        if (!otherType) {
            newErrors.otherType = "Selecciona el tipo de mascota.";
        } else if (otherType === 'otro_tipo' && !customOtherText.trim()) {
            newErrors.customOther = "Especifique qué tipo de mascota es.";
        }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContinue = () => {
    if (!validate()) return;

    let finalSpecies = initialSpecies;
    if (initialSpecies === "otro") {
        if (otherType === 'otro_tipo') {
            finalSpecies = customOtherText.trim(); 
        } else {
            finalSpecies = otherType; 
        }
    }

    const draftPetStep1 = {
      especie: finalSpecies, 
      categoria: initialSpecies === "otro" ? "otro" : initialSpecies, 
      nombre: name.trim(),
      sexo: sex,
      tieneMicrochip: hasMicrochip,
      identificadorMicrochip: microchipId.trim() || null,
      poseeTatuaje: hasTattoo,
      tieneAnillado: otherType === "ave" ? hasRing : false,
      identificadorAnillado: (otherType === "ave" && hasRing) ? ringId.trim() : null,
      edadValor: Number(ageValue),
      edadTipo: ageType,
      peso: weight.trim(), // 👇 GUARDAR PESO
      imageUri: imageUri || null,
    };

    navigation.navigate("RegistroMascota2", { draftPet: draftPetStep1 });
  };

  const renderSexOption = (option) => {
    const isSelected = sex === option.value;
    const iconName = option.value === "macho" ? "mars" : "venus";
    const isMale = option.value === "macho";
    return (
      <TouchableOpacity
        key={option.value}
        style={[styles.chip, isSelected ? (isMale ? styles.chipMaleSelected : styles.chipFemaleSelected) : null]}
        onPress={() => setSex(option.value)}
      >
        <FontAwesome5 name={iconName} size={14} color={isSelected ? "#FFFFFF" : "#607D8B"} style={{ marginRight: 6 }} />
        <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>{option.label}</Text>
      </TouchableOpacity>
    );
  };

  const renderOtherTypeOption = (type) => {
    const isSelected = otherType === type.id;
    const IconLib = type.family === "MaterialCommunityIcons" ? MaterialCommunityIcons : FontAwesome5;
    return (
        <TouchableOpacity 
            key={type.id} 
            style={[styles.chip, isSelected && styles.chipSelectedGeneric]}
            onPress={() => {
                setOtherType(type.id);
                setErrors((prev) => ({ ...prev, otherType: undefined, customOther: undefined }));
                if (type.id !== 'ave') { setHasRing(false); setRingId(""); }
                if (type.id !== 'otro_tipo') { setCustomOtherText(""); }
            }}
        >
            <IconLib name={type.icon} size={14} color={isSelected ? "#FFFFFF" : "#607D8B"} style={{marginRight: 6}} />
            <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>{type.label}</Text>
        </TouchableOpacity>
    )
  }

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
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor="#4A85A5" />
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerIconButton} onPress={handleGoBack}>
          <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Paso 1 de 3</Text>
        <View style={styles.headerIconButton} />
      </View>

      {/* 👇 2. CONFIGURACIÓN DEL TECLADO PARA QUE NO CUBRA LOS CAMPOS */}
      <KeyboardAwareScrollView 
        style={styles.scroll} 
        contentContainerStyle={styles.scrollContent} 
        enableOnAndroid={true}
        extraHeight={180} // Altura extra para empujar la pantalla
        extraScrollHeight={180}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <View>
            <View style={styles.imagePreviewWrapper}>
              <TouchableOpacity style={styles.imagePreview} activeOpacity={0.8} onPress={handlePickImage}>
                {imageUri ? (
                  <>
                    <Image source={{ uri: imageUri }} style={styles.imagePreviewImage} />
                    <TouchableOpacity style={styles.imageEditButton} onPress={handlePickImage}><FontAwesome5 name="pen" size={14} color="#FFFFFF" /></TouchableOpacity>
                  </>
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <FontAwesome5 name="camera" size={28} color="#9CA3AF" />
                    <Text style={styles.imagePlaceholderText}>Toca para agregar foto</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.card}>
              <View style={styles.headerTextBlock}>
                <Text style={styles.title}>Datos Básicos</Text>
                <Text style={styles.subtitle}>Cuéntanos sobre tu mascota.</Text>
              </View>

              {initialSpecies === 'otro' && (
                  <View style={styles.section}>
                      <Text style={styles.label}>¿Qué tipo de mascota es?</Text>
                      <View style={styles.rowWrap}>{OTHER_TYPES.map(renderOtherTypeOption)}</View>
                      {errors.otherType && <Text style={styles.errorText}>{errors.otherType}</Text>}

                      {otherType === 'otro_tipo' && (
                          <View style={{marginTop: 10}}>
                              <Text style={styles.label}>Especifique:</Text>
                              <TextInput 
                                style={[styles.input, errors.customOther && styles.inputError]} 
                                placeholder="Ej: Erizo, Hurón, Pez..." 
                                value={customOtherText} 
                                onChangeText={setCustomOtherText}
                              />
                              {errors.customOther && <Text style={styles.errorText}>{errors.customOther}</Text>}
                          </View>
                      )}
                  </View>
              )}

              <View style={styles.section}>
                <Text style={styles.label}>Nombre</Text>
                <TextInput style={[styles.input, errors.name && styles.inputError]} placeholder="Ej: Max" value={name} onChangeText={(t) => setName(t.replace(/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ ]/g, ""))}/>
                {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
              </View>

              <View style={styles.section}>
                <Text style={styles.label}>Sexo</Text>
                <View style={styles.rowWrap}>{PET_SEX_OPTIONS.map(renderSexOption)}</View>
              </View>

              <View style={styles.section}>
                <View style={styles.rowSplit}>
                  <View style={styles.splitColumn}>
                    <Text style={styles.label}>Microchip?</Text>
                    <View style={styles.rowWrap}>
                      <TouchableOpacity style={[styles.chip, hasMicrochip && styles.chipSelected]} onPress={() => setHasMicrochip(true)}><Text style={[styles.chipText, hasMicrochip && styles.chipTextSelected]}>Sí</Text></TouchableOpacity>
                      <TouchableOpacity style={[styles.chip, !hasMicrochip && styles.chipSelected]} onPress={() => setHasMicrochip(false)}><Text style={[styles.chipText, !hasMicrochip && styles.chipTextSelected]}>No</Text></TouchableOpacity>
                    </View>
                  </View>
                  <View style={[styles.splitColumn, { marginLeft: 12 }]}>
                    <Text style={styles.label}>Tatuaje?</Text>
                    <View style={styles.rowWrap}>
                      <TouchableOpacity style={[styles.chip, hasTattoo && styles.chipSelected]} onPress={() => setHasTattoo(true)}><Text style={[styles.chipText, hasTattoo && styles.chipTextSelected]}>Sí</Text></TouchableOpacity>
                      <TouchableOpacity style={[styles.chip, !hasTattoo && styles.chipSelected]} onPress={() => setHasTattoo(false)}><Text style={[styles.chipText, !hasTattoo && styles.chipTextSelected]}>No</Text></TouchableOpacity>
                    </View>
                  </View>
                </View>
                {hasMicrochip && <TextInput style={[styles.input, styles.microchipInput]} placeholder="Código microchip" value={microchipId} onChangeText={(t) => setMicrochipId(t.replace(/\D/g, ""))} keyboardType="number-pad"/>}
              </View>

              {otherType === 'ave' && (
                  <View style={styles.section}>
                    <Text style={styles.label}>¿Posee Anillado?</Text>
                    <View style={styles.rowWrap}>
                        <TouchableOpacity style={[styles.chip, hasRing && styles.chipSelected]} onPress={() => setHasRing(true)}><Text style={[styles.chipText, hasRing && styles.chipTextSelected]}>Sí</Text></TouchableOpacity>
                        <TouchableOpacity style={[styles.chip, !hasRing && styles.chipSelected]} onPress={() => setHasRing(false)}><Text style={[styles.chipText, !hasRing && styles.chipTextSelected]}>No</Text></TouchableOpacity>
                    </View>
                    {hasRing && (
                        <TextInput style={[styles.input, styles.microchipInput]} placeholder="Código de anilla" value={ringId} onChangeText={setRingId} />
                    )}
                  </View>
              )}

              {/* 👇 3. EDAD (OCUPA TODA LA FILA AHORA) */}
              <View style={styles.section}>
                <Text style={styles.label}>Edad</Text>
                <View style={styles.ageRow}>
                    <View style={styles.ageDropdownWrapper}>
                        <TouchableOpacity style={[styles.input, styles.inputAge, errors.age && styles.inputError]} onPress={toggleAgeDropdown} activeOpacity={0.8}>
                        <Text style={ageValue ? styles.ageValueText : styles.agePlaceholderText}>{ageValue || "Elegir"}</Text>
                        <Ionicons name={isAgeDropdownOpen ? "chevron-up" : "chevron-down"} size={16} color="#6B7280" />
                        </TouchableOpacity>
                        {isAgeDropdownOpen && (
                        <View style={styles.ageDropdownList}>
                            <ScrollView nestedScrollEnabled showsVerticalScrollIndicator={true}>
                            {Array.from({ length: MAX_AGE }, (_, i) => i + 1).map((num) => (
                                <TouchableOpacity key={num} style={[styles.ageDropdownItem, ageValue === String(num) && styles.ageDropdownItemSelected]} onPress={() => handleSelectAge(num)}>
                                <Text style={[styles.ageDropdownItemText, ageValue === String(num) && styles.ageDropdownItemTextSelected]}>{num}</Text>
                                </TouchableOpacity>
                            ))}
                            </ScrollView>
                        </View>
                        )}
                    </View>
                    <View style={styles.ageOptions}>
                        {["años", "meses"].map((type) => (
                        <TouchableOpacity key={type} style={[styles.chip, styles.chipSmall, ageType === type && styles.chipSelected]} onPress={() => setAgeType(type)}>
                            <Text style={[styles.chipText, ageType === type && styles.chipTextSelected]}>{type}</Text>
                        </TouchableOpacity>
                        ))}
                    </View>
                </View>
                {errors.age && <Text style={styles.errorText}>{errors.age}</Text>}
              </View>

              {/* 👇 4. PESO (EN SU PROPIA FILA DEBAJO DE EDAD) */}
              <View style={styles.section}>
                <Text style={styles.label}>Peso (Kg/Lb)</Text>
                <TextInput 
                    style={[styles.input, errors.weight && styles.inputError]} 
                    placeholder="Ej: 12.5" 
                    value={weight} 
                    onChangeText={setWeight}
                    keyboardType="numeric"
                />
                {errors.weight && <Text style={styles.errorText}>{errors.weight}</Text>}
              </View>

              <TouchableOpacity style={styles.primaryButton} onPress={handleContinue}>
                <Text style={styles.primaryButtonText}>Continuar</Text>
                <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            
            {/* 👇 5. ESPACIO EXTRA PARA EL TECLADO */}
            <View style={{ height: 120 }} /> 
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAwareScrollView>
    </View>
  );
};

export default RegistroMascota1;

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#E3F2FD" },
  header: { paddingTop: Platform.OS === "ios" ? 52 : 32, paddingHorizontal: 20, paddingBottom: 14, flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: "#4A85A5", borderBottomLeftRadius: 15, borderBottomRightRadius: 15, elevation: 6 },
  headerIconButton: { width: 38, height: 38, borderRadius: 19, backgroundColor: "rgba(255,255,255,0.18)", alignItems: "center", justifyContent: "center" },
  headerTitle: { flex: 1, marginHorizontal: 12, fontSize: 16, fontWeight: "700", color: "#FFFFFF", textAlign: "center" },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 50 },
  imagePreviewWrapper: { alignItems: "center", marginBottom: 16 },
  imagePreview: { width: "100%", maxWidth: 500, marginBottom: 1, marginTop: 1, height: 200, borderRadius: 24, backgroundColor: "#F1F5F9", borderWidth: 1, borderColor: "#E2E8F0", overflow: "hidden" },
  imagePreviewImage: { width: "100%", height: "100%", resizeMode: "cover" },
  imagePlaceholder: { flex: 1, alignItems: "center", justifyContent: "center" },
  imagePlaceholderText: { marginTop: 8, fontSize: 12, color: "#6B7280", fontWeight: "500" },
  imageEditButton: { position: "absolute", bottom: 10, right: 10, width: 32, height: 32, borderRadius: 16, backgroundColor: "rgba(15, 23, 42, 0.85)", alignItems: "center", justifyContent: "center" },
  card: { backgroundColor: "#FFFFFF", borderRadius: 20, marginTop: 1, paddingHorizontal: 18, paddingVertical: 20, elevation: 3 },
  headerTextBlock: { alignItems: "center", marginBottom: 18 },
  title: { fontSize: 18, fontWeight: "700", color: "#111827" },
  subtitle: { marginTop: 4, fontSize: 12, color: "#6B7280", textAlign: "center" },
  section: { marginBottom: 14 },
  label: { fontSize: 13, fontWeight: "600", color: "#374151", marginBottom: 6 },
  input: { borderRadius: 10, borderWidth: 1, borderColor: "#E5E7EB", paddingHorizontal: 12, paddingVertical: 8, fontSize: 14, backgroundColor: "#F9FAFB" },
  microchipInput: { marginTop: 10 },
  inputAge: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", height: 42 },
  ageValueText: { fontSize: 14, color: "#111827" },
  agePlaceholderText: { fontSize: 14, color: "#9CA3AF" },
  inputError: { borderColor: "#EF4444" },
  errorText: { marginTop: 4, fontSize: 11, color: "#EF4444" },
  rowWrap: { flexDirection: "row", flexWrap: "wrap", marginTop: 4 },
  ageRow: { flexDirection: "row", alignItems: "flex-start" },
  ageDropdownWrapper: { flex: 0.6, marginRight: 8, position: "relative" }, 
  ageDropdownList: { position: "absolute", bottom: "100%", left: 0, right: 0, marginBottom: 4, borderRadius: 10, borderWidth: 1, borderColor: "#D1D5DB", backgroundColor: "#FFFFFF", maxHeight: 160, overflow: "hidden", zIndex: 50, elevation: 8 },
  ageDropdownItem: { paddingHorizontal: 12, paddingVertical: 8 },
  ageDropdownItemSelected: { backgroundColor: "#DBEAFE" },
  ageDropdownItemText: { fontSize: 14, color: "#111827" },
  ageDropdownItemTextSelected: { fontWeight: "600" },
  ageOptions: { flexDirection: "row", flex: 1 },
  rowSplit: { flexDirection: "row" },
  splitColumn: { flex: 1 },
  chip: { flexDirection: "row", alignItems: "center", borderRadius: 999, borderWidth: 1, borderColor: "#E5E7EB", paddingHorizontal: 14, paddingVertical: 6, marginRight: 8, marginBottom: 8, backgroundColor: "#F9FAFB" },
  chipSmall: { paddingHorizontal: 10 },
  chipSelected: { backgroundColor: "#10B981", borderColor: "#10B981" },
  chipMaleSelected: { backgroundColor: "#3B82F6", borderColor: "#3B82F6" },
  chipFemaleSelected: { backgroundColor: "#EC4899", borderColor: "#EC4899" },
  chipSelectedGeneric: { backgroundColor: "#8B5CF6", borderColor: "#8B5CF6" },
  chipText: { fontSize: 13, color: "#4B5563" },
  chipTextSelected: { color: "#FFFFFF", fontWeight: "600" },
  primaryButton: { marginTop: 8, marginBottom: 20, alignSelf: "flex-end", flexDirection: "row", alignItems: "center", backgroundColor: "#2563EB", borderRadius: 999, paddingHorizontal: 18, paddingVertical: 10 },
  primaryButtonText: { color: "#FFFFFF", fontWeight: "600", fontSize: 13, marginRight: 6 },
});