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
  StatusBar,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
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

const VetMapScreen = ({ navigation, route }) => {
  const [loading, setLoading] = useState(true);
  const [region, setRegion] = useState(null);
  const [places, setPlaces] = useState([]);
  const [showList, setShowList] = useState(false);

  const mapRef = useRef();

  // 🔹 Modo "pick" cuando vienes desde el calendario
  const isPickMode = route?.params?.pickMode === true;
  const selectedDateISOFromRoute = route?.params?.dateISO || null;

  // 🔹 Cargar ubicación + veterinarias UNA sola vez
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

  // 🔹 Cada vez que la pantalla gana foco solo abrimos la lista en modo pick
  useFocusEffect(
    React.useCallback(() => {
      if (isPickMode) {
        setShowList(true);
      }
      return () => {};
    }, [isPickMode])
  );

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

  // 🔹 Crear recordatorio (funciona tanto desde tab "Mapa" como modo pick del calendario)
  const createReminderFromMap = (place) => {
    const todayISO = new Date().toISOString().split("T")[0];
    const dateISO = selectedDateISOFromRoute || todayISO;

    const params = {
      selectedVetForEvent: {
        placeId: place.place_id,
        name: place.name,
        address: place.vicinity || "",
      },
      openNewEventFromMap: true,
      dateISO,
    };

    const state = navigation.getState();
    const hasAppointmentsTab =
      state?.routeNames && state.routeNames.includes("Appointments");

    if (hasAppointmentsTab) {
      navigation.navigate("Appointments", params);
    } else {
      navigation.navigate("MainTabs", {
        screen: "Appointments",
        params,
      });
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
          <View style={{ flex: 1, paddingRight: 8 }}>
            <Text style={styles.listTitle}>Veterinarias cercanas</Text>
            <Text style={styles.listSubtitle}>
              Toca una clínica para centrar el mapa o usa los botones para ver
              detalles y crear un recordatorio.
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => setShowList(false)}
            style={styles.closeListBtn}
          >
            <Ionicons name="close" size={20} color="#365b6d" />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.listScroll}
          contentContainerStyle={styles.listScrollContent}
        >
          {places.map((p) => {
            const lat = p.geometry?.location?.lat;
            const lng = p.geometry?.location?.lng;

            const handleCenter = () => {
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
            };

            const handleViewDetails = () => {
              navigation.navigate("VetDetail", { placeId: p.place_id });
            };

            const handleSelectOrCreate = () => {
              createReminderFromMap(p);
            };

            const labelSelect = isPickMode
              ? "Usar en recordatorio"
              : "Crear recordatorio";

            const isOpen = p.opening_hours?.open_now;

            return (
              <View key={p.place_id} style={styles.listItem}>
                {/* fila principal: nombre, dirección, distancia y rating */}
                <View style={styles.listItemMainRow}>
                  <TouchableOpacity
                    style={styles.listItemLeft}
                    onPress={handleCenter}
                  >
                    <Text style={styles.itemTitle} numberOfLines={1}>
                      {p.name}
                    </Text>

                    {p.vicinity ? (
                      <Text
                        style={styles.itemSubtitle}
                        numberOfLines={2}
                        ellipsizeMode="tail"
                      >
                        {p.vicinity}
                      </Text>
                    ) : null}

                    {isOpen !== undefined && (
                      <View
                        style={[
                          styles.openBadge,
                          isOpen
                            ? styles.openBadgeOpen
                            : styles.openBadgeClosed,
                        ]}
                      >
                        <View
                          style={[
                            styles.openDot,
                            {
                              backgroundColor: isOpen ? "#43A047" : "#E53935",
                            },
                          ]}
                        />
                        <Text
                          style={[
                            styles.openBadgeText,
                            !isOpen && styles.openBadgeTextClosed,
                          ]}
                        >
                          {isOpen ? "Abierto ahora" : "Cerrado ahora"}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>

                  <View style={styles.listItemRight}>
                    <View style={styles.distanceChip}>
                      <Ionicons
                        name="navigate-outline"
                        size={14}
                        color="#1E88E5"
                      />
                      <Text style={styles.distanceChipText}>
                        {p.distanceKm < 1
                          ? `${Math.round(p.distanceKm * 1000)} m`
                          : `${p.distanceKm.toFixed(1)} km`}
                      </Text>
                    </View>

                    {p.rating ? (
                      <View style={styles.ratingChip}>
                        <Ionicons name="star" size={12} color="#FFB300" />
                        <Text style={styles.ratingChipText}>
                          {p.rating.toFixed(1)}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                </View>

                {/* fila de botones */}
                <View style={styles.listActionsRow}>
                  <TouchableOpacity
                    style={[styles.detailsBtn, styles.secondaryListBtn]}
                    onPress={handleViewDetails}
                  >
                    <Ionicons
                      name="information-circle-outline"
                      size={16}
                      color="#365b6d"
                    />
                    <Text style={styles.detailsBtnText}>Ver detalles</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.detailsBtn, styles.primaryListBtn]}
                    onPress={handleSelectOrCreate}
                  >
                    <Ionicons
                      name={isPickMode ? "checkmark-circle-outline" : "add"}
                      size={16}
                      color="#ffffff"
                    />
                    <Text style={[styles.detailsBtnText, { color: "#ffffff" }]}>
                      {labelSelect}
                    </Text>
                  </TouchableOpacity>
                </View>
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

  const statusBarHeight =
    Platform.OS === "android" ? StatusBar.currentHeight || 0 : 0;
  const topOffset = Platform.OS === "ios" ? 50 : statusBarHeight + 10;
  const floatingButtonsTop = topOffset + 60;

  return (
    <View style={styles.container}>
      <StatusBar
        translucent={true}
        backgroundColor="transparent"
        barStyle="light-content"
      />
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

          const handleViewDetails = () => {
            navigation.navigate("VetDetail", { placeId: p.place_id });
          };

          const handleSelectOrCreate = () => {
            createReminderFromMap(p);
          };

          const labelSelect = isPickMode
            ? "Usar en recordatorio"
            : "Crear recordatorio";

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
                      onPress={handleViewDetails}
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
                      onPress={handleSelectOrCreate}
                    >
                      <Ionicons
                        name={isPickMode ? "checkmark-circle-outline" : "add"}
                        size={18}
                        color="#365b6d"
                      />
                      <Text style={styles.calloutBtnText}>{labelSelect}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.calloutBtn}
                      onPress={() => {
                        const q = encodeURIComponent(
                          `${lat},${lng} (${p.name})`
                        );
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

      {/* HEADER flotante */}
      <View style={[styles.topControls, { top: topOffset }]}>
        <TouchableOpacity
          style={styles.topBtn}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={20} color="#365b6d" />
        </TouchableOpacity>

        <Text style={styles.title}>
          {isPickMode ? "Veterinarias" : "Veterinarias"}
        </Text>

        <View style={{ width: 40 }} />
      </View>

      {/* BOTONES flotantes a la derecha */}
      <View style={[styles.floatingRight, { top: floatingButtonsTop }]}>
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
    color: "#ffffffff",
  },

  floatingRight: {
    position: "absolute",
    right: 12,
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
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  listHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  listTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#263238",
  },
  listSubtitle: {
    marginTop: 2,
    fontSize: 11,
    color: "#78909C",
  },
  closeListBtn: {
    width: 32,
    height: 32,
    backgroundColor: "#E0E9F5",
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  listScroll: { marginTop: 10 },
  listScrollContent: {
    paddingBottom: 12,
  },

  listItem: {
    backgroundColor: "#F9FAFB",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E0E9F5",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  listItemMainRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  listItemLeft: {
    flex: 1,
    paddingRight: 8,
  },
  listItemRight: {
    alignItems: "flex-end",
    justifyContent: "flex-start",
  },

  itemTitle: { fontSize: 15, fontWeight: "700", color: "#263238" },
  itemSubtitle: {
    fontSize: 13,
    color: "#607D8B",
    marginTop: 4,
  },

  distanceChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "#E3F2FD",
    marginBottom: 4,
  },
  distanceChipText: {
    marginLeft: 4,
    fontSize: 11,
    fontWeight: "600",
    color: "#1E88E5",
  },

  ratingChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: "#FFF8E1",
  },
  ratingChipText: {
    marginLeft: 4,
    fontSize: 11,
    fontWeight: "600",
    color: "#FFB300",
  },

  openBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    marginTop: 6,
  },
  openBadgeOpen: {
    backgroundColor: "#E8F5E9",
  },
  openBadgeClosed: {
    backgroundColor: "#FFEBEE",
  },
  openDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },
  openBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#2E7D32",
  },
  openBadgeTextClosed: {
    color: "#C62828",
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

  listActionsRow: {
    flexDirection: "row",
    marginTop: 8,
    justifyContent: "flex-end",
  },

  callout: {
    width: 260,
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
    flexWrap: "wrap",
    gap: 4,
  },
  calloutBtn: {
    flexDirection: "row",
    backgroundColor: "#E3F2FD",
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 4,
  },
  calloutBtnText: {
    marginLeft: 6,
    fontSize: 12,
    fontWeight: "600",
    color: "#263238",
  },

  detailsBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 999,
  },
  secondaryListBtn: {
    backgroundColor: "#E3F2FD",
    marginRight: 8,
  },
  primaryListBtn: {
    backgroundColor: "#43A047",
  },
  detailsBtnText: {
    marginLeft: 6,
    fontSize: 13,
    fontWeight: "600",
    color: "#263238",
  },
});
