// screens/HomeScreen.js
import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../../../../firebase/config";
import { getUserFromStorage } from "../../../shared/utils/storage";
import { COL_MASCOTAS } from "../../../shared/utils/collections";

const avatarPlaceholder = require("../../../../assets/logo.png");

const EVENTS_STORAGE_KEY = "@appointments_events";

const MONTHS = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

// Formatear fecha para mostrar en Home
const formatEventDateForHome = (iso) => {
  if (!iso) return "Sin fecha";
  const [y, m, d] = iso.split("-").map((x) => Number(x));
  if (!y || !m || !d) return "Sin fecha";

  const date = new Date(y, m - 1, d);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const onlyDate = new Date(y, m - 1, d);
  onlyDate.setHours(0, 0, 0, 0);

  const label = `${d} de ${MONTHS[m - 1]}`;

  if (onlyDate.getTime() === today.getTime()) {
    return `Hoy · ${label}`;
  }

  return label;
};

// Para elegir iconito según tipo de evento
const getEventVisuals = (ev) => {
  if (!ev?.type) {
    return { iconName: "time-outline" };
  }

  if (
    ["personal_vet_visit", "vet_appointment", "vet_visit"].includes(ev.type)
  ) {
    return { iconName: "medkit-outline" };
  }
  if (ev.type === "meds") {
    return { iconName: "medkit" };
  }
  if (ev.type === "walk") {
    return { iconName: "paw-outline" };
  }
  return { iconName: "time-outline" };
};

// Parsear fecha + hora a Date para ordenar
const parseEventDateTime = (ev) => {
  if (!ev?.date) return null;
  const [y, m, d] = ev.date.split("-").map((x) => Number(x));
  if (!y || !m || !d) return null;

  let hours = 9;
  let minutes = 0;

  if (ev.time) {
    const match = ev.time.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (match) {
      let h = parseInt(match[1], 10);
      const min = parseInt(match[2], 10);
      const period = match[3].toUpperCase();
      if (period === "PM" && h !== 12) h += 12;
      if (period === "AM" && h === 12) h = 0;
      hours = h;
      minutes = min;
    }
  }

  return new Date(y, m - 1, d, hours, minutes, 0, 0);
};

const HomeScreen = ({ navigation }) => {
  const [user, setUser] = useState(null);
  const [photoUri, setPhotoUri] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

  const [pets, setPets] = useState([]);
  const [loadingPets, setLoadingPets] = useState(true);

  // ancho real de la card "Tus mascotas"
  const [petsCardWidth, setPetsCardWidth] = useState(0);
  const [activePetIndex, setActivePetIndex] = useState(0);

  // eventos / citas para Home
  const [upcomingUserEvents, setUpcomingUserEvents] = useState([]);
  const [nextVetEvent, setNextVetEvent] = useState(null);
  const [loadingEvents, setLoadingEvents] = useState(true);

  // Cargar usuario + foto + mascotas + eventos cada vez que la pantalla gana foco
  useFocusEffect(
    useCallback(() => {
      let unsubscribePets;

      const loadData = async () => {
        try {
          setLoadingUser(true);
          setLoadingPets(true);
          setLoadingEvents(true);

          const stored = await getUserFromStorage();
          if (!stored || !stored.id) {
            setUser(null);
            setPhotoUri(null);
            setPets([]);
            setUpcomingUserEvents([]);
            setNextVetEvent(null);
            return;
          }

          setUser(stored);

          // foto local
          if (stored.id) {
            const localPhoto = await AsyncStorage.getItem(
              `@userPhoto_${stored.id}`
            );
            setPhotoUri(localPhoto || null);
          }

          // mascotas de este usuario
          const q = query(
            collection(db, COL_MASCOTAS),
            where("ownerId", "==", stored.id)
          );

          unsubscribePets = onSnapshot(
            q,
            (snapshot) => {
              const list = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
              }));
              setPets(list);
              setLoadingPets(false);
            },
            (error) => {
              console.log("Error al suscribirse a mascotas:", error);
              setPets([]);
              setLoadingPets(false);
            }
          );

          // === Cargar eventos desde AsyncStorage para el Home ===
          try {
            const eventsJson = await AsyncStorage.getItem(EVENTS_STORAGE_KEY);
            let allEvents = [];
            if (eventsJson) {
              const parsed = JSON.parse(eventsJson);
              if (Array.isArray(parsed)) {
                allEvents = parsed;
              }
            }

            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const processed = allEvents
              .map((ev) => {
                const dt = parseEventDateTime(ev);
                let dateOnly = null;
                if (ev.date) {
                  const [yy, mm, dd] = ev.date.split("-").map((x) => Number(x));
                  if (yy && mm && dd) {
                    dateOnly = new Date(yy, mm - 1, dd);
                    dateOnly.setHours(0, 0, 0, 0);
                  }
                }
                return { ev, dt: dt || dateOnly, dateOnly };
              })
              // 👉 filtramos solo por fecha >= hoy (no por hora exacta)
              .filter((x) => x.dt && x.dateOnly && x.dateOnly >= today)
              .sort((a, b) => {
                if (a.dateOnly.getTime() !== b.dateOnly.getTime()) {
                  return a.dateOnly - b.dateOnly;
                }
                return a.dt - b.dt;
              });

            const userEvents = processed.filter((x) => x.ev.source === "user");
            const vetEvents = processed.filter((x) => x.ev.source === "vet");

            // hasta 3 eventos del usuario
            setUpcomingUserEvents(userEvents.slice(0, 3).map((x) => x.ev));
            // 1 próxima cita del vet
            setNextVetEvent(vetEvents.length ? vetEvents[0].ev : null);
          } catch (errEv) {
            console.log("Error cargando eventos en Home:", errEv);
            setUpcomingUserEvents([]);
            setNextVetEvent(null);
          } finally {
            setLoadingEvents(false);
          }
        } catch (error) {
          console.log("Error al cargar datos en HomeScreen:", error);
          setPets([]);
          setUpcomingUserEvents([]);
          setNextVetEvent(null);
          setLoadingPets(false);
          setLoadingEvents(false);
        } finally {
          setLoadingUser(false);
        }
      };

      loadData();

      return () => {
        if (unsubscribePets) unsubscribePets();
      };
    }, [])
  );

  const handleOpenSettings = () => {
    navigation.navigate("Settings");
  };

  const handleOpenProfile = () => {
    navigation.navigate("UserInfo");
  };

  const displayName =
    (user && (user.nombre || user.username || user.nombres)) || "Usuario";

  // Helpers para mostrar datos bonitos
  const formatPetAge = (pet) => {
    if (!pet) return "Edad no registrada";
    if (!pet.edadValor || !pet.edadTipo) return "Edad no registrada";

    const valor = Number(pet.edadValor);
    const tipo = pet.edadTipo;

    if (tipo === "años") {
      const unidad = valor === 1 ? "año" : "años";
      return `${valor} ${unidad}`;
    } else {
      const unidad = valor === 1 ? "mes" : "meses";
      return `${valor} ${unidad}`;
    }
  };

  const renderPetsSectionContent = (cardWidth) => {
    if (loadingPets) {
      return (
        <View style={styles.petsLoadingRow}>
          <ActivityIndicator size="small" color="#365b6d" />
          <Text style={styles.petsLoadingText}>Cargando tus mascotas…</Text>
        </View>
      );
    }

    if (!pets.length) {
      // Placeholder cuando no hay mascotas
      return (
        <View style={styles.petsEmptyCard}>
          <Ionicons name="paw-outline" size={32} color="#4CAF50" />
          <Text style={styles.petsEmptyTitle}>
            Aún no tienes mascotas registradas
          </Text>
          <Text style={styles.petsEmptyText}>
            Registra tu primera mascota para ver aquí su resumen rápido.
          </Text>

          <TouchableOpacity
            style={styles.petsEmptyButton}
            onPress={() => navigation.navigate("RegistroMascota")}
          >
            <Ionicons name="add" size={18} color="#FFFFFF" />
            <Text style={styles.petsEmptyButtonText}>Registrar mascota</Text>
          </TouchableOpacity>
        </View>
      );
    }

    // Si aún no sabemos el ancho de la card, no renderizamos el carrusel
    if (!cardWidth) return null;

    // Ancho útil interno (cardWidth menos paddingHorizontal: 16 + 16)
    const contentWidth = Math.max(0, cardWidth - 32);

    const handleScrollEnd = (event) => {
      const offsetX = event.nativeEvent.contentOffset.x;
      const index = Math.round(offsetX / contentWidth);
      setActivePetIndex(index);
    };

    return (
      <>
        {/* Carrusel horizontal de mascotas, una por “página” */}
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          style={{ width: contentWidth }}
          contentContainerStyle={styles.petsCarouselContent}
          decelerationRate="fast"
          snapToAlignment="center"
          onMomentumScrollEnd={handleScrollEnd}
        >
          {pets.map((pet) => (
            <View
              key={pet.id}
              style={{ width: contentWidth, alignItems: "center" }}
            >
              <TouchableOpacity
                activeOpacity={0.9}
                style={[styles.petCard, { width: contentWidth }]}
                onPress={() =>
                  navigation.navigate("PetProfile", { petId: pet.id })
                }
              >
                {/* FOTO IZQUIERDA */}
                <View style={styles.petAvatarWrapper}>
                  {pet.fotoUrl ? (
                    <Image
                      source={{ uri: pet.fotoUrl }}
                      style={styles.petAvatarImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.petAvatarPlaceholder}>
                      <Ionicons name="paw-outline" size={32} color="#4B5563" />
                    </View>
                  )}
                </View>

                {/* INFO DERECHA */}
                <View style={styles.petInfo}>
                  <Text style={styles.petName} numberOfLines={1}>
                    {pet.nombre || "Mascota"}
                  </Text>

                  <View style={styles.petRow}>
                    <Text style={styles.petMetaText} numberOfLines={1}>
                      {formatPetAge(pet)}
                    </Text>
                    <Text style={styles.petDivider}> | </Text>
                    <Text style={styles.petMetaText} numberOfLines={1}>
                      {pet.raza || pet.especie || "Sin raza definida"}
                    </Text>
                  </View>

                  {pet.pesoLbs ? (
                    <View style={styles.petRow}>
                      <Text style={styles.petMetaText}>
                        {pet.pesoLbs} lbs aprox.
                      </Text>
                    </View>
                  ) : null}
                </View>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>

        {/* PUNTITOS DEL CARRUSEL */}
        <View style={styles.dotsRow}>
          {pets.map((_, index) => (
            <View
              key={index}
              style={[styles.dot, index === activePetIndex && styles.dotActive]}
            />
          ))}
        </View>
      </>
    );
  };

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <View>
          <Text style={styles.helloText}>Hola,</Text>
          {loadingUser ? (
            <ActivityIndicator size="small" color="#365b6d" />
          ) : (
            <View style={styles.nameRow}>
              <Text style={styles.nameText}>{displayName}</Text>
              <Text style={styles.wave}> 👋</Text>
            </View>
          )}
        </View>

        <View style={styles.headerRight}>
          {/* Avatar usuario (izquierda) */}
          <TouchableOpacity
            style={styles.iconCircle}
            onPress={handleOpenProfile}
          >
            <Image
              source={photoUri ? { uri: photoUri } : avatarPlaceholder}
              style={styles.avatar}
            />
          </TouchableOpacity>

          {/* Botón Configuración (derecha) */}
          <TouchableOpacity
            style={[styles.iconCircle, { marginLeft: 8 }]}
            onPress={handleOpenSettings}
          >
            <Ionicons name="settings-outline" size={20} color="#365b6d" />
          </TouchableOpacity>
        </View>
      </View>

      {/* CONTENIDO PRINCIPAL */}
      <ScrollView contentContainerStyle={styles.content}>
        {/* === SECCIÓN MASCOTAS (solo carrusel, sin header) === */}
        <View
          style={styles.petsCard}
          onLayout={(e) => setPetsCardWidth(e.nativeEvent.layout.width)}
        >
          {renderPetsSectionContent(petsCardWidth)}
        </View>

        {/* Próximos recordatorios del usuario */}
        <Text style={styles.sectionTitle}>Tus próximos recordatorios</Text>
        {loadingEvents ? (
          <View style={styles.card}>
            <ActivityIndicator size="small" color="#365b6d" />
            <Text style={[styles.cardDetail, { marginLeft: 8 }]}>
              Cargando tus recordatorios...
            </Text>
          </View>
        ) : upcomingUserEvents.length === 0 ? (
          <View style={styles.card}>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>Sin recordatorios próximos</Text>
              <Text style={styles.cardDetail}>
                Crea un recordatorio desde la pestaña Calendario.
              </Text>
            </View>
            <View style={styles.cardIconWrapper}>
              <Ionicons name="time-outline" size={22} color="#365b6d" />
            </View>
          </View>
        ) : (
          upcomingUserEvents.map((ev) => {
            const { iconName } = getEventVisuals(ev);
            return (
              <TouchableOpacity
                key={ev.id}
                style={styles.card}
                onPress={() => navigation.navigate("Appointments")}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>{ev.title}</Text>
                  <Text style={styles.cardSubtitle}>
                    {ev.location || "Evento personal"}
                  </Text>
                  <Text style={styles.cardDetail}>
                    {formatEventDateForHome(ev.date)} · {ev.time || "Sin hora"}
                  </Text>
                </View>
                <View style={styles.cardIconWrapper}>
                  <Ionicons name={iconName} size={22} color="#365b6d" />
                </View>
              </TouchableOpacity>
            );
          })
        )}

        {/* Próxima cita asignada por el veterinario */}
        <Text style={styles.sectionTitle}>Próxima cita con tu veterinario</Text>
        {loadingEvents ? (
          <View style={styles.card}>
            <ActivityIndicator size="small" color="#365b6d" />
            <Text style={[styles.cardDetail, { marginLeft: 8 }]}>
              Cargando citas...
            </Text>
          </View>
        ) : !nextVetEvent ? (
          <View style={styles.card}>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>Sin citas asignadas</Text>
              <Text style={styles.cardDetail}>
                Tu veterinario aún no ha asignado una próxima cita.
              </Text>
            </View>
            <View style={styles.cardIconWrapper}>
              <Ionicons name="calendar-outline" size={22} color="#365b6d" />
            </View>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate("Appointments")}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>{nextVetEvent.title}</Text>
              <Text style={styles.cardSubtitle}>
                {nextVetEvent.location || "Clínica veterinaria"}
              </Text>
              <Text style={styles.cardDetail}>
                {formatEventDateForHome(nextVetEvent.date)} ·{" "}
                {nextVetEvent.time || "Sin hora"}
              </Text>
            </View>
            <View style={styles.cardIconWrapper}>
              <Ionicons name="medkit-outline" size={22} color="#365b6d" />
            </View>
          </TouchableOpacity>
        )}

        {/* Accesos rápidos */}
        <Text style={styles.sectionTitle}>Accesos rápidos</Text>
        <View style={styles.quickRow}>
          <TouchableOpacity
            style={styles.quickCard}
            onPress={() => navigation.navigate("RegistroMascota")}
          >
            <Ionicons name="add-circle-outline" size={22} color="#4CAF50" />
            <Text style={styles.quickText}>Agregar mascota</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickCard}
            onPress={() => navigation.navigate("Appointments")}
          >
            <Ionicons name="medkit-outline" size={22} color="#1E88E5" />
            <Text style={styles.quickText}>Ver calendario</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickCard}
            onPress={() => navigation.navigate("Appointments")}
          >
            <Ionicons name="time-outline" size={22} color="#FFB300" />
            <Text style={styles.quickText}>Próximas citas</Text>
          </TouchableOpacity>
        </View>

        {/* Resumen de salud (por ahora estático / demo) */}
        <Text style={styles.sectionTitle}>Resumen de salud</Text>
        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Ionicons name="heart-outline" size={22} color="#E91E63" />
            <Text style={styles.summaryTitle}>Vacunas al día</Text>
            <Text style={styles.summaryValue}>4 / 5</Text>
          </View>

          <View style={styles.summaryCard}>
            <Ionicons name="chatbubbles-outline" size={22} color="#00796B" />
            <Text style={styles.summaryTitle}>Consultas este año</Text>
            <Text style={styles.summaryValue}>3</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#E3F2FD",
    paddingTop: Platform.OS === "ios" ? 40 : 24,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  helloText: {
    fontSize: 14,
    color: "#607D8B",
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  nameText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#263238",
  },
  wave: {
    fontSize: 20,
    marginLeft: 4,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    elevation: 3,
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },

  /* ---------- Carrusel mascotas ---------- */
  petsCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 16,
    elevation: 3,
    overflow: "visible",
  },
  petsLoadingRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
  },
  petsLoadingText: {
    marginLeft: 8,
    fontSize: 13,
    color: "#607D8B",
  },
  petsEmptyCard: {
    marginTop: 6,
    borderRadius: 16,
    backgroundColor: "#F5F5F5",
    paddingVertical: 18,
    paddingHorizontal: 12,
    alignItems: "center",
  },
  petsEmptyTitle: {
    marginTop: 6,
    fontSize: 15,
    fontWeight: "600",
    color: "#263238",
    textAlign: "center",
  },
  petsEmptyText: {
    marginTop: 4,
    fontSize: 13,
    color: "#607D8B",
    textAlign: "center",
  },
  petsEmptyButton: {
    marginTop: 10,
    backgroundColor: "#4CAF50",
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  petsEmptyButtonText: {
    marginLeft: 6,
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 13,
  },
  petsCarouselContent: {
    paddingVertical: 4,
  },

  // CARD de cada mascota
  petCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 14,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  petAvatarWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: "#80DEEA",
    overflow: "hidden",
    marginRight: 14,
  },
  petAvatarImage: {
    width: "100%",
    height: "100%",
  },
  petAvatarPlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E5E7EB",
  },
  petInfo: {
    flex: 1,
  },
  petName: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1F2933",
  },
  petRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    flexWrap: "wrap",
  },
  petMetaText: {
    fontSize: 13,
    color: "#37474F",
  },
  petDivider: {
    fontSize: 14,
    color: "#90A4AE",
    marginHorizontal: 6,
  },

  // dots del carrusel
  dotsRow: {
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#CFD8DC",
    marginHorizontal: 3,
  },
  dotActive: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#90CAF9",
  },

  /* ---------- Resto de secciones ---------- */
  sectionTitle: {
    marginTop: 8,
    marginBottom: 6,
    fontSize: 14,
    fontWeight: "600",
    color: "#365b6d",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#263238",
  },
  cardSubtitle: {
    fontSize: 13,
    color: "#607D8B",
  },
  cardDetail: {
    fontSize: 12,
    color: "#90A4AE",
  },
  cardIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#E3F2FD",
    justifyContent: "center",
    alignItems: "center",
  },
  quickRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  quickCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingVertical: 10,
    alignItems: "center",
    marginHorizontal: 4,
    elevation: 2,
  },
  quickText: {
    marginTop: 4,
    fontSize: 12,
    color: "#455A64",
    textAlign: "center",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  summaryCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingVertical: 10,
    alignItems: "center",
    marginHorizontal: 4,
    elevation: 2,
  },
  summaryTitle: {
    fontSize: 12,
    color: "#607D8B",
    marginTop: 4,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#263238",
    marginTop: 2,
  },
});
