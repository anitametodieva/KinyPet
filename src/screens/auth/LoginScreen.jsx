import { useRef, useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from "react-native";
import { COLORS } from "../../constants/colors";
import AppButton from "../../components/AppButton";
import AppInput from "../../components/AppInput";
import AuthDecorations from "../../components/AuthDecorations";
import { useAuth } from "../../context/AuthContext";

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { signIn } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const scrollRef = useRef(null);

  function scrollToField(y) {
    setTimeout(() => {
      scrollRef.current?.scrollTo({
        y,
        animated: true,
      });
    }, 300);
  }

  async function handleLogin() {
    if (!email.trim() || !password) {
      Alert.alert(
        "Missing information",
        "Please enter your email and password.",
      );
      return;
    }

    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      await signIn(email, password);
    } catch (error) {
      Alert.alert(
        "Login failed",
        error.message || "Something went wrong. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <AuthDecorations variant="login" />

      <ScrollView
        ref={scrollRef}
        style={styles.scrollView}
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
          <AppInput
            icon="mail-outline"
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            onFocus={() => scrollToField(50)}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />

          <AppInput
            icon="lock-closed-outline"
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            onFocus={() => scrollToField(120)}
            secure
            autoComplete="password"
          />

          <AppButton
            title="Forgot password?"
            variant="text"
            style={styles.forgotButton}
            textStyle={styles.forgotText}
          />

          <AppButton
            title={isSubmitting ? "Signing In..." : "Sign In"}
            onPress={handleLogin}
            style={styles.signInButton}
          />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account? </Text>

          <AppButton
            title="Register"
            variant="text"
            onPress={() => navigation.replace("Register")}
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
    position: "relative",
    backgroundColor: COLORS.background,
  },

  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 65,
    paddingBottom: 35,
  },

  scrollView: {
    flex: 1,
    backgroundColor: "transparent",
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
    marginTop: Platform.OS === "android" ? 15 : 55,
    paddingBottom: 20,
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
