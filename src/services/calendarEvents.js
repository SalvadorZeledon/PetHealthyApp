// src/services/calendarEvents.js
import {
  collection,
  addDoc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  updateDoc,
  doc,
} from "firebase/firestore";
import { db } from "../../firebase/config"; // ajusta ruta si tu config está en otro lado
import { COL_EVENTOS_CALENDARIO } from "../utils/collections"; // o "../shared/utils/collections"

/**
 * Suscripción a los eventos del calendario de un veterinario.
 * Llama al callback con una lista de docs { id, ...data }.
 */
export const subscribeVetEvents = (vetId, callback) => {
  if (!vetId) {
    console.log("subscribeVetEvents: vetId vacío, no se suscribe.");
    return () => {};
  }

  const ref = collection(db, COL_EVENTOS_CALENDARIO);

  // Solo filtramos por vetId. El orden lo haremos en el cliente
  const q = query(ref, where("vetId", "==", vetId));

  const unsubscribe = onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));
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
      const list = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));
      callback(list);
    },
    (error) => {
      console.log("Error en subscribeOwnerEvents:", error);
    }
  );

  return unsubscribe;
};

/**
 * Crear un evento desde el calendario del veterinario.
 * Más adelante usaremos ownerId y petId reales.
 */
export const createVetEvent = async ({
  vetId,
  ownerId,
  petId,
  petName,
  type, // "APPOINTMENT" | "MEDICATION"
  title,
  description,
  dateISO,
  time,
  medicationName,
  medicationFrequency,
  medicationDuration,
}) => {
  const ref = collection(db, COL_EVENTOS_CALENDARIO);

  const docData = {
    vetId: "U21rGFImygciJNBGCqLZ",

    ownerId: "9pK5RlLaQyYIfmXfxsK0U1sBMCV2",
    petId: petId || null,
    petName: petName || null,

    type, // "APPOINTMENT" | "MEDICATION"
    status: "PENDIENTE_DUENIO",

    title,
    description: description || null,
    dateISO: "2025-12-07",
    time: "11:00 AM",

    medicationName: medicationName || null,
    medicationFrequency: medicationFrequency || null,
    medicationDuration: medicationDuration || null,

    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const docRef = await addDoc(ref, docData);
  return docRef.id;
};

/**
 * El dueño ACEPTA una cita propuesta por el vet.
 */
export const ownerAcceptEvent = async (eventId) => {
  const ref = doc(db, COL_EVENTOS_CALENDARIO, eventId);
  await updateDoc(ref, {
    status: "ACEPTADO",
    ownerDecisionAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
};

/**
 * El dueño RECHAZA una cita propuesta por el vet.
 */
export const ownerRejectEvent = async (eventId) => {
  const ref = doc(db, COL_EVENTOS_CALENDARIO, eventId);
  await updateDoc(ref, {
    status: "RECHAZADO_DUENIO",
    ownerDecisionAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
};
