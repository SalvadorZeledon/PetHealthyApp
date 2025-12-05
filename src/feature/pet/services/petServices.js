// src/services/petsService.js
import {
  collection,
  addDoc,
  doc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';

import { db } from '../../../../firebase/config';
import { COL_MASCOTAS } from '../../../shared/utils/collections';
import { uploadImageToCloudinary } from '../../../shared/services/cloudinary';

/**
 * Crea el perfil de una mascota y su historial médico inicial.
 * - Sube la foto a Cloudinary (si existe).
 * - Crea doc en la colección "mascotas".
 * - Crea doc "inicial" en la subcolección "historial" de esa mascota.
 *
 * @param {string} userId - ID del usuario dueño de la mascota
 * @param {object} draftPet - Objeto completo armado en RegistroMascota1/2/3
 */
export const createPetWithHistory = async (userId, draftPet) => {
  if (!userId) {
    throw new Error('Usuario no autenticado. Vuelve a iniciar sesión.');
  }

  // 1️⃣ Subir foto a Cloudinary (si hay)
  let fotoUrl = null;
  if (draftPet.imageUri) {
    try {
      fotoUrl = await uploadImageToCloudinary(draftPet.imageUri);
    } catch (error) {
      console.error('Error subiendo imagen de mascota:', error);
      throw new Error('No se pudo subir la foto de tu mascota. Intenta de nuevo.');
    }
  }

  // 2️⃣ Crear PERFIL en colección "mascotas"
  const petProfile = {
    ownerId: userId,
    especie: draftPet.especie || 'perro', // por ahora perro/gato comparten formulario
    nombre: draftPet.nombre,
    sexo: draftPet.sexo,

    tieneMicrochip: draftPet.tieneMicrochip,
    identificadorMicrochip: draftPet.identificadorMicrochip || null,

    poseeTatuaje: draftPet.poseeTatuaje,

    edadValor: draftPet.edadValor,
    edadTipo: draftPet.edadTipo,

    fotoUrl, // URL de Cloudinary (o null)

    activo: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const mascotaRef = await addDoc(collection(db, COL_MASCOTAS), petProfile);
  const mascotaId = mascotaRef.id;

  // 3️⃣ Crear HISTORIAL INICIAL en subcolección "historial"
  const comportamiento = draftPet.comportamiento || {};

  const historialInicial = {
    mascotaId,
    ownerId: userId,
    tipo: 'inicial',

    // --- RegistroMascota2 ---
    vacunas: draftPet.vacunas || [],
    desparacitaciones: draftPet.desparacitaciones || [],
    condicionesMedicas: draftPet.condicionesMedicas || '',
    contextoVivienda: draftPet.contextoVivienda || null,
    frecuenciaPaseo: draftPet.frecuenciaPaseo || null,

    // --- RegistroMascota3 / comportamiento ---
    viveConOtrosAnimales:
      comportamiento.viveConOtrosAnimales ?? false,
    relacionConOtrosAnimales:
      comportamiento.relacionConOtrosAnimales ?? null,
    descripcionConvivencia:
      comportamiento.descripcionConvivencia || '',

    esAgresivo: comportamiento.esAgresivo ?? false,
    descripcionAgresividad:
      comportamiento.descripcionAgresividad || '',

    viajaRegularmente:
      comportamiento.viajaRegularmente ?? false,
    descripcionViajes:
      comportamiento.descripcionViajes || '',

    compromisoVeracidad:
      comportamiento.compromisoVeracidad ?? false,

    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const historialRef = doc(
    collection(db, COL_MASCOTAS, mascotaId, 'historial'),
    'inicial'
  );
  await setDoc(historialRef, historialInicial);

  return {
    mascotaId,
    petProfile,
    historialInicial,
  };
};
