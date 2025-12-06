import React, { useState, useEffect, useMemo } from "react";
import { useRoute } from "@react-navigation/native";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Modal,
  TextInput,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { getUserFromStorage } from "../../../utils/storage";

const WEEKDAYS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
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

const EVENTS_STORAGE_KEY = "@appointments_events";

// Helper para generar todos los días de un mes
const buildMonthDays = (year, monthIndex) => {
  const days = [];
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(year, monthIndex, day);
    const iso = d.toISOString().split("T")[0];
    days.push({
      iso,
      dayNumber: day,
      weekday: WEEKDAYS[d.getDay()],
      dateObj: d,
    });
  }
  return days;
};

// Helper: comprobar si una fecha (YYYY-MM-DD) está en el pasado
const isDateInPast = (iso) => {
  if (!iso) return false;
  const [y, m, d] = iso.split("-").map((x) => Number(x));
  const date = new Date(y, m - 1, d);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date < today;
};

// Eventos por defecto (solo la primera vez si no hay guardados)
const buildDefaultEvents = () => {
  const today = new Date();
  const todayISO = today.toISOString().split("T")[0];

  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const tomorrowISO = tomorrow.toISOString().split("T")[0];

  return [
    {
      id: "1",
      type: "personal_vet_visit",
      title: "Visita al veterinario (personal)",
      petName: "Max",
      time: "10:30 AM",
      date: todayISO,
      location: "Clínica PetHealthy",
      source: "user", // user | vet
      status: "pending",
      vetPlaceId: null,
    },
    {
      id: "2",
      type: "walk",
      title: "Paseo al parque",
      petName: "Luna",
      time: "5:00 PM",
      date: todayISO,
      location: "Parque Central",
      source: "user",
      status: "pending",
      vetPlaceId: null,
    },
    {
      id: "3",
      type: "vet_appointment",
      title: "Consulta general (asignada por tu veterinario)",
      petName: "Bruno",
      time: "9:00 AM",
      date: tomorrowISO,
      location: "Clínica VetSalud",
      source: "vet",
      status: "pending",
      vetPlaceId: null,
    },
  ];
};

const AppointmentsScreen = ({ navigation }) => {
  const route = useRoute();
  const [userRole, setUserRole] = useState("cliente"); // "cliente" | "veterinario"

  const [selectedDateISO, setSelectedDateISO] = useState(null);
  const [daysStrip, setDaysStrip] = useState([]);
  const [filter, setFilter] = useState("all"); // all | citas | meds | actividades

  // Eventos (cargados desde AsyncStorage)
  const [events, setEvents] = useState([]);
  const [eventsLoaded, setEventsLoaded] = useState(false);

  // Modal nuevo recordatorio
  const [showNewEventModal, setShowNewEventModal] = useState(false);
  const [eventTitle, setEventTitle] = useState("");
  const [eventCategory, setEventCategory] = useState("vet_visit"); // vet_visit | meds | walk | other
  const [timeHour, setTimeHour] = useState("09");
  const [timeMinute, setTimeMinute] = useState("00");
  const [timePeriod, setTimePeriod] = useState("AM"); // AM | PM
  const [manualLocation, setManualLocation] = useState("");
  const [selectedVet, setSelectedVet] = useState(null); // { placeId, name, address }

  // Modal calendario mensual completo
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [monthCursor, setMonthCursor] = useState(() => new Date());

  // Cargar rol de usuario
  useEffect(() => {
    const loadUser = async () => {
      try {
        const stored = await getUserFromStorage();
        if (stored?.rol) setUserRole(stored.rol);
      } catch (err) {
        console.log("Error cargando usuario en AppointmentsScreen:", err);
      }
    };
    loadUser();
  }, []);

  // Cargar eventos desde AsyncStorage (una sola vez)
  useEffect(() => {
    const loadEvents = async () => {
      try {
        const json = await AsyncStorage.getItem(EVENTS_STORAGE_KEY);
        if (json) {
          const parsed = JSON.parse(json);
          if (Array.isArray(parsed)) {
            setEvents(parsed);
          } else {
            setEvents(buildDefaultEvents());
          }
        } else {
          setEvents(buildDefaultEvents());
        }
      } catch (e) {
        console.log("Error cargando eventos:", e);
        setEvents(buildDefaultEvents());
      } finally {
        setEventsLoaded(true);
      }
    };

    loadEvents();
  }, []);

  // Guardar eventos en AsyncStorage cada vez que cambian
  useEffect(() => {
    if (!eventsLoaded) return;

    const saveEvents = async () => {
      try {
        await AsyncStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(events));
      } catch (e) {
        console.log("Error guardando eventos:", e);
      }
    };

    saveEvents();
  }, [events, eventsLoaded]);

  // 👉 Cuando venimos desde el mapa (VetMap → "Crear recordatorio")
  useEffect(() => {
    if (!route?.params) return;

    const { selectedVetForEvent, openNewEventFromMap, dateISO } = route.params;

    if (selectedVetForEvent) {
      // Guardamos la vet seleccionada
      setSelectedVet({
        placeId: selectedVetForEvent.placeId,
        name: selectedVetForEvent.name,
        address: selectedVetForEvent.address,
      });

      // Ajustamos la fecha si viene
      if (dateISO) {
        setSelectedDateISO(dateISO);
      }

      // Si nos dijeron que abramos el modal, lo abrimos
      if (openNewEventFromMap) {
        setShowNewEventModal(true);
      }

      // Limpiamos params para que no se repita al volver a enfocar
      navigation.setParams({
        selectedVetForEvent: undefined,
        openNewEventFromMap: undefined,
        dateISO: undefined,
      });
    }
  }, [route?.params, navigation]);

  // Inicializar tira de días con TODO el mes actual
  useEffect(() => {
    const today = new Date();
    const todayISO = today.toISOString().split("T")[0];
    setSelectedDateISO(todayISO);

    const days = buildMonthDays(today.getFullYear(), today.getMonth());
    setDaysStrip(days);
    setMonthCursor(new Date(today.getFullYear(), today.getMonth(), 1));
  }, []);

  const formattedSelectedDate = useMemo(() => {
    if (!selectedDateISO) return "";
    const [year, month, day] = selectedDateISO.split("-");
    const d = new Date(Number(year), Number(month) - 1, Number(day));
    const dayNumber = d.getDate();
    const monthName = MONTHS[d.getMonth()];
    return `${dayNumber} de ${monthName}`;
  }, [selectedDateISO]);

  const currentMonthLabel = useMemo(() => {
    if (!daysStrip.length) return "";
    const first = daysStrip[0].dateObj;
    const monthName = MONTHS[first.getMonth()];
    const year = first.getFullYear();
    return `${monthName.charAt(0).toUpperCase()}${monthName.slice(1)} ${year}`;
  }, [daysStrip]);

  const mapTypeToFilterCategory = (type) => {
    if (
      type === "personal_vet_visit" ||
      type === "vet_appointment" ||
      type === "vet_visit"
    ) {
      return "citas";
    }
    if (type === "meds") return "meds";
    if (type === "walk" || type === "other") return "actividades";
    return "otros";
  };

  const eventsForSelectedDay = useMemo(() => {
    if (!selectedDateISO) return [];
    let list = events.filter((e) => e.date === selectedDateISO);
    if (filter !== "all") {
      list = list.filter((e) => mapTypeToFilterCategory(e.type) === filter);
    }
    return list;
  }, [events, selectedDateISO, filter]);

  const getDaySummary = (dateIso) => {
    const list = events.filter((e) => e.date === dateIso);
    return {
      hasVet: list.some((e) =>
        ["personal_vet_visit", "vet_appointment", "vet_visit"].includes(e.type)
      ),
      hasMeds: list.some((e) => e.type === "meds"),
      hasActivity: list.some((e) => ["walk", "other"].includes(e.type)),
    };
  };

  const handleOpenSettings = () => {
    navigation.navigate("Settings");
  };

  const openNewEventModal = () => {
    if (!selectedDateISO) {
      return;
    }

    // 🚫 No permitir fechas en el pasado
    if (isDateInPast(selectedDateISO)) {
      Alert.alert(
        "Fecha no válida",
        "No puedes crear recordatorios en fechas anteriores a hoy."
      );
      return;
    }

    if (userRole === "veterinario") {
      // Más adelante: modo veterinario
      return;
    }

    setEventTitle("");
    setEventCategory("vet_visit");
    setTimeHour("09");
    setTimeMinute("00");
    setTimePeriod("AM");
    setManualLocation("");
    // No reseteamos selectedVet para que se mantenga si venimos del mapa
    setShowNewEventModal(true);
  };

  const handleSaveNewEvent = () => {
    const trimmedTitle = eventTitle.trim();
    if (!trimmedTitle) {
      return;
    }

    const h = parseInt(timeHour, 10);
    const m = parseInt(timeMinute, 10);
    if (isNaN(h) || isNaN(m) || h < 1 || h > 12 || m < 0 || m > 59) {
      return;
    }

    // Reforzar: no guardar eventos en fechas pasadas
    if (isDateInPast(selectedDateISO)) {
      Alert.alert(
        "Fecha no válida",
        "No puedes crear recordatorios en fechas anteriores a hoy."
      );
      return;
    }

    const hh = h.toString().padStart(2, "0");
    const mm = m.toString().padStart(2, "0");
    const timeStr = `${hh}:${mm} ${timePeriod}`;

    let locationStr = manualLocation.trim();
    let vetPlaceId = null;

    if (eventCategory === "vet_visit" && selectedVet) {
      locationStr = selectedVet.address || selectedVet.name;
      vetPlaceId = selectedVet.placeId;
    }

    const newEvent = {
      id: Date.now().toString(),
      type: eventCategory,
      title: trimmedTitle,
      petName: null,
      time: timeStr,
      date: selectedDateISO,
      location: locationStr || null,
      source: "user",
      status: "pending",
      vetPlaceId,
    };

    setEvents((prev) => [...prev, newEvent]);
    setShowNewEventModal(false);
  };

  const handleToggleDone = (id) => {
    setEvents((prev) =>
      prev.map((e) =>
        e.id === id
          ? { ...e, status: e.status === "done" ? "pending" : "done" }
          : e
      )
    );
  };

  const handleDeleteEvent = (id) => {
    const eventToDelete = events.find((e) => e.id === id);

    Alert.alert(
      "Eliminar recordatorio",
      eventToDelete
        ? `¿Seguro que quieres eliminar "${eventToDelete.title}"?`
        : "¿Seguro que quieres eliminar este evento?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: () => {
            setEvents((prev) => prev.filter((e) => e.id !== id));
          },
        },
      ]
    );
  };

  const getEventVisuals = (ev) => {
    if (
      ["personal_vet_visit", "vet_appointment", "vet_visit"].includes(ev.type)
    ) {
      return {
        iconName: "medkit-outline",
        iconBg: "#E3F2FD",
        iconColor: "#1565C0",
      };
    }
    if (ev.type === "meds") {
      return {
        iconName: "medkit",
        iconBg: "#F3E5F5",
        iconColor: "#6A1B9A",
      };
    }
    if (ev.type === "walk") {
      return {
        iconName: "paw-outline",
        iconBg: "#E8F5E9",
        iconColor: "#2E7D32",
      };
    }
    return {
      iconName: "time-outline",
      iconBg: "#E0E0E0",
      iconColor: "#455A64",
    };
  };

  // 👉 Abrir mapa en modo "picker" con la fecha seleccionada
  const handleOpenVetPicker = () => {
    if (!selectedDateISO) return;

    if (isDateInPast(selectedDateISO)) {
      Alert.alert(
        "Fecha no válida",
        "Selecciona una fecha igual o posterior a hoy antes de elegir una veterinaria."
      );
      return;
    }

    navigation.navigate("VetMap", {
      pickMode: true,
      dateISO: selectedDateISO,
    });
  };

  const primaryButtonLabel =
    userRole === "veterinario" ? "Crear cita médica" : "Agregar recordatorio";

  // ---------- RENDER DEL CALENDARIO MENSUAL COMPLETO ----------
  const renderMonthPicker = () => {
    if (!showMonthPicker) return null;

    const year = monthCursor.getFullYear();
    const monthIdx = monthCursor.getMonth();
    const monthName = MONTHS[monthIdx];

    const firstWeekday = new Date(year, monthIdx, 1).getDay(); // 0-6
    const daysInMonth = new Date(year, monthIdx + 1, 0).getDate();

    const cells = [];
    for (let i = 0; i < firstWeekday; i++) cells.push(null);
    for (let day = 1; day <= daysInMonth; day++) cells.push(day);
    while (cells.length % 7 !== 0) cells.push(null);

    const selectedInfo = selectedDateISO
      ? (() => {
          const [sy, sm, sd] = selectedDateISO.split("-");
          return {
            year: Number(sy),
            monthIdx: Number(sm) - 1,
            day: Number(sd),
          };
        })()
      : null;

    const isSameDay = (y, mIdx, d) => {
      if (!selectedInfo) return false;
      return (
        selectedInfo.year === y &&
        selectedInfo.monthIdx === mIdx &&
        selectedInfo.day === d
      );
    };

    const handleSelectDay = (day) => {
      if (!day) return;
      const date = new Date(year, monthIdx, day);
      const iso = date.toISOString().split("T")[0];

      setSelectedDateISO(iso);
      setDaysStrip(buildMonthDays(year, monthIdx));
      setMonthCursor(new Date(year, monthIdx, 1));
      setShowMonthPicker(false);
    };

    const goPrevMonth = () => {
      const prev = new Date(year, monthIdx - 1, 1);
      setMonthCursor(prev);
      setDaysStrip(buildMonthDays(prev.getFullYear(), prev.getMonth()));
    };

    const goNextMonth = () => {
      const next = new Date(year, monthIdx + 1, 1);
      setMonthCursor(next);
      setDaysStrip(buildMonthDays(next.getFullYear(), next.getMonth()));
    };

    return (
      <Modal
        visible={showMonthPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMonthPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.monthCard}>
            <View style={styles.monthHeaderRow}>
              <TouchableOpacity
                style={styles.monthNavBtn}
                onPress={goPrevMonth}
              >
                <Ionicons name="chevron-back" size={18} color="#455A64" />
              </TouchableOpacity>

              <Text style={styles.monthHeaderText}>
                {monthName.charAt(0).toUpperCase() + monthName.slice(1)} {year}
              </Text>

              <TouchableOpacity
                style={styles.monthNavBtn}
                onPress={goNextMonth}
              >
                <Ionicons name="chevron-forward" size={18} color="#455A64" />
              </TouchableOpacity>
            </View>

            <View style={styles.monthWeekRow}>
              {WEEKDAYS.map((w) => (
                <Text key={w} style={styles.monthWeekLabel}>
                  {w}
                </Text>
              ))}
            </View>

            <View style={styles.monthGrid}>
              {cells.map((day, idx) => {
                if (!day) {
                  return <View key={idx} style={styles.monthDayCell} />;
                }
                const selected = isSameDay(year, monthIdx, day);
                return (
                  <TouchableOpacity
                    key={idx}
                    style={[
                      styles.monthDayCell,
                      selected && styles.monthDayCellSelected,
                    ]}
                    onPress={() => handleSelectDay(day)}
                  >
                    <Text
                      style={[
                        styles.monthDayNumber,
                        selected && styles.monthDayNumberSelected,
                      ]}
                    >
                      {day}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.monthActionsRow}>
              <TouchableOpacity
                style={styles.modalSecondaryBtn}
                onPress={() => setShowMonthPicker(false)}
              >
                <Text style={styles.modalSecondaryText}>Cerrar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  // ---------- RENDER PRINCIPAL ----------
  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Calendario</Text>

        <TouchableOpacity
          style={styles.iconCircle}
          onPress={handleOpenSettings}
        >
          <Ionicons name="settings-outline" size={20} color="#365b6d" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* CARD DEL CALENDARIO */}
        <View className="calendarCard" style={styles.calendarCard}>
          <View style={styles.calendarHeaderRow}>
            <View style={styles.calendarHeaderLeft}>
              <Text style={styles.calendarTitle}>Tu calendario</Text>
              <Text style={styles.calendarSubtitle}>
                Selecciona un día para ver o agregar recordatorios.
              </Text>
            </View>

            {/* Botón mes/año (abre calendario grande) */}
            <TouchableOpacity
              style={styles.calendarMonthPill}
              onPress={() => {
                if (selectedDateISO) {
                  const [y, m] = selectedDateISO.split("-");
                  setMonthCursor(new Date(Number(y), Number(m) - 1, 1));
                } else if (daysStrip.length) {
                  const d0 = daysStrip[0].dateObj;
                  setMonthCursor(new Date(d0.getFullYear(), d0.getMonth(), 1));
                } else {
                  setMonthCursor(new Date());
                }
                setShowMonthPicker(true);
              }}
            >
              <Ionicons
                name="calendar-outline"
                size={14}
                color="#1E88E5"
                style={{ marginRight: 4 }}
              />
              <Text
                style={styles.calendarMonthText}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {currentMonthLabel || "Calendario"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* TIRA HORIZONTAL DE DÍAS – todo el mes */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.daysStrip}
          >
            {daysStrip.map((d) => {
              const isSelected = d.iso === selectedDateISO;
              const todayISO = new Date().toISOString().split("T")[0];
              const isToday = d.iso === todayISO;
              const summary = getDaySummary(d.iso);

              return (
                <TouchableOpacity
                  key={d.iso}
                  style={[styles.dayChip, isSelected && styles.dayChipSelected]}
                  onPress={() => setSelectedDateISO(d.iso)}
                >
                  <Text
                    style={[
                      styles.dayWeekText,
                      isSelected && styles.dayWeekTextSelected,
                    ]}
                  >
                    {d.weekday}
                  </Text>
                  <Text
                    style={[
                      styles.dayNumberText,
                      isSelected && styles.dayNumberTextSelected,
                    ]}
                  >
                    {d.dayNumber}
                  </Text>

                  <View style={styles.dayDotsRow}>
                    {summary.hasVet && (
                      <View
                        style={[styles.dayDot, { backgroundColor: "#1E88E5" }]}
                      />
                    )}
                    {summary.hasMeds && (
                      <View
                        style={[styles.dayDot, { backgroundColor: "#8E24AA" }]}
                      />
                    )}
                    {summary.hasActivity && (
                      <View
                        style={[styles.dayDot, { backgroundColor: "#2E7D32" }]}
                      />
                    )}
                  </View>

                  {isToday && !isSelected && (
                    <Text style={styles.todayBadge}>Hoy</Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* BOTÓN PRINCIPAL */}
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={openNewEventModal}
          >
            <Ionicons name="add-outline" size={18} color="#FFFFFF" />
            <Text style={styles.primaryButtonText}>{primaryButtonLabel}</Text>
          </TouchableOpacity>
        </View>

        {/* EVENTOS DEL DÍA + FILTROS */}
        <View style={styles.eventsHeaderRow}>
          <Text style={styles.eventsTitle}>
            Eventos para el {formattedSelectedDate || "día seleccionado"}
          </Text>
        </View>

        <View style={styles.filterRow}>
          {[
            { value: "all", label: "Todos" },
            { value: "citas", label: "Citas" },
            { value: "meds", label: "Medicación" },
            { value: "actividades", label: "Actividades" },
          ].map((f) => {
            const selected = filter === f.value;
            return (
              <TouchableOpacity
                key={f.value}
                style={[
                  styles.filterChip,
                  selected && styles.filterChipSelected,
                ]}
                onPress={() => setFilter(f.value)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    selected && styles.filterChipTextSelected,
                  ]}
                >
                  {f.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {eventsForSelectedDay.length === 0 ? (
          <View style={styles.placeholderCard}>
            <Ionicons name="time-outline" size={36} color="#1E88E5" />
            <Text style={styles.placeholderTitle}>Sin eventos este día</Text>
            <Text style={styles.placeholderText}>
              Usa el botón{" "}
              <Text style={{ fontWeight: "700" }}>{primaryButtonLabel}</Text>{" "}
              para agregar una cita o recordatorio.
            </Text>
          </View>
        ) : (
          eventsForSelectedDay.map((ev) => {
            const visuals = getEventVisuals(ev);
            const isDone = ev.status === "done";

            return (
              <TouchableOpacity
                key={ev.id}
                style={styles.eventCard}
                activeOpacity={ev.vetPlaceId ? 0.9 : 1}
                onPress={
                  ev.vetPlaceId
                    ? () =>
                        navigation.navigate("VetDetail", {
                          placeId: ev.vetPlaceId,
                        })
                    : undefined
                }
              >
                <View style={{ flex: 1 }}>
                  <Text
                    style={[styles.eventTitle, isDone && styles.eventTextDone]}
                  >
                    {ev.title}
                  </Text>
                  <Text
                    style={[
                      styles.eventSubtitle,
                      isDone && styles.eventTextDone,
                    ]}
                  >
                    {ev.petName ? `Con ${ev.petName} 🐾` : "Evento"}
                  </Text>
                  <Text
                    style={[styles.eventDetail, isDone && styles.eventTextDone]}
                  >
                    {ev.time} · {ev.location || "Sin ubicación definida"}
                  </Text>
                </View>

                <View style={styles.eventMeta}>
                  {ev.source === "vet" ? (
                    <View style={styles.badgeVet}>
                      <Ionicons
                        name="medkit-outline"
                        size={14}
                        color="#1E88E5"
                      />
                      <Text style={styles.badgeVetText}>Vet</Text>
                    </View>
                  ) : (
                    <View style={styles.badgeUser}>
                      <Ionicons
                        name="person-outline"
                        size={14}
                        color="#43A047"
                      />
                      <Text style={styles.badgeUserText}>Personal</Text>
                    </View>
                  )}

                  <View
                    style={[
                      styles.eventIconWrapper,
                      { backgroundColor: visuals.iconBg },
                    ]}
                  >
                    <Ionicons
                      name={visuals.iconName}
                      size={20}
                      color={visuals.iconColor}
                    />
                  </View>

                  {ev.source === "user" && (
                    <View style={styles.eventActionsRow}>
                      <TouchableOpacity
                        style={styles.smallIconButton}
                        onPress={() => handleToggleDone(ev.id)}
                      >
                        <Ionicons
                          name={
                            isDone
                              ? "checkmark-circle"
                              : "checkmark-circle-outline"
                          }
                          size={18}
                          color={isDone ? "#43A047" : "#607D8B"}
                        />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.smallIconButton}
                        onPress={() => handleDeleteEvent(ev.id)}
                      >
                        <Ionicons
                          name="trash-outline"
                          size={18}
                          color="#E53935"
                        />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {/* MODAL: NUEVO RECORDATORIO */}
      <Modal
        visible={showNewEventModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowNewEventModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Nuevo recordatorio</Text>
              <TouchableOpacity onPress={() => setShowNewEventModal(false)}>
                <Ionicons name="close" size={22} color="#455A64" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              {selectedDateISO
                ? `Para el ${formattedSelectedDate}`
                : "Selecciona una fecha en el calendario."}
            </Text>

            {/* TÍTULO */}
            <Text style={styles.modalLabel}>Título</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Ej: Vacuna anual, Paseo con Max..."
              placeholderTextColor="#9CA3AF"
              value={eventTitle}
              onChangeText={setEventTitle}
            />

            {/* CATEGORÍA */}
            <Text style={[styles.modalLabel, { marginTop: 10 }]}>
              Tipo de recordatorio
            </Text>
            <View style={styles.modalChipsRow}>
              {[
                { value: "vet_visit", label: "Visita al vet" },
                { value: "meds", label: "Medicación" },
                { value: "walk", label: "Paseo" },
                { value: "other", label: "Otro" },
              ].map((opt) => {
                const selected = eventCategory === opt.value;
                return (
                  <TouchableOpacity
                    key={opt.value}
                    style={[
                      styles.modalChip,
                      selected && styles.modalChipSelected,
                    ]}
                    onPress={() => setEventCategory(opt.value)}
                  >
                    <Text
                      style={[
                        styles.modalChipText,
                        selected && styles.modalChipTextSelected,
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* HORA */}
            <Text style={[styles.modalLabel, { marginTop: 10 }]}>Hora</Text>
            <View style={styles.timeRow}>
              <TextInput
                style={styles.timeInput}
                keyboardType="numeric"
                maxLength={2}
                value={timeHour}
                onChangeText={setTimeHour}
                placeholder="hh"
                placeholderTextColor="#9CA3AF"
              />
              <Text style={styles.timeColon}>:</Text>
              <TextInput
                style={styles.timeInput}
                keyboardType="numeric"
                maxLength={2}
                value={timeMinute}
                onChangeText={setTimeMinute}
                placeholder="mm"
                placeholderTextColor="#9CA3AF"
              />

              <View style={styles.periodToggle}>
                {["AM", "PM"].map((p) => {
                  const selected = timePeriod === p;
                  return (
                    <TouchableOpacity
                      key={p}
                      style={[
                        styles.periodChip,
                        selected && styles.periodChipSelected,
                      ]}
                      onPress={() => setTimePeriod(p)}
                    >
                      <Text
                        style={[
                          styles.periodChipText,
                          selected && styles.periodChipTextSelected,
                        ]}
                      >
                        {p}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* LUGAR / VETERINARIA */}
            {eventCategory === "vet_visit" ? (
              <>
                <Text style={[styles.modalLabel, { marginTop: 10 }]}>
                  Veterinaria
                </Text>
                <View style={styles.vetRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.vetSelectedName}>
                      {selectedVet ? selectedVet.name : "Ninguna seleccionada"}
                    </Text>
                    {selectedVet?.address ? (
                      <Text style={styles.vetSelectedAddress}>
                        {selectedVet.address}
                      </Text>
                    ) : null}
                  </View>

                  {selectedVet && (
                    <TouchableOpacity
                      style={styles.vetClearBtn}
                      onPress={() => setSelectedVet(null)}
                    >
                      <Ionicons
                        name="close-circle-outline"
                        size={18}
                        color="#EF5350"
                      />
                    </TouchableOpacity>
                  )}
                </View>

                <TouchableOpacity
                  style={[styles.modalSecondaryBtn, styles.vetChooseBtn]}
                  onPress={handleOpenVetPicker}
                >
                  <Ionicons name="location-outline" size={16} color="#1E88E5" />
                  <Text
                    style={[
                      styles.modalSecondaryText,
                      { color: "#1E88E5", marginLeft: 4 },
                    ]}
                  >
                    Elegir desde el mapa
                  </Text>
                </TouchableOpacity>

                <Text style={[styles.modalLabel, { marginTop: 10 }]}>
                  Notas sobre el lugar (opcional)
                </Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Ej: Llevar carnet de vacunas, pagar en efectivo..."
                  placeholderTextColor="#9CA3AF"
                  value={manualLocation}
                  onChangeText={setManualLocation}
                />
              </>
            ) : (
              <>
                <Text style={[styles.modalLabel, { marginTop: 10 }]}>
                  Lugar (opcional)
                </Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Ej: Parque central, casa de la abuela..."
                  placeholderTextColor="#9CA3AF"
                  value={manualLocation}
                  onChangeText={setManualLocation}
                />
              </>
            )}

            {/* BOTONES DEL MODAL */}
            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                style={styles.modalSecondaryBtn}
                onPress={() => setShowNewEventModal(false)}
              >
                <Text style={styles.modalSecondaryText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalPrimaryBtn}
                onPress={handleSaveNewEvent}
              >
                <Text style={styles.modalPrimaryText}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL: CALENDARIO MENSUAL COMPLETO */}
      {renderMonthPicker()}
    </View>
  );
};

export default AppointmentsScreen;

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
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#ffffffff",
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
  content: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },

  calendarCard: {
    marginTop: 15,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 16,
    elevation: 3,
  },
  calendarHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  calendarHeaderLeft: {
    flex: 1,
    paddingRight: 8,
  },
  calendarTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#263238",
  },
  calendarSubtitle: {
    marginTop: 2,
    fontSize: 12,
    color: "#607D8B",
  },
  calendarMonthPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#E3F2FD",
    maxWidth: 140,
  },
  calendarMonthText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#1E88E5",
  },
  daysStrip: {
    marginTop: 8,
    paddingVertical: 4,
  },
  dayChip: {
    width: 60,
    marginRight: 8,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: "#F5F5F5",
    alignItems: "center",
    justifyContent: "center",
  },
  dayChipSelected: {
    backgroundColor: "#7ed482ff",
  },
  dayWeekText: {
    fontSize: 11,
    color: "#607D8B",
  },
  dayWeekTextSelected: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  dayNumberText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#263238",
  },
  dayNumberTextSelected: {
    color: "#FFFFFF",
  },
  dayDotsRow: {
    flexDirection: "row",
    marginTop: 3,
  },
  dayDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginHorizontal: 1,
  },
  todayBadge: {
    marginTop: 2,
    fontSize: 9,
    color: "#1E88E5",
    fontWeight: "600",
  },

  primaryButton: {
    marginTop: 12,
    alignSelf: "flex-end",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#43A047",
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 13,
    marginLeft: 6,
  },

  eventsHeaderRow: {
    marginTop: 4,
    marginBottom: 6,
  },
  eventsTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#365b6d",
  },

  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 10,
  },
  filterChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginRight: 6,
    marginBottom: 6,
    backgroundColor: "#F5F5F5",
  },
  filterChipSelected: {
    backgroundColor: "#1E88E5",
    borderColor: "#1E88E5",
  },
  filterChipText: {
    fontSize: 11,
    color: "#455A64",
  },
  filterChipTextSelected: {
    color: "#FFFFFF",
    fontWeight: "600",
  },

  placeholderCard: {
    marginTop: 4,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 18,
    alignItems: "center",
    elevation: 2,
    marginBottom: 16,
  },
  placeholderTitle: {
    marginTop: 8,
    fontSize: 15,
    fontWeight: "600",
    color: "#263238",
  },
  placeholderText: {
    marginTop: 4,
    fontSize: 13,
    color: "#607D8B",
    textAlign: "center",
  },

  eventCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    elevation: 2,
  },
  eventTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#263238",
  },
  eventSubtitle: {
    fontSize: 13,
    color: "#607D8B",
  },
  eventDetail: {
    fontSize: 12,
    color: "#90A4AE",
  },
  eventTextDone: {
    color: "#B0BEC5",
    textDecorationLine: "line-through",
  },
  eventMeta: {
    marginLeft: 8,
    alignItems: "flex-end",
  },
  eventIconWrapper: {
    marginTop: 6,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },

  badgeVet: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "#E3F2FD",
  },
  badgeVetText: {
    marginLeft: 4,
    fontSize: 11,
    fontWeight: "600",
    color: "#1E88E5",
  },
  badgeUser: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "#E8F5E9",
  },
  badgeUserText: {
    marginLeft: 4,
    fontSize: 11,
    fontWeight: "600",
    color: "#43A047",
  },

  eventActionsRow: {
    flexDirection: "row",
    marginTop: 6,
  },
  smallIconButton: {
    marginLeft: 4,
  },

  // --- Modal genérico ---
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  modalCard: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
  },
  modalHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#263238",
  },
  modalSubtitle: {
    marginTop: 4,
    fontSize: 12,
    color: "#607D8B",
  },
  modalLabel: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: "600",
    color: "#455A64",
  },
  modalInput: {
    marginTop: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    backgroundColor: "#F9FAFB",
  },
  modalChipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 6,
  },
  modalChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginRight: 6,
    marginBottom: 6,
    backgroundColor: "#F9FAFB",
  },
  modalChipSelected: {
    backgroundColor: "#1E88E5",
    borderColor: "#1E88E5",
  },
  modalChipText: {
    fontSize: 12,
    color: "#455A64",
  },
  modalChipTextSelected: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  modalButtonsRow: {
    marginTop: 14,
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  modalSecondaryBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    marginRight: 8,
  },
  modalSecondaryText: {
    fontSize: 13,
    color: "#607D8B",
  },
  modalPrimaryBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#1E88E5",
  },
  modalPrimaryText: {
    fontSize: 13,
    color: "#FFFFFF",
    fontWeight: "600",
  },

  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  timeInput: {
    width: 48,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 8,
    paddingVertical: 6,
    fontSize: 13,
    backgroundColor: "#F9FAFB",
    textAlign: "center",
  },
  timeColon: {
    marginHorizontal: 4,
    fontSize: 16,
    fontWeight: "700",
    color: "#455A64",
  },
  periodToggle: {
    flexDirection: "row",
    marginLeft: 8,
  },
  periodChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#F9FAFB",
    marginLeft: 4,
  },
  periodChipSelected: {
    backgroundColor: "#1E88E5",
    borderColor: "#1E88E5",
  },
  periodChipText: {
    fontSize: 12,
    color: "#455A64",
  },
  periodChipTextSelected: {
    color: "#FFFFFF",
    fontWeight: "600",
  },

  vetRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  vetSelectedName: {
    fontSize: 13,
    fontWeight: "600",
    color: "#263238",
  },
  vetSelectedAddress: {
    fontSize: 12,
    color: "#607D8B",
  },
  vetClearBtn: {
    marginLeft: 8,
  },
  vetChooseBtn: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    marginTop: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#E3F2FD",
  },

  // --- Calendario mensual grande ---
  monthCard: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
  },
  monthHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  monthNavBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
  },
  monthHeaderText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#263238",
  },
  monthWeekRow: {
    flexDirection: "row",
    marginTop: 10,
  },
  monthWeekLabel: {
    flex: 1,
    textAlign: "center",
    fontSize: 11,
    fontWeight: "600",
    color: "#607D8B",
  },
  monthGrid: {
    marginTop: 8,
    flexDirection: "row",
    flexWrap: "wrap",
  },
  monthDayCell: {
    width: `${100 / 7}%`,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  monthDayCellSelected: {
    backgroundColor: "#1E88E5",
    borderRadius: 999,
  },
  monthDayNumber: {
    fontSize: 14,
    color: "#263238",
  },
  monthDayNumberSelected: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  monthActionsRow: {
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "flex-end",
  },
});
