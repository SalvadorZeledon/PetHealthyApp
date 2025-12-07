import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Platform,
  StatusBar,
} from "react-native";
import {
  FontAwesome5,
  MaterialCommunityIcons,
  Ionicons,
} from "@expo/vector-icons";
import { Dialog, ALERT_TYPE } from "react-native-alert-notification";

const SPECIES_OPTIONS = [
  {
    id: "perro",
    label: "Perro",
    iconName: "dog",
    family: "FontAwesome5",
    enabled: true,
  },
  {
    id: "gato",
    label: "Gato",
    iconName: "cat",
    family: "FontAwesome5",
    enabled: true,
  },
  {
    id: "otro",
    label: "Otro",
    iconName: "paw",
    family: "FontAwesome5",
    enabled: true,
  },
];

const RegistroMascota = ({ navigation, route }) => {
  const [selectedSpecies, setSelectedSpecies] = useState(null);
  const userName = route?.params?.userName || "";

  const handleContinue = () => {
    if (!selectedSpecies) {
      Dialog.show({
        type: ALERT_TYPE.WARNING,
        title: "Selecciona una especie",
        textBody: "Por favor elige una especie para continuar con el registro.",
        button: "Entendido",
      });
      return;
    }

    navigation.navigate("RegistroMascota1", {
      initialSpecies: selectedSpecies,
    });
  };

  const isContinueDisabled = !selectedSpecies;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4A85A5" />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerIconButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Registrar mascota</Text>
        <View style={styles.headerIconButton} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.logoContainer}>
          <Image
            source={require("../../../../assets/logoPH.png")}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.appName}>PETHEALTHY</Text>
        </View>

        <View style={styles.headerTextContainer}>
          <View style={styles.greetingRow}>
            <Text style={styles.greetingText}>
              ¡Hola{userName ? `, ${userName}` : ""}!
            </Text>
            <FontAwesome5
              name="paw"
              size={28}
              color="#111827"
              style={styles.pawIcon}
            />
          </View>
          <Text style={styles.subtitleText}>
            Selecciona la especie de tu mascota para comenzar.
          </Text>
        </View>

        <View style={styles.gridContainer}>
          {SPECIES_OPTIONS.map((option) => {
            const IconComponent =
              option.family === "MaterialCommunityIcons"
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
                        ? "#9CA3AF"
                        : isSelected
                        ? "#111827"
                        : "#1F2933"
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
              color={isContinueDisabled ? "#E5E7EB" : "#FFFFFF"}
              style={styles.primaryButtonIcon}
            />
          </View>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

export default RegistroMascota;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#E3F2FD", paddingTop: 0 },
  header: {
    paddingTop: Platform.OS === "ios" ? 52 : 32,
    paddingHorizontal: 20,
    paddingBottom: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#4A85A5",
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
  },
  headerIconButton: { width: 38, height: 38, borderRadius: 19, backgroundColor: "rgba(255,255,255,0.18)", alignItems: "center", justifyContent: "center" },
  headerTitle: { flex: 1, marginHorizontal: 12, fontSize: 18, fontWeight: "700", color: "#FFFFFF", textAlign: "center" },
  scrollContent: { paddingHorizontal: 24, paddingVertical: 24, alignItems: "center" },
  logoContainer: { alignItems: "center", marginBottom: 24 },
  logo: { width: 150, height: 150, marginBottom: 8, marginTop: -10 },
  appName: { fontSize: 18, fontWeight: "700", letterSpacing: 3, color: "#111827" },
  headerTextContainer: { width: "100%", alignItems: "center", marginBottom: 24 },
  greetingRow: { flexDirection: "row", alignItems: "center" },
  greetingText: { fontSize: 28, fontWeight: "800", color: "#111827" },
  pawIcon: { marginLeft: 8 },
  subtitleText: { marginTop: 12, fontSize: 14, textAlign: "center", color: "#4B5563", lineHeight: 20 },
  gridContainer: { width: "100%", flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 15, marginTop: 8, marginBottom: 32 },
  speciesCard: { width: "30%", aspectRatio: 0.9, backgroundColor: "#FFFFFF", borderRadius: 20, paddingVertical: 14, paddingHorizontal: 8, marginBottom: 18, alignItems: "center", justifyContent: "center", shadowColor: "#000000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 3 },
  speciesCardSelected: { borderWidth: 2, borderColor: "#0EA5E9", backgroundColor: "#E0F2FE" },
  speciesCardDisabled: { opacity: 0.45, shadowOpacity: 0.02, elevation: 0 },
  iconContainer: { marginBottom: 8 },
  speciesLabel: { fontSize: 14, fontWeight: "600", color: "#111827" },
  speciesLabelDisabled: { color: "#9CA3AF" },
  primaryButton: { width: "100%", backgroundColor: "#0EA5E9", paddingVertical: 14, borderRadius: 999, alignItems: "center", justifyContent: "center", shadowColor: "#0284C7", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  primaryButtonDisabled: { backgroundColor: "#BFDBFE", shadowOpacity: 0, elevation: 0 },
  primaryButtonContent: { flexDirection: "row", alignItems: "center", justifyContent: "center" },
  primaryButtonText: { fontSize: 18, fontWeight: "700", color: "#FFFFFF" },
  primaryButtonTextDisabled: { color: "#E5E7EB" },
  primaryButtonIcon: { marginLeft: 10 },
});