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
  Alert,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../services/supabase";
import PetPhotoPicker from "../../components/PetPhotoPicker";
import { uploadPetPhoto, deletePetPhoto } from "../../services/petPhotoService";

import { COLORS } from "../../constants/colors";
import AppInput from "../../components/AppInput";
import AppButton from "../../components/AppButton";
import DatePicker from "../../components/DatePicker";

export default function AddPetScreen({ navigation }) {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [species, setSpecies] = useState("dog");
  const [breed, setBreed] = useState("");
  const [birthDate, setBirthDate] = useState(null);
  const [gender, setGender] = useState("");
  const [weight, setWeight] = useState("");
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [photo, setPhoto] = useState(null);

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

  function validateForm() {
    const newErrors = {};

    if (!name.trim()) {
      newErrors.name = "Pet name is required";
    }

    if (weight.trim()) {
      const parsedWeight = Number(weight.replace(",", "."));

      if (!Number.isFinite(parsedWeight) || parsedWeight <= 0) {
        newErrors.weight = "Enter a valid weight greater than 0";
      }
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  }

  async function handleSavePet() {
    if (saving || !validateForm()) return;

    if (!user) {
      Alert.alert("Error", "You must be logged in to add a pet.");
      return;
    }

    setSaving(true);

    // Keep photoUrl outside try so it is accessible in catch
    let photoUrl = null;

    try {
      // Upload photo if one was selected
      if (photo) {
        const uploadedPhoto = await uploadPetPhoto(photo, user.id);

        photoUrl = uploadedPhoto.photoUrl;
      }

      // Save pet information to Supabase
      const { error } = await supabase.from("pets").insert({
        user_id: user.id,
        name: name.trim(),
        species,
        breed: breed.trim() || null,
        birth_date: birthDate
          ? `${birthDate.getFullYear()}-${String(
              birthDate.getMonth() + 1,
            ).padStart(2, "0")}-${String(birthDate.getDate()).padStart(2, "0")}`
          : null,
        gender: gender || null,
        weight: weight.trim() ? Number(weight.replace(",", ".")) : null,
        photo_url: photoUrl,
      });

      if (error) throw error;

      // Navigate back after successful save
      Alert.alert("Success", "Your pet has been added successfully!", [
        {
          text: "OK",
          onPress: () =>
            navigation.navigate("PetsList", {
              refresh: Date.now(),
            }),
        },
      ]);
    } catch (error) {
      // Remove uploaded photo if saving the pet failed
      if (photoUrl) {
        try {
          await deletePetPhoto(photoUrl, user.id);
        } catch (cleanupError) {
          console.warn("Failed to clean up uploaded photo:", cleanupError);
        }
      }

      Alert.alert("Error", error.message || "Failed to save pet.");
    } finally {
      setSaving(false);
    }
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

          <PetPhotoPicker photo={photo} onChangePhoto={setPhoto} />

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
              error={errors.name}
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
              error={errors.weight}
            />
          </View>

          {/* Save Button */}

          <AppButton
            title={saving ? "Saving..." : "Save Pet"}
            onPress={handleSavePet}
            disabled={saving}
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
