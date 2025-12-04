import React from "react";
import { View } from "react-native";
import { useTheme } from "../../themes/useTheme";

export default function ThemedView({ style, ...props }) {
  const { colors } = useTheme();
  return <View style={[{ backgroundColor: colors.background }, style]} {...props} />;
}
