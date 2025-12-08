// src/services/appointmentChatService.js
import {
  collection,
  doc,
  setDoc,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  getDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../../firebase/config";

/**
 * Asegura que exista el chat para una cita (appointment_chats/{eventId}).
 * Si no existe, lo crea en estado OPEN.
 *
 * Devuelve el id del chat (igual al eventId).
 */
export const openOrCreateChatForEvent = async ({ eventId, ownerId, vetId }) => {
  if (!eventId) throw new Error("eventId es requerido para el chat.");

  const chatRef = doc(db, "appointment_chats", eventId);
  const snap = await getDoc(chatRef);

  if (!snap.exists()) {
    await setDoc(chatRef, {
      eventId,
      ownerId: ownerId || null,
      vetId: vetId || null,
      status: "OPEN", // OPEN | CLOSED
      createdAt: serverTimestamp(),
      closedAt: null,
    });
  }

  return eventId;
};

/**
 * Obtener datos del chat (para saber ownerId, vetId, status, etc).
 */
export const getChatForEvent = async (eventId) => {
  if (!eventId) throw new Error("eventId es requerido.");

  const chatRef = doc(db, "appointment_chats", eventId);
  const snap = await getDoc(chatRef);

  if (snap.exists()) {
    return {
      id: snap.id,
      ...snap.data(),
    };
  }

  return null;
};

/**
 * Suscripción a los mensajes de un chat de cita.
 * callback recibe un array de mensajes { id, ...data }.
 */
export const subscribeToAppointmentChat = (eventId, callback) => {
  if (!eventId) {
    console.log("subscribeToAppointmentChat: eventId vacío, no se suscribe.");
    return () => {};
  }

  const messagesRef = collection(db, "appointment_chats", eventId, "messages");
  const q = query(messagesRef, orderBy("createdAt", "asc"));

  const unsubscribe = onSnapshot(
    q,
    (snap) => {
      const msgs = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
        // Convertir timestamp de Firebase a objeto legible
        createdAtMs: d.data().createdAt?.toMillis?.() || Date.now(),
      }));
      callback(msgs);
    },
    (error) => {
      console.log("Error en subscribeToAppointmentChat:", error);
      callback([]); // callback vacío en error
    }
  );

  return unsubscribe;
};

/**
 * Suscripción también al documento del chat (para cambios de status, etc).
 */
export const subscribeToAppointmentChatDoc = (eventId, callback) => {
  if (!eventId) {
    console.log("subscribeToAppointmentChatDoc: eventId vacío.");
    return () => {};
  }

  const chatRef = doc(db, "appointment_chats", eventId);

  const unsubscribe = onSnapshot(
    chatRef,
    (snap) => {
      if (snap.exists()) {
        callback({
          id: snap.id,
          ...snap.data(),
        });
      }
    },
    (error) => {
      console.log("Error en subscribeToAppointmentChatDoc:", error);
    }
  );

  return unsubscribe;
};

/**
 * Enviar mensaje en el chat de una cita.
 *
 * senderRole: "OWNER" | "VET"
 * senderId: uid del usuario
 */
export const sendAppointmentChatMessage = async ({
  eventId,
  senderId,
  senderRole,
  text,
}) => {
  if (!eventId) throw new Error("eventId es requerido.");
  if (!text || !text.trim())
    throw new Error("El mensaje no puede estar vacío.");
  if (!senderId) throw new Error("senderId es requerido.");
  if (!senderRole || !["OWNER", "VET"].includes(senderRole)) {
    throw new Error("senderRole debe ser OWNER o VET.");
  }

  // Verificar que el chat existe y está OPEN
  const chatRef = doc(db, "appointment_chats", eventId);
  const chatSnap = await getDoc(chatRef);

  if (!chatSnap.exists()) {
    // Crear rápido si no existía
    await setDoc(chatRef, {
      eventId,
      ownerId: null,
      vetId: null,
      status: "OPEN",
      createdAt: serverTimestamp(),
      closedAt: null,
    });
  } else {
    const chatData = chatSnap.data();
    if (chatData.status === "CLOSED") {
      throw new Error("Este chat está cerrado. No se pueden enviar mensajes.");
    }
  }

  // Agregar el mensaje a la subcolección
  const messagesRef = collection(db, "appointment_chats", eventId, "messages");

  const docRef = await addDoc(messagesRef, {
    text: text.trim(),
    senderId: senderId,
    senderRole: senderRole,
    createdAt: serverTimestamp(),
    read: false, // Opcional: para marcar como leído
  });

  return docRef.id;
};

/**
 * Marcar mensajes como leídos (opcional pero útil).
 */
export const markMessagesAsRead = async (eventId, messageIds) => {
  if (!eventId || !messageIds || messageIds.length === 0) return;

  const messagesRef = collection(db, "appointment_chats", eventId, "messages");

  for (const msgId of messageIds) {
    const msgRef = doc(messagesRef, msgId);
    await updateDoc(msgRef, { read: true });
  }
};

/**
 * Cerrar el chat de una cita (cuando la cita se COMPLETA o CANCELA).
 */
export const closeAppointmentChat = async (eventId) => {
  if (!eventId) return;

  const chatRef = doc(db, "appointment_chats", eventId);
  await setDoc(
    chatRef,
    {
      status: "CLOSED",
      closedAt: serverTimestamp(),
    },
    { merge: true }
  );
};

/**
 * Reabrir un chat cerrado (en caso de que se necesite).
 */
export const reopenAppointmentChat = async (eventId) => {
  if (!eventId) return;

  const chatRef = doc(db, "appointment_chats", eventId);
  await updateDoc(chatRef, {
    status: "OPEN",
    closedAt: null,
  });
};
