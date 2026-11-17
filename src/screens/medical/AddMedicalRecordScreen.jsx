import { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { COLORS } from "../../constants/colors";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../services/supabase";

import AppInput from "../../components/AppInput";
import AppButton from "../../components/AppButton";
import DatePicker from "../../components/DatePicker";
import MedicalDocumentPicker from "../../components/MedicalDocumentPicker";

import {
  uploadMedicalDocument,
  deleteMedicalDocument,
} from "../../services/medicalDocumentService";

const RECORD_TYPES = [
  "Vaccination",
  "Treatment",
  "Surgery",
  "Check-up",
  "Medication",
];

function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export default function AddMedicalRecordScreen({ navigation }) {
  const { user } = useAuth();

  const scrollRef = useRef(null);

  const [pets, setPets] = useState([]);
  const [loadingPets, setLoadingPets] = useState(true);

  const [selectedPetId, setSelectedPetId] = useState(null);
  const [recordType, setRecordType] = useState("");
  const [title, setTitle] = useState("");
  const [recordDate, setRecordDate] = useState(new Date());
  const [clinic, setClinic] = useState("");
  const [notes, setNotes] = useState("");
  const [attachment, setAttachment] = useState(null);

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  function scrollToField(y) {
    setTimeout(() => {
      scrollRef.current?.scrollTo({
        y,
        animated: true,
      });
    }, 300);
  }

  useEffect(() => {
    let active = true;

    async function loadPets() {
      try {
        const { data, error } = await supabase
          .from("pets")
          .select("id, name, species")
          .eq("user_id", user.id)
          .order("name", { ascending: true });

        if (error) throw error;

        if (active) {
          setPets(data || []);
        }
      } catch (error) {
        Alert.alert("Error", error.message || "Could not load your pets.");
      } finally {
        if (active) {
          setLoadingPets(false);
        }
      }
    }

    if (user?.id) {
      loadPets();
    } else {
      setLoadingPets(false);
    }

    return () => {
      active = false;
    };
  }, [user?.id]);

  function validateForm() {
    const newErrors = {};

    if (!selectedPetId) {
      newErrors.pet = "Please select a pet.";
    }

    if (!recordType) {
      newErrors.recordType = "Please select a record type.";
    }

    if (!title.trim()) {
      newErrors.title = "Title is required.";
    } else if (title.trim().length < 3) {
      newErrors.title = "Title must be at least 3 characters.";
    }

    if (!recordDate) {
      newErrors.date = "Please select a date.";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  }

  async function handleSave() {
    Keyboard.dismiss();

    if (isSubmitting || !validateForm()) {
      return;
    }

    if (!user?.id) {
      Alert.alert("Error", "Please sign in again.");
      return;
    }

    setIsSubmitting(true);

    let uploadedDocumentPath = null;

    try {
      if (attachment) {
        uploadedDocumentPath = await uploadMedicalDocument(attachment, user.id);
      }

      const { error } = await supabase.from("medical_records").insert({
        user_id: user.id,
        pet_id: selectedPetId,
        title: title.trim(),
        record_type: recordType,
        record_date: formatDate(recordDate),
        clinic: clinic.trim() || null,
        notes: notes.trim() || null,
        document_path: uploadedDocumentPath,
      });

      if (error) {
        throw error;
      }

      Alert.alert("Success", "Medical record added successfully.", [
        {
          text: "OK",
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      console.error("Error adding medical record:", error);

      if (uploadedDocumentPath) {
        try {
          await deleteMedicalDocument(uploadedDocumentPath);
        } catch (cleanupError) {
          console.error("Could not remove uploaded document:", cleanupError);
        }
      }

      Alert.alert(
        "Error",
        error.message || "Could not save the medical record.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.header}>
          <Pressable
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </Pressable>

          <Text style={styles.headerTitle}>Add Medical Record</Text>

          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          ref={scrollRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="none"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.sectionTitle}>Pet Information</Text>

          <Text style={styles.label}>Select Pet *</Text>

          {loadingPets ? (
            <ActivityIndicator color={COLORS.primary} style={styles.loader} />
          ) : pets.length === 0 ? (
            <Text style={styles.emptyPetsText}>
              You need to add a pet before creating a medical record.
            </Text>
          ) : (
            <View style={styles.optionsContainer}>
              {pets.map((pet) => (
                <Pressable
                  key={pet.id}
                  style={[
                    styles.optionButton,
                    selectedPetId === pet.id && styles.selectedOption,
                  ]}
                  onPress={() => {
                    setSelectedPetId(pet.id);
                    setErrors((prev) => ({
                      ...prev,
                      pet: undefined,
                    }));
                  }}
                >
                  <Ionicons
                    name="paw-outline"
                    size={18}
                    color={
                      selectedPetId === pet.id
                        ? COLORS.primary
                        : COLORS.textSecondary
                    }
                  />

                  <Text
                    style={[
                      styles.optionText,
                      selectedPetId === pet.id && styles.selectedOptionText,
                    ]}
                  >
                    {pet.name}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}

          {errors.pet ? (
            <Text style={styles.errorText}>{errors.pet}</Text>
          ) : null}

          <Text style={styles.sectionTitle}>Medical Details</Text>

          <Text style={styles.label}>Record Type *</Text>

          <View style={styles.optionsContainer}>
            {RECORD_TYPES.map((type) => (
              <Pressable
                key={type}
                style={[
                  styles.optionButton,
                  recordType === type && styles.selectedOption,
                ]}
                onPress={() => {
                  setRecordType(type);
                  setErrors((prev) => ({
                    ...prev,
                    recordType: undefined,
                  }));
                }}
              >
                <Text
                  style={[
                    styles.optionText,
                    recordType === type && styles.selectedOptionText,
                  ]}
                >
                  {type}
                </Text>
              </Pressable>
            ))}
          </View>

          {errors.recordType ? (
            <Text style={styles.errorText}>{errors.recordType}</Text>
          ) : null}

          <View style={styles.field}>
            <AppInput
              label="Title *"
              icon="document-text-outline"
              placeholder="e.g. Annual vaccination"
              value={title}
              onFocus={() => scrollToField(250)}
              onChangeText={(value) => {
                setTitle(value);
                setErrors((prev) => ({
                  ...prev,
                  title: undefined,
                }));
              }}
              error={errors.title}
            />
          </View>

          <View style={styles.field}>
            <DatePicker
              label="Date *"
              value={recordDate}
              onChange={(date) => {
                setRecordDate(date);
                setErrors((prev) => ({
                  ...prev,
                  date: undefined,
                }));
              }}
              maximumDate={new Date()}
            />

            {errors.date ? (
              <Text style={styles.errorText}>{errors.date}</Text>
            ) : null}
          </View>

          <View style={styles.field}>
            <AppInput
              label="Veterinary Clinic"
              icon="business-outline"
              placeholder="Clinic or veterinarian"
              value={clinic}
              onFocus={() => scrollToField(420)}
              onChangeText={setClinic}
            />
          </View>

          <View style={styles.field}>
            <AppInput
              label="Notes"
              icon="create-outline"
              placeholder="Additional information"
              value={notes}
              onFocus={() => scrollToField(520)}
              onChangeText={setNotes}
            />
          </View>

          <View style={styles.field}>
            <MedicalDocumentPicker file={attachment} onChange={setAttachment} />
          </View>

          <AppButton
            title={isSubmitting ? "Saving..." : "Save Medical Record"}
            onPress={handleSave}
            disabled={isSubmitting || loadingPets || pets.length === 0}
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

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },

  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },

  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.text,
  },

  headerSpacer: {
    width: 40,
  },

  scrollView: {
    flex: 1,
  },

  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 120,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.text,
    marginTop: 24,
    marginBottom: 18,
  },

  label: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 10,
  },

  optionsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },

  optionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 15,
    paddingVertical: 12,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
  },

  selectedOption: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },

  optionText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },

  selectedOptionText: {
    color: COLORS.primary,
    fontWeight: "700",
  },

  field: {
    marginTop: 22,
  },

  loader: {
    marginVertical: 20,
  },

  emptyPetsText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    lineHeight: 22,
  },

  errorText: {
    color: COLORS.error,
    fontSize: 12,
    marginTop: 7,
  },

  saveButton: {
    marginTop: 35,
  },
});
