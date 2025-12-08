// screens/TermsScreen.js
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

const TermsScreen = ({ navigation }) => {
  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      {/* TOP BAR con fondo verde pastel (hereda del container) */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={handleBack} style={styles.topIconButton}>
          <Ionicons name="arrow-back" size={22} color="#365b6d" />
        </TouchableOpacity>

        <Text style={styles.topTitle}>Términos y Condiciones</Text>

        {/* Espaciador para equilibrar la fila */}
        <View style={styles.topIconButton} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.paragraph}>
          Los presentes Términos y Condiciones regulan el uso de la aplicación
          móvil PetHealthyApp. Al utilizar la aplicación, el usuario acepta cumplir
          con todas las disposiciones aquí establecidas.
        </Text>

        <Text style={styles.sectionTitle}>1. Aceptación del usuario:</Text>
        <Text style={styles.paragraph}>
          El uso de la aplicación implica la aceptación total de estos Términos
          y Condiciones. Si no está de acuerdo, debe abstenerse de utilizar la
          app.
        </Text>

        <Text style={styles.sectionTitle}>2. Uso permitido:</Text>
        <Text style={styles.paragraph}>
          El usuario se compromete a utilizar la aplicación únicamente para
          fines legales y personales. Se prohíbe modificar, copiar, distribuir o
          utilizar el contenido con fines ilícitos o no autorizados.
        </Text>

        <Text style={styles.sectionTitle}>3. Registro y seguridad:</Text>
        <Text style={styles.paragraph}>
          El usuario es responsable de mantener la seguridad y confidencialidad
          de su cuenta. La aplicación no se hace responsable por accesos no
          autorizados derivados de negligencia del usuario.
        </Text>

        <Text style={styles.sectionTitle}>4. Propiedad intelectual:</Text>
        <Text style={styles.paragraph}>
          Todo el contenido, diseño, imágenes, código y elementos de PetHealthyApp son
          propiedad de sus desarrolladores. No se permite su reproducción sin
          autorización.
        </Text>

        <Text style={styles.sectionTitle}>5. Datos personales:</Text>
        <Text style={styles.paragraph}>
          La aplicación podrá recopilar datos estrictamente necesarios para su
          funcionamiento, como información de usuario, veterinarios y mascotas.
          Estos datos serán utilizados únicamente para los fines establecidos
          dentro de la app y no serán compartidos con terceros no autorizados.
        </Text>

        <Text style={styles.sectionTitle}>
          6. Uso de la cámara y la ubicación (GPS):
        </Text>
        <Text style={styles.paragraph}>
          PetHealthyApp podrá solicitar acceso a la cámara y a la ubicación actual del
          dispositivo. Estos permisos se utilizan exclusivamente para funciones
          esenciales, como capturar fotografías clínicas de mascotas, adjuntar
          imágenes a consultas veterinarias y mostrar veterinarias cercanas
          según la posición del usuario.{"\n\n"}
          PetHealthyApp no utiliza la cámara ni la ubicación para monitoreo
          permanente, vigilancia, recopilación de datos innecesarios ni con
          fines publicitarios. La app solo accederá a dichos permisos cuando el
          usuario lo autorice y durante el uso de la función correspondiente. En
          ningún caso se compartirá información de ubicación o imágenes con
          terceros sin consentimiento expreso del usuario.
        </Text>

        <Text style={styles.sectionTitle}>
          7. Limitación de responsabilidad:
        </Text>
        <Text style={styles.paragraph}>
          Los desarrolladores no garantizan que la aplicación esté libre de
          errores o interrupciones. El uso de la app es bajo responsabilidad del
          usuario.
        </Text>

        <Text style={styles.sectionTitle}>8. Modificaciones:</Text>
        <Text style={styles.paragraph}>
          PetHealthyApp se reserva el derecho de modificar o actualizar estos términos
          en cualquier momento sin previo aviso. El uso continuo de la app
          implica la aceptación de dichas modificaciones.
        </Text>

        <Text style={styles.sectionTitle}>9. Legislación aplicable:</Text>
        <Text style={styles.paragraph}>
          Estos Términos y Condiciones se rigen por las leyes de la República de
          El Salvador.
        </Text>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // 👇 mismo verde pastel que Register
    backgroundColor: "#E8F5E9",
    // 👇 espacio para la barra de notificaciones
    paddingTop: Platform.OS === "ios" ? 50 : 32,
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
    backgroundColor: "#CDEED5", // verde un poco más sólido, sigue pastel
  },
  topTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#365b6d",
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginTop: 12,
    marginBottom: 4,
    color: "#263238",
  },
  paragraph: {
    fontSize: 14,
    color: "#455A64",
    textAlign: "justify",
  },
});

export default TermsScreen;
