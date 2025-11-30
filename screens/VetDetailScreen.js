// screens/VetDetailScreen.js
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Platform,
  Linking,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { getPlaceDetails } from "../src/services/googlePlaces";

const VetDetailScreen = ({ route, navigation }) => {
  const { placeId } = route.params;
  const [info, setInfo] = useState(null);

  // Traducción días inglés → español
  const daysMap = {
    Monday: "Lunes",
    Tuesday: "Martes",
    Wednesday: "Miércoles",
    Thursday: "Jueves",
    Friday: "Viernes",
    Saturday: "Sábado",
    Sunday: "Domingo",
  };

  const translateSchedule = (weekdayText) => {
    if (!weekdayText) return [];
    return weekdayText.map((line) => {
      const [day, hours] = line.split(": ");
      const dayEs = daysMap[day] || day;
      const isClosed =
        !hours || hours.toLowerCase().includes("closed") || hours === "-";
      if (isClosed) return `${dayEs}: Cerrado`;
      return `${dayEs}: ${hours}`;
    });
  };

  // Copiar texto
  const copy = (txt) => Clipboard.setStringAsync(txt);

  // Abrir mapa dependiendo de plataforma
  const openMap = (address) => {
    if (!address) return;
    const encoded = encodeURIComponent(address);
    const url = Platform.select({
      ios: `maps:0,0?q=${encoded}`,
      android: `geo:0,0?q=${encoded}`,
    });
    Linking.openURL(url);
  };

  useEffect(() => {
    (async () => {
      const details = await getPlaceDetails(placeId);
      setInfo(details);
    })();
  }, [placeId]);

  if (!info)
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#365b6d" />
      </View>
    );

  const isOpen = info.opening_hours?.open_now;

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={navigation.goBack}
          style={styles.topIconButton}
        >
          <Ionicons name="arrow-back" size={22} color="#365b6d" />
        </TouchableOpacity>

        <Text style={styles.topTitle} numberOfLines={1}>
          {info.name}
        </Text>

        <View style={{ width: 40 }} />
      </View>

      {/* CONTENIDO DESPLAZABLE */}
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ESTATUS DE APERTURA */}
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: isOpen ? "#D0F8CE" : "#FFCDD2" },
          ]}
        >
          <Ionicons
            name={isOpen ? "checkmark-circle-outline" : "close-circle-outline"}
            size={20}
            color={isOpen ? "#2E7D32" : "#C62828"}
          />
          <Text
            style={[
              styles.statusText,
              { color: isOpen ? "#2E7D32" : "#C62828" },
            ]}
          >
            {isOpen ? "Abierto ahora" : "Cerrado ahora"}
          </Text>
        </View>

        {/* DIRECCIÓN */}
        {info.formatted_address && (
          <>
            <Text style={styles.sectionTitle}>Dirección</Text>
            <View style={styles.infoBox}>
              <Text style={styles.infoLabel}>Ubicación:</Text>
              <Text style={styles.infoValue}>{info.formatted_address}</Text>

              <View style={styles.rowButtons}>
                <TouchableOpacity
                  style={styles.smallBtn}
                  onPress={() => openMap(info.formatted_address)}
                >
                  <Ionicons name="location-outline" size={20} color="#6A1B9A" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.smallBtn}
                  onPress={() => copy(info.formatted_address)}
                >
                  <Ionicons name="copy-outline" size={20} color="#6A1B9A" />
                </TouchableOpacity>
              </View>
            </View>
          </>
        )}

        {/* TELÉFONO */}
        {info.formatted_phone_number && (
          <>
            <Text style={styles.sectionTitle}>Contacto</Text>
            <View style={styles.infoBox}>
              <Text style={styles.infoLabel}>Teléfono:</Text>
              <Text style={styles.infoValue}>
                {info.formatted_phone_number}
              </Text>

              <View style={styles.rowButtons}>
                <TouchableOpacity
                  style={styles.smallBtn}
                  onPress={() =>
                    Linking.openURL(`tel:${info.formatted_phone_number}`)
                  }
                >
                  <Ionicons name="call-outline" size={20} color="#00695C" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.smallBtn}
                  onPress={() => copy(info.formatted_phone_number)}
                >
                  <Ionicons name="copy-outline" size={20} color="#00695C" />
                </TouchableOpacity>
              </View>
            </View>
          </>
        )}

        {/* HORARIO COMPLETO */}
        {info.opening_hours?.weekday_text && (
          <>
            <Text style={styles.sectionTitle}>Horario</Text>
            <View style={styles.infoBox}>
              {translateSchedule(info.opening_hours.weekday_text).map(
                (d, i) => (
                  <Text key={i} style={styles.infoValue}>
                    {d}
                  </Text>
                )
              )}
            </View>
          </>
        )}

        {/* RATING */}
        {info.rating && (
          <>
            <Text style={styles.sectionTitle}>Calificación</Text>
            <View style={styles.infoBox}>
              <Text style={styles.infoValue}>
                ⭐ {info.rating} ({info.user_ratings_total} reseñas)
              </Text>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
};

export default VetDetailScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#E3F2FD",
    paddingTop: Platform.OS === "ios" ? 40 : 24, // 👈 deja espacio bajo la barra de estado
  },
  loading: {
    flex: 1,
    backgroundColor: "#E3F2FD",
    paddingTop: Platform.OS === "ios" ? 40 : 24, // 👈 igual en la pantalla de carga
    justifyContent: "center",
    alignItems: "center",
  },

  /* HEADER */
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
    fontSize: 15,
    fontWeight: "600",
    color: "#365b6d",
    textAlign: "center",
    flex: 1,
    marginHorizontal: 8,
  },

  content: {
    padding: 20,
    flexGrow: 1,
  },

  /* BADGE */
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignSelf: "flex-start",
    gap: 6,
    marginBottom: 16,
  },
  statusText: {
    fontSize: 13,
    fontWeight: "700",
  },

  /* SECTIONS */
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#263238",
    marginTop: 12,
    marginBottom: 6,
  },

  infoBox: {
    backgroundColor: "#FFFFFF",
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
  },
  infoLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#263238",
  },
  infoValue: {
    fontSize: 13,
    color: "#37474F",
    marginTop: 2,
    marginBottom: 10,
  },

  rowButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  smallBtn: {
    backgroundColor: "#E0F2F1",
    padding: 8,
    borderRadius: 10,
  },
});
