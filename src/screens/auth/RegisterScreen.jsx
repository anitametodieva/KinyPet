import { useRef, useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

import { COLORS } from "../../constants/colors";
import AppButton from "../../components/AppButton";
import AppInput from "../../components/AppInput";
import AuthDecorations from "../../components/AuthDecorations";
import { useAuth } from "../../context/AuthContext";

export default function RegisterScreen({ navigation }) {
  const { signUp } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState({});

  const scrollRef = useRef(null);

  function scrollToField(y) {
    setTimeout(() => {
      scrollRef.current?.scrollTo({
        y,
        animated: true,
      });
    }, 300);
  }

  function updateField(field, value, setter) {
    setter(value);

    setErrors((prevErrors) => {
      const updatedErrors = { ...prevErrors };

      delete updatedErrors[field];

      if (field === "password") {
        delete updatedErrors.confirmPassword;
      }

      return updatedErrors;
    });
  }

  async function handleRegister() {
    const newErrors = {};

    if (!name.trim()) {
      newErrors.name = "Name is required.";
    } else if (name.trim().length < 2) {
      newErrors.name = "Name must be at least 2 characters.";
    }

    if (!email.trim()) {
      newErrors.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = "Please enter a valid email.";
    }

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

    if (Object.keys(newErrors).length > 0) {
      return;
    }

    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    try {
      await signUp(name, email, password);

      Alert.alert(
        "Registration successful!",
        "Your account has been created successfully.",
      );
    } catch (error) {
      Alert.alert(
        "Registration failed",
        error.message || "Something went wrong. Please try again.",
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
          ref={scrollRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="none"
        >
          <Pressable
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backText}>‹</Text>
          </Pressable>

          <Text style={styles.title}>Create Account</Text>

          <Text style={styles.subtitle}>
            Join KinyPet and keep your pets happy and healthy.
          </Text>

          <View style={styles.form}>
            <AppInput
              label="Full Name"
              icon="person-outline"
              placeholder="Your name"
              value={name}
              onChangeText={(value) => updateField("name", value, setName)}
              error={errors.name}
              autoCapitalize="words"
              autoComplete="name"
            />

            <AppInput
              label="Email"
              icon="mail-outline"
              placeholder="your@email.com"
              value={email}
              onChangeText={(value) => updateField("email", value, setEmail)}
              onFocus={() => scrollToField(100)}
              error={errors.email}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="off"
            />

            <AppInput
              label="Password"
              icon="lock-closed-outline"
              placeholder="At least 8 characters"
              value={password}
              onChangeText={(value) =>
                updateField("password", value, setPassword)
              }
              onFocus={() => scrollToField(200)}
              error={errors.password}
              secure
              autoComplete="new-password"
            />

            <AppInput
              label="Confirm Password"
              icon="lock-closed-outline"
              placeholder="Repeat your password"
              value={confirmPassword}
              onChangeText={(value) =>
                updateField("confirmPassword", value, setConfirmPassword)
              }
              onFocus={() => scrollToField(300)}
              error={errors.confirmPassword}
              secure
              autoComplete="new-password"
            />

            <AppButton
              title={isSubmitting ? "Creating Account..." : "Create Account"}
              onPress={handleRegister}
              style={styles.registerButton}
            />
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>

            <AppButton
              title="Sign In"
              variant="text"
              onPress={() => navigation.replace("Login")}
              textStyle={styles.signInText}
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
    marginBottom: 30,
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
    lineHeight: 22,
    marginBottom: 28,
  },

  form: {
    gap: 17,
  },

  registerButton: {
    marginTop: 15,
  },

  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: "auto",
    paddingBottom: 30,
  },

  footerText: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },

  signInText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: "700",
  },
});
