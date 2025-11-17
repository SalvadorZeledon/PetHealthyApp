// src/services/groqService.js

const API_KEY = "AQUI_VA_TU_API_KEY";
const API_URL = "https://api.groq.com/openai/v1/chat/completions";

export const getAIResponse = async (messages) => {
  try {
    // Convertimos tu estructura a la de Groq
    const formattedMessages = messages.map(msg => ({
      role: msg.sender === "user" ? "user" : "assistant",
      content: msg.text
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
            content: "Eres un asistente virtual veterinario amigable. Responde siempre con claridad pero sin incitar a las personas a automedicar a sus mascotas y recomendar que se vayan a la veterinaria mas cercana."
          },
          ...formattedMessages
        ],
        max_tokens: 350,
        temperature: 0.7,
      }),
    });

    const data = await response.json();
    return data.choices[0].message.content;

  } catch (err) {
    console.log("Error Groq:", err);
    return "Lo siento, ocurrió un problema al conectarme al servicio de IA.";
  }
};
