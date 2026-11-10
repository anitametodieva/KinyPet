import { View, Text, StyleSheet } from "react-native";
import { COLORS } from "../../constants/colors";

export default function PetDetailsScreen({ route }) {
  const { petId } = route.params;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Pet Details 🐾</Text>
      <Text style={styles.text}>Pet ID: {petId}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: COLORS.primary,
    marginBottom: 15,
  },
  text: {
    fontSize: 16,
    color: COLORS.text,
  },
});
