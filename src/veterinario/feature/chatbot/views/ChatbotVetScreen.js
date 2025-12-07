// screens/ChatbotVetScreen.js
import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
  TextInput,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getAIResponse } from "../services/groqVetService";

const ChatbotVetScreen = ({ navigation }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const scrollViewRef = useRef();

  // 👇 SUGERENCIAS PENSADAS PARA VETERINARIO
  const SUGGESTIONS = [
    "📋 Abordaje inicial de vómitos crónicos en perro adulto",
    "🦴 Manejo inicial de fractura cerrada en perro",
    "🐱 Enfoque de enfermedad renal crónica en gatos",
    "🧪 ¿Qué exámenes solicitar ante diarrea hemorrágica aguda?",
    "🏥 Manejo y monitoreo en casos de parvovirosis canina",
  ];

  // 👇 En el modo VET ysa no bloqueamos palabras de medicamentos
  const sendMessage = async (textOverride = null) => {
    const textToSend = typeof textOverride === "string" ? textOverride : input;

    if (!textToSend.trim()) return;

    setInput(""); // Limpiamos el input siempre

    // Agregamos el mensaje del usuario
    const newMessages = [...messages, { sender: "user", text: textToSend }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const botResponse = await getAIResponse(newMessages);
      setMessages((prev) => [...prev, { sender: "ai", text: botResponse }]);
    } catch (err) {
      console.log("Error en ChatbotVetScreen:", err);
      Alert.alert(
        "Error",
        "Ocurrió un problema al obtener la respuesta. Intenta de nuevo."
      );
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    Alert.alert(
      "¿Eliminar conversación?",
      "Se eliminarán todos los mensajes del chat actual.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Sí, eliminar",
          style: "destructive",
          onPress: () => setMessages([]),
        },
      ]
    );
  };

  useEffect(() => {
    Alert.alert(
      "¡Bienvenido! 👋",
      "Soy PetHealthyBot en modo profesional veterinario. Puedes hacer consultas clínicas, de cirugía, farmacología y protocolos.\n\nRecuerda: no sustituyo tu criterio ni la valoración presencial del paciente.",
      [{ text: "Entendido", style: "default" }]
    );
  }, []);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior="padding"
      keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
    >
      <View style={styles.container}>
        {/* HEADER */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Chat clínico veterinario</Text>

          <View style={{ flexDirection: "row", gap: 10 }}>
            <TouchableOpacity style={styles.iconCircle} onPress={clearChat}>
              <Ionicons name="trash-outline" size={20} color="#d9534f" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.iconCircle}
              onPress={() => navigation.navigate("Settings")}
            >
              <Ionicons name="settings-outline" size={20} color="#365b6d" />
            </TouchableOpacity>
          </View>
        </View>

        {/* MENSAJES */}
        <ScrollView
          ref={scrollViewRef}
          onContentSizeChange={() =>
            scrollViewRef.current?.scrollToEnd({ animated: true })
          }
          contentContainerStyle={styles.content}
        >
          {/* SUGERENCIAS SOLO SI NO HAY MENSAJES */}
          {messages.length === 0 && (
            <View style={styles.suggestionsContainer}>
              <Text style={styles.suggestionsTitle}>
                ¿Sobre qué caso clínico quieres hablar hoy?
              </Text>
              <View style={styles.chipsWrapper}>
                {SUGGESTIONS.map((suggestion, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.suggestionChip}
                    onPress={() => sendMessage(suggestion)}
                  >
                    <Text style={styles.suggestionText}>{suggestion}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.helperBanner}>
                Uso exclusivo para profesionales veterinarios. Esta herramienta
                es de apoyo y no reemplaza tu criterio clínico.
              </Text>
            </View>
          )}

          {/* MENSAJES DEL CHAT */}
          {messages.map((msg, index) => (
            <View
              key={index}
              style={[
                styles.chatBubble,
                msg.sender === "user" ? styles.userBubble : styles.aiBubble,
              ]}
            >
              <Text style={styles.chatSender}>
                {msg.sender === "user" ? "Tú" : "PetHealthyBot"}
              </Text>
              <Text style={styles.chatText}>{msg.text}</Text>
            </View>
          ))}
        </ScrollView>

        {/* INPUT */}
        <View style={styles.inputContainer}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Describe el caso o tu consulta clínica..."
            style={styles.input}
            multiline
          />

          <TouchableOpacity
            style={styles.sendButton}
            onPress={() => sendMessage()}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Ionicons name="send" size={20} color="white" />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

export default ChatbotVetScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#E3F2FD",
    paddingTop: 0,
  },
  header: {
    paddingTop: Platform.OS === "ios" ? 52 : 32,
    paddingHorizontal: 20,
    paddingBottom: 14,

    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",

    backgroundColor: "#4A85A5",
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,

    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
  },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#ffffffff" },

  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#ffffffff",
    justifyContent: "center",
    alignItems: "center",
    elevation: 3,
  },

  content: { paddingHorizontal: 20, paddingBottom: 24 },

  suggestionsContainer: {
    marginTop: 40,
    alignItems: "center",
    opacity: 0.95,
  },
  suggestionsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#546E7A",
    marginBottom: 20,
    textAlign: "center",
  },
  chipsWrapper: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 10,
  },
  suggestionChip: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#B3E5FC",
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    marginBottom: 6,
  },
  suggestionText: {
    color: "#0277BD",
    fontWeight: "500",
    fontSize: 14,
  },
  helperBanner: {
    marginTop: 16,
    fontSize: 12,
    color: "#455A64",
    textAlign: "center",
  },

  chatBubble: {
    marginTop: 10,
    padding: 12,
    borderRadius: 14,
    maxWidth: "80%",
  },
  aiBubble: { backgroundColor: "#E0F2F1", alignSelf: "flex-start" },
  userBubble: { backgroundColor: "#42A5F5", alignSelf: "flex-end" },

  chatSender: {
    fontSize: 11,
    fontWeight: "600",
    marginBottom: 4,
    color: "#004D40",
  },

  chatText: { fontSize: 14, color: "#004D40" },

  inputContainer: {
    flexDirection: "row",
    padding: 10,
    backgroundColor: "#fff",
    alignItems: "center",
    borderTopWidth: 1,
    borderColor: "#ccc",
  },

  input: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#bbb",
  },

  sendButton: {
    marginLeft: 8,
    backgroundColor: "#00796B",
    padding: 12,
    borderRadius: 50,
  },
});
