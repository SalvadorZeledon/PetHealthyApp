import React from "react";
import { TouchableOpacity, Text } from "react-native";
import { useTheme } from "../../themes/useTheme";

export default function AppButton({ title, onPress, style, textStyle }) {
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        {
          backgroundColor: colors.buttonPrimary,
          paddingVertical: 12,
          borderRadius: 12,
          alignItems: "center",
        },
        style,
      ]}
    >
      <Text
        style={[
          {
            color: "#ffffff",
            fontSize: 15,
            fontWeight: "600",
          },
          textStyle,
        ]}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );
}
