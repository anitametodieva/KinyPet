import { View, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../constants/colors";

export default function AuthDecorations() {
  return (
    <View
      style={styles.container}
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <View style={styles.paw}>
        <Ionicons name="paw" size={38} color={COLORS.primary} />
      </View>

      <View style={styles.leafOne}>
        <Ionicons name="leaf-outline" size={95} color={COLORS.secondary} />
      </View>

      <View style={styles.leafTwo}>
        <Ionicons name="leaf-outline" size={65} color={COLORS.secondary} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: "hidden",
    zIndex: 10,
  },

  paw: {
    position: "absolute",
    top: 100,
    right: 30,
    opacity: 0.3,
    transform: [{ rotate: "-20deg" }],
  },

  leafOne: {
    position: "absolute",
    bottom: 90,
    right: -20,
    opacity: 0.35,
    transform: [{ rotate: "-35deg" }],
  },

  leafTwo: {
    position: "absolute",
    bottom: 155,
    right: 35,
    opacity: 0.3,
    transform: [{ rotate: "25deg" }],
  },
});
