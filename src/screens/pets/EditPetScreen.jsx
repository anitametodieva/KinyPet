import { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  Image,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Keyboard,
  Platform,
  StyleSheet,
  ActivityIndicator,
  ActionSheetIOS,
  Alert,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { decode } from "base64-arraybuffer";

import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../services/supabase";
import { COLORS } from "../../constants/colors";

import AppInput from "../../components/AppInput";
import AppButton from "../../components/AppButton";
import DatePicker from "../../components/DatePicker";

export default function EditPetScreen({ navigation, route }) {
  const { petId } = route.params;
  const { user } = useAuth();

  const [name, setName] = useState("");
  const [species, setSpecies] = useState("dog");
  const [breed, setBreed] = useState("");
  const [birthDate, setBirthDate] = useState(null);
  const [gender, setGender] = useState("");
  const [weight, setWeight] = useState("");

  // Pet photos
  const [photoUrl, setPhotoUrl] = useState(null);
  const [newPhoto, setNewPhoto] = useState(null);

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState("");

  // Keyboard and scrolling — same as Add Pet
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

  // Load existing pet data
  useEffect(() => {
    async function loadPet() {
      if (!user) {
        setLoadError("You must be logged in.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setLoadError("");

      try {
        const { data, error } = await supabase
          .from("pets")
          .select("*")
          .eq("id", petId)
          .eq("user_id", user.id)
          .single();

        if (error) throw error;

        setName(data.name || "");
        setSpecies(data.species || "dog");
        setBreed(data.breed || "");

        if (data.birth_date) {
          const [year, month, day] = data.birth_date.split("-").map(Number);
          setBirthDate(new Date(year, month - 1, day));
        } else {
          setBirthDate(null);
        }

        setGender(data.gender || "");
        setWeight(data.weight != null ? String(data.weight) : "");

        // Load existing photo
        setPhotoUrl(data.photo_url || null);
        setNewPhoto(null);
      } catch (error) {
        setLoadError("Failed to load pet details.");
      } finally {
        setLoading(false);
      }
    }

    loadPet();
  }, [petId, user?.id]);

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

  // Choose photo from gallery
  async function chooseFromGallery() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        "Permission required",
        "Please allow access to your photo library.",
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
      base64: true,
    });

    if (!result.canceled) {
      setNewPhoto(result.assets[0]);
    }
  }

  // Take photo with camera
  async function takePhoto() {
    const permission = await ImagePicker.requestCameraPermissionsAsync();

    if (!permission.granted) {
      Alert.alert("Permission required", "Please allow access to your camera.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
      base64: true,
    });

    if (!result.canceled) {
      setNewPhoto(result.assets[0]);
    }
  }

  // Photo options
  function handlePhotoPress() {
    Keyboard.dismiss();

    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ["Take Photo", "Choose from Gallery", "Cancel"],
          cancelButtonIndex: 2,
        },
        (buttonIndex) => {
          if (buttonIndex === 0) takePhoto();
          if (buttonIndex === 1) chooseFromGallery();
        },
      );
    } else {
      Alert.alert("Pet Photo", "Choose an option", [
        { text: "Take Photo", onPress: takePhoto },
        { text: "Choose from Gallery", onPress: chooseFromGallery },
        { text: "Cancel", style: "cancel" },
      ]);
    }
  }

  // Form validation
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

  // Upload new photo to Supabase Storage
  async function uploadNewPetPhoto() {
    if (!newPhoto?.base64) {
      throw new Error(
        "Could not process the selected photo. Please try again.",
      );
    }

    const filePath = `${user.id}/${Date.now()}.jpg`;

    const { error } = await supabase.storage
      .from("pet-photos")
      .upload(filePath, decode(newPhoto.base64), {
        contentType: "image/jpeg",
        upsert: false,
      });

    if (error) throw error;

    const { data } = supabase.storage.from("pet-photos").getPublicUrl(filePath);

    return {
      photoUrl: data.publicUrl,
      filePath,
    };
  }

  // Save updated pet details
  async function handleSaveChanges() {
    if (saving || !validateForm()) return;

    if (!user) {
      Alert.alert("Error", "You must be logged in to edit a pet.");
      return;
    }

    setSaving(true);

    let uploadedPhotoPath = null;

    try {
      let updatedPhotoUrl = photoUrl;

      // Upload photo only if user selected a new one
      if (newPhoto) {
        const uploadedPhoto = await uploadNewPetPhoto();

        updatedPhotoUrl = uploadedPhoto.photoUrl;
        uploadedPhotoPath = uploadedPhoto.filePath;
      }

      const { data, error } = await supabase
        .from("pets")
        .update({
          name: name.trim(),
          species,
          breed: breed.trim() || null,
          birth_date: birthDate
            ? `${birthDate.getFullYear()}-${String(
                birthDate.getMonth() + 1,
              ).padStart(2, "0")}-${String(birthDate.getDate()).padStart(
                2,
                "0",
              )}`
            : null,
          gender: gender || null,
          weight: weight.trim() ? Number(weight.replace(",", ".")) : null,
          photo_url: updatedPhotoUrl,
        })
        .eq("id", petId)
        .eq("user_id", user.id)
        .select("id")
        .single();

      if (error) throw error;

      if (!data) {
        throw new Error("Pet not found.");
      }

      Alert.alert("Success", "Pet details updated successfully!", [
        {
          text: "OK",
          onPress: () => {
            navigation.popTo("PetDetails", {
              petId,
              refresh: Date.now(),
            });
          },
        },
      ]);
    } catch (error) {
      // Remove newly uploaded photo if database update fails
      if (uploadedPhotoPath) {
        const { error: cleanupError } = await supabase.storage
          .from("pet-photos")
          .remove([uploadedPhotoPath]);

        if (cleanupError) {
          console.warn("Failed to clean up uploaded photo:", cleanupError);
        }
      }

      Alert.alert("Error", error.message || "Failed to update pet.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (loadError) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{loadError}</Text>
      </View>
    );
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
            <Pressable
              style={styles.photoCircle}
              onPress={handlePhotoPress}
              disabled={saving}
            >
              {newPhoto?.uri || photoUrl ? (
                <Image
                  source={{ uri: newPhoto?.uri || photoUrl }}
                  style={styles.petPhoto}
                />
              ) : (
                <Ionicons name="paw-outline" size={54} color={COLORS.primary} />
              )}

              <View style={styles.cameraButton}>
                <Ionicons name="camera" size={19} color={COLORS.surface} />
              </View>
            </Pressable>

            <Text style={styles.photoText}>
              {newPhoto || photoUrl ? "Change photo" : "Add a photo"}
            </Text>
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
              error={errors.name}
            />
          </View>

          {/* Species */}

          <Text style={styles.label}>Species *</Text>

          <View style={styles.optionsRow}>
            {[
              { value: "dog", label: "Dog", icon: "paw-outline" },
              { value: "cat", label: "Cat", icon: "logo-octocat" },
              { value: "other", label: "Other", icon: "heart-outline" },
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
              { value: "male", label: "Male" },
              { value: "female", label: "Female" },
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
            title={saving ? "Saving..." : "Save Changes"}
            onPress={handleSaveChanges}
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

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
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

  petPhoto: {
    width: "100%",
    height: "100%",
    borderRadius: 65,
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
    backgroundColor: COLORS.primaryLight,
    color: COLORS.primary,
    fontWeight: "700",
  },

  saveButton: {
    marginTop: 16,
    marginBottom: 10,
  },

  errorText: {
    color: COLORS.error,
    fontSize: 14,
    textAlign: "center",
    paddingHorizontal: 24,
  },
});
