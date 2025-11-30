// screens/AboutUsScreen.js
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const AboutUsScreen = ({ navigation }) => {
  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      {/* TOP BAR igual a Configuración/UserInfo */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={handleBack} style={styles.topIconButton}>
          <Ionicons name="arrow-back" size={22} color="#365b6d" />
        </TouchableOpacity>

        <Text style={styles.topTitle}>Acerca de nosotros</Text>

        {/* Placeholder para centrar el título */}
        <View style={styles.topIconButton} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Encabezado */}
        <View style={styles.header}>
          <Text style={styles.appName}>PetHealthy</Text>
          <Text style={styles.slogan}>Cuidamos de tus mascotas contigo 🐾</Text>

          <View style={styles.versionBadge}>
            <Text style={styles.versionText}>Versión 1.0.0</Text>
          </View>
        </View>

        {/* ¿Qué es PetHealthy? */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>¿Qué es PetHealthy?</Text>
          <Text style={styles.paragraph}>
            PetHealthy es una aplicación diseñada para ayudarte a organizar el
            cuidado de tus mascotas: vacunas, citas veterinarias, historial
            clínico y recordatorios importantes. Todo desde un solo lugar, fácil
            de usar y siempre accesible.
          </Text>
        </View>

        {/* Nuestra misión */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Nuestra misión</Text>
          <Text style={styles.paragraph}>
            Facilitar la gestión del bienestar de tus mascotas, brindando
            herramientas digitales que te permitan llevar un control organizado,
            confiable y accesible de su salud.
          </Text>
        </View>

        {/* Nuestra visión */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Nuestra visión</Text>
          <Text style={styles.paragraph}>
            Convertirnos en la aplicación líder en cuidado animal en El
            Salvador, ofreciendo una plataforma completa que conecte a tutores,
            veterinarios y servicios especializados, promoviendo una cultura de
            bienestar y responsabilidad animal.
          </Text>
        </View>

        {/* Sobre el equipo */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Sobre el equipo</Text>
          <Text style={styles.paragraph}>
            PetHealthy nace como un proyecto para brindar una solución práctica
            y moderna a los tutores responsables que desean mejorar el bienestar
            de sus mascotas.
          </Text>
        </View>

        {/* Términos y Condiciones */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Términos y Condiciones</Text>

          <Text style={styles.paragraph}>
            <Text style={styles.bold}>1. Aceptación del usuario:</Text>
            {"\n"}
            El uso de la aplicación implica la aceptación total de estos
            Términos y Condiciones. Si no está de acuerdo, debe abstenerse de
            utilizar la app.
          </Text>

          <Text style={styles.paragraph}>
            <Text style={styles.bold}>2. Uso permitido:</Text>
            {"\n"}
            El usuario se compromete a utilizar la aplicación únicamente para
            fines personales y legales. Se prohíbe modificar, copiar, distribuir
            o utilizar contenido sin autorización.
          </Text>

          <Text style={styles.paragraph}>
            <Text style={styles.bold}>3. Registro y seguridad:</Text>
            {"\n"}
            El usuario es responsable de la seguridad de su cuenta. PetHealthy
            no se hace responsable por accesos no autorizados derivados de
            negligencia.
          </Text>

          <Text style={styles.paragraph}>
            <Text style={styles.bold}>4. Propiedad intelectual:</Text>
            {"\n"}
            Todo contenido, diseño, código y elementos visuales son propiedad de
            los desarrolladores. No se permite su reproducción sin permiso.
          </Text>

          <Text style={styles.paragraph}>
            <Text style={styles.bold}>5. Datos personales:</Text>
            {"\n"}
            La aplicación puede recopilar datos necesarios para su
            funcionamiento, los cuales no serán compartidos con terceros no
            autorizados.
          </Text>

          <Text style={styles.paragraph}>
            <Text style={styles.bold}>6. Limitación de responsabilidad:</Text>
            {"\n"}
            No garantizamos que la app esté libre de errores o interrupciones.
            El uso es responsabilidad del usuario.
          </Text>

          <Text style={styles.paragraph}>
            <Text style={styles.bold}>7. Modificaciones:</Text>
            {"\n"}
            PetHealthy se reserva el derecho de modificar o actualizar estos
            términos en cualquier momento.
          </Text>

          <Text style={styles.paragraph}>
            <Text style={styles.bold}>8. Legislación aplicable:</Text>
            {"\n"}
            Estos términos se rigen por las leyes de la República de El
            Salvador.
          </Text>
        </View>

        {/* Marco Legal */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Resumen del Marco Legal</Text>
          <Text style={styles.paragraph}>
            PetHealthy cumple con la legislación salvadoreña en materia de
            protección de datos, incluyendo la Ley de Protección de Datos
            Personales (LPDP), la Ley de Comercio Electrónico y la Ley de
            Protección al Consumidor.
          </Text>

          <Text style={styles.paragraph}>
            La app aplica el consentimiento informado como base legal para el
            tratamiento de datos, permitiendo que el usuario autorice de forma
            libre y clara el uso de su información.
          </Text>

          <Text style={styles.paragraph}>
            PetHealthy respeta los derechos ARCO (Acceso, Rectificación,
            Cancelación y Oposición), garantizando que los usuarios puedan
            administrar su información cuando lo deseen.
          </Text>

          <Text style={styles.paragraph}>
            Los datos sensibles —como historial clínico, diagnósticos o datos
            personales del propietario— reciben protección reforzada para evitar
            accesos no autorizados.
          </Text>

          <Text style={styles.paragraph}>
            Se implementan medidas técnicas como cifrado, restricciones de
            acceso por roles, auditorías de seguridad y minimización de datos.
          </Text>
        </View>

        {/* Pie */}
        <Text style={styles.footerText}>
          Gracias por confiar en PetHealthy para el cuidado de tus mejores
          amigos 💚
        </Text>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#E3F2FD",
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
    backgroundColor: "#E0E9F5",
  },
  topTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#365b6d",
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
    color: "#365b6d",
  },
  slogan: {
    fontSize: 14,
    color: "#607D8B",
    marginTop: 4,
    textAlign: "center",
  },
  versionBadge: {
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    backgroundColor: "#C8E6C9",
  },
  versionText: {
    fontSize: 12,
    color: "#2E7D32",
    fontWeight: "600",
  },
  sectionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#37474F",
    marginBottom: 6,
  },
  paragraph: {
    fontSize: 14,
    color: "#455A64",
    lineHeight: 22,
  },
  bold: {
    fontWeight: "700",
    color: "#263238",
  },
  footerText: {
    marginTop: 10,
    fontSize: 13,
    textAlign: "center",
    color: "#607D8B",
  },
});

export default AboutUsScreen;
