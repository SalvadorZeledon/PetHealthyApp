import { createContext, useContext, useState } from 'react';

const lightTheme = {
  background: "#E3F2FD",
  card: "#FFFFFF",
  textPrimary: "#263238",
  textSecondary: "#607D8B",
  accent: "#365b6d",
};

const darkTheme = {
  background: "#121212",
  card: "#1E1E1E",
  textPrimary: "#FFFFFF",
  textSecondary: "#B0B0B0",
  accent: "#90CAF9",
};

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [darkMode, setDarkMode] = useState(false);

  const theme = darkMode ? darkTheme : lightTheme;

  const toggleTheme = () => setDarkMode(!darkMode);

  return (
    <ThemeContext.Provider value={{ darkMode, toggleTheme, theme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
