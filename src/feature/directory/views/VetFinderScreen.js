// screens/VetFinderScreen.js
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
  Platform,
} from "react-native";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";
import { getNearbyVets } from "../services/googlePlaces";



const VetFinderScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [vets, setVets] = useState([]);
  const [agro, setAgro] = useState([]);
  const [others, setOthers] = useState([]);

  const vetKeywords = [
    "veterinaria",
    "vet",
    "clínica",
    "clinic",
    "animal",
    "pet's house",
    "ponme guau",
  ];

  const agroKeywords = ["agro", "agroservicio", "agroservicios", "macoga"];

  const classifyPlace = (place) => {
    const name = place.name.toLowerCase();
    const vicinity = place.vicinity?.toLowerCase() || "";

    if (agroKeywords.some((w) => name.includes(w) || vicinity.includes(w)))
      return "agro";

    if (vetKeywords.some((w) => name.includes(w) || vicinity.includes(w)))
      return "veterinaria";

    return "otro";
  };

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        alert("Debes dar permiso de ubicación.");
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      loadVets(location.coords.latitude, location.coords.longitude);
    })();
  }, []);

  const loadVets = async (lat, lng) => {
    const places = await getNearbyVets(lat, lng);

    const vetsArr = [];
    const agroArr = [];
    const otherArr = [];

    places.forEach((place) => {
      const type = classifyPlace(place);

      if (type === "veterinaria") vetsArr.push(place);
      else if (type === "agro") agroArr.push(place);
      else otherArr.push(place);
    });

    setVets(vetsArr);
    setAgro(agroArr);
    setOthers(otherArr);
    setLoading(false);
  };

  const openDetails = (place) => {
    navigation.navigate("VetDetail", { placeId: place.place_id });
  };

  const renderSection = (title, list, typeIcon) =>
    list.length > 0 && (
      <View style={{ marginBottom: 24 }}>
        <View style={styles.sectionHeader}>
          <Ionicons name="folder-outline" size={18} color="#365b6d" />
          <Text style={styles.sectionTitle}>{title}</Text>
        </View>

        {list.map((v) => (
          <TouchableOpacity
            key={v.place_id}
            style={styles.card}
            onPress={() => openDetails(v)}
          >
            <View style={styles.cardHeader}>
              <Ionicons
                name={typeIcon}
                size={20}
                color={typeIcon === "paw-outline" ? "#FF7043" : "#29B6F6"}
                style={{ marginRight: 8 }}
              />
              <Text style={styles.cardTitle}>{v.name}</Text>
            </View>

            <View style={styles.moreRow}>
              <Text style={styles.moreText}>Ver detalles</Text>
              <Ionicons name="chevron-forward" size={18} color="#90A4AE" />
            </View>
          </TouchableOpacity>
        ))}
      </View>
    );

  const handleGoBack = () => {
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      {/* Barra superior como el resto de pantallas */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={handleGoBack} style={styles.topIconButton}>
          <Ionicons name="arrow-back" size={22} color="#365b6d" />
        </TouchableOpacity>

        <Text style={styles.topTitle}>Veterinarias cercanas</Text>

        {/* Spacer para centrar el título */}
        <View style={{ width: 34 }} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#365b6d" />
          <Text style={styles.loadingText}>
            Buscando servicios cerca de ti...
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          {renderSection("Veterinarias", vets, "paw-outline")}
          {renderSection("Agroservicios", agro, "leaf-outline")}
          {renderSection(
            "Otros servicios animales",
            others,
            "business-outline"
          )}
        </ScrollView>
      )}
    </View>
  );
};

export default VetFinderScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#E3F2FD",
    paddingTop: Platform.OS === "ios" ? 40 : 28, // espacio bajo la barra de estado
  },

  // HEADER
  topBar: {
    paddingTop: 18,
    paddingHorizontal: 16,
    paddingBottom: 10,
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
    fontWeight: "700",
    color: "#365b6d",
  },

  // CONTENIDO
  content: {
    paddingHorizontal: 16,
    paddingBottom: 30,
    paddingTop: 4,
  },

  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 8,
    fontSize: 13,
    color: "#607D8B",
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E0E9F5",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 12,
    marginTop: 14,
    marginBottom: 8,
    gap: 6,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#365b6d",
  },

  card: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#263238",
    flexShrink: 1,
  },
  moreRow: {
    marginTop: 4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  moreText: {
    fontSize: 12,
    color: "#607D8B",
    marginRight: 4,
  },
});
