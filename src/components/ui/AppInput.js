import { View, TextInput } from "react-native";
import useTheme from "../../themes/useTheme";
import AppText from "./AppText";

export default function AppInput({ label, error, style, ...props }) {
  const theme = useTheme();

  return (
    <View style={{ marginBottom: 16 }}>
      {label && (
        <AppText variant="small" style={{ marginBottom: 4, color: theme.text }}>
          {label}
        </AppText>
      )}

      <TextInput
        placeholderTextColor={theme.textSecondary}
        style={[
          {
            backgroundColor: theme.card,
            borderWidth: 1,
            borderColor: error ? "red" : theme.border,
            borderRadius: 10,
            padding: 10,
            color: theme.text,
            fontFamily: theme.fontRegular,
          },
          style,
        ]}
        {...props}
      />

      {error && (
        <AppText variant="small" style={{ color: "red", marginTop: 4 }}>
          {error}
        </AppText>
      )}
    </View>
  );
}
