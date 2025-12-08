import {
  collection,
  addDoc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  updateDoc,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  increment, // IMPORTANTE: agregar este import
} from "firebase/firestore";
import { db } from "../../firebase/config";

import { COL_EVENTOS_CALENDARIO } from "../utils/collections";

/**
 * Estados posibles de una cita (APPOINTMENT):
 *
 * PENDIENTE_DUENIO         -> vet propone, espera respuesta del dueño
 * ACEPTADO                 -> dueño aceptó la cita actual
 * RECHAZADO_DUENIO         -> dueño la rechazó
 * PENDIENTE_REPROGRAMACION -> hay propuesta de cambio (OWNER o VET)
 * COMPLETADO               -> vet marcó como realizada
 * CANCELADO_VET            -> vet canceló
 * CANCELADO_OWNER          -> dueño canceló luego de aceptar
 *
 * Además:
 * - requestedBy: "OWNER" | "VET" | null
 * - proposedDateISO / proposedTime: propuesta de nuevo horario
 * - ownerChangeRequestsCount: cuántas veces el dueño pidió cambio (máx 2)
 * - visibleToOwner / visibleToVet: flags para ocultar en cada lado
 */

// -------------------------------
//  SUSCRIPCIONES
// -------------------------------

/**
 * Suscripción a los eventos del calendario de un veterinario.
 * Llama al callback con una lista de docs { id, ...data } filtrando
 * los que el vet no quiera ver (visibleToVet === false).
 */
export const subscribeVetEvents = (vetId, callback) => {
  if (!vetId) {
    console.log("subscribeVetEvents: vetId vacío, no se suscribe.");
    return () => {};
  }

  const ref = collection(db, COL_EVENTOS_CALENDARIO);
  const q = query(ref, where("vetId", "==", vetId));

  const unsubscribe = onSnapshot(
    q,
    (snap) => {
      const list = snap.docs
        .map((d) => ({
          id: d.id,
          ...d.data(),
        }))
        // ocultar eventos que el vet decidió esconder
        .filter((ev) => ev.visibleToVet !== false);

      callback(list);
    },
    (error) => {
      console.log("Error en subscribeVetEvents:", error);
    }
  );

  return unsubscribe;
};

/**
 * Suscripción a los eventos de un DUEÑO (usuario normal).
 * Filtra los que el dueño haya ocultado (visibleToOwner === false).
 */
export const subscribeOwnerEvents = (ownerId, callback) => {
  if (!ownerId) {
    console.log("subscribeOwnerEvents: ownerId vacío, no se suscribe.");
    return () => {};
  }

  const ref = collection(db, COL_EVENTOS_CALENDARIO);
  const q = query(ref, where("ownerId", "==", ownerId));

  const unsubscribe = onSnapshot(
    q,
    (snap) => {
      const list = snap.docs
        .map((d) => ({
          id: d.id,
          ...d.data(),
        }))
        // ocultar eventos que el dueño decidió esconder
        .filter(
          (ev) =>
            ev.visibleToOwner !== false &&
            (ev.status || "") !== "RECHAZADO_DUENIO"
        );

      callback(list);
    },
    (error) => {
      console.log("Error en subscribeOwnerEvents:", error);
    }
  );

  return unsubscribe;
};

// -------------------------------
//  CREAR EVENTO (Vet crea cita)
// -------------------------------

/**
 * Crear un evento desde el calendario del veterinario.
 *
 * Ahora:
 * - ya NO hay datos quemados
 * - se inicializan todos los nuevos campos de estado
 *
 * Params esperados:
 * {
 *   vetId,
 *   ownerId,
 *   petId,
 *   petName,
 *   type: "APPOINTMENT" | "MEDICATION",
 *   title,
 *   description,
 *   dateISO,  // "YYYY-MM-DD"
 *   time,     // "hh:mm AM/PM" (para citas)
 *
 *   // medicación (opcional)
 *   medicationName,
 *   medicationFrequency,
 *   medicationDuration,
 *
 *   // opcional, si ya los tenés:
 *   ownerPhone,
 *   vetPhone,
 * }
 */
export const createVetEvent = async ({
  vetId,
  ownerId,
  petId,
  petName,
  type,
  title,
  description,
  dateISO,
  time,
  medicationName,
  medicationFrequency,
  medicationDuration,
  ownerPhone = null,
  vetPhone = null,
}) => {
  const ref = collection(db, COL_EVENTOS_CALENDARIO);

  console.log("🩺 createVetEvent payload:", {
    vetId,
    ownerId,
    petId,
    petName,
    type,
    title,
    description,
    dateISO,
    time,
    medicationName,
    medicationFrequency,
    medicationDuration,
    ownerPhone,
    vetPhone,
  });

  const docData = {
    vetId: vetId || null,
    ownerId: ownerId || null,
    petId: petId || null,
    petName: petName || null,

    type, // "APPOINTMENT" | "MEDICATION"

    // 🔹 estado inicial
    status: type === "APPOINTMENT" ? "PENDIENTE_DUENIO" : "ACEPTADO",
    requestedBy: null, // para PENDIENTE_REPROGRAMACION

    // 🔹 datos básicos
    title,
    description: description || null,

    dateISO: dateISO || null,
    time: time || null,

    // 🔹 medicación
    medicationName: medicationName || null,
    medicationFrequency: medicationFrequency || null,
    medicationDuration: medicationDuration || null,

    // 🔹 contacto (opcional)
    ownerPhone: ownerPhone || null,
    vetPhone: vetPhone || null,

    // 🔹 propuesta de cambio de fecha/hora (cuando alguien pida reprogramar)
    proposedDateISO: null,
    proposedTime: null,

    // 🔹 límite de cambios por dueño
    ownerChangeRequestsCount: 0,

    // 🔹 visibilidad en cada lado
    visibleToOwner: true,
    visibleToVet: true,

    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const docRef = await addDoc(ref, docData);
  console.log("✅ Evento creado en calendario con id:", docRef.id);
  return docRef.id;
};

// -------------------------------
//  ACCIONES DEL DUEÑO (OWNER)
// -------------------------------

/**
 * El dueño ACEPTA una cita APPOINTMENT normal
 * (status: PENDIENTE_DUENIO).
 */
export const ownerAcceptEvent = async (eventId) => {
  const ref = doc(db, COL_EVENTOS_CALENDARIO, eventId);
  await updateDoc(ref, {
    status: "ACEPTADO",
    requestedBy: null,
    proposedDateISO: null,
    proposedTime: null,
    ownerDecisionAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
};

/**
 * El dueño RECHAZA una cita propuesta por el vet (PENDIENTE_DUENIO)
 * o una propuesta nueva hecha por el vet (PENDIENTE_REPROGRAMACION, requestedBy="VET").
 */
export const ownerRejectEvent = async (eventId) => {
  const ref = doc(db, COL_EVENTOS_CALENDARIO, eventId);
  await updateDoc(ref, {
    status: "RECHAZADO_DUENIO",
    requestedBy: null,
    proposedDateISO: null,
    proposedTime: null,
    ownerDecisionAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    // ocultar automáticamente para el owner
    visibleToOwner: false,
  });
};

/**
 * El dueño CANCELA una cita previamente aceptada.
 * (Por ejemplo, no podrá ir ese día).
 */
export const ownerCancelEvent = async (eventId) => {
  const ref = doc(db, COL_EVENTOS_CALENDARIO, eventId);
  await updateDoc(ref, {
    status: "CANCELADO_OWNER",
    requestedBy: null,
    proposedDateISO: null,
    proposedTime: null,
    ownerDecisionAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
};

/**
 * El dueño pide CAMBIAR fecha/hora de una cita.
 *
 * - Máximo 2 veces por evento (ownerChangeRequestsCount).
 * - Deja la cita en estado PENDIENTE_REPROGRAMACION con requestedBy="OWNER".
 * - NO cambia aún dateISO/time: esa sigue siendo la fecha "vigente"
 *   hasta que el vet acepte la propuesta.
 *
 * Si se supera el límite, lanza un error con code="OWNER_CHANGE_LIMIT_REACHED".
 */
export const ownerRequestChange = async (eventId, { dateISO, time }) => {
  const ref = doc(db, COL_EVENTOS_CALENDARIO, eventId);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    throw new Error("Evento no encontrado");
  }

  const data = snap.data();
  const currentCount = Number(data.ownerChangeRequestsCount || 0);

  if (currentCount >= 2) {
    const err = new Error(
      "El límite de solicitudes de cambio de horario ha sido alcanzado."
    );
    // para poder detectar en la UI
    err.code = "OWNER_CHANGE_LIMIT_REACHED";
    throw err;
  }

  await updateDoc(ref, {
    status: "PENDIENTE_REPROGRAMACION",
    requestedBy: "OWNER",
    proposedDateISO: dateISO,
    proposedTime: time,
    ownerChangeRequestsCount: currentCount + 1,
    updatedAt: serverTimestamp(),
  });
};

/**
 * El dueño ACEPTA una propuesta de cambio hecha por el VET.
 * (status: PENDIENTE_REPROGRAMACION, requestedBy="VET")
 *
 * Se copian los proposedDateISO/proposedTime a dateISO/time
 * y queda en estado ACEPTADO.
 */
export const ownerAcceptVetProposal = async (eventId) => {
  const ref = doc(db, COL_EVENTOS_CALENDARIO, eventId);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    throw new Error("Evento no encontrado");
  }

  const data = snap.data();
  const { proposedDateISO, proposedTime } = data;

  if (!proposedDateISO || !proposedTime) {
    throw new Error("No hay propuesta de fecha/hora del veterinario.");
  }

  await updateDoc(ref, {
    dateISO: proposedDateISO,
    time: proposedTime,
    proposedDateISO: null,
    proposedTime: null,
    status: "ACEPTADO",
    requestedBy: null,
    ownerDecisionAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
};

/**
 * El DUEÑO propone una nueva fecha/hora para una cita
 */
export const ownerRequestRescheduleEvent = async (
  eventId,
  proposedDateISO,
  proposedTime
) => {
  if (!eventId || !proposedDateISO || !proposedTime) {
    throw new Error("eventId, proposedDateISO y proposedTime son requeridos.");
  }

  try {
    console.log("📤 Enviando propuesta de cambio:", {
      eventId,
      proposedDateISO,
      proposedTime,
    });

    const eventRef = doc(db, "calendar_events", eventId);

    await updateDoc(eventRef, {
      status: "PENDIENTE_REPROGRAMACION",
      requestedBy: "OWNER",
      proposedDateISO: proposedDateISO,
      proposedTime: proposedTime,
      ownerChangeRequestsCount: increment(1), // Incrementa el contador
      updatedAt: serverTimestamp(),
    });

    console.log("✅ Propuesta de cambio enviada exitosamente");
    return eventId;
  } catch (error) {
    console.error("❌ Error en ownerRequestRescheduleEvent:", error);
    throw new Error(
      error.message ||
        "No se pudo enviar la propuesta de cambio. Verifica tu conexión."
    );
  }
};

// -------------------------------
//  ACCIONES DEL VETERINARIO (VET)
// -------------------------------

/**
 * Vet reprograma una cita proponiendo NUEVA fecha/hora.
 *
 * - No pisa aún la fecha/hora actual, solo llena proposedDateISO/proposedTime.
 * - status: PENDIENTE_REPROGRAMACION
 * - requestedBy: "VET"
 *
 * El dueño luego podrá:
 *  - aceptar esa propuesta (ownerAcceptVetProposal)
 *  - o rechazarla (ownerRejectEvent)
 */
export const vetProposeNewDateTime = async (eventId, { dateISO, time }) => {
  const ref = doc(db, COL_EVENTOS_CALENDARIO, eventId);
  await updateDoc(ref, {
    status: "PENDIENTE_REPROGRAMACION",
    requestedBy: "VET",
    proposedDateISO: dateISO,
    proposedTime: time,
    updatedAt: serverTimestamp(),
  });
};

/**
 * Vet acepta la propuesta de cambio que envió el OWNER
 * (status: PENDIENTE_REPROGRAMACION, requestedBy="OWNER").
 *
 * - Copia proposedDateISO/proposedTime a dateISO/time
 * - Limpia campos de propuesta
 * - Deja la cita como ACEPTADO (ya acordada).
 */
export const vetAcceptOwnerProposal = async (eventId) => {
  const ref = doc(db, COL_EVENTOS_CALENDARIO, eventId);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    throw new Error("Evento no encontrado");
  }

  const data = snap.data();
  const { proposedDateISO, proposedTime } = data;

  if (!proposedDateISO || !proposedTime) {
    throw new Error("No hay propuesta de cambio desde el dueño.");
  }

  await updateDoc(ref, {
    dateISO: proposedDateISO,
    time: proposedTime,
    proposedDateISO: null,
    proposedTime: null,
    status: "ACEPTADO",
    requestedBy: null,
    updatedAt: serverTimestamp(),
  });
};

/**
 * Vet marca una cita como COMPLETADA.
 *
 * IMPORTANTE: en la screen del vet, cuando llames a esto,
 * también deberías cerrar el chat de la cita (con el servicio de chat).
 */
export const vetCompleteEvent = async (eventId) => {
  const ref = doc(db, COL_EVENTOS_CALENDARIO, eventId);
  await updateDoc(ref, {
    status: "COMPLETADO",
    requestedBy: null,
    updatedAt: serverTimestamp(),
  });
};

/**
 * Vet cancela la cita.
 */
export const vetCancelEvent = async (eventId) => {
  const ref = doc(db, COL_EVENTOS_CALENDARIO, eventId);
  await updateDoc(ref, {
    status: "CANCELADO_VET",
    requestedBy: null,
    updatedAt: serverTimestamp(),
  });
};

// -------------------------------
//  VISIBILIDAD (basurero)
// -------------------------------

/**
 * El dueño oculta el evento de su lista (basurero del lado usuario).
 * No borra nada en Firestore, solo lo saca de su vista.
 */
export const hideEventForOwner = async (eventId) => {
  const ref = doc(db, COL_EVENTOS_CALENDARIO, eventId);
  await updateDoc(ref, {
    visibleToOwner: false,
    updatedAt: serverTimestamp(),
  });
};

/**
 * El vet oculta el evento de su lista (si querés usarlo).
 */
export const hideEventForVet = async (eventId) => {
  const ref = doc(db, COL_EVENTOS_CALENDARIO, eventId);
  await updateDoc(ref, {
    visibleToVet: false,
    updatedAt: serverTimestamp(),
  });
};

/**
 * Ocultar un evento solo para la vista del dueño (visibleToOwner = false).
 * Devuelve el eventId si se ocultó, o null si el documento no existe.
 */
export const ownerHideEvent = async (eventId) => {
  if (!eventId) throw new Error("ownerHideEvent: eventId es requerido.");

  try {
    const eventRef = doc(db, "calendar_events", eventId);
    const snap = await getDoc(eventRef);

    if (!snap.exists()) {
      console.log("ownerHideEvent: documento no encontrado:", eventId);
      // Resolver sin lanzar para que la UI pueda seguir (ya estaba "oculto" en backend)
      return null;
    }

    await updateDoc(eventRef, {
      visibleToOwner: false,
      updatedAt: serverTimestamp(),
    });

    console.log("ownerHideEvent: evento ocultado para owner:", eventId);
    return eventId;
  } catch (error) {
    console.error("Error en ownerHideEvent:", error);
    throw error;
  }
};

// -------------------------------
//  HELPERS PUROS (sin Firestore)
// -------------------------------

/**
 * Devuelve true si la cita está en el pasado (fecha + hora).
 * dateISO: "YYYY-MM-DD"
 * time: "hh:mm AM/PM" (puede ser null -> se considera 00:00)
 */
export const isEventPast = (dateISO, time) => {
  if (!dateISO) return false;

  const [y, m, d] = dateISO.split("-").map((x) => parseInt(x, 10));
  if (!y || !m || !d) return false;

  let hours = 0;
  let minutes = 0;

  if (time) {
    const [hm, period] = time.split(" ");
    const [hStr, mStr] = hm.split(":");
    let h = parseInt(hStr, 10);
    const mm = parseInt(mStr, 10) || 0;

    if (period === "PM" && h !== 12) h += 12;
    if (period === "AM" && h === 12) h = 0;

    hours = h;
    minutes = mm;
  }

  const eventDate = new Date(y, m - 1, d, hours, minutes, 0, 0);
  const now = new Date();

  return eventDate.getTime() < now.getTime();
};

/**
 * Reglas para habilitar teléfono / chat del lado del DUEÑO:
 *
 * - NO se puede contactar si la cita está en un estado final:
 *   COMPLETADO / CANCELADO_VET / CANCELADO_OWNER / RECHAZADO_DUENIO
 * - Se puede contactar si:
 *   - la cita está ACEPTADO (independientemente de fecha), o
 *   - la cita está en el pasado pero aún no fue cerrada (para reprogramar).
 */
export const canOwnerContactForAppointment = (event) => {
  const finalStatuses = [
    "COMPLETADO",
    "CANCELADO_VET",
    "CANCELADO_OWNER",
    "RECHAZADO_DUENIO",
  ];

  if (!event || finalStatuses.includes(event.status)) {
    return false;
  }

  const inPast = isEventPast(event.dateISO, event.time);

  if (event.status === "ACEPTADO") {
    return true; // siempre puede ver teléfono/chat mientras esté aceptada
  }

  // si está en el pasado y todavía no está cerrada, permitir contacto
  if (
    inPast &&
    event.status !== "CANCELADO_OWNER" &&
    event.status !== "CANCELADO_VET"
  ) {
    return true;
  }

  return false;
};
