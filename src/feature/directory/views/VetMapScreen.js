// screens/VetMapScreen.js
import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Platform,
  Alert,
  Dimensions,
  ScrollView,
} from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE, Callout } from "react-native-maps";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import { getNearbyVets } from "../services/googlePlaces";



const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");

const haversineDistanceKm = (lat1, lon1, lat2, lon2) => {
  const toRad = (v) => (v * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const VetMapScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [region, setRegion] = useState(null);
  const [places, setPlaces] = useState([]);
  const [showList, setShowList] = useState(false);

  const mapRef = useRef();

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          Alert.alert(
            "Permiso requerido",
            "Debes permitir acceso a la ubicación para ver veterinarias cercanas."
          );
          setLoading(false);
          return;
        }

        const loc = await Location.getCurrentPositionAsync({});
        const lat = loc.coords.latitude;
        const lng = loc.coords.longitude;

        setRegion({
          latitude: lat,
          longitude: lng,
          latitudeDelta: 0.04,
          longitudeDelta: 0.04,
        });

        const nearby = await getNearbyVets(lat, lng);

        const withDistance = nearby.map((p) => {
          const lat2 = p.geometry?.location?.lat;
          const lng2 = p.geometry?.location?.lng;
          const distanceKm =
            lat2 && lng2 ? haversineDistanceKm(lat, lng, lat2, lng2) : 9999;
          return { ...p, distanceKm };
        });

        withDistance.sort((a, b) => a.distanceKm - b.distanceKm);

        setPlaces(withDistance);
      } catch (err) {
        console.log("VetMapScreen error:", err);
        Alert.alert("Error", "No se pudieron obtener veterinarias cercanas.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const centerOnUser = async () => {
    try {
      const loc = await Location.getCurrentPositionAsync({});
      const lat = loc.coords.latitude;
      const lng = loc.coords.longitude;
      mapRef.current?.animateToRegion(
        {
          latitude: lat,
          longitude: lng,
          latitudeDelta: 0.04,
          longitudeDelta: 0.04,
        },
        400
      );
    } catch (err) {
      console.log("centerOnUser error:", err);
    }
  };

  const LinkingFallback = async (primary, fallback) => {
    try {
      const supported = await Linking.canOpenURL(primary);
      if (supported) await Linking.openURL(primary);
      else await Linking.openURL(fallback);
    } catch {
      await Linking.openURL(fallback);
    }
  };

  const renderListPanel = () => {
    if (!places.length)
      return (
        <View style={styles.listEmpty}>
          <Text style={styles.listEmptyText}>
            No se encontraron lugares cercanos.
          </Text>
        </View>
      );

    return (
      <View style={styles.listPanel}>
        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>Veterinarias cercanas</Text>
          <TouchableOpacity
            onPress={() => setShowList(false)}
            style={styles.closeListBtn}
          >
            <Ionicons name="close" size={20} color="#365b6d" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.listScroll}>
          {places.map((p) => {
            const lat = p.geometry?.location?.lat;
            const lng = p.geometry?.location?.lng;
            return (
              <View key={p.place_id} style={styles.listItem}>
                <TouchableOpacity
                  style={{ flex: 1 }}
                  onPress={() => {
                    setShowList(false);
                    mapRef.current?.animateToRegion(
                      {
                        latitude: lat,
                        longitude: lng,
                        latitudeDelta: 0.01,
                        longitudeDelta: 0.01,
                      },
                      400
                    );
                  }}
                >
                  <Text style={styles.itemTitle}>{p.name}</Text>
                  {p.vicinity ? (
                    <Text style={styles.itemSubtitle}>{p.vicinity}</Text>
                  ) : null}
                </TouchableOpacity>

                <View style={{ alignItems: "flex-end" }}>
                  <Text style={styles.itemDistance}>
                    {p.distanceKm < 1
                      ? `${Math.round(p.distanceKm * 1000)} m`
                      : `${p.distanceKm.toFixed(1)} km`}
                  </Text>
                  <Text style={styles.itemMeta}>
                    {p.rating ? `⭐ ${p.rating}` : ""}
                  </Text>
                </View>

                {/* 🔥 NUEVO BOTÓN DE DETALLES */}
                <TouchableOpacity
                  style={styles.detailsBtn}
                  onPress={() =>
                    navigation.navigate("VetDetail", {
                      placeId: p.place_id,
                    })
                  }
                >
                  <Ionicons
                    name="information-circle-outline"
                    size={16}
                    color="#365b6d"
                  />
                  <Text style={styles.detailsBtnText}>Ver más detalles</Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </ScrollView>
      </View>
    );
  };

  if (loading || !region) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#365b6d" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={region}
        showsUserLocation
        showsMyLocationButton={false}
      >
        {places.map((p) => {
          const lat = p.geometry?.location?.lat;
          const lng = p.geometry?.location?.lng;
          if (!lat || !lng) return null;

          return (
            <Marker
              key={p.place_id}
              coordinate={{ latitude: lat, longitude: lng }}
              title={p.name}
              description={p.vicinity}
            >
              <Callout tooltip>
                <View style={styles.callout}>
                  <Text style={styles.calloutTitle}>{p.name}</Text>
                  {p.vicinity ? (
                    <Text style={styles.calloutSubtitle}>{p.vicinity}</Text>
                  ) : null}

                  <View style={styles.calloutRow}>
                    <TouchableOpacity
                      style={styles.calloutBtn}
                      onPress={() =>
                        navigation.navigate("VetDetail", {
                          placeId: p.place_id,
                        })
                      }
                    >
                      <Ionicons
                        name="information-circle-outline"
                        size={18}
                        color="#365b6d"
                      />
                      <Text style={styles.calloutBtnText}>Detalles</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.calloutBtn}
                      onPress={() => {
                        const q = encodeURIComponent(`${lat},${lng} (${p.name})`);
                        const url = Platform.select({
                          ios: `maps://?q=${q}`,
                          android: `geo:0,0?q=${q}`,
                        });
                        LinkingFallback(
                          url,
                          `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
                        );
                      }}
                    >
                      <Ionicons
                        name="navigate-outline"
                        size={18}
                        color="#00695C"
                      />
                      <Text style={styles.calloutBtnText}>Cómo llegar</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </Callout>
            </Marker>
          );
        })}
      </MapView>

      {/* HEADER FLOATING */}
      <View style={styles.topControls}>
        <TouchableOpacity
          style={styles.topBtn}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={20} color="#365b6d" />
        </TouchableOpacity>

        <Text style={styles.title}>Veterinarias</Text>

        <View style={{ width: 40 }} />
      </View>

      {/* BOTONES A LA DERECHA */}
      <View style={styles.floatingRight}>
        <TouchableOpacity style={styles.floatBtn} onPress={centerOnUser}>
          <Ionicons name="locate" size={20} color="#365b6d" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.floatBtn, { marginTop: 12 }]}
          onPress={() => setShowList(true)}
        >
          <Ionicons name="list" size={20} color="#365b6d" />
        </TouchableOpacity>
      </View>

      {showList && renderListPanel()}
    </View>
  );
};

export default VetMapScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#E3F2FD" },
  loading: { flex: 1, justifyContent: "center", alignItems: "center" },
  map: { flex: 1 },

  topControls: {
    position: "absolute",
    top: Platform.OS === "ios" ? 50 : 24,
    left: 16,
    right: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  topBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    elevation: 3,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: "#263238",
  },

  floatingRight: {
    position: "absolute",
    right: 12,
    top: Platform.OS === "ios" ? 110 : 80,
    alignItems: "center",
  },
  floatBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    elevation: 3,
  },

  listPanel: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: Math.round(SCREEN_H * 0.45),
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 12,
    elevation: 8,
  },
  listHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  listTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#263238",
  },
  closeListBtn: {
    width: 36,
    height: 36,
    backgroundColor: "#E0E9F5",
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  listScroll: { marginTop: 10 },

  listItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: "#F0F0F0",
  },

  itemTitle: { fontSize: 15, fontWeight: "700", color: "#263238" },
  itemSubtitle: {
    fontSize: 13,
    color: "#607D8B",
    marginTop: 4,
  },

  itemDistance: {
    fontSize: 13,
    color: "#455A64",
    fontWeight: "600",
    marginTop: 4,
  },
  itemMeta: {
    fontSize: 12,
    color: "#90A4AE",
    marginTop: 2,
  },

  listEmpty: {
    position: "absolute",
    bottom: 20,
    left: 16,
    right: 16,
    backgroundColor: "#FFFFFF",
    padding: 12,
    borderRadius: 12,
    elevation: 4,
  },
  listEmptyText: { color: "#607D8B", textAlign: "center" },

  callout: {
    width: 220,
    padding: 10,
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
  },
  calloutTitle: { fontSize: 13, fontWeight: "700", color: "#263238" },
  calloutSubtitle: { fontSize: 12, color: "#607D8B", marginTop: 4 },
  calloutRow: {
    marginTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  calloutBtn: {
    flexDirection: "row",
    backgroundColor: "#E3F2FD",
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 8,
    alignItems: "center",
  },
  calloutBtnText: {
    marginLeft: 6,
    fontSize: 12,
    fontWeight: "600",
    color: "#263238",
  },

  // 🔥 NUEVOS ESTILOS
  detailsBtn: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#E3F2FD",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginTop: 6,
  },
  detailsBtnText: {
    marginLeft: 6,
    fontSize: 13,
    fontWeight: "600",
    color: "#263238",
  },
});
