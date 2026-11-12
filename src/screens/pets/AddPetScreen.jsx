import { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Keyboard,
  Platform,
  StyleSheet,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { COLORS } from "../../constants/colors";
import AppInput from "../../components/AppInput";
import AppButton from "../../components/AppButton";
import DatePicker from "../../components/DatePicker";

export default function AddPetScreen() {
  const [name, setName] = useState("");
  const [species, setSpecies] = useState("dog");
  const [breed, setBreed] = useState("");
  const [birthDate, setBirthDate] = useState(null);
  const [gender, setGender] = useState("");
  const [weight, setWeight] = useState("");

  // Keyboard and scrolling
  const scrollRef = useRef(null);
  const fieldPositions = useRef({});
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const showSubscription = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      (event) => {
        setKeyboardHeight(event.endCoordinates.height);
      },
    );

    const hideSubscription = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => {
        setKeyboardHeight(0);
      },
    );

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  function registerField(field, event) {
    fieldPositions.current[field] = event.nativeEvent.layout.y;
  }

  function scrollToField(field) {
    setTimeout(() => {
      const fieldY = fieldPositions.current[field];

      if (fieldY === undefined) return;

      scrollRef.current?.scrollTo({
        y: Math.max(0, fieldY - 35),
        animated: true,
      });
    }, 350);
  }

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          ref={scrollRef}
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingBottom: keyboardHeight > 0 ? 220 : 50,
            },
          ]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="none"
          showsVerticalScrollIndicator={false}
        >
          {/* Pet Photo */}

          <View style={styles.photoSection}>
            <Pressable style={styles.photoCircle} onPress={() => {}}>
              <Ionicons name="paw-outline" size={54} color={COLORS.primary} />

              <View style={styles.cameraButton}>
                <Ionicons name="camera" size={19} color={COLORS.surface} />
              </View>
            </Pressable>

            <Text style={styles.photoText}>Add a photo</Text>
          </View>

          {/* Pet Name */}

          <View onLayout={(event) => registerField("name", event)}>
            <AppInput
              label="Pet Name *"
              icon="paw-outline"
              placeholder="Your pet's name"
              value={name}
              onChangeText={setName}
              onFocus={() => scrollToField("name")}
              autoCapitalize="words"
            />
          </View>

          {/* Species */}

          <Text style={styles.label}>Species *</Text>

          <View style={styles.optionsRow}>
            {[
              {
                value: "dog",
                label: "Dog",
                icon: "paw-outline",
              },
              {
                value: "cat",
                label: "Cat",
                icon: "logo-octocat",
              },
              {
                value: "other",
                label: "Other",
                icon: "heart-outline",
              },
            ].map((item) => (
              <Pressable
                key={item.value}
                style={[
                  styles.optionButton,
                  species === item.value && styles.optionSelected,
                ]}
                onPress={() => setSpecies(item.value)}
              >
                <Ionicons
                  name={item.icon}
                  size={20}
                  color={
                    species === item.value
                      ? COLORS.primary
                      : COLORS.textSecondary
                  }
                />

                <Text
                  style={[
                    styles.optionText,
                    species === item.value && styles.optionTextSelected,
                  ]}
                >
                  {item.label}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Breed */}

          <View onLayout={(event) => registerField("breed", event)}>
            <AppInput
              label="Breed"
              icon="heart-outline"
              placeholder="e.g. Pomeranian"
              value={breed}
              onChangeText={setBreed}
              onFocus={() => scrollToField("breed")}
              autoCapitalize="words"
            />
          </View>

          {/* Date of Birth */}

          <DatePicker
            label="Date of Birth"
            value={birthDate}
            onChange={setBirthDate}
            maximumDate={new Date()}
          />

          {/* Gender */}

          <Text style={styles.label}>Gender</Text>

          <View style={styles.optionsRow}>
            {[
              {
                value: "male",
                label: "Male",
              },
              {
                value: "female",
                label: "Female",
              },
            ].map((item) => (
              <Pressable
                key={item.value}
                style={[
                  styles.optionButton,
                  gender === item.value && styles.optionSelected,
                ]}
                onPress={() => setGender(item.value)}
              >
                <Text
                  style={[
                    styles.optionText,
                    gender === item.value && styles.optionTextSelected,
                  ]}
                >
                  {item.label}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Weight */}

          <View onLayout={(event) => registerField("weight", event)}>
            <AppInput
              label="Weight (kg)"
              icon="scale-outline"
              placeholder="e.g. 4.5"
              value={weight}
              onChangeText={setWeight}
              onFocus={() => scrollToField("weight")}
              keyboardType="decimal-pad"
            />
          </View>

          {/* Save Button */}

          <AppButton
            title="Save Pet"
            onPress={() => {}}
            style={styles.saveButton}
          />
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
  },

  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 20,
    gap: 16,
  },

  photoSection: {
    alignItems: "center",
    marginBottom: 10,
  },

  photoCircle: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: COLORS.border,
  },

  cameraButton: {
    position: "absolute",
    right: 0,
    bottom: 5,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.secondary,
    borderWidth: 3,
    borderColor: COLORS.background,
    alignItems: "center",
    justifyContent: "center",
  },

  photoText: {
    marginTop: 12,
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: "600",
  },

  label: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "600",
    marginBottom: -8,
  },

  optionsRow: {
    flexDirection: "row",
    gap: 10,
  },

  optionButton: {
    flex: 1,
    minHeight: 52,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 7,
  },

  optionSelected: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },

  optionText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: "500",
  },

  optionTextSelected: {
    color: COLORS.primary,
    fontWeight: "700",
  },

  saveButton: {
    marginTop: 16,
    marginBottom: 10,
  },
});
