import { View, Text, StyleSheet } from "react-native";

import AppButton from "../../components/AppButton";
import { COLORS } from "../../constants/colors";

export default function PetsScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Pets 🐾</Text>

      <AppButton
        title="Open Pet Details"
        onPress={() =>
          navigation.navigate("PetDetails", {
            petId: 1,
          })
        }
        style={styles.button}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: COLORS.background,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: COLORS.primary,
    marginBottom: 25,
  },
  button: {
    width: "100%",
  },
});
