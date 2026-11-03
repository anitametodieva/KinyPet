import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View } from "react-native";

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>KinyPet 🐾</Text>
      <Text style={styles.subtitle}>
        Every pet deserves a little extra care.
      </Text>
      <StatusBar style="dark" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F6FB",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  title: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#5B4B8A",
  },
  subtitle: {
    fontSize: 16,
    color: "#6D6A75",
    marginTop: 12,
    textAlign: "center",
  },
});
