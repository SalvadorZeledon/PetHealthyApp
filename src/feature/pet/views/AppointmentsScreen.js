// src/feature/appointments/views/AppointmentsScreen.js
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
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { getUserFromStorage } from "../../../utils/storage";
import {
  subscribeOwnerEvents,
  ownerAcceptEvent,
  ownerRejectEvent,
  ownerHideEvent,
} from "../../../services/calendarEvents";
import { openOrCreateChatForEvent } from "../../../services/appointmentChatService";

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
const MINUTE_OPTIONS = [0, 10, 20, 30, 40, 50];

// ========= HELPERS =========
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

const isDateInPast = (iso) => {
  if (!iso) return false;
  const [y, m, d] = iso.split("-").map((x) => Number(x));
  const date = new Date(y, m - 1, d);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date < today;
};

const time12hToMinutes = (hour12, minute, period) => {
  let h = hour12 % 12;
  if (period === "PM") h += 12;
  return h * 60 + minute;
};

const parseTimeToMinutes = (timeStr) => {
  if (!timeStr) return 0;
  const [hm, period] = timeStr.split(" ");
  const [hStr, mStr] = hm.split(":");
  let h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10) || 0;

  if (period === "PM" && h !== 12) h += 12;
  if (period === "AM" && h === 12) h = 0;

  return h * 60 + m;
};

// evento pasado (fecha + hora, si hay)
const isEventPast = (dateISO, timeStr) => {
  if (!dateISO) return false;
  const [y, m, d] = dateISO.split("-").map(Number);
  const base = new Date(y, m - 1, d);
  base.setSeconds(0);
  base.setMilliseconds(0);

  let h = 23;
  let min = 59;
  if (timeStr) {
    const [hm, period] = timeStr.split(" ");
    const [hh, mm] = hm.split(":").map((n) => parseInt(n, 10));
    h = hh;
    min = mm || 0;
    if (period === "PM" && h !== 12) h += 12;
    if (period === "AM" && h === 12) h = 0;
  }

  base.setHours(h, min, 0, 0);
  return base < new Date();
};

const finalStatuses = [
  "COMPLETADO",
  "CANCELADO_VET",
  "CANCELADO_OWNER",
  "RECHAZADO_DUENIO",
];

// Eventos por defecto (solo para demo local del usuario)
const buildDefaultEvents = () => {
  const today = new Date();
  const todayISO = today.toISOString().split("T")[0];

  return [
    {
      id: "demo1",
      type: "personal_vet_visit",
      title: "Visita al veterinario (personal)",
      petName: "Max",
      time: "10:30 AM",
      date: todayISO,
      location: "Clínica PetHealthy",
      source: "user",
      status: "pending",
      vetPlaceId: null,
    },
  ];
};

const AppointmentsScreen = ({ navigation }) => {
  const route = useRoute();

  const [userRole, setUserRole] = useState("cliente");
  const [ownerId, setOwnerId] = useState(null);

  const [selectedDateISO, setSelectedDateISO] = useState(null);
  const [daysStrip, setDaysStrip] = useState([]);
  const [filter, setFilter] = useState("all"); // all | citas | meds | actividades

  // Eventos personales (locales, en AsyncStorage)
  const [userEvents, setUserEvents] = useState([]);
  const [userEventsLoaded, setUserEventsLoaded] = useState(false);

  // Eventos que vienen del veterinario desde Firestore
  const [vetEvents, setVetEvents] = useState([]);

  // Modal nuevo recordatorio (usuario)
  const [showNewEventModal, setShowNewEventModal] = useState(false);
  const [eventTitle, setEventTitle] = useState("");
  const [eventCategory, setEventCategory] = useState("vet_visit"); // vet_visit | meds | walk | other
  const [timeHour, setTimeHour] = useState("09");
  const [timeMinute, setTimeMinute] = useState("00");
  const [timePeriod, setTimePeriod] = useState("AM");
  const [manualLocation, setManualLocation] = useState("");
  const [selectedVet, setSelectedVet] = useState(null);
  const [timeError, setTimeError] = useState("");

  // Modal calendario mensual
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [monthCursor, setMonthCursor] = useState(() => new Date());

  // ====== Carga de usuario (rol + ownerId) ======
  useEffect(() => {
    const loadUser = async () => {
      try {
        const stored = await getUserFromStorage();
        if (stored?.rol) setUserRole(stored.rol);

        const uid = stored?.uid || stored?.id || stored?.userId || null;
        if (uid) setOwnerId(uid);
        console.log("🧩 Usuario dueño:", stored);
      } catch (err) {
        console.log("Error cargando usuario en AppointmentsScreen:", err);
      }
    };
    loadUser();
  }, []);

  // ====== Cargar eventos personales desde AsyncStorage ======
  useEffect(() => {
    const loadEvents = async () => {
      try {
        const json = await AsyncStorage.getItem(EVENTS_STORAGE_KEY);
        if (json) {
          const parsed = JSON.parse(json);
          if (Array.isArray(parsed)) {
            setUserEvents(parsed);
          } else {
            setUserEvents(buildDefaultEvents());
          }
        } else {
          setUserEvents(buildDefaultEvents());
        }
      } catch (e) {
        console.log("Error cargando eventos:", e);
        setUserEvents(buildDefaultEvents());
      } finally {
        setUserEventsLoaded(true);
      }
    };

    loadEvents();
  }, []);

  // ====== Guardar eventos personales cuando cambian ======
  useEffect(() => {
    if (!userEventsLoaded) return;

    const saveEvents = async () => {
      try {
        await AsyncStorage.setItem(
          EVENTS_STORAGE_KEY,
          JSON.stringify(userEvents)
        );
      } catch (e) {
        console.log("Error guardando eventos:", e);
      }
    };

    saveEvents();
  }, [userEvents, userEventsLoaded]);

  // ====== Suscribirse a eventos del vet en Firestore (para este dueño) ======
  useEffect(() => {
    if (!ownerId) return;

    const unsubscribe = subscribeOwnerEvents(ownerId, (fireEvents) => {
      console.log("🔥 Eventos recibidos de Firestore (owner):", fireEvents);

      const mapped = (fireEvents || [])
        .filter((ev) => ev.visibleToOwner !== false) // por si manejamos basurero en backend
        .map((ev) => {
          const isMedication = ev.type === "MEDICATION";
          return {
            id: ev.id, // ID de Firestore
            type: isMedication ? "meds" : "vet_appointment",
            title:
              ev.title ||
              (isMedication ? "Recordatorio de medicación" : "Cita médica"),
            petName: ev.petName || null,
            time: ev.time || null,
            date: ev.dateISO || null,
            location: ev.description || ev.location || null,
            source: "vet",
            status: ev.status || "PENDIENTE_DUENIO",
            vetPlaceId: ev.vetPlaceId || null,

            // Campos extra para flujos nuevos
            medicationName: ev.medicationName || null,
            medicationFrequency: ev.medicationFrequency || null,
            medicationDuration: ev.medicationDuration || null,

            requestedBy: ev.requestedBy || null,
            proposedDateISO: ev.proposedDateISO || null,
            proposedTime: ev.proposedTime || null,
            ownerChangeRequestsCount: ev.ownerChangeRequestsCount || 0,

            vetPhone: ev.vetPhone || null,
            ownerPhone: ev.ownerPhone || null,
            vetId: ev.vetId || null,
            ownerId: ev.ownerId || ownerId,
          };
        });

      setVetEvents(mapped);
    });

    return () => {
      unsubscribe && unsubscribe();
    };
  }, [ownerId]);

  // ====== Integrar eventos personales + vet ======
  const allEvents = useMemo(
    () => [...userEvents, ...vetEvents],
    [userEvents, vetEvents]
  );

  // ------- Integración con VetMap (modo usuario, local) -------
  useEffect(() => {
    if (!route?.params) return;

    const { selectedVetForEvent, openNewEventFromMap, dateISO } = route.params;

    if (selectedVetForEvent) {
      setSelectedVet({
        placeId: selectedVetForEvent.placeId,
        name: selectedVetForEvent.name,
        address: selectedVetForEvent.address,
      });

      if (dateISO) setSelectedDateISO(dateISO);
      if (openNewEventFromMap) setShowNewEventModal(true);

      navigation.setParams({
        selectedVetForEvent: undefined,
        openNewEventFromMap: undefined,
        dateISO: undefined,
      });
    }
  }, [route?.params, navigation]);

  // ====== Inicializar calendario mes actual ======
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
    let list = allEvents.filter((e) => e.date === selectedDateISO);
    if (filter !== "all") {
      list = list.filter((e) => mapTypeToFilterCategory(e.type) === filter);
    }
    // Ordenar por hora
    return [...list].sort(
      (a, b) =>
        parseTimeToMinutes(a.time || "00:00 AM") -
        parseTimeToMinutes(b.time || "00:00 AM")
    );
  }, [allEvents, selectedDateISO, filter]);

  const getDaySummary = (dateIso) => {
    const list = allEvents.filter((e) => e.date === dateIso);
    return {
      hasVet: list.some((e) =>
        ["personal_vet_visit", "vet_appointment", "vet_visit"].includes(e.type)
      ),
      hasMeds: list.some((e) => e.type === "meds"),
      hasActivity: list.some((e) => ["walk", "other"].includes(e.type)),
    };
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

  const getVetStatusVisuals = (status, requestedBy) => {
    switch (status) {
      case "PENDIENTE_DUENIO":
        return {
          label: "Responde a tu veterinario",
          bg: "#FFF3E0",
          color: "#FB8C00",
        };
      case "ACEPTADO":
        return {
          label: "Cita confirmada",
          bg: "#E8F5E9",
          color: "#43A047",
        };
      case "RECHAZADO_DUENIO":
        return {
          label: "Rechazaste esta cita",
          bg: "#FFEBEE",
          color: "#E53935",
        };
      case "CANCELADO_VET":
        return {
          label: "Cancelada por la clínica",
          bg: "#ECEFF1",
          color: "#546E7A",
        };
      case "CANCELADO_OWNER":
        return {
          label: "Cancelada por ti",
          bg: "#ECEFF1",
          color: "#546E7A",
        };
      case "PENDIENTE_REPROGRAMACION":
        if (requestedBy === "OWNER") {
          return {
            label: "Esperando respuesta del veterinario",
            bg: "#FFF8E1",
            color: "#F9A825",
          };
        }
        if (requestedBy === "VET") {
          return {
            label: "El veterinario propuso nueva fecha",
            bg: "#E3F2FD",
            color: "#1E88E5",
          };
        }
        return {
          label: "Cambio de cita pendiente",
          bg: "#FFF8E1",
          color: "#F9A825",
        };
      case "COMPLETADO":
        return {
          label: "Cita realizada",
          bg: "#E3F2FD",
          color: "#1E88E5",
        };
      default:
        return {
          label: status || "Estado",
          bg: "#ECEFF1",
          color: "#546E7A",
        };
    }
  };

  // ====== Navegación / acciones ======
  const handleOpenSettings = () => {
    navigation.navigate("Settings");
  };

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

  const openNewEventModal = () => {
    if (!selectedDateISO) return;

    if (isDateInPast(selectedDateISO)) {
      Alert.alert(
        "Fecha no válida",
        "No puedes crear recordatorios en fechas anteriores a hoy."
      );
      return;
    }

    // Este calendario es para dueño; el del vet es otra pantalla
    if (userRole === "veterinario") {
      return;
    }

    setEventTitle("");
    setEventCategory("vet_visit");
    setTimeHour("09");
    setTimeMinute("00");
    setTimePeriod("AM");
    setManualLocation("");
    setTimeError("");
    setShowNewEventModal(true);
  };

  const handleSaveNewEvent = () => {
    setTimeError("");

    const trimmedTitle = eventTitle.trim();
    if (!trimmedTitle) return;

    const h = parseInt(timeHour, 10);
    const m = parseInt(timeMinute, 10);
    if (isNaN(h) || isNaN(m) || h < 1 || h > 12 || m < 0 || m > 59) {
      setTimeError("Hora no válida. Revisa el horario seleccionado.");
      return;
    }

    if (isDateInPast(selectedDateISO)) {
      Alert.alert(
        "Fecha no válida",
        "No puedes crear recordatorios en fechas anteriores a hoy."
      );
      return;
    }

    const todayISO = new Date().toISOString().split("T")[0];
    if (selectedDateISO === todayISO) {
      const now = new Date();
      const nowMinutes = now.getHours() * 60 + now.getMinutes();
      const selectedMinutes = time12hToMinutes(h, m, timePeriod);

      if (selectedMinutes <= nowMinutes) {
        setTimeError(
          "No puedes generar un recordatorio en una hora que ya pasó hoy."
        );
        return;
      }
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

    setUserEvents((prev) => [...prev, newEvent]);
    setShowNewEventModal(false);
  };

  const handleToggleDone = (id) => {
    setUserEvents((prev) =>
      prev.map((e) =>
        e.id === id
          ? { ...e, status: e.status === "done" ? "pending" : "done" }
          : e
      )
    );
  };

  const handleDeleteEvent = (id) => {
    const eventToDelete = userEvents.find((e) => e.id === id);

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
            setUserEvents((prev) => prev.filter((e) => e.id !== id));
          },
        },
      ]
    );
  };

  const handleAcceptVetEvent = async (ev) => {
    try {
      await ownerAcceptEvent(ev.id);
    } catch (error) {
      console.log("Error aceptando evento:", error);
      Alert.alert(
        "Error",
        "No se pudo aceptar la cita. Inténtalo nuevamente más tarde."
      );
    }
  };

  const handleRejectVetEvent = (ev) => {
    Alert.alert(
      "Rechazar cita",
      "¿Seguro que quieres rechazar esta cita? El veterinario verá que no puedes asistir.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Rechazar",
          style: "destructive",
          onPress: async () => {
            try {
              await ownerRejectEvent(ev.id);
            } catch (error) {
              console.log("Error rechazando evento:", error);
              Alert.alert(
                "Error",
                "No se pudo rechazar la cita. Inténtalo nuevamente."
              );
            }
          },
        },
      ]
    );
  };

  const handleCallVet = (ev) => {
    if (!ev.vetPhone) {
      Alert.alert(
        "Teléfono no disponible",
        "No tenemos el teléfono de la clínica para esta cita."
      );
      return;
    }
    Linking.openURL(`tel:${ev.vetPhone}`).catch((err) =>
      console.log("Error abriendo marcador:", err)
    );
  };

  const handleOpenChat = async (ev) => {
    try {
      await openOrCreateChatForEvent({
        eventId: ev.id,
        ownerId: ev.ownerId || ownerId,
        vetId: ev.vetId || null,
      });

      navigation.navigate("AppointmentChat", {
        eventId: ev.id,
        fromRole: "OWNER",
      });
    } catch (error) {
      console.log("Error abriendo chat de cita:", error);
      Alert.alert(
        "Error",
        "No se pudo abrir el chat de la cita. Intenta nuevamente."
      );
    }
  };

  const handleHideVetEvent = (ev) => {
    Alert.alert(
      "Eliminar de tu vista",
      "Esta cita ya está rechazada. ¿Querés quitarla de tu calendario?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              await ownerHideEvent(ev.id);
            } catch (error) {
              console.log("Error ocultando evento:", error);
              Alert.alert(
                "Error",
                "No se pudo eliminar la cita de tu vista. Intenta nuevamente."
              );
            }
          },
        },
      ]
    );
  };

  const primaryButtonLabel =
    userRole === "veterinario" ? "Crear cita médica" : "Agregar recordatorio";

  // ====== helpers hora/minuto ======
  const incrementHour = () => {
    setTimeError("");
    setTimeHour((prev) => {
      let n = parseInt(prev || "1", 10);
      if (isNaN(n) || n < 1 || n > 12) n = 1;
      n = n >= 12 ? 1 : n + 1;
      return n.toString().padStart(2, "0");
    });
  };

  const decrementHour = () => {
    setTimeError("");
    setTimeHour((prev) => {
      let n = parseInt(prev || "1", 10);
      if (isNaN(n) || n < 1 || n > 12) n = 1;
      n = n <= 1 ? 12 : n - 1;
      return n.toString().padStart(2, "0");
    });
  };

  const incrementMinute = () => {
    setTimeError("");
    setTimeMinute((prev) => {
      const current = parseInt(prev || "0", 10);
      const idx = MINUTE_OPTIONS.indexOf(current);
      const nextIdx = idx === -1 ? 0 : (idx + 1) % MINUTE_OPTIONS.length;
      return MINUTE_OPTIONS[nextIdx].toString().padStart(2, "0");
    });
  };

  const decrementMinute = () => {
    setTimeError("");
    setTimeMinute((prev) => {
      const current = parseInt(prev || "0", 10);
      const idx = MINUTE_OPTIONS.indexOf(current);
      const prevIdx =
        idx === -1
          ? MINUTE_OPTIONS.length - 1
          : (idx - 1 + MINUTE_OPTIONS.length) % MINUTE_OPTIONS.length;
      return MINUTE_OPTIONS[prevIdx].toString().padStart(2, "0");
    });
  };

  // ====== Calendario mensual grande ======
  const renderMonthPicker = () => {
    if (!showMonthPicker) return null;

    const year = monthCursor.getFullYear();
    const monthIdx = monthCursor.getMonth();
    const monthName = MONTHS[monthIdx];

    const firstWeekday = new Date(year, monthIdx, 1).getDay();
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

  // ====== RENDER ======
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
        {/* CARD CALENDARIO */}
        <View className="calendarCard" style={styles.calendarCard}>
          <View style={styles.calendarHeaderRow}>
            <View style={styles.calendarHeaderLeft}>
              <Text style={styles.calendarTitle}>Tu calendario</Text>
              <Text style={styles.calendarSubtitle}>
                Selecciona un día para ver o agregar recordatorios.
              </Text>
            </View>

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

          <Text style={styles.calendarHint}>
            Consejo: procura seleccionar una veterinaria y horarios correctos.
            Puedes revisar el mapa y el detalle de la clínica antes de guardar
            el recordatorio.
          </Text>

          {/* TIRA DE DÍAS */}
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

          {/* BOTÓN PRINCIPAL (solo usuario) */}
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={openNewEventModal}
          >
            <Ionicons name="add-outline" size={18} color="#FFFFFF" />
            <Text style={styles.primaryButtonText}>{primaryButtonLabel}</Text>
          </TouchableOpacity>
        </View>

        {/* EVENTOS DEL DÍA */}
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
            const vetStatus =
              ev.source === "vet"
                ? getVetStatusVisuals(ev.status, ev.requestedBy)
                : null;

            const overdue =
              ev.source === "vet" &&
              ev.type === "vet_appointment" &&
              isEventPast(ev.date, ev.time);
            const isFinal =
              ev.source === "vet" && finalStatuses.includes(ev.status);

            const cardStyles = [styles.eventCard];
            if (ev.source === "vet" && overdue && !isFinal) {
              cardStyles.push(styles.eventCardPast);
            }
            if (
              ev.source === "vet" &&
              (ev.status === "RECHAZADO_DUENIO" ||
                ev.status === "CANCELADO_VET" ||
                ev.status === "CANCELADO_OWNER")
            ) {
              cardStyles.push(styles.eventCardInactive);
            }

            // 👇 AHORA también muestra contacto en PENDIENTE_DUENIO
            const showContact =
              ev.source === "vet" &&
              ev.type === "vet_appointment" &&
              (ev.status === "ACEPTADO" ||
                ev.status === "PENDIENTE_DUENIO" ||
                ev.status === "PENDIENTE_REPROGRAMACION" ||
                ev.status === "CANCELADO_VET" || // ✅ también mostrar contacto si la clínica canceló
                (overdue && !isFinal));

            const changeCount = ev.ownerChangeRequestsCount || 0;

            return (
              <TouchableOpacity
                key={ev.id}
                style={cardStyles}
                activeOpacity={ev.vetPlaceId && ev.source === "vet" ? 0.9 : 1}
                onPress={
                  ev.vetPlaceId && ev.source === "vet"
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
                    {ev.petName
                      ? `Con ${ev.petName} 🐾`
                      : ev.source === "vet"
                      ? "Cita de tu veterinario"
                      : "Evento"}
                  </Text>
                  <Text
                    style={[styles.eventDetail, isDone && styles.eventTextDone]}
                  >
                    {ev.time || "Hora por definir"} ·{" "}
                    {ev.location || "Sin ubicación definida"}
                  </Text>

                  {/* Detalles de medicación (si vienen desde Firestore) */}
                  {ev.type === "meds" && ev.medicationName && (
                    <Text
                      style={[
                        styles.eventDetail,
                        isDone && styles.eventTextDone,
                      ]}
                    >
                      Medicación: {ev.medicationName}
                    </Text>
                  )}
                  {ev.type === "meds" && ev.medicationFrequency && (
                    <Text
                      style={[
                        styles.eventDetail,
                        isDone && styles.eventTextDone,
                      ]}
                    >
                      Frecuencia: {ev.medicationFrequency}
                    </Text>
                  )}
                  {ev.type === "meds" && ev.medicationDuration && (
                    <Text
                      style={[
                        styles.eventDetail,
                        isDone && styles.eventTextDone,
                      ]}
                    >
                      Duración: {ev.medicationDuration}
                    </Text>
                  )}

                  {/* info de cambio propuesto */}
                  {ev.source === "vet" &&
                    ev.status === "PENDIENTE_REPROGRAMACION" &&
                    ev.proposedDateISO &&
                    ev.proposedTime && (
                      <Text
                        style={[
                          styles.eventDetail,
                          isDone && styles.eventTextDone,
                        ]}
                      >
                        Propuesta: {ev.proposedDateISO} · {ev.proposedTime}
                      </Text>
                    )}

                  {vetStatus && (
                    <View
                      style={[
                        styles.vetStatusPill,
                        {
                          backgroundColor: vetStatus.bg,
                          borderColor: vetStatus.color,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.vetStatusPillText,
                          { color: vetStatus.color },
                        ]}
                      >
                        {vetStatus.label}
                      </Text>
                    </View>
                  )}

                  {ev.source === "vet" &&
                    overdue &&
                    !isFinal &&
                    ev.type === "vet_appointment" && (
                      <Text style={styles.overdueText}>
                        Esta cita ya pasó. Podés hablar con la clínica para
                        reprogramarla.
                      </Text>
                    )}

                  {ev.source === "vet" && changeCount >= 2 && !isFinal && (
                    <Text style={styles.limitText}>
                      Ya realizaste el máximo de cambios. Lo ideal es llamar a
                      la clínica.
                    </Text>
                  )}
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

                  {/* Contacto con la clínica */}
                  {ev.source === "vet" && showContact && (
                    <View style={styles.eventContactRow}>
                      {ev.vetPhone && (
                        <TouchableOpacity
                          style={styles.smallIconButton}
                          onPress={() => handleCallVet(ev)}
                        >
                          <Ionicons
                            name="call-outline"
                            size={18}
                            color="#00796B"
                          />
                        </TouchableOpacity>
                      )}

                      <TouchableOpacity
                        style={styles.smallIconButton}
                        onPress={() => handleOpenChat(ev)}
                      >
                        <Ionicons
                          name="chatbubble-ellipses-outline"
                          size={18}
                          color="#5E35B1"
                        />
                      </TouchableOpacity>
                    </View>
                  )}

                  {/* Acciones según el origen */}
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

                  {ev.source === "vet" && (
                    <>
                      {/* acciones de estado */}
                      <View style={styles.eventActionsRow}>
                        {/* Basurero para citas rechazadas */}
                        {ev.status === "RECHAZADO_DUENIO" && (
                          <TouchableOpacity
                            style={styles.smallIconButton}
                            onPress={() => handleHideVetEvent(ev)}
                          >
                            <Ionicons
                              name="trash-outline"
                              size={18}
                              color="#E53935"
                            />
                          </TouchableOpacity>
                        )}

                        {/* Aceptar / rechazar cuando está pendiente */}
                        {ev.status === "PENDIENTE_DUENIO" && (
                          <>
                            <TouchableOpacity
                              style={styles.smallOutlineButton}
                              onPress={() => handleRejectVetEvent(ev)}
                            >
                              <Text style={styles.smallOutlineButtonText}>
                                Rechazar
                              </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={styles.smallFilledButton}
                              onPress={() => handleAcceptVetEvent(ev)}
                            >
                              <Text style={styles.smallFilledButtonText}>
                                Aceptar
                              </Text>
                            </TouchableOpacity>
                          </>
                        )}

                        {/* Vet propuso nueva fecha */}
                        {ev.status === "PENDIENTE_REPROGRAMACION" &&
                          ev.requestedBy === "VET" && (
                            <>
                              <TouchableOpacity
                                style={styles.smallOutlineButton}
                                onPress={() => handleRejectVetEvent(ev)}
                              >
                                <Text style={styles.smallOutlineButtonText}>
                                  No puedo
                                </Text>
                              </TouchableOpacity>
                              <TouchableOpacity
                                style={styles.smallFilledButton}
                                onPress={() => handleAcceptVetEvent(ev)}
                              >
                                <Text style={styles.smallFilledButtonText}>
                                  Aceptar nueva fecha
                                </Text>
                              </TouchableOpacity>
                            </>
                          )}
                      </View>
                    </>
                  )}
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {/* MODAL NUEVO RECORDATORIO (USUARIO) */}
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
            </View>

            <Text style={styles.modalSubtitle}>
              {selectedDateISO
                ? `Para el ${formattedSelectedDate}`
                : "Selecciona una fecha en el calendario."}
            </Text>

            <Text style={styles.modalLabel}>Título</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Ej: Vacuna anual, Paseo con Max..."
              placeholderTextColor="#9CA3AF"
              value={eventTitle}
              onChangeText={setEventTitle}
            />

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

            <Text style={[styles.modalLabel, { marginTop: 10 }]}>Hora</Text>
            <View style={styles.timeRow}>
              <View style={styles.timeStepper}>
                <TouchableOpacity
                  style={styles.timeStepperButton}
                  onPress={decrementHour}
                >
                  <Ionicons name="chevron-back" size={16} color="#455A64" />
                </TouchableOpacity>
                <Text style={styles.timeStepperText}>{timeHour}</Text>
                <TouchableOpacity
                  style={styles.timeStepperButton}
                  onPress={incrementHour}
                >
                  <Ionicons name="chevron-forward" size={16} color="#455A64" />
                </TouchableOpacity>
              </View>

              <Text style={styles.timeColon}>:</Text>

              <View style={styles.timeStepper}>
                <TouchableOpacity
                  style={styles.timeStepperButton}
                  onPress={decrementMinute}
                >
                  <Ionicons name="chevron-back" size={16} color="#455A64" />
                </TouchableOpacity>
                <Text style={styles.timeStepperText}>{timeMinute}</Text>
                <TouchableOpacity
                  style={styles.timeStepperButton}
                  onPress={incrementMinute}
                >
                  <Ionicons name="chevron-forward" size={16} color="#455A64" />
                </TouchableOpacity>
              </View>

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
                      onPress={() => {
                        setTimeError("");
                        setTimePeriod(p);
                      }}
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

            {timeError ? (
              <Text style={styles.timeErrorText}>{timeError}</Text>
            ) : null}

            <Text style={styles.timeHint}>
              Nota: procura elegir una hora futura y, si es una cita en
              veterinaria, revisa el horario en el mapa antes de guardar el
              recordatorio.
            </Text>

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
  calendarHint: {
    marginTop: 4,
    fontSize: 11,
    color: "#607D8B",
    flex: 1,
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
  eventCardPast: {
    borderWidth: 1,
    borderColor: "#E53935",
    backgroundColor: "#FFEBEE",
  },
  eventCardInactive: {
    opacity: 0.7,
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
  vetStatusPill: {
    marginTop: 8,
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  vetStatusPillText: {
    fontSize: 11,
    fontWeight: "600",
  },
  eventActionsRow: {
    flexDirection: "row",
    marginTop: 6,
  },
  eventContactRow: {
    flexDirection: "row",
    marginTop: 6,
  },
  smallIconButton: {
    marginLeft: 4,
  },
  smallOutlineButton: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#E53935",
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginLeft: 4,
  },
  smallOutlineButtonText: {
    fontSize: 11,
    color: "#E53935",
    fontWeight: "600",
  },
  smallFilledButton: {
    borderRadius: 999,
    backgroundColor: "#1E88E5",
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginLeft: 4,
  },
  smallFilledButtonText: {
    fontSize: 11,
    color: "#FFFFFF",
    fontWeight: "600",
  },
  overdueText: {
    marginTop: 4,
    fontSize: 11,
    color: "#E53935",
  },
  limitText: {
    marginTop: 4,
    fontSize: 11,
    color: "#FB8C00",
  },
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
  timeStepper: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#F9FAFB",
    paddingHorizontal: 4,
    paddingVertical: 4,
    minWidth: 80,
    justifyContent: "space-between",
  },
  timeStepperButton: {
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  timeStepperText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#263238",
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
  timeHint: {
    marginTop: 6,
    fontSize: 11,
    color: "#607D8B",
  },
  timeErrorText: {
    marginTop: 4,
    fontSize: 11,
    color: "#E53935",
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
