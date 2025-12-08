// src/feature/chat/views/AppointmentChatScreen.js
import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  TextInput,
  Platform,
  KeyboardAvoidingView,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getUserFromStorage } from "../../../shared/utils/storage";
import {
  openOrCreateChatForEvent,
  subscribeToAppointmentChat,
  subscribeToAppointmentChatDoc,
  sendAppointmentChatMessage,
  getChatForEvent,
} from "../../../services/appointmentChatService";

const AppointmentChatScreen = ({ navigation, route }) => {
  const { eventId, fromRole } = route.params || {};
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState([]);
  const [chatDoc, setChatDoc] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [currentRole, setCurrentRole] = useState(fromRole || "VET");
  const [messageText, setMessageText] = useState("");
  const [sending, setSending] = useState(false);
  const flatListRef = useRef(null);

  // Cargar usuario actual
  useEffect(() => {
    const loadUser = async () => {
      try {
        const stored = await getUserFromStorage();
        setCurrentUserId(stored?.uid || stored?.id || stored?.userId || null);
        setCurrentRole(stored?.rol === "veterinario" ? "VET" : "OWNER");
      } catch (err) {
        console.log("Error cargando usuario:", err);
      }
    };
    loadUser();
  }, []);

  // Inicializar chat + suscripciones
  useEffect(() => {
    if (!eventId || !currentUserId) return;

    (async () => {
      try {
        // Crear/abrir el chat
        await openOrCreateChatForEvent({
          eventId,
          ownerId: currentRole === "OWNER" ? currentUserId : null,
          vetId: currentRole === "VET" ? currentUserId : null,
        });

        // Obtener datos del chat
        const chat = await getChatForEvent(eventId);
        setChatDoc(chat);

        // Suscribirse a cambios del documento chat
        const unsubChat = subscribeToAppointmentChatDoc(eventId, (chatData) => {
          setChatDoc(chatData);
        });

        // Suscribirse a los mensajes
        const unsubMessages = subscribeToAppointmentChat(eventId, (msgs) => {
          setMessages(msgs);
          setLoading(false);
        });

        return () => {
          unsubChat();
          unsubMessages();
        };
      } catch (err) {
        console.log("AppointmentChat init error:", err);
        Alert.alert("Error", "No se pudo abrir el chat.");
        setLoading(false);
      }
    })();
  }, [eventId, currentUserId, currentRole]);

  // Auto-scroll al último mensaje
  useEffect(() => {
    if (messages.length > 0) {
      flatListRef.current?.scrollToEnd({ animated: true });
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!messageText.trim() || !currentUserId || !eventId) return;

    setSending(true);
    try {
      await sendAppointmentChatMessage({
        eventId,
        senderId: currentUserId,
        senderRole: currentRole,
        text: messageText,
      });
      setMessageText("");
    } catch (err) {
      console.log("Error enviando mensaje:", err);
      Alert.alert("Error", err.message || "No se pudo enviar el mensaje.");
    } finally {
      setSending(false);
    }
  };

  const renderMessage = ({ item }) => {
    const isOwn = item.senderId === currentUserId;
    const bubbleStyle = isOwn ? styles.bubbleOwn : styles.bubbleOther;
    const bubbleBg = isOwn ? "#7B1FA2" : "#E5E7EB";
    const textColor = isOwn ? "#FFFFFF" : "#263238";

    // Formato de hora
    const time =
      item.createdAtMs && !isNaN(item.createdAtMs)
        ? new Date(item.createdAtMs).toLocaleTimeString("es-AR", {
            hour: "2-digit",
            minute: "2-digit",
          })
        : "...";
    const roleBadge = `(${item.senderRole || "?"})`;

    return (
      <View style={[styles.messageRow, isOwn && styles.messageRowOwn]}>
        <View
          style={[bubbleStyle, { backgroundColor: bubbleBg, maxWidth: "75%" }]}
        >
          <Text style={[styles.senderRole, { color: textColor, opacity: 0.7 }]}>
            {roleBadge}
          </Text>
          <Text style={[styles.messageText, { color: textColor }]}>
            {item.text}
          </Text>
          <Text
            style={[styles.messageTime, { color: textColor, opacity: 0.6 }]}
          >
            {time}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerTitle}>
          <Text style={styles.title}>Chat de cita</Text>
          <Text style={styles.subtitle}>
            {chatDoc?.status === "OPEN" ? "Abierto" : "Cerrado"}
          </Text>
        </View>
        <View style={{ width: 24 }} />
      </View>

      {/* CONTENIDO MENSAJES */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#7B1FA2" />
          <Text style={styles.loadingText}>Cargando chat...</Text>
        </View>
      ) : (
        <>
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.messagesList}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="chatbubble-outline" size={48} color="#C0C0C0" />
                <Text style={styles.emptyText}>
                  No hay mensajes aún. ¡Sé el primero en escribir!
                </Text>
              </View>
            }
          />

          {/* INPUT + BOTÓN ENVIAR */}
          {chatDoc?.status === "OPEN" ? (
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Escribe un mensaje..."
                placeholderTextColor="#9CA3AF"
                value={messageText}
                onChangeText={setMessageText}
                multiline
                editable={!sending}
                maxLength={500}
              />
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  (!messageText.trim() || sending) && styles.sendButtonDisabled,
                ]}
                onPress={handleSendMessage}
                disabled={!messageText.trim() || sending}
              >
                <Ionicons
                  name={sending ? "hourglass" : "send"}
                  size={18}
                  color={messageText.trim() ? "#FFFFFF" : "#B0BEC5"}
                />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.closedContainer}>
              <Text style={styles.closedText}>
                Este chat fue cerrado cuando la cita finalizó.
              </Text>
            </View>
          )}
        </>
      )}
    </KeyboardAvoidingView>
  );
};

export default AppointmentChatScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  header: {
    paddingTop: Platform.OS === "ios" ? 52 : 32,
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#7B1FA2",
    elevation: 3,
  },
  headerTitle: {
    flex: 1,
    marginLeft: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  subtitle: {
    fontSize: 12,
    color: "#E0B0FF",
    marginTop: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
    color: "#607D8B",
  },
  messagesList: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  messageRow: {
    marginVertical: 4,
    alignItems: "flex-start",
  },
  messageRowOwn: {
    alignItems: "flex-end",
  },
  bubbleOwn: {
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  bubbleOther: {
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  senderRole: {
    fontSize: 10,
    fontWeight: "600",
    marginBottom: 2,
  },
  messageText: {
    fontSize: 14,
  },
  messageTime: {
    fontSize: 10,
    marginTop: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 48,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 13,
    color: "#9CA3AF",
    textAlign: "center",
  },
  inputContainer: {
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    alignItems: "flex-end",
  },
  input: {
    flex: 1,
    backgroundColor: "#F3F5F7",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginRight: 8,
    fontSize: 13,
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 999,
    backgroundColor: "#7B1FA2",
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonDisabled: {
    backgroundColor: "#E5E7EB",
  },
  closedContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFEBEE",
    borderTopWidth: 1,
    borderTopColor: "#E53935",
  },
  closedText: {
    fontSize: 12,
    color: "#C62828",
    textAlign: "center",
    fontWeight: "600",
  },
});
