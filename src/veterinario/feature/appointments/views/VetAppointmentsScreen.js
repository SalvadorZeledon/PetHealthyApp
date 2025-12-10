// src/veterinario/feature/appointments/views/VetAppointmentsScreen.js
import React, { useState, useEffect, useMemo } from "react";
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
  KeyboardAvoidingView,
  ActivityIndicator,
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { getUserFromStorage } from "../../../../shared/utils/storage";
import {
  subscribeVetEvents,
  createVetEvent,
  vetAcceptOwnerProposal,
  vetCompleteEvent,
  vetCancelEvent,
} from "../../../../services/calendarEvents";
import { openOrCreateChatForEvent } from "../../../../services/appointmentChatService";

import {
  collection,
  query,
  where,
  onSnapshot,
  getDoc,
  doc,
  // 👇 IMPORTANTE: Agregamos documentId para filtrar por IDs en tiempo real
  documentId 
} from "firebase/firestore";
import { db } from "../../../../../firebase/config";
import { COL_MASCOTAS } from "../../../../shared/utils/collections";

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

const MINUTE_OPTIONS = [0, 10, 20, 30, 40, 50];

// ---------- Helpers de fecha/hora ----------
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

// mapping de estado
const getStatusInfo = (status, requestedBy) => {
  switch (status) {
    case "PENDIENTE_DUENIO":
      return {
        label: "Pendiente de respuesta del dueño",
        color: "#F9A825",
      };
    case "ACEPTADO":
      return { label: "Cita confirmada", color: "#2E7D32" };
    case "RECHAZADO_DUENIO":
      return { label: "Rechazada por el dueño", color: "#C62828" };
    case "PENDIENTE_REPROGRAMACION":
      if (requestedBy === "OWNER") {
        return {
          label: "Dueño pidió cambio de horario",
          color: "#FB8C00",
        };
      }
      if (requestedBy === "VET") {
        return {
          label: "Propusiste un nuevo horario",
          color: "#1565C0",
        };
      }
      return { label: "Cambio de cita pendiente", color: "#FB8C00" };
    case "COMPLETADO":
      return { label: "Cita realizada", color: "#00897B" };
    case "CANCELADO_VET":
      return { label: "Cancelada por ti", color: "#6D4C41" };
    case "CANCELADO_OWNER":
      return { label: "Cancelada por el dueño", color: "#6D4C41" };
    default:
      return { label: "Sin estado", color: "#607D8B" };
  }
};

const finalStatuses = [
  "COMPLETADO",
  "CANCELADO_VET",
  "CANCELADO_OWNER",
  "RECHAZADO_DUENIO",
];

const VetAppointmentsScreen = ({ navigation }) => {
  const [vetId, setVetId] = useState(null);
  const [vetPhone, setVetPhone] = useState(null);

  const [selectedDateISO, setSelectedDateISO] = useState(null);
  const [daysStrip, setDaysStrip] = useState([]);
  const [filter, setFilter] = useState("all"); // all | citas | meds | actividades

  const [events, setEvents] = useState([]);
  const [eventsLoaded, setEventsLoaded] = useState(false);

  // Pacientes vinculados al vet (para asignar citas)
  const [availablePatients, setAvailablePatients] = useState([]);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [selectedPetMeta, setSelectedPetMeta] = useState(null);
  const [patientSearch, setPatientSearch] = useState("");

  // Modal nueva cita
  const [showNewEventModal, setShowNewEventModal] = useState(false);
  const [eventTitle, setEventTitle] = useState("");
  const [eventCategory, setEventCategory] = useState("vet_appointment"); // vet_appointment | meds

  const [timeHour, setTimeHour] = useState("09");
  const [timeMinute, setTimeMinute] = useState("00");
  const [timePeriod, setTimePeriod] = useState("AM");
  const [timeError, setTimeError] = useState("");

  const [manualNotes, setManualNotes] = useState(""); // notas internas / observaciones

  // Campos extra para medicación
  const [medicationName, setMedicationName] = useState("");
  const [medicationFrequency, setMedicationFrequency] = useState("");
  const [medicationDuration, setMedicationDuration] = useState("");

  // Modal calendario mensual
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [monthCursor, setMonthCursor] = useState(() => new Date());

  // ========================
  //    CARGAR VET + SUSCRIPCIÓN
  // ========================
  useEffect(() => {
    const loadVetId = async () => {
      try {
        const stored = await getUserFromStorage();
        if (!stored || stored.rol !== "veterinario") {
          console.log("No hay sesión de veterinario para el calendario.");
          return;
        }

        const possibleId =
          stored.uid || stored.id || stored.userId || stored.vetId || null;

        if (!possibleId) {
          console.log(
            "No se encontró un ID único del veterinario en la sesión."
          );
        }

        setVetId(possibleId || "VET_DEMO");
        setVetPhone(stored.telefono || stored.phone || null);
      } catch (error) {
        console.log("Error cargando sesión de vet:", error);
      }
    };

    loadVetId();
  }, []);

  // ================================================================
  // CAMBIO PRINCIPAL: Cargar pacientes vinculados EN TIEMPO REAL
  // ================================================================
  useEffect(() => {
    if (!vetId) return;

    let unsubscribeLinks;
    let unsubscribePets; // Variable para manejar la suscripción anidada

    const fetchLinkedPatients = async () => {
      try {
        setLoadingPatients(true);

        // 1. Escuchar la colección de RELACIONES (vet_patients)
        const qLinks = query(
          collection(db, "vet_patients"),
          where("vetId", "==", vetId)
        );

        unsubscribeLinks = onSnapshot(qLinks, (snapshot) => {
          const petIds = snapshot.docs.map((d) => d.data().petId);

          // Limpiar listener de mascotas previo si existía para evitar duplicados
          if (unsubscribePets) {
            unsubscribePets();
            unsubscribePets = null;
          }

          if (petIds.length === 0) {
            setAvailablePatients([]);
            setLoadingPatients(false);
            return;
          }

          // 2. Escuchar la colección de MASCOTAS usando los IDs obtenidos.
          // Usamos 'documentId()' 'in' [ids] para filtrar solo las mascotas relevantes.
          const qPets = query(
            collection(db, COL_MASCOTAS),
            where(documentId(), "in", petIds)
          );

          unsubscribePets = onSnapshot(
            qPets,
            (petsSnapshot) => {
              const petsData = petsSnapshot.docs.map((petDoc) => {
                const data = petDoc.data();
                return {
                  id: petDoc.id,
                  nombre: data.nombre || "Mascota",
                  especie: data.especie || "",
                  ownerId: data.ownerId || data.ownerUID || null,
                  ownerPhone:
                    data.ownerPhone ||
                    data.telefonoDueno ||
                    data.telefono ||
                    null,
                };
              });

              setAvailablePatients(petsData);
              setLoadingPatients(false);
            },
            (error) => {
              console.log("Error cargando datos de mascotas:", error);
              setLoadingPatients(false);
            }
          );
        }, (error) => {
             console.log("Error cargando enlaces de pacientes:", error);
             setLoadingPatients(false);
        });

      } catch (error) {
        console.log("Error inicializando listener de pacientes:", error);
        setLoadingPatients(false);
      }
    };

    fetchLinkedPatients();

    return () => {
      if (unsubscribeLinks) unsubscribeLinks();
      if (unsubscribePets) unsubscribePets();
    };
  }, [vetId]);

  // Suscripción a eventos del vet en Firestore
  useEffect(() => {
    if (!vetId) return;

    const unsubscribe = subscribeVetEvents(vetId, (fireEvents) => {
      const sorted = [...fireEvents].sort((a, b) => {
        if (a.dateISO === b.dateISO) {
          return (
            parseTimeToMinutes(a.time || "00:00 AM") -
            parseTimeToMinutes(b.time || "00:00 AM")
          );
        }
        return (a.dateISO || "").localeCompare(b.dateISO || "");
      });

      const mapped = sorted.map((ev) => {
        const isMedication = ev.type === "MEDICATION";

        return {
          id: ev.id,
          rawType: ev.type,
          type: isMedication ? "meds" : "vet_appointment",
          title: ev.title,
          petName: ev.petName || "",
          time: ev.time || null,
          date: ev.dateISO || null,
          dateISO: ev.dateISO || null,
          location: ev.description || ev.location || null,
          source: "vet",
          status: ev.status || (isMedication ? "ACEPTADO" : "PENDIENTE_DUENIO"),
          requestedBy: ev.requestedBy || null,
          proposedDateISO: ev.proposedDateISO || null,
          proposedTime: ev.proposedTime || null,
          ownerPhone: ev.ownerPhone || null,
          vetPhone: ev.vetPhone || null,
          ownerChangeRequestsCount: ev.ownerChangeRequestsCount || 0,
          ownerId: ev.ownerId || null,
          vetId: ev.vetId || vetId,
          medicationName: ev.medicationName || null,
          medicationFrequency: ev.medicationFrequency || null,
          medicationDuration: ev.medicationDuration || null,
        };
      });

      setEvents(mapped);
      setEventsLoaded(true);
    });

    return () => {
      unsubscribe && unsubscribe();
    };
  }, [vetId]);

  // Inicializar mes actual
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
    if (type === "vet_appointment") {
      return "citas";
    }
    if (type === "meds") return "meds";
    if (type === "walk" || type === "other") return "actividades";
    return "otros";
  };

  // Eventos del vet para el día seleccionado
  const eventsForSelectedDay = useMemo(() => {
    if (!selectedDateISO) return [];
    let list = events.filter(
      (e) => e.date === selectedDateISO && e.source === "vet"
    );
    if (filter !== "all") {
      list = list.filter((e) => mapTypeToFilterCategory(e.type) === filter);
    }
    return list;
  }, [events, selectedDateISO, filter]);

  const getDaySummary = (dateIso) => {
    const list = events.filter((e) => e.date === dateIso && e.source === "vet");
    return {
      hasVet: list.some((e) => e.type === "vet_appointment"),
      hasMeds: list.some((e) => e.type === "meds"),
      hasActivity: list.some((e) => ["walk", "other"].includes(e.type)),
    };
  };

  const handleOpenSettings = () => {
    navigation.navigate("Settings");
  };

  // lista filtrada de pacientes para el selector
  const filteredPatients = useMemo(() => {
    const term = patientSearch.trim().toLowerCase();
    if (!term) return availablePatients;
    return availablePatients.filter((p) =>
      (p.nombre || "").toLowerCase().includes(term)
    );
  }, [availablePatients, patientSearch]);

  const openNewEventModal = () => {
    if (!selectedDateISO) return;

    if (isDateInPast(selectedDateISO)) {
      Alert.alert(
        "Fecha no válida",
        "No puedes crear citas en fechas anteriores a hoy."
      );
      return;
    }

    setEventTitle("");
    setEventCategory("vet_appointment");
    setTimeHour("09");
    setTimeMinute("00");
    setTimePeriod("AM");
    setTimeError("");
    setManualNotes("");
    setMedicationName("");
    setMedicationFrequency("");
    setMedicationDuration("");
    setSelectedPetMeta(null);
    setPatientSearch("");
    setShowNewEventModal(true);
  };

  const handleSaveNewEvent = async () => {
    if (!vetId) {
      Alert.alert(
        "Sesión inválida",
        "No se encontró la sesión del veterinario. Vuelve a iniciar sesión."
      );
      return;
    }

    setTimeError("");

    const trimmedTitle = eventTitle.trim();
    if (!trimmedTitle) {
      Alert.alert(
        "Motivo requerido",
        "Debes indicar el motivo de la cita o control."
      );
      return;
    }

    if (!selectedPetMeta) {
      Alert.alert(
        "Paciente requerido",
        "Debes seleccionar un paciente (mascota) de tu lista."
      );
      return;
    }

    const trimmedPatient = (selectedPetMeta.nombre || "").trim();
    if (!trimmedPatient) {
      Alert.alert(
        "Paciente requerido",
        "Debes seleccionar un paciente válido."
      );
      return;
    }

    const isMedicationEvent = eventCategory === "meds";

    // Si es medicación, validamos campos básicos
    if (isMedicationEvent) {
      if (!medicationName.trim()) {
        Alert.alert(
          "Medicamento requerido",
          "Indica el nombre del medicamento para esta pauta."
        );
        return;
      }
    }

    let timeStr = null;

    // Validaciones de hora SOLO para citas médicas normales
    if (!isMedicationEvent) {
      const h = parseInt(timeHour, 10);
      const m = parseInt(timeMinute, 10);
      if (isNaN(h) || isNaN(m) || h < 1 || h > 12 || m < 0 || m > 59) {
        setTimeError("Hora no válida. Revisa el horario seleccionado.");
        return;
      }

      if (isDateInPast(selectedDateISO)) {
        Alert.alert(
          "Fecha no válida",
          "No puedes crear citas en fechas anteriores a hoy."
        );
        return;
      }

      const todayISO = new Date().toISOString().split("T")[0];
      if (selectedDateISO === todayISO) {
        const now = new Date();
        const nowMinutes = now.getHours() * 60 + now.getMinutes();
        const selectedMinutes = time12hToMinutes(h, m, timePeriod);

        if (selectedMinutes <= nowMinutes) {
          setTimeError("No puedes crear una cita en una hora que ya pasó hoy.");
          return;
        }
      }

      const hh = h.toString().padStart(2, "0");
      const mm = m.toString().padStart(2, "0");
      timeStr = `${hh}:${mm} ${timePeriod}`;
    } else {
      if (isDateInPast(selectedDateISO)) {
        Alert.alert(
          "Fecha no válida",
          "No puedes iniciar un tratamiento en una fecha pasada."
        );
        return;
      }
    }

    try {
      const payload = {
        vetId,
        ownerId: selectedPetMeta.ownerId || null,
        petId: selectedPetMeta.id || selectedPetMeta.petId || null,
        petName: trimmedPatient,

        type: isMedicationEvent ? "MEDICATION" : "APPOINTMENT",
        title: trimmedTitle,
        description: manualNotes.trim() || null,
        dateISO: selectedDateISO,
        time: timeStr,

        medicationName: isMedicationEvent ? medicationName.trim() : null,
        medicationFrequency: isMedicationEvent
          ? medicationFrequency.trim()
          : null,
        medicationDuration: isMedicationEvent
          ? medicationDuration.trim()
          : null,

        ownerPhone: selectedPetMeta.ownerPhone || null,
        vetPhone: vetPhone || null,
      };

      await createVetEvent(payload);
      setShowNewEventModal(false);
    } catch (error) {
      console.log("Error creando evento vet:", error);
      Alert.alert(
        "Error",
        "Ocurrió un problema al guardar la cita. Intenta nuevamente."
      );
    }
  };

  // --------- Acciones del veterinario sobre eventos ---------

  const handleMarkCompleted = async (event) => {
    try {
      await vetCompleteEvent(event.id);
    } catch (error) {
      console.log("Error marcando cita como completada:", error);
      Alert.alert(
        "Error",
        "No se pudo marcar la cita como completada. Intenta nuevamente."
      );
    }
  };

  const handleCancelEvent = (event) => {
    Alert.alert(
      "Cancelar cita",
      `¿Seguro que quieres cancelar la cita "${event.title}"?`,
      [
        { text: "No", style: "cancel" },
        {
          text: "Sí, cancelar",
          style: "destructive",
          onPress: async () => {
            try {
              await vetCancelEvent(event.id);
            } catch (error) {
              console.log("Error cancelando cita:", error);
              Alert.alert(
                "Error",
                "No se pudo cancelar la cita. Intenta nuevamente."
              );
            }
          },
        },
      ]
    );
  };

  const handleAcceptOwnerProposal = async (event) => {
    try {
      await vetAcceptOwnerProposal(event.id);
    } catch (error) {
      console.log("Error aceptando propuesta del dueño:", error);
      Alert.alert(
        "Error",
        "No se pudo aceptar la nueva fecha propuesta por el dueño."
      );
    }
  };

  const handleCallOwner = (event) => {
    if (!event.ownerPhone) {
      Alert.alert(
        "Teléfono no disponible",
        "El número de teléfono del propietario no está registrado en esta cita."
      );
      return;
    }
    Linking.openURL(`tel:${event.ownerPhone}`).catch((err) =>
      console.log("Error abriendo marcador:", err)
    );
  };

  const handleOpenChat = async (event) => {
    try {
      await openOrCreateChatForEvent({
        eventId: event.id,
        ownerId: event.ownerId || null,
        vetId: event.vetId || vetId || null,
      });

      navigation.navigate("AppointmentChat", {
        eventId: event.id,
        fromRole: "VET",
      });
    } catch (error) {
      console.log("Error abriendo chat de cita:", error);
      Alert.alert(
        "Error",
        "No se pudo abrir el chat de la cita. Intenta nuevamente."
      );
    }
  };

  const getEventVisuals = (ev) => {
    if (ev.type === "vet_appointment") {
      return {
        iconName: "medkit-outline",
        iconBg: "#EDE7F6",
        iconColor: "#6A1B9A",
      };
    }
    if (ev.type === "meds") {
      return {
        iconName: "medkit",
        iconBg: "#F3E5F5",
        iconColor: "#8E24AA",
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

  const primaryButtonLabel = "Nuevo evento";

  // -------- helpers hora/minuto --------
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

  // -------- Calendario grande --------
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

  // -------- Render principal --------
  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Calendario de pacientes</Text>

        <TouchableOpacity
          style={styles.iconCircle}
          onPress={handleOpenSettings}
        >
          <Ionicons name="settings-outline" size={20} color="#6A1B9A" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* CARD CALENDARIO */}
        <View style={styles.calendarCard}>
          <View style={styles.calendarHeaderRow}>
            <View style={styles.calendarHeaderLeft}>
              <Text style={styles.calendarTitle}>Citas y controles</Text>
              <Text style={styles.calendarSubtitle}>
                Selecciona un día para ver o crear eventos para tus pacientes.
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
                color="#7B1FA2"
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
            Consejo: asigna horarios realistas y confirma con el propietario
            antes de guardar cambios importantes.
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
                        style={[styles.dayDot, { backgroundColor: "#7B1FA2" }]}
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

        {/* EVENTOS DEL DÍA */}
        <View style={styles.eventsHeaderRow}>
          <Text style={styles.eventsTitle}>
            Citas para el {formattedSelectedDate || "día seleccionado"}
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
            <Ionicons name="time-outline" size={36} color="#7B1FA2" />
            <Text style={styles.placeholderTitle}>Sin eventos este día</Text>
            <Text style={styles.placeholderText}>
              Usa el botón{" "}
              <Text style={{ fontWeight: "700" }}>{primaryButtonLabel}</Text>{" "}
              para asignar un nuevo evento a un paciente.
            </Text>
          </View>
        ) : (
          eventsForSelectedDay.map((ev) => {
            const visuals = getEventVisuals(ev);
            const isDone = ev.status === "COMPLETADO";
            const statusInfo = getStatusInfo(ev.status, ev.requestedBy);
            const overdue = isEventPast(ev.dateISO || ev.date, ev.time);
            const isFinal = finalStatuses.includes(ev.status);

            const cardStyles = [styles.eventCard];
            if (ev.type === "vet_appointment" && overdue && !isFinal) {
              cardStyles.push(styles.eventCardPast);
            }
            if (ev.status === "RECHAZADO_DUENIO") {
              cardStyles.push(styles.eventCardRejected);
            }
            if (
              ev.status === "CANCELADO_VET" ||
              ev.status === "CANCELADO_OWNER"
            ) {
              cardStyles.push(styles.eventCardCancelled);
            }

            // contacto sólo cuando tiene sentido
            const showContact =
              ev.type === "vet_appointment" &&
              (ev.status === "ACEPTADO" ||
                ev.status === "PENDIENTE_REPROGRAMACION" ||
                (overdue && !isFinal));

            // Mostrar botón de llamada SOLO para citas confirmadas (ACEPTADO)
            const showCall =
              ev.type === "vet_appointment" && ev.status === "ACEPTADO";

            return (
              <TouchableOpacity
                key={ev.id}
                style={cardStyles}
                activeOpacity={0.9}
              >
                <View style={{ flex: 1 }}>
                  {/* Badge de estado */}
                  <Text
                    style={[
                      styles.statusBadge,
                      {
                        borderColor: statusInfo.color,
                        color: statusInfo.color,
                      },
                    ]}
                  >
                    {statusInfo.label}
                  </Text>

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
                      ? `Paciente: ${ev.petName} 🐾`
                      : "Paciente sin nombre"}
                  </Text>

                  {ev.type === "meds" && ev.medicationName ? (
                    <Text
                      style={[
                        styles.eventDetail,
                        isDone && styles.eventTextDone,
                      ]}
                    >
                      Medicamento: {ev.medicationName}
                      {ev.medicationFrequency
                        ? ` · ${ev.medicationFrequency}`
                        : ""}
                    </Text>
                  ) : null}

                  <Text
                    style={[styles.eventDetail, isDone && styles.eventTextDone]}
                  >
                    {ev.type === "meds"
                      ? ev.medicationFrequency
                        ? `Pauta: ${ev.medicationFrequency}`
                        : "Pauta según indicación"
                      : `${ev.time || "Sin hora"} · ${
                          ev.location || "Clínica no especificada"
                        }`}
                  </Text>

                  {ev.status === "PENDIENTE_REPROGRAMACION" &&
                    ev.proposedDateISO &&
                    ev.proposedTime && (
                      <Text
                        style={[
                          styles.eventDetail,
                          isDone && styles.eventTextDone,
                        ]}
                      >
                        Cambio solicitado para {ev.proposedDateISO} ·{" "}
                        {ev.proposedTime}
                      </Text>
                    )}

                  {ev.type === "vet_appointment" && overdue && !isFinal && (
                    <Text style={styles.eventPastText}>
                      Esta cita ya pasó. Considera reprogramarla o actualizar su
                      estado.
                    </Text>
                  )}
                </View>

                <View style={styles.eventMeta}>
                  <View className="badgeVet" style={styles.badgeVet}>
                    <Ionicons name="medkit-outline" size={14} color="#7B1FA2" />
                    <Text style={styles.badgeVetText}>Vet</Text>
                  </View>

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

                  {/* Contacto: llamada + chat */}
                  <View style={styles.eventContactRow}>
                    {showCall && ev.ownerPhone && (
                      <TouchableOpacity
                        style={styles.smallIconButton}
                        onPress={() => handleCallOwner(ev)}
                      >
                        <Ionicons
                          name="call-outline"
                          size={18}
                          color="#00796B"
                        />
                      </TouchableOpacity>
                    )}

                    {showContact && (
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
                    )}
                  </View>

                  {/* Acciones sobre la cita */}
                  <View style={styles.eventActionsRow}>
                    {/* Aceptar propuesta de cambio del dueño */}
                    {ev.type === "vet_appointment" &&
                      ev.status === "PENDIENTE_REPROGRAMACION" &&
                      ev.requestedBy === "OWNER" && (
                        <TouchableOpacity
                          style={styles.smallIconButton}
                          onPress={() => handleAcceptOwnerProposal(ev)}
                        >
                          <Ionicons
                            name="checkmark-done-outline"
                            size={18}
                            color="#2E7D32"
                          />
                        </TouchableOpacity>
                      )}

                    {/* Marcar como COMPLETADO */}
                    {ev.type === "vet_appointment" &&
                      ["ACEPTADO", "PENDIENTE_REPROGRAMACION"].includes(
                        ev.status
                      ) && (
                        <TouchableOpacity
                          style={styles.smallIconButton}
                          onPress={() => handleMarkCompleted(ev)}
                        >
                          <Ionicons
                            name="checkmark-circle-outline"
                            size={18}
                            color="#2E7D32"
                          />
                        </TouchableOpacity>
                      )}

                    {/* Cancelar cita */}
                    {ev.type === "vet_appointment" &&
                      [
                        "PENDIENTE_DUENIO",
                        "ACEPTADO",
                        "PENDIENTE_REPROGRAMACION",
                      ].includes(ev.status) && (
                        <TouchableOpacity
                          style={styles.smallIconButton}
                          onPress={() => handleCancelEvent(ev)}
                        >
                          <Ionicons
                            name="trash-outline"
                            size={18}
                            color="#E53935"
                          />
                        </TouchableOpacity>
                      )}
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {/* MODAL: NUEVO EVENTO VET */}
      <Modal
        visible={showNewEventModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowNewEventModal(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View style={styles.modalCard}>
            <ScrollView
              contentContainerStyle={styles.modalScrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={true}
            >
              <View style={styles.modalHeaderRow}>
                <Text style={styles.modalTitle}>Nuevo evento</Text>
              </View>

              <Text style={styles.modalSubtitle}>
                {selectedDateISO
                  ? `Para el ${formattedSelectedDate}`
                  : "Selecciona una fecha en el calendario."}
              </Text>

              {/* PACIENTE */}
              <Text style={styles.modalLabel}>Paciente</Text>
              {loadingPatients ? (
                <ActivityIndicator size="small" color="#7B1FA2" />
              ) : availablePatients.length === 0 ? (
                <Text style={styles.modalHelperText}>
                  Aún no tienes pacientes vinculados. Escanea el código QR de
                  una mascota para agregarla a tu lista.
                </Text>
              ) : (
                <>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="Buscar por nombre..."
                    placeholderTextColor="#9CA3AF"
                    value={patientSearch}
                    onChangeText={setPatientSearch}
                  />

                  <View style={{ height: 180, marginTop: 6 }}>
                    <ScrollView
                      keyboardShouldPersistTaps="handled"
                      nestedScrollEnabled={true}
                      showsVerticalScrollIndicator={true}
                      contentContainerStyle={{ paddingBottom: 8 }}
                    >
                      {filteredPatients.map((pet) => {
                        const selected =
                          selectedPetMeta?.id && selectedPetMeta.id === pet.id;
                        return (
                          <TouchableOpacity
                            key={pet.id}
                            style={[
                              styles.petRow,
                              selected && styles.petRowSelected,
                            ]}
                            onPress={() =>
                              setSelectedPetMeta({
                                ...pet,
                                petId: pet.id,
                              })
                            }
                          >
                            <View style={{ flex: 1 }}>
                              <Text
                                style={[
                                  styles.petRowName,
                                  selected && styles.petRowNameSelected,
                                ]}
                              >
                                {pet.nombre}
                              </Text>
                              {pet.especie ? (
                                <Text
                                  style={[
                                    styles.petRowSub,
                                    selected && styles.petRowSubSelected,
                                  ]}
                                >
                                  {pet.especie}
                                </Text>
                              ) : null}
                            </View>
                            {selected && (
                              <Ionicons
                                name="checkmark-circle"
                                size={18}
                                color="#7B1FA2"
                              />
                            )}
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  </View>
                </>
              )}

              {/* MOTIVO */}
              <Text style={styles.modalLabel}>Motivo del evento</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Ej: Vacuna anual, control postoperatorio..."
                placeholderTextColor="#9CA3AF"
                value={eventTitle}
                onChangeText={setEventTitle}
              />

              {/* CATEGORÍA */}
              <Text style={[styles.modalLabel, { marginTop: 10 }]}>
                Tipo de evento
              </Text>
              <View style={styles.modalChipsRow}>
                {[
                  { value: "vet_appointment", label: "Cita médica" },
                  { value: "meds", label: "Medicación" },
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

              {/* HORA: solo para citas médicas */}
              {eventCategory !== "meds" && (
                <>
                  <Text style={[styles.modalLabel, { marginTop: 10 }]}>
                    Hora
                  </Text>
                  <View style={styles.timeRow}>
                    <View style={styles.timeStepper}>
                      <TouchableOpacity
                        style={styles.timeStepperButton}
                        onPress={decrementHour}
                      >
                        <Ionicons
                          name="chevron-back"
                          size={16}
                          color="#455A64"
                        />
                      </TouchableOpacity>
                      <Text style={styles.timeStepperText}>{timeHour}</Text>
                      <TouchableOpacity
                        style={styles.timeStepperButton}
                        onPress={incrementHour}
                      >
                        <Ionicons
                          name="chevron-forward"
                          size={16}
                          color="#455A64"
                        />
                      </TouchableOpacity>
                    </View>

                    <Text style={styles.timeColon}>:</Text>

                    <View style={styles.timeStepper}>
                      <TouchableOpacity
                        style={styles.timeStepperButton}
                        onPress={decrementMinute}
                      >
                        <Ionicons
                          name="chevron-back"
                          size={16}
                          color="#455A64"
                        />
                      </TouchableOpacity>
                      <Text style={styles.timeStepperText}>{timeMinute}</Text>
                      <TouchableOpacity
                        style={styles.timeStepperButton}
                        onPress={incrementMinute}
                      >
                        <Ionicons
                          name="chevron-forward"
                          size={16}
                          color="#455A64"
                        />
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
                    Nota: ajusta la hora según la agenda de la clínica y
                    confirma con el propietario.
                  </Text>
                </>
              )}

              {/* CAMPOS EXTRA PARA MEDICACIÓN */}
              {eventCategory === "meds" && (
                <>
                  <Text style={[styles.modalLabel, { marginTop: 10 }]}>
                    Nombre del medicamento
                  </Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="Ej: Carprofeno 50mg"
                    placeholderTextColor="#9CA3AF"
                    value={medicationName}
                    onChangeText={setMedicationName}
                  />

                  <Text style={styles.modalLabel}>
                    Frecuencia (cada cuánto)
                  </Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="Ej: 2 veces al día, cada 8 horas..."
                    placeholderTextColor="#9CA3AF"
                    value={medicationFrequency}
                    onChangeText={setMedicationFrequency}
                  />

                  <Text style={styles.modalLabel}>
                    Duración del tratamiento
                  </Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="Ej: 7 días, 1 mes..."
                    placeholderTextColor="#9CA3AF"
                    value={medicationDuration}
                    onChangeText={setMedicationDuration}
                  />
                </>
              )}

              {/* NOTAS INTERNAS / CLÍNICA */}
              <Text style={[styles.modalLabel, { marginTop: 10 }]}>
                Notas internas / indicaciones
              </Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Ej: traer exámenes, ayuno previo, sala 2, etc."
                placeholderTextColor="#9CA3AF"
                value={manualNotes}
                onChangeText={setManualNotes}
                multiline={true}
                numberOfLines={3}
              />

              {/* BOTONES MODAL */}
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
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {renderMonthPicker()}
    </View>
  );
};

export default VetAppointmentsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3E5F5",
    paddingTop: 0,
  },
  header: {
    paddingTop: Platform.OS === "ios" ? 52 : 32,
    paddingHorizontal: 20,
    paddingBottom: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#7B1FA2",
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
    color: "#FFFFFF",
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
    color: "#311B92",
  },
  calendarSubtitle: {
    marginTop: 2,
    fontSize: 12,
    color: "#5E35B1",
  },
  calendarHint: {
    marginTop: 4,
    fontSize: 11,
    color: "#7E57C2",
    flex: 1,
  },
  calendarMonthPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#EDE7F6",
    maxWidth: 160,
  },
  calendarMonthText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#7B1FA2",
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
    backgroundColor: "#7B1FA2",
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
    color: "#7B1FA2",
    fontWeight: "600",
  },
  primaryButton: {
    marginTop: 12,
    alignSelf: "flex-end",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#7B1FA2",
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
    color: "#6A1B9A",
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
    backgroundColor: "#7B1FA2",
    borderColor: "#7B1FA2",
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
    color: "#311B92",
  },
  placeholderText: {
    marginTop: 4,
    fontSize: 13,
    color: "#5E35B1",
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
  eventCardRejected: {
    opacity: 0.7,
  },
  eventCardCancelled: {
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
  eventPastText: {
    marginTop: 4,
    fontSize: 11,
    color: "#E53935",
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
    backgroundColor: "#EDE7F6",
  },
  badgeVetText: {
    marginLeft: 4,
    fontSize: 11,
    fontWeight: "600",
    color: "#7B1FA2",
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
  statusBadge: {
    alignSelf: "flex-start",
    marginTop: 2,
    marginBottom: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    borderWidth: 1,
    fontSize: 11,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  modalScrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    width: "100%",
    paddingVertical: 20,
  },
  modalCard: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    maxHeight: "90%",
  },
  modalHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#311B92",
  },
  modalSubtitle: {
    marginTop: 4,
    fontSize: 12,
    color: "#5E35B1",
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
  modalHelperText: {
    marginTop: 4,
    fontSize: 12,
    color: "#6B7280",
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
    backgroundColor: "#7B1FA2",
    borderColor: "#7B1FA2",
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
    marginBottom: 4,
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
    backgroundColor: "#7B1FA2",
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
    backgroundColor: "#7B1FA2",
    borderColor: "#7B1FA2",
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
    backgroundColor: "#7B1FA2",
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
  // filas de paciente en el modal
  petRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: "#F9FAFB",
    marginBottom: 4,
  },
  petRowSelected: {
    backgroundColor: "#EDE7F6",
  },
  petRowName: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
  },
  petRowNameSelected: {
    color: "#4A148C",
  },
  petRowSub: {
    fontSize: 11,
    color: "#6B7280",
  },
  petRowSubSelected: {
    color: "#7E57C2",
  },
});