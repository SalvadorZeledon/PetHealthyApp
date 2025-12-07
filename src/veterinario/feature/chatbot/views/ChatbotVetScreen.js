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

  const SUGGESTIONS = [
    "📋 Abordaje inicial de vómitos crónicos en perro adulto",
    "🦴 Manejo inicial de fractura cerrada en perro",
    "🐱 Enfoque de enfermedad renal crónica en gatos",
    "🧪 ¿Qué exámenes solicitar ante diarrea hemorrágica aguda?",
    "🏥 Manejo y monitoreo en casos de parvovirosis canina",
  ];

  const sendMessage = async (textOverride = null) => {
    const textToSend = typeof textOverride === "string" ? textOverride : input;

    if (!textToSend.trim()) return;

    setInput("");

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
              <Ionicons name="trash-outline" size={20} color="#D32F2F" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.iconCircle}
              onPress={() => navigation.navigate("Settings")}
            >
              <Ionicons name="settings-outline" size={20} color="#6A1B9A" />
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
            placeholderTextColor="#9CA3AF"
            style={styles.input}
            multiline
          />

          <TouchableOpacity
            style={styles.sendButton}
            onPress={() => sendMessage()}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Ionicons name="send" size={20} color="#FFFFFF" />
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
    backgroundColor: "#F3E5F5",
    paddingTop: 0,
  },
  header: {
    paddingTop: Platform.OS === "ios" ? 52 : 32,
    paddingHorizontal: 20,
    paddingBottom: 14,

    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",

    backgroundColor: "#7B1FA2",
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,

    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    elevation: 3,
  },

  content: { paddingHorizontal: 20, paddingBottom: 24 },

  suggestionsContainer: {
    marginTop: 40,
    alignItems: "center",
    opacity: 0.98,
  },
  suggestionsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#5E35B1",
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
    borderColor: "#D1C4E9",
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    marginBottom: 6,
  },
  suggestionText: {
    color: "#7B1FA2",
    fontWeight: "500",
    fontSize: 14,
  },
  helperBanner: {
    marginTop: 16,
    fontSize: 12,
    color: "#6A1B9A",
    textAlign: "center",
  },

  chatBubble: {
    marginTop: 10,
    padding: 12,
    borderRadius: 14,
    maxWidth: "80%",
  },
  aiBubble: {
    backgroundColor: "#EDE7F6",
    alignSelf: "flex-start",
  },
  userBubble: {
    backgroundColor: "#7B1FA2",
    alignSelf: "flex-end",
  },

  chatSender: {
    fontSize: 11,
    fontWeight: "600",
    marginBottom: 4,
    color: "#4527A0",
  },

  chatText: {
    fontSize: 14,
    color: "#311B92",
  },

  inputContainer: {
    flexDirection: "row",
    padding: 10,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    borderTopWidth: 1,
    borderColor: "#E0E0E0",
  },

  input: {
    flex: 1,
    backgroundColor: "#FAFAFA",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#D1C4E9",
    fontSize: 14,
    color: "#263238",
  },

  sendButton: {
    marginLeft: 8,
    backgroundColor: "#7B1FA2",
    padding: 12,
    borderRadius: 50,
  },
});
