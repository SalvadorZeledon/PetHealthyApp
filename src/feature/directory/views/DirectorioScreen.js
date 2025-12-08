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

const institutions = [
  {
    id: 1,
    category: "Gobierno",
    name: "Unidad de Bienestar Animal (MAG)",
    phone: "22103334",
    whatsapp: "",
    email: "info@mag.gob.sv",
    address: "Kilómetro 5 1/2 carretera a Santa Tecla, MAG, San Salvador.",
    desc: "Dependencia del Ministerio de Agricultura responsable de recibir denuncias por maltrato animal.",
    details:
      "Atiende casos de maltrato, negligencia, abandono, animales en riesgo, criaderos irregulares y denuncias sobre bienestar animal.",
  },
  {
    id: 2,
    category: "Gobierno",
    name: "PNC Medio Ambiente",
    phone: "911",
    whatsapp: "",
    email: "",
    address: "",
    desc: "Unidad especializada de la Policía enfocada en delitos ambientales.",
    details:
      "En emergencias o maltrato grave llamar al 911. Para denuncias menores acudir a la delegación más cercana.",
  },
  {
    id: 3,
    category: "Gobierno",
    name: "Ministerio de Medio Ambiente (MARN)",
    phone: "21326276",
    whatsapp: "",
    email: "medioambiente@ambiente.gob.sv",
    address:
      "Km 5½ Carretera a Santa Tecla, Colonia Las Mercedes, edificios MARN, San Salvador.",
    desc: "Atiende denuncias relacionadas con fauna silvestre y medio ambiente.",
    details:
      "Recibe denuncias por caza ilegal, tráfico de fauna, contaminación ambiental y afectaciones a ecosistemas.",
  },
  {
    id: 4,
    category: "Gobierno",
    name: "Instituto de Bienestar Animal (IBA)",
    phone: "23167777",
    whatsapp: "",
    email: "uaip@iba.gob.sv",
    address: "Calle Los Abedules #422, Urb. Buenos Aires, San Salvador.",
    desc: "Entidad pública encargada de velar por el bienestar animal.",
    details:
      "Atiende denuncias, realiza inspecciones, rescates y coordinación de normativa de protección animal.",
  },
  {
    id: 5,
    category: "Fundaciones",
    name: "FURESA",
    phone: "23479300",
    whatsapp: "60786629",
    email: "info@furesa.com.sv",
    address:
      "Carretera al Puerto de La Libertad, Km 19, Panchimalco, San Salvador.",
    desc: "Fundación dedicada al rescate y protección animal.",
    details:
      "Atiende casos de animales abandonados, rescates y apoyo comunitario.",
  },
  {
    id: 6,
    category: "Fundaciones",
    name: "FHMD CatDog",
    phone: "78660465",
    whatsapp: "",
    email: "donafcatdogsv@hotmail.com",
    address: "Calle a Huizúcar, cerca del Redondel Utila, Antiguo Cuscatlán.",
    desc: "Fundación dedicada a la protección y adopción de mascotas.",
    details:
      "Reciben reportes de animales desprotegidos, rescates y procesos de adopción.",
  },
];

const categories = ["Gobierno", "Fundaciones"];

const DirectorioScreen = ({ navigation }) => {
  const goBack = () => navigation.goBack();

  const openDetails = (item) => {
    navigation.navigate("DirectorioDetail", { data: item });
  };

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={goBack} style={styles.topIconButton}>
          <Ionicons name="arrow-back" size={22} color="#365b6d" />
        </TouchableOpacity>

        <Text style={styles.topTitle}>Directorio</Text>

        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {categories.map((cat) => (
          <View key={cat}>
            {/* SECTION HEADER */}
            <View style={styles.sectionHeader}>
              <Ionicons
                name="folder-outline"
                size={18}
                color="#365b6d"
                style={{ marginRight: 6 }}
              />
              <Text style={styles.sectionTitle}>{cat}</Text>
            </View>

            {/* INSTITUTIONS */}
            {institutions
              .filter((i) => i.category === cat)
              .map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.card}
                  onPress={() => openDetails(item)}
                >
                  <Text style={styles.cardTitle}>{item.name}</Text>
                  <Text style={styles.cardDesc}>{item.desc}</Text>

                  <View style={styles.moreRow}>
                    <Text style={styles.moreText}>Ver detalles</Text>
                    <Ionicons
                      name="chevron-forward"
                      size={18}
                      color="#90A4AE"
                    />
                  </View>
                </TouchableOpacity>
              ))}
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

export default DirectorioScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#E3F2FD",
    paddingTop: 0,
  },
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
  topIconButton: {
    padding: 6,
    borderRadius: 999,
    backgroundColor: "#E0E9F5",
  },
  topTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 30,
  },

  /* SECTION HEADER */
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E0E9F5",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 12,
    marginTop: 14,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#365b6d",
  },

  /* CARDS */
  card: {
    backgroundColor: "#FFFFFF",
    padding: 14,
    borderRadius: 16,
    marginBottom: 12,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 4,
    color: "#263238",
  },
  cardDesc: {
    fontSize: 13,
    color: "#455A64",
    marginBottom: 10,
  },
  moreRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  moreText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#607D8B",
    marginRight: 4,
  },
});
