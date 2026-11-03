import { Pressable, Text, StyleSheet } from "react-native";
import { COLORS } from "../constants/colors";

export default function AppButton({
  title,
  onPress,
  variant = "primary",
  disabled = false,
  style,
  textStyle,
}) {
  const isPrimary = variant === "primary";
  const isText = variant === "text";

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled }}
      hitSlop={isText ? 8 : 0}
      style={({ pressed }) => [
        styles.button,
        isText
          ? styles.textButton
          : isPrimary
            ? styles.primaryButton
            : styles.secondaryButton,
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      <Text
        style={[
          styles.buttonText,
          isText
            ? styles.textButtonText
            : isPrimary
              ? styles.primaryText
              : styles.secondaryText,
          textStyle,
        ]}
      >
        {title}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: "100%",
    minHeight: 52,
    paddingVertical: 15,
    paddingHorizontal: 18,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },

  primaryButton: {
    backgroundColor: COLORS.secondary,
  },

  secondaryButton: {
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.secondary,
  },

  textButton: {
    width: "auto",
    minHeight: 0,
    paddingVertical: 4,
    paddingHorizontal: 0,
    borderRadius: 0,
    alignSelf: "flex-start",
  },

  buttonText: {
    fontSize: 16,
    fontWeight: "600",
  },

  primaryText: {
    color: COLORS.surface,
  },

  secondaryText: {
    color: COLORS.secondary,
  },

  textButtonText: {
    color: COLORS.primary,
    fontSize: 14,
  },

  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },

  disabled: {
    opacity: 0.5,
  },
});
