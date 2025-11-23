import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../src/themes/ThemeContext';
const ChatbotScreen = ({ navigation }) => {
   const { theme, darkMode } = useTheme();
  const handleOpenSettings = () => {
    navigation.navigate('Settings');
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* HEADER SOLO CON SETTINGS */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Chat de consultas</Text>

      <TouchableOpacity
                style={[styles.iconCircle, { backgroundColor: darkMode ? theme.card2 : '#FFFFFF' }]}
                onPress={handleOpenSettings}
              >
                <Ionicons name="settings-outline" size={20} color="#365b6d" />
              </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.placeholderCard, { backgroundColor: darkMode ? theme.card2 : theme.card }]}>
          <Ionicons name="chatbubbles-outline" size={40} color="#00796B" />
          <Text style={[styles.placeholderTitle, { color: theme.textPrimary }]}>Asistente virtual</Text>
          <Text style={[styles.placeholderText, { color: theme.textSecondary }]}>
            Próximamente podrás hacer consultas rápidas sobre la salud de tus
            mascotas y recibir recomendaciones.
          </Text>

          <View style={[styles.chatBubble, { backgroundColor: darkMode ? '#2A3A3A' : '#E0F2F1' }]}>
            <Text style={[styles.chatBotLabel, { color: theme.textPrimary }]}>PetHealthyBot</Text>
            <Text style={[styles.chatBotText, { color: theme.textSecondary }]}>
              Hola 🐾, pronto podré ayudarte con dudas sobre vacunas, citas y
              cuidados generales.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};


export default ChatbotScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E3F2FD',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Platform.OS === 'ios' ? 40 : 0,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#263238',
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  placeholderCard: {
    marginTop: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    alignItems: 'flex-start',
    elevation: 3,
  },
  placeholderTitle: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#263238',
  },
  placeholderText: {
    marginTop: 4,
    fontSize: 13,
    color: '#607D8B',
  },
  chatBubble: {
    marginTop: 14,
    backgroundColor: '#E0F2F1',
    borderRadius: 16,
    padding: 12,
  },
  chatBotLabel: {
    fontSize: 11,
    color: '#00796B',
    fontWeight: '600',
    marginBottom: 4,
  },
  chatBotText: {
    fontSize: 13,
    color: '#004D40',
  },
});
