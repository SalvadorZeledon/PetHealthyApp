// src/services/googlePlaces.js
import axios from "axios";

const GOOGLE_API_KEY = "AIzaSyD0u3Td_9NiMMECDfiBBq4X1U3_htUgNa4";

// ---------------------------------------------
// ✔ Obtener veterinarias cercanas
// ---------------------------------------------
export const getNearbyVets = async (lat, lng) => {
  try {
    const url =
      `https://maps.googleapis.com/maps/api/place/nearbysearch/json` +
      `?location=${lat},${lng}` +
      `&rankby=distance` +
      `&type=veterinary_care` +
      `&key=${GOOGLE_API_KEY}`;

    const res = await axios.get(url);
    const { data } = res;

    if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
      console.warn(
        "Google Places nearbysearch returned:",
        data.status,
        data.error_message
      );
      return [];
    }

    // Normalizamos
    return (data.results || []).map((p) => ({
      place_id: p.place_id,
      name: p.name,
      vicinity: p.vicinity || p.formatted_address || "",
      geometry: p.geometry,
      opening_hours: p.opening_hours || null,
      types: p.types || [],
      rating: p.rating || null,
      photos: p.photos || [], // 👈 agregado
    }));
  } catch (err) {
    console.log("getNearbyVets error:", err.message || err);
    return [];
  }
};

// ---------------------------------------------
// ✔ Obtener detalles del lugar
// ---------------------------------------------
export const getPlaceDetails = async (placeId) => {
  try {
    // Campos adicionales incluidos
    const fields = [
      "name",
      "formatted_address",
      "formatted_phone_number",
      "geometry",
      "opening_hours",
      "rating",
      "user_ratings_total",
      "website",
      "photos", // 👈 agregado para fotos de alta calidad
      "url", // 👈 URL oficial de Google Maps
      "place_id",
    ].join(",");

    const url =
      `https://maps.googleapis.com/maps/api/place/details/json` +
      `?place_id=${placeId}` +
      `&fields=${encodeURIComponent(fields)}` +
      `&key=${GOOGLE_API_KEY}`;

    const res = await axios.get(url);
    const { data } = res;

    if (data.status !== "OK") {
      console.warn(
        "Google Places details returned:",
        data.status,
        data.error_message
      );
      return null;
    }

    const p = data.result;

    return {
      place_id: p.place_id,
      name: p.name,
      formatted_address: p.formatted_address,
      formatted_phone_number: p.formatted_phone_number,
      geometry: p.geometry,
      opening_hours: p.opening_hours || null,
      rating: p.rating,
      user_ratings_total: p.user_ratings_total || 0,
      website: p.website || null,
      url: p.url || null, // 👈 Link a Google Maps
      photos: p.photos || [], // 👈 lista de referencias de foto
    };
  } catch (err) {
    console.log("getPlaceDetails error:", err.message || err);
    return null;
  }
};
