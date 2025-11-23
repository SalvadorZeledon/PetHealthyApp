// src/services/googlePlaces.js
import axios from "axios";

const GOOGLE_API_KEY = "AQUI_VA_TU_API_KEY";

/**
 * OBTENER VETERINARIAS CERCANAS
 */
export const getNearbyVets = async (latitude, longitude) => {
  try {
    const response = await axios.get(
      "https://maps.googleapis.com/maps/api/place/nearbysearch/json",
      {
        params: {
          location: `${latitude},${longitude}`,
          radius: 4000,
          keyword: "veterinaria",
          type: "veterinary_care",
          key: GOOGLE_API_KEY,
        },
      }
    );

    return response.data.results;
  } catch (error) {
    console.error("Error obteniendo veterinarias:", error);
    return [];
  }
};

/**
 * OBTENER DETALLES DE UN LUGAR
 */
export const getPlaceDetails = async (placeId) => {
  try {
    const response = await axios.get(
      "https://maps.googleapis.com/maps/api/place/details/json",
      {
        params: {
          place_id: placeId,
          fields:
            "name,formatted_address,formatted_phone_number,geometry,opening_hours,rating,user_ratings_total",
          key: GOOGLE_API_KEY,
        },
      }
    );

    return response.data.result;
  } catch (error) {
    console.error("Error obteniendo detalles:", error);
    return null;
  }
};
