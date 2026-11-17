import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { COLORS } from "../../constants/colors";
import AppButton from "../../components/AppButton";
import AppInput from "../../components/AppInput";
import AuthDecorations from "../../components/AuthDecorations";
import { supabase } from "../../services/supabase";

export default function ResetPasswordScreen({ onPasswordReset }) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleResetPassword() {
    const newErrors = {};

    if (!password) {
      newErrors.password = "Password is required.";
    } else if (password.length < 8) {
      newErrors.password = "Password must be at least 8 characters.";
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password.";
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match.";
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0 || isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) throw error;

      Alert.alert(
        "Password Updated",
        "Your password has been changed successfully.",
        [
          {
            text: "OK",
            onPress: () => onPasswordReset?.(),
          },
        ],
      );
    } catch (error) {
      Alert.alert(
        "Reset Failed",
        error.message || "Could not update your password.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <AuthDecorations variant="register" />

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.iconContainer}>
            <Ionicons
              name="lock-closed-outline"
              size={42}
              color={COLORS.primary}
            />
          </View>

          <Text style={styles.title}>Create New Password</Text>

          <Text style={styles.subtitle}>
            Enter a new password for your KinyPet account.
          </Text>

          <View style={styles.form}>
            <AppInput
              label="New Password"
              icon="lock-closed-outline"
              placeholder="At least 8 characters"
              value={password}
              onChangeText={(value) => {
                setPassword(value);
                setErrors((prev) => ({
                  ...prev,
                  password: undefined,
                  confirmPassword: undefined,
                }));
              }}
              error={errors.password}
              secure
              autoComplete="new-password"
            />

            <AppInput
              label="Confirm Password"
              icon="lock-closed-outline"
              placeholder="Repeat your new password"
              value={confirmPassword}
              onChangeText={(value) => {
                setConfirmPassword(value);
                setErrors((prev) => ({
                  ...prev,
                  confirmPassword: undefined,
                }));
              }}
              error={errors.confirmPassword}
              secure
              autoComplete="new-password"
            />

            <AppButton
              title={isSubmitting ? "Updating..." : "Reset Password"}
              onPress={handleResetPassword}
              disabled={isSubmitting}
              style={styles.submitButton}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  scrollView: {
    flex: 1,
    backgroundColor: "transparent",
  },

  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 70,
    paddingBottom: 35,
  },

  iconContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: COLORS.primaryLight,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    marginBottom: 35,
  },

  title: {
    fontSize: 30,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 12,
  },

  subtitle: {
    fontSize: 15,
    color: COLORS.textSecondary,
    lineHeight: 23,
    marginBottom: 35,
  },

  form: {
    gap: 18,
  },

  submitButton: {
    marginTop: 15,
  },
});
