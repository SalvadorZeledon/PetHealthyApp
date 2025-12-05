// src/utils/authUser.js
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'CURRENT_USER_ID';

export async function saveCurrentUser(id) {
  try {
    await AsyncStorage.setItem(KEY, id);
  } catch (e) {
    console.error('saveCurrentUser ERROR =>', e);
  }
}

export async function getCurrentUser() {
  try {
    const value = await AsyncStorage.getItem(KEY);
    return value; // null si no hay sesión
  } catch (e) {
    console.error('getCurrentUser ERROR =>', e);
    return null;
  }
}

export async function clearCurrentUser() {
  try {
    await AsyncStorage.removeItem(KEY);
  } catch (e) {
    console.error('clearCurrentUser ERROR =>', e);
  }
}
