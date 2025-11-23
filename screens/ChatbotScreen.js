// screens/ChatbotScreen.js
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
import { getAIResponse } from "../src/services/groqService";

const ChatbotScreen = ({ navigation }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const scrollViewRef = useRef();

  const MEDICATION_KEYWORDS = [
    'medicamento', 'medicina', 'pastilla', 'tableta', 'inyección', 'inyectable',
    'antibiótico', 'analgésico', 'antiinflamatorio', 'dosis', 'mg', 'ml',
    'paracetamol', 'ibuprofeno', 'aspirina', 'penicilina', 'vacuna', 'tratamiento',
    'receta', 'fármaco', 'droga', 'comprimido', 'cápsula', 'jarabe', 'pomada',
    'crema', 'gotas', 'supositorio', 'antiparasitario', 'desparasitante'
  ];

  const containsMedicationKeywords = (text) => {
    const lowerText = text.toLowerCase();
    return MEDICATION_KEYWORDS.some(keyword => lowerText.includes(keyword));
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userText = input.trim();

    if (containsMedicationKeywords(userText)) {
      Alert.alert(
        "⚠️ Consulta importante",
        "Para temas relacionados con medicamentos, debes consultar directamente con un veterinario. Puedo ayudarte con consejos generales de cuidado y bienestar.",
        [{ text: "Entendido", style: "default" }]
      );
      return;
    }

    setInput("");
    const newMessages = [...messages, { sender: "user", text: userText }];
    setMessages(newMessages);
    setLoading(true);

    const botResponse = await getAIResponse(newMessages);
    setMessages(prev => [...prev, { sender: "ai", text: botResponse }]);
    setLoading(false);
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
          onPress: () => setMessages([]) 
        }
      ]
    );
  };

  // 🔹 Ventana emergente al entrar a la pantalla
  useEffect(() => {
    Alert.alert(
      "¡Hola! 👋",
      "Soy PetHealthyBot, tu asistente para consultas de bienestar animal. Puedo darte consejos generales y guiarte con información útil sobre tus mascotas.",
      [{ text: "¡Aceptar!", style: "default" }]
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
          <Text style={styles.headerTitle}>Chat de consultas</Text>

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
            placeholder="Escribe tu consulta..."
            style={styles.input}
            multiline
          />

          <TouchableOpacity
            style={styles.sendButton}
            onPress={sendMessage}
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

export default ChatbotScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#E3F2FD" },

  header: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: Platform.OS === "ios" ? 40 : 0,
  },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#263238" },

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
