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

export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleResetPassword() {
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      setError("Email is required.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError("Please enter a valid email.");
      return;
    }

    if (isSubmitting) return;

    setError("");
    setIsSubmitting(true);

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        trimmedEmail,
        {
          redirectTo: "kinypet://reset-password",
        },
      );

      if (resetError) throw resetError;

      Alert.alert(
        "Check your email",
        "If an account exists with this email, you will receive a password reset link.",
        [
          {
            text: "OK",
            onPress: () => navigation.goBack(),
          },
        ],
      );
    } catch (resetError) {
      Alert.alert(
        "Error",
        resetError.message || "Failed to send reset email. Please try again.",
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
        <AuthDecorations variant="login" />

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <AppButton
            title="‹ Back"
            variant="text"
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            textStyle={styles.backText}
          />

          <View style={styles.iconContainer}>
            <Ionicons
              name="lock-open-outline"
              size={42}
              color={COLORS.primary}
            />
          </View>

          <Text style={styles.title}>Forgot Password?</Text>

          <Text style={styles.subtitle}>
            Enter your email address and we'll send you a link to reset your
            password.
          </Text>

          <View style={styles.form}>
            <AppInput
              label="Email"
              icon="mail-outline"
              placeholder="your@email.com"
              value={email}
              onChangeText={(value) => {
                setEmail(value);
                setError("");
              }}
              error={error}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />

            <AppButton
              title={isSubmitting ? "Sending..." : "Send Reset Link"}
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
    paddingTop: 25,
    paddingBottom: 35,
  },

  backButton: {
    alignSelf: "flex-start",
    marginBottom: 40,
  },

  backText: {
    fontSize: 20,
    color: COLORS.text,
  },

  iconContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: COLORS.primaryLight,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    marginBottom: 30,
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
