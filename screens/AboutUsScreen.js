// screens/AboutUsScreen.js
import React from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import AppText from "../src/components/ui/AppText";
import { useTheme } from "../src/themes/useTheme";

const AboutUsScreen = ({ navigation }) => {
  const { colors, text } = useTheme();

  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* TOP BAR */}
      <View style={[styles.topBar]}>
        <TouchableOpacity
          onPress={handleBack}
          style={[styles.topIconButton, { backgroundColor: colors.card }]}
        >
          <Ionicons name="arrow-back" size={22} color={colors.primary} />
        </TouchableOpacity>

        <AppText title style={[styles.topTitle, { color: colors.primary }]}>
          Acerca de nosotros
        </AppText>

        {/* Placeholder para centrar */}
        <View style={[styles.topIconButton, { backgroundColor: "transparent" }]} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Encabezado */}
        <View style={styles.header}>
          <AppText
            style={[styles.appName, { color: colors.primary }]}
            title
          >
            PetHealthy
          </AppText>

          <AppText style={[styles.slogan, { color: colors.textSmall }]}>
            Cuidamos de tus mascotas contigo 🐾
          </AppText>

          <View
            style={[
              styles.versionBadge,
              { backgroundColor: colors.success + "33" },
            ]}
          >
            <AppText style={{ color: colors.success, fontSize: 12 }}>
              Versión 1.0.0
            </AppText>
          </View>
        </View>

        {/* SECCIONES */}
        <View style={[styles.sectionCard, { backgroundColor: colors.card }]}>
          <AppText title style={{ color: colors.text }}>
            ¿Qué es PetHealthy?
          </AppText>

          <AppText style={[styles.paragraph, { color: colors.textSmall }]}>
            PetHealthy es una aplicación diseñada para ayudarte a organizar el
            cuidado de tus mascotas: vacunas, citas veterinarias, historial
            clínico y recordatorios importantes.
          </AppText>
        </View>

        <View style={[styles.sectionCard, { backgroundColor: colors.card }]}>
          <AppText title>Nuestra misión</AppText>
          <AppText style={[styles.paragraph, { color: colors.textSmall }]}>
            Facilitar la gestión del bienestar de tus mascotas, brindando
            herramientas digitales organizadas y confiables.
          </AppText>
        </View>

        <View style={[styles.sectionCard, { backgroundColor: colors.card }]}>
          <AppText title>Nuestra visión</AppText>
          <AppText style={[styles.paragraph, { color: colors.textSmall }]}>
            Convertirnos en la app líder de cuidado animal en El Salvador.
          </AppText>
        </View>

        <View style={[styles.sectionCard, { backgroundColor: colors.card }]}>
          <AppText title>Sobre el equipo</AppText>
          <AppText style={[styles.paragraph, { color: colors.textSmall }]}>
            PetHealthy nace como un proyecto para brindar una solución moderna a
            los tutores responsables.
          </AppText>
        </View>

        {/* Términos generales */}
        <View style={[styles.sectionCard, { backgroundColor: colors.card }]}>
          <AppText title>Términos y Condiciones</AppText>

          <AppText style={[styles.paragraph]}>
            <AppText style={styles.bold}>1. Aceptación del usuario:</AppText>
            {"\n"}El uso implica aceptación total.
          </AppText>

          <AppText style={[styles.paragraph]}>
            <AppText style={styles.bold}>2. Uso permitido:</AppText>
            {"\n"}Solo para fines personales y legales.
          </AppText>

          <AppText style={[styles.paragraph]}>
            <AppText style={styles.bold}>3. Registro y seguridad:</AppText>
            {"\n"}El usuario es responsable de su cuenta.
          </AppText>

          <AppText style={[styles.paragraph]}>
            <AppText style={styles.bold}>4. Propiedad intelectual:</AppText>
            {"\n"}Todo el contenido pertenece a los desarrolladores.
          </AppText>

          <AppText style={[styles.paragraph]}>
            <AppText style={styles.bold}>5. Datos personales:</AppText>
            {"\n"}No compartimos datos con terceros no autorizados.
          </AppText>
        </View>

        {/* MARCO LEGAL */}
        <View style={[styles.sectionCard, { backgroundColor: colors.card }]}>
          <AppText title>Resumen del Marco Legal</AppText>

          <AppText style={[styles.paragraph]}>
            PetHealthy cumple con la legislación salvadoreña de protección de
            datos y comercio electrónico.
          </AppText>
        </View>

        {/* Pie */}
        <AppText
          small
          style={[styles.footerText, { color: colors.textSmall }]}
        >
          Gracias por confiar en PetHealthy 💚
        </AppText>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === "ios" ? 40 : 24,
  },
  topBar: {
    paddingTop: 18,
    paddingHorizontal: 14,
    paddingBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  topIconButton: {
    padding: 6,
    borderRadius: 999,
  },
  topTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  header: {
    alignItems: "center",
    marginBottom: 20,
  },
  appName: {
    fontSize: 26,
    fontWeight: "800",
  },
  slogan: {
    fontSize: 14,
    marginTop: 4,
    textAlign: "center",
  },
  versionBadge: {
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  sectionCard: {
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    elevation: 2,
  },
  paragraph: {
    fontSize: 14,
    lineHeight: 22,
  },
  bold: {
    fontWeight: "700",
  },
  footerText: {
    marginTop: 10,
    fontSize: 13,
    textAlign: "center",
  },
});

export default AboutUsScreen;

