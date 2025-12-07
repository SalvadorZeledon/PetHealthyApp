// src/services/groqService.js

const API_KEY = " tu_api_key_aqui"; // Reemplaza con tu clave de API de Groq
const API_URL = "https://api.groq.com/openai/v1/chat/completions";

// Sistema de restricciones veterinarias
const VETERINARY_RESTRICTIONS = `
IMPORTANTE: Eres un asistente virtual veterinario llamado PetHealthyBot para una aplicación móvil. DEBES SEGUIR ESTRICTAMENTE estas reglas:

PROHIBIDO ABSOLUTAMENTE:
- No sugerir, recomendar o mencionar nombres de medicamentos específicos
- No indicar dosis de ningún tipo de medicamento
- No diagnosticar enfermedades o condiciones médicas específicas
- No recomendar tratamientos farmacológicos
- No sugerir remedios caseros que involucren sustancias medicinales
- No brindar consejos que puedan reemplazar la consulta veterinaria profesional
- No respondas a preguntas sobre tematicas externas a la salud y bienestar animal
- 
PERMITIDO:
- Ofrecer consejos generales de cuidado y bienestar animal y puedes recomendar suplementos alimenticios y vitaminas 
- Sugerir cuándo es necesario visitar al veterinario
- Explicar síntomas comunes SIN diagnosticar
- Brindar información sobre cuidados preventivos como desparasitantes generales o tratamiento para los acaros y garrapatas
- Recomendar primeros auxilios básicos (sin medicamentos)
- Orientar sobre alimentación, ejercicio y hábitos saludables
- Informar sobre señales de alerta que requieren atención veterinaria

RESPUESTAS OBLIGATORIAS para consultas sobre medicamentos:
- "No puedo recomendar medicamentos. Es fundamental consultar con un veterinario para un diagnóstico y tratamiento adecuado."
- "La automedicación puede ser peligrosa para tu mascota. Te sugiero visitar al veterinario para una evaluación profesional."
- "Para temas de medicamentos necesitas prescripción veterinaria. Puedo ayudarte con consejos generales de cuidado."

Tu tono debe ser amigable pero profesional, siempre priorizando la seguridad de las mascotas.
No fomentes de ninguana manera la automedicación o el uso inapropiado de medicamentos.
No fomentes las malas practicas de cuidado animal.
`;

export const getAIResponse = async (messages) => {
  try {
    // Convertimos tu estructura a la de Groq
    const formattedMessages = messages.map((msg) => ({
      role: msg.sender === "user" ? "user" : "assistant",
      content: msg.text,
    }));

    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          {
            role: "system",
            content: VETERINARY_RESTRICTIONS,
          },
          ...formattedMessages,
        ],
        max_tokens: 350,
        temperature: 0.3, // Reducida para respuestas más conservadoras
      }),
    });

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (err) {
    console.log("Error Groq:", err);
    return "Lo siento, ocurrió un problema al conectarme al servicio de IA.";
  }
};
