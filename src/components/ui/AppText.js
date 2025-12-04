import React from "react";
import { Text } from "react-native";
import { useTheme } from "../../themes/useTheme";

export default function AppText({ style, children, small, title, ...props }) {
  const { text } = useTheme();

  const textStyle = title
    ? text.title
    : small
    ? text.small
    : {};

  return (
    <Text style={[textStyle, style]} {...props}>
      {children}
    </Text>
  );
}
