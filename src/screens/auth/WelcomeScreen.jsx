import {
  View,
  Text,
  Image,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  ScrollView,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { COLORS } from "../../constants/colors";

export default function WelcomeScreen() {
  const { width, height } = useWindowDimensions();

  const imageWidth = Math.min(width, 480);
  const imageHeight = imageWidth * (1024 / 1536);

  const isSmallScreen = height < 750;

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { minHeight: height }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          {/* Logo */}
          <View style={styles.header}>
            <Image
              source={require("../../../assets/images/decorations/logo-symbol.png")}
              style={[
                styles.logoSymbol,
                isSmallScreen && styles.smallLogoSymbol,
              ]}
              resizeMode="contain"
            />

            <View style={styles.logoContainer}>
              <Text style={styles.logoGreen}>Kiny</Text>
              <Text style={styles.logoPurple}>Pet</Text>
            </View>

            <Text style={styles.subtitle}>
              Your Pet's Health,{"\n"}All in One Place.
            </Text>
          </View>

          {/* Pets illustration */}
          <View style={styles.imageContainer}>
            <Image
              source={require("../../../assets/images/welcome-pets-decorated.png")}
              style={{
                width: imageWidth,
                height: imageHeight,
              }}
              resizeMode="contain"
            />
          </View>

          {/* Buttons */}
          <View style={styles.buttonsContainer}>
            <Pressable
              style={styles.primaryButton}
              onPress={() => console.log("Get Started pressed")}
            >
              <Text style={styles.primaryButtonText}>Get Started →</Text>
            </Pressable>

            <Pressable
              style={styles.secondaryButton}
              onPress={() => console.log("Sign In pressed")}
            >
              <Text style={styles.secondaryButtonText}>Sign In</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
  },

  content: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 30,
  },

  header: {
    alignItems: "center",
    marginBottom: 8,
  },

  logoSymbol: {
    width: 85,
    height: 85,
    marginBottom: 8,
  },

  smallLogoSymbol: {
    width: 65,
    height: 65,
  },

  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },

  logoGreen: {
    fontSize: 42,
    fontWeight: "bold",
    color: COLORS.secondary,
  },

  logoPurple: {
    fontSize: 42,
    fontWeight: "bold",
    color: COLORS.primary,
  },

  subtitle: {
    fontSize: 16,
    color: COLORS.text,
    textAlign: "center",
    lineHeight: 23,
  },

  imageContainer: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },

  buttonsContainer: {
    width: "100%",
    gap: 12,
  },

  primaryButton: {
    backgroundColor: COLORS.secondary,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
  },

  primaryButtonText: {
    color: COLORS.surface,
    fontSize: 16,
    fontWeight: "600",
  },

  secondaryButton: {
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.secondary,
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: "center",
  },

  secondaryButtonText: {
    color: COLORS.secondary,
    fontSize: 16,
    fontWeight: "600",
  },
});
