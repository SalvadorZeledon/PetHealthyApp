// src/feature/auth/services/vetAuthService.js
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../../../firebase/config";
import { COL_VETERINARIOS } from "../../../shared/utils/collections";
import { saveUserToStorage } from "../../../shared/utils/storage";

export const loginVeterinario = async (juntaNumber, password) => {
  const juntaLimpia = juntaNumber.trim();

  const vetsRef = collection(db, COL_VETERINARIOS);
  const q = query(
    vetsRef,
    where("juntanumber", "==", juntaLimpia), // ojo: mismo nombre que en Firestore
    where("password", "==", password)
  );

  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    const error = new Error("CREDENCIALES_INVALIDAS");
    throw error;
  }

  const doc = snapshot.docs[0];
  const data = doc.data();

  if (data.activo === false) {
    const error = new Error("CUENTA_INACTIVA");
    throw error;
  }

  const vet = {
    id: doc.id,
    juntaNumber: data.juntanumber,
    fullName: data.fullname,
    clinic: data.clinic,
    phone: data.phone,
    city: data.city,
    email: data.email,
    rol: data.rol || "veterinario",
    activo: data.activo !== false,
  };

  // Guardamos en AsyncStorage reutilizando la misma utilidad
  await saveUserToStorage({
    ...vet,
    isVet: true, // banderita extra por si luego quieres diferenciar rápido
  });

  return vet;
};
