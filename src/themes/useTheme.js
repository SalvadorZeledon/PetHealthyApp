// src/themes/useTheme.js
import { theme } from "./theme";

export const useTheme = () => {
  const currentTheme = theme();

  return {
    colors: currentTheme.colors,
    text: currentTheme.text,
    mode: currentTheme.mode,
  };
};

export default useTheme;
