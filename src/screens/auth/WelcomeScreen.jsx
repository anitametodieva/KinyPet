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
import AppButton from "../../components/AppButton";

export default function WelcomeScreen({ navigation }) {
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
            <AppButton
              title="Get Started →"
              onPress={() => console.log("Get Started pressed")}
            />

            <AppButton
              title="Sign In"
              variant="secondary"
              onPress={() => navigation.navigate("Login")}
            />
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
});
