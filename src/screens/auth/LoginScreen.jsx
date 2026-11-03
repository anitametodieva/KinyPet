import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { COLORS } from "../../constants/colors";

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <StatusBar style="dark" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Pressable
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backText}>‹</Text>
        </Pressable>

        <Text style={styles.title}>Welcome Back</Text>

        <Text style={styles.subtitle}>Sign in to continue to KinyPet.</Text>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor={COLORS.textSecondary}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            value={email}
            onChangeText={setEmail}
          />

          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Password"
              placeholderTextColor={COLORS.textSecondary}
              secureTextEntry={!showPassword}
              autoComplete="password"
              value={password}
              onChangeText={setPassword}
            />

            <Pressable onPress={() => setShowPassword(!showPassword)}>
              <Text style={styles.showPassword}>
                {showPassword ? "Hide" : "Show"}
              </Text>
            </Pressable>
          </View>

          <Pressable style={styles.forgotButton}>
            <Text style={styles.forgotText}>Forgot password?</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.signInButton,
              pressed && styles.signInButtonPressed,
            ]}
            onPress={() => console.log("Login:", email)}
          >
            <Text style={styles.signInText}>Sign In</Text>
          </Pressable>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account? </Text>

          <Pressable onPress={() => navigation.navigate("Register")}>
            <Text style={styles.registerText}>Register</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 65,
    paddingBottom: 35,
  },

  backButton: {
    marginBottom: 45,
  },

  backText: {
    fontSize: 36,
    color: COLORS.text,
  },

  title: {
    fontSize: 30,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 8,
  },

  subtitle: {
    fontSize: 15,
    color: COLORS.textSecondary,
    marginBottom: 30,
  },

  form: {
    gap: 14,
  },

  input: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 54,
    fontSize: 16,
    color: COLORS.text,
  },

  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 54,
  },

  passwordInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text,
  },

  showPassword: {
    color: COLORS.primary,
    fontWeight: "600",
  },

  forgotButton: {
    alignSelf: "flex-end",
  },

  forgotText: {
    color: COLORS.primary,
    fontSize: 14,
    textDecorationLine: "underline",
  },

  signInButton: {
    backgroundColor: COLORS.secondary,
    borderRadius: 12,
    paddingVertical: 17,
    alignItems: "center",
    marginTop: 20,
  },

  signInButtonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },

  signInText: {
    color: COLORS.surface,
    fontSize: 16,
    fontWeight: "600",
  },

  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: "auto",
    paddingTop: 45,
  },

  footerText: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },

  registerText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: "700",
  },
});
