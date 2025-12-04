import React from "react";
import { View } from "react-native";
import { useTheme } from "../../themes/useTheme";

export default function AppCard({ style, children }) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        {
          backgroundColor: colors.card,
          borderRadius: 18,
          padding: 20,
          elevation: 4,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
