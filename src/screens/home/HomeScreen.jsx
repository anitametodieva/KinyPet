import { View, Text, StyleSheet, Alert } from "react-native";
import { useAuth } from "../../context/AuthContext";
import { COLORS } from "../../constants/colors";
import AppButton from "../../components/AppButton";

export default function HomeScreen() {
  const { user, signOut } = useAuth();

  async function handleLogout() {
    try {
      await signOut();
    } catch (error) {
      Alert.alert("Logout failed", error.message);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to KinyPet! 🐾</Text>

      <Text style={styles.subtitle}>
        Hello, {user?.user_metadata?.full_name || "Pet Lover"}!
      </Text>

      <Text style={styles.email}>{user?.email}</Text>

      <AppButton
        title="Logout"
        onPress={handleLogout}
        style={styles.logoutButton}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: COLORS.primary,
    textAlign: "center",
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 18,
    color: COLORS.text,
    marginBottom: 8,
  },
  email: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  logoutButton: {
    marginTop: 32,
    width: "100%",
  },
});
