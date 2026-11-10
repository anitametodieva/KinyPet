import { Image, StyleSheet } from "react-native";

export default function AuthDecorations({ variant = "login" }) {
  const isRegister = variant === "register";

  return (
    <>
      <Image
        pointerEvents="none"
        source={require("../../assets/images/decorations/auth-wave.png")}
        style={[styles.wave, isRegister && styles.registerWave]}
        resizeMode="stretch"
      />

      <Image
        pointerEvents="none"
        source={require("../../assets/images/decorations/auth-leaves.png")}
        style={[styles.leaves, isRegister && styles.registerLeaves]}
        resizeMode="contain"
      />

      <Image
        pointerEvents="none"
        source={require("../../assets/images/decorations/auth-paws.png")}
        style={[styles.paws, isRegister && styles.registerPaws]}
        resizeMode="contain"
      />
    </>
  );
}

const styles = StyleSheet.create({
  wave: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    width: "100%",
    height: 100,
  },

  leaves: {
    position: "absolute",
    bottom: 0,
    right: -15,
    width: 175,
    height: 290,
  },

  paws: {
    position: "absolute",
    top: 50,
    right: 15,
    width: 120,
    height: 90,
  },

  registerWave: {
    height: 100,
  },

  registerLeaves: {
    width: 175,
    height: 290,
    right: -20,
  },

  registerPaws: {
    width: 120,
    height: 90,
  },
});
