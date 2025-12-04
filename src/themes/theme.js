// src/themes/theme.js
import { useColorScheme } from "react-native";

// 🎨 TEMA CLARO (tu diseño original)
export const lightTheme = {
  mode: "light",
  colors: {
    primary: "#215273",        // títulos & headers
    background: "#CBEBF6",     // fondo general
    card: "#FFFFFF",           // tarjetas
    buttonPrimary: "#4CAF50",  // botón principal
    text: "#263238",           // texto principal
    textSmall: "#767676",      // texto pequeño
    inputBackground: "#F9FAFB",
    inputBorder: "#CFD8DC",
    placeholder: "#7a8b8c",
    danger: "#e53935",
    info: "#1E88E5",
    success: "#4CAF50"
  },

  text: {
    title: {
      fontSize: 20,
      fontWeight: "700",
      color: "#215273",
    },
    subtitle: {
      fontSize: 14,
      color: "#767676",
    },
    small: {
      fontSize: 12,
      color: "#767676",
    }
  }
};

// 🌙 TEMA OSCURO (automático)
export const darkTheme = {
  mode: "dark",
  colors: {
    primary: "#81CFFF",        // azul brillante
    background: "#0E0E0E",     // fondo oscuro
    card: "#1E1E1E",
    buttonPrimary: "#4CAF50",  // mantenemos verde
    text: "#F5F5F5",
    textSmall: "#C4C4C4",
    inputBackground: "#262626",
    inputBorder: "#3A3A3A",
    placeholder: "#999999",
    danger: "#FF6B6B",
    info: "#4FC3F7",
    success: "#81C784"
  },

  text: {
    title: {
      fontSize: 20,
      fontWeight: "700",
      color: "#81CFFF",
    },
    subtitle: {
      fontSize: 14,
      color: "#C4C4C4",
    },
    small: {
      fontSize: 12,
      color: "#C4C4C4",
    }
  }
};

// ⚡ Selección automática (Sistema)
export const theme = () => {
  const colorScheme = useColorScheme(); // 'light' | 'dark'
  return colorScheme === "dark" ? darkTheme : lightTheme;
};
