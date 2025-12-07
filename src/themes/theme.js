// src/themes/theme.js
import { Appearance } from "react-native";

const lightTheme = {
  mode: "light",
  colors: {
    // FONDO GENERAL
    background: "#E3F2FD",

    // TARJETAS / CARDS
    card: "#FFFFFF",

    // BRAND / ACCENT
    primary: "#4CAF50", // botón principal verde
    primaryText: "#FFFFFF",
    accent: "#4A85A5", // azul de la app (logos, iconos)
    secondaryAccent: "#1E88E5",

    // TEXTO
    text: "#263238",
    subtitle: "#607D8B",
    footerText: "#78909C",

    // INPUTS
    inputBackground: "#F9FAFB",
    inputBorder: "#CFD8DC",
    placeholder: "#7a8b8c",

    // LINKS
    link: "#1E88E5",
    vetLink: "#00897B",

    // ESTADOS
    success: "#4CAF50",
    error: "#e53935",

    // MODAL
    modalOverlay: "rgba(15,23,42,0.45)",
    modalCard: "#FFFFFF",
  },
  text: {
    title: { fontSize: 20, fontWeight: "700", color: "#263238" },
    body: { fontSize: 14, color: "#607D8B" },
  },
};

const darkTheme = {
  mode: "dark",
  colors: {
    // FONDO GENERAL
    background: "#0B1724", // azul oscuro

    // TARJETAS / CARDS
    card: "#102027", // gris-azul oscuro

    // BRAND / ACCENT
    primary: "#4CAF50",
    primaryText: "#FFFFFF",
    accent: "#4A85A5",
    secondaryAccent: "#64B5F6",

    // TEXTO
    text: "#ECEFF1",
    subtitle: "#B0BEC5",
    footerText: "#90A4AE",

    // INPUTS
    inputBackground: "#1C2833",
    inputBorder: "#455A64",
    placeholder: "#9CA3AF",

    // LINKS
    link: "#64B5F6",
    vetLink: "#4DB6AC",

    // ESTADOS
    success: "#66BB6A",
    error: "#EF5350",

    // MODAL
    modalOverlay: "rgba(15,23,42,0.75)",
    modalCard: "#1F2933",
  },
  text: {
    title: { fontSize: 20, fontWeight: "700", color: "#ECEFF1" },
    body: { fontSize: 14, color: "#B0BEC5" },
  },
};

export const theme = () => {
  const colorScheme = Appearance.getColorScheme(); // "light" | "dark" | null
  return colorScheme === "dark" ? darkTheme : lightTheme;
};

export default theme;
