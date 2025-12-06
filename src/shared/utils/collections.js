// src/utils/collections.js

// Colecciones globales de Firestore
export const COL_USUARIOS = 'usuarios';
export const COL_MASCOTAS = 'mascotas';

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
