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
import AppButton from "../../components/AppButton";

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

            <AppButton
              title={showPassword ? "Hide" : "Show"}
              variant="text"
              onPress={() => setShowPassword(!showPassword)}
              style={styles.showPasswordButton}
              textStyle={styles.showPassword}
            />
          </View>

          <AppButton
            title="Forgot password?"
            variant="text"
            style={styles.forgotButton}
            textStyle={styles.forgotText}
          />

          <AppButton
            title="Sign In"
            onPress={() => console.log("Login:", email)}
            style={styles.signInButton}
          />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account? </Text>

          <AppButton
            title="Register"
            variant="text"
            onPress={() => navigation.navigate("Register")}
            textStyle={styles.registerText}
          />
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

  showPasswordButton: {
    alignSelf: "center",
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
    marginTop: 20,
  },

  footer: {
    flexDirection: "row",
    alignItems: "center",
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
