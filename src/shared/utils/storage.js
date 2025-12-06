// src/utils/storage.js
import AsyncStorage from '@react-native-async-storage/async-storage';

const USER_KEY = '@userData'; // si prefieres otro nombre, úsalo SIEMPRE igual

export const saveUserToStorage = async (user) => {
  await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const getUserFromStorage = async () => {
  const stored = await AsyncStorage.getItem(USER_KEY);
  return stored ? JSON.parse(stored) : null;
};

export const clearUserFromStorage = async () => {
  await AsyncStorage.removeItem(USER_KEY);
};

