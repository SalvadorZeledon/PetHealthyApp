// src/services/cloudinary.js

const CLOUD_NAME = "ddqr9jtnd";
const UPLOAD_PRESET = "pethealthy_unsigned";

const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;

/**
 * Sube una imagen a Cloudinary y devuelve la URL segura
 * @param {string} uri - URI local de la imagen (de ImagePicker)
 * @returns {Promise<string>} secure_url de la imagen
 */
export const uploadImageToCloudinary = async (uri) => {
  const data = new FormData();

  data.append("file", {
    uri,
    type: "image/jpeg",
    name: "photo.jpg",
  });

  data.append("upload_preset", UPLOAD_PRESET);

  const res = await fetch(CLOUDINARY_URL, {
    method: "POST",
    body: data,
  });

  const json = await res.json();

  if (!res.ok) {
    console.log("Cloudinary error:", json);
    throw new Error(
      json.error?.message || "Error al subir imagen a Cloudinary"
    );
  }

  return json.secure_url;
};
