// src/utils/collections.js
// o src/shared/utils/collections.js si lo tienes ahí

// Colecciones globales de Firestore
export const COL_USUARIOS = "usuarios";
export const COL_MASCOTAS = "mascotas";
export const COL_VETERINARIOS = "veterinarios";

// 👉 NUEVA colección para los eventos del calendario
export const COL_EVENTOS_CALENDARIO = "calendarEvents";

// Si luego quieres derivar nombres personalizados por usuario:
export function getUserCollections(userId) {
  if (!userId) {
    return {};
  }

  const prefix = userId.trim().toLowerCase();

  return {
    // ejemplo futuro:
    // COL_MIS_MASCOTAS: `${prefix}-mascotas`,
  };
}
