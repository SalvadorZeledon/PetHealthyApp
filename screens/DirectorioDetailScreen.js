// screens/DirectorioDetailScreen.js
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";

const DirectorioDetailScreen = ({ route, navigation }) => {
  const { data } = route.params;

  const goBack = () => navigation.goBack();

  const makeCall = () => data.phone && Linking.openURL(`tel:${data.phone}`);

  const openWhatsApp = () => {
    if (!data.whatsapp) return;
    Linking.openURL(`https://wa.me/503${data.whatsapp}`);
  };

  const sendEmail = () => {
    if (!data.email) return;
    Linking.openURL(`mailto:${data.email}`);
  };

  const openMap = () => {
    if (!data.address) return;

    const encoded = encodeURIComponent(data.address);
    const url = Platform.select({
      ios: `maps:0,0?q=${encoded}`,
      android: `geo:0,0?q=${encoded}`,
    });

    Linking.openURL(url);
  };

  const copyToClipboard = (value) => Clipboard.setStringAsync(value);

  
  const getCategoryBadge = () => {
    if (data.category === "Gobierno") {
      return (
        <View style={[styles.badge, { backgroundColor: "#D1E9FF" }]}>
          <Ionicons name="business-outline" size={16} color="#0D47A1" />
          <Text style={[styles.badgeText, { color: "#0D47A1" }]}>Gobierno</Text>
        </View>
      );
    }

    if (data.category === "Fundaciones") {
      return (
        <View style={[styles.badge, { backgroundColor: "#D0F8CE" }]}>
          <Ionicons name="leaf-outline" size={16} color="#2E7D32" />
          <Text style={[styles.badgeText, { color: "#2E7D32" }]}>
            Fundación / ONG
          </Text>
        </View>
      );
    }

    // fallback por si en el futuro agregas más categorías
    return null;
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={goBack} style={styles.topIconButton}>
          <Ionicons name="arrow-back" size={22} color="#365b6d" />
        </TouchableOpacity>

        <Text style={styles.topTitle}>{data.name}</Text>

        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        {/* CATEGORY BADGE */}
        {getCategoryBadge()}

        <Text style={styles.descTitle}>Descripción</Text>
        <Text style={styles.descText}>{data.details}</Text>

        <Text style={styles.descTitle}>Contacto</Text>

        {/* Teléfono */}
        {data.phone && (
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>Teléfono:</Text>
            <Text style={styles.infoValue}>{data.phone}</Text>

            <View style={styles.rowButtons}>
              <TouchableOpacity style={styles.smallBtn} onPress={makeCall}>
                <Ionicons name="call-outline" size={20} color="#00695C" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.smallBtn}
                onPress={() => copyToClipboard(data.phone)}
              >
                <Ionicons name="copy-outline" size={20} color="#00695C" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* WhatsApp */}
        {data.whatsapp && (
          <TouchableOpacity style={styles.actionBtn} onPress={openWhatsApp}>
            <Ionicons name="logo-whatsapp" size={22} color="#1B5E20" />
            <Text style={styles.actionText}>Enviar mensaje por WhatsApp</Text>
          </TouchableOpacity>
        )}

        {/* Email */}
        {data.email && (
          <TouchableOpacity style={styles.actionBtn} onPress={sendEmail}>
            <Ionicons name="mail-outline" size={22} color="#3949AB" />
            <Text style={styles.actionText}>Enviar correo</Text>
          </TouchableOpacity>
        )}

        {/* Dirección */}
        {data.address && (
          <>
            <Text style={styles.descTitle}>Dirección</Text>

            <View style={styles.infoBox}>
              <Text style={styles.infoLabel}>Ubicación:</Text>
              <Text style={styles.infoValue}>{data.address}</Text>

              <View style={styles.rowButtons}>
                <TouchableOpacity style={styles.smallBtn} onPress={openMap}>
                  <Ionicons name="location-outline" size={20} color="#6A1B9A" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.smallBtn}
                  onPress={() => copyToClipboard(data.address)}
                >
                  <Ionicons name="copy-outline" size={20} color="#6A1B9A" />
                </TouchableOpacity>
              </View>
            </View>
          </>
        )}
      </View>
    </View>
  );
};

export default DirectorioDetailScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#E3F2FD",
    marginTop: Platform.OS === "ios" ? 40 : 0,
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
    fontSize: 15,
    fontWeight: "600",
    color: "#365b6d",
    textAlign: "center",
    flex: 1,
  },
  content: {
    padding: 20,
  },

  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    alignSelf: "flex-start",
    marginBottom: 12,
    gap: 6,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: "700",
  },

  descTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#263238",
    marginTop: 12,
  },
  descText: {
    fontSize: 13,
    color: "#455A64",
    marginTop: 4,
  },

  infoBox: {
    backgroundColor: "#FFFFFF",
    padding: 12,
    borderRadius: 12,
    marginTop: 12,
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
    marginBottom: 10,
  },

  rowButtons: {
    flexDirection: "row",
    gap: 10,
  },
  smallBtn: {
    backgroundColor: "#E0F2F1",
    padding: 8,
    borderRadius: 10,
  },

  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 12,
    borderRadius: 12,
    marginTop: 12,
    elevation: 2,
  },
  actionText: {
    marginLeft: 10,
    color: "#263238",
    fontSize: 14,
    fontWeight: "600",
  },
});
