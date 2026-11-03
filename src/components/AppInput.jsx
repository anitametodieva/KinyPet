import { useState } from "react";
import { View, Text, TextInput, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../constants/colors";
import AppButton from "./AppButton";

export default function AppInput({
  label,
  icon,
  placeholder,
  value,
  onChangeText,
  error,
  secure = false,
  keyboardType = "default",
  autoCapitalize = "sentences",
  autoComplete,
}) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}

      <View style={[styles.inputContainer, error && styles.inputError]}>
        {icon && (
          <Ionicons
            name={icon}
            size={20}
            color={COLORS.textSecondary}
            style={styles.icon}
          />
        )}
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={COLORS.textSecondary}
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoComplete={autoComplete}
          secureTextEntry={secure && !showPassword}
        />

        {secure && (
          <AppButton
            title={showPassword ? "Hide" : "Show"}
            variant="text"
            onPress={() => setShowPassword(!showPassword)}
            style={styles.showButton}
          />
        )}
      </View>

      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },

  label: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 8,
  },

  icon: {
    marginRight: 12,
  },

  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    height: 54,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 16,
  },

  input: {
    flex: 1,
    minWidth: 0,
    fontSize: 16,
    color: COLORS.text,
    paddingVertical: 0,
  },

  showButton: {
    alignSelf: "center",
    justifyContent: "center",
    paddingVertical: 0,
    marginLeft: 8,
  },

  inputError: {
    borderColor: COLORS.error,
  },

  error: {
    color: COLORS.error,
    fontSize: 12,
    marginTop: 5,
  },
});
