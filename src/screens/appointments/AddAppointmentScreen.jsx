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
import TimePicker from "../../components/TimePicker";

const APPOINTMENT_TYPES = [
  "Vaccination",
  "Treatment",
  "Surgery",
  "Check-up",
  "Medication",
  "Other",
];

function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatTime(date) {
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${hours}:${minutes}:00`;
}

function parseDate(dateString) {
  if (!dateString) return new Date();

  const [year, month, day] = dateString.split("-").map(Number);

  return new Date(year, month - 1, day);
}

function parseTime(timeString) {
  if (!timeString) return null;

  const [hours, minutes] = timeString.split(":").map(Number);

  const date = new Date();
  date.setHours(hours, minutes, 0, 0);

  return date;
}

export default function AddAppointmentScreen({ route, navigation }) {
  const { user } = useAuth();

  const appointmentId = route.params?.appointmentId;
  const isEditMode = Boolean(appointmentId);

  const scrollRef = useRef(null);

  const [pets, setPets] = useState([]);
  const [loadingPets, setLoadingPets] = useState(true);
  const [loadingAppointment, setLoadingAppointment] = useState(isEditMode);

  const [selectedPetId, setSelectedPetId] = useState(null);
  const [appointmentType, setAppointmentType] = useState("");
  const [title, setTitle] = useState("");
  const [appointmentDate, setAppointmentDate] = useState(new Date());
  const [appointmentTime, setAppointmentTime] = useState(null);
  const [clinic, setClinic] = useState("");
  const [notes, setNotes] = useState("");

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadError, setLoadError] = useState("");

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

        if (active) setPets(data || []);
      } catch (error) {
        if (active) {
          console.error("Error loading pets:", error);
          setLoadError(error.message || "Could not load your pets.");
        }
      } finally {
        if (active) setLoadingPets(false);
      }
    }

    if (user?.id) {
      loadPets();
    } else {
      setLoadingPets(false);
      setLoadError("Please sign in again.");
    }

    return () => {
      active = false;
    };
  }, [user?.id]);

  useEffect(() => {
    if (!isEditMode) {
      setLoadingAppointment(false);
      return;
    }

    let active = true;

    async function loadExistingAppointment() {
      setLoadingAppointment(true);

      try {
        const { data, error } = await supabase
          .from("appointments")
          .select(
            "id, pet_id, title, appointment_type, appointment_date, appointment_time, clinic, notes, status",
          )
          .eq("id", appointmentId)
          .eq("user_id", user.id)
          .single();

        if (error) throw error;
        if (!active) return;

        setSelectedPetId(data.pet_id);
        setAppointmentType(data.appointment_type);
        setTitle(data.title);
        setAppointmentDate(parseDate(data.appointment_date));
        setAppointmentTime(parseTime(data.appointment_time));
        setClinic(data.clinic || "");
        setNotes(data.notes || "");
      } catch (error) {
        if (active) {
          console.error("Error loading appointment:", error);
          setLoadError(error.message || "Could not load the appointment.");
        }
      } finally {
        if (active) setLoadingAppointment(false);
      }
    }

    if (user?.id) {
      loadExistingAppointment();
    } else {
      setLoadingAppointment(false);
      setLoadError("Please sign in again.");
    }

    return () => {
      active = false;
    };
  }, [appointmentId, isEditMode, user?.id]);

  function validateForm() {
    const newErrors = {};

    if (!selectedPetId) {
      newErrors.pet = "Please select a pet.";
    } else if (!pets.some((pet) => pet.id === selectedPetId)) {
      newErrors.pet = "Selected pet is unavailable.";
    }

    if (!appointmentType) {
      newErrors.appointmentType = "Please select an appointment type.";
    }

    if (!title.trim()) {
      newErrors.title = "Title is required.";
    } else if (title.trim().length < 3) {
      newErrors.title = "Title must be at least 3 characters.";
    }

    if (!appointmentDate) {
      newErrors.date = "Please select a date.";
    }

    if (!appointmentTime) {
      newErrors.time = "Please select a time.";
    }

    if (appointmentDate && appointmentTime && !isEditMode) {
      const selectedDateTime = new Date(
        appointmentDate.getFullYear(),
        appointmentDate.getMonth(),
        appointmentDate.getDate(),
        appointmentTime.getHours(),
        appointmentTime.getMinutes(),
      );

      if (selectedDateTime.getTime() < Date.now()) {
        newErrors.time = "Please select a future date and time.";
      }
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  }

  async function handleSave() {
    Keyboard.dismiss();

    if (
      isSubmitting ||
      loadingPets ||
      loadingAppointment ||
      loadError ||
      !validateForm()
    ) {
      return;
    }

    if (!user?.id) {
      Alert.alert("Error", "Please sign in again.");
      return;
    }

    setIsSubmitting(true);

    try {
      const appointmentData = {
        pet_id: selectedPetId,
        title: title.trim(),
        appointment_type: appointmentType,
        appointment_date: formatDate(appointmentDate),
        appointment_time: formatTime(appointmentTime),
        clinic: clinic.trim() || null,
        notes: notes.trim() || null,
      };

      if (isEditMode) {
        const { error } = await supabase
          .from("appointments")
          .update(appointmentData)
          .eq("id", appointmentId)
          .eq("user_id", user.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from("appointments").insert({
          ...appointmentData,
          user_id: user.id,
        });

        if (error) throw error;
      }

      Alert.alert(
        "Success",
        isEditMode
          ? "Appointment updated successfully."
          : "Appointment added successfully.",
        [
          {
            text: "OK",
            onPress: () => navigation.goBack(),
          },
        ],
      );
    } catch (error) {
      console.error("Error saving appointment:", error);

      Alert.alert("Error", error.message || "Could not save the appointment.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const isLoading = loadingPets || loadingAppointment;

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (loadError) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.header}>
          <Pressable
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </Pressable>

          <Text style={styles.headerTitle}>
            {isEditMode ? "Edit Appointment" : "Add Appointment"}
          </Text>

          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.centerContainer}>
          <Ionicons
            name="alert-circle-outline"
            size={42}
            color={COLORS.error}
          />

          <Text style={styles.loadErrorText}>{loadError}</Text>

          <Pressable
            style={styles.retryButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.retryText}>Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
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

          <Text style={styles.headerTitle}>
            {isEditMode ? "Edit Appointment" : "Add Appointment"}
          </Text>

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

          {pets.length === 0 ? (
            <Text style={styles.emptyPetsText}>
              You need to add a pet before creating an appointment.
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
                    setErrors((prev) => ({ ...prev, pet: undefined }));
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

          <Text style={styles.sectionTitle}>Appointment Details</Text>
          <Text style={styles.label}>Appointment Type *</Text>

          <View style={styles.optionsContainer}>
            {APPOINTMENT_TYPES.map((type) => (
              <Pressable
                key={type}
                style={[
                  styles.optionButton,
                  appointmentType === type && styles.selectedOption,
                ]}
                onPress={() => {
                  setAppointmentType(type);
                  setErrors((prev) => ({
                    ...prev,
                    appointmentType: undefined,
                  }));
                }}
              >
                <Text
                  style={[
                    styles.optionText,
                    appointmentType === type && styles.selectedOptionText,
                  ]}
                >
                  {type}
                </Text>
              </Pressable>
            ))}
          </View>

          {errors.appointmentType ? (
            <Text style={styles.errorText}>{errors.appointmentType}</Text>
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
                setErrors((prev) => ({ ...prev, title: undefined }));
              }}
              error={errors.title}
            />
          </View>

          <View style={styles.field}>
            <DatePicker
              label="Date *"
              value={appointmentDate}
              onChange={(date) => {
                setAppointmentDate(date);
                setErrors((prev) => ({ ...prev, date: undefined }));
              }}
              minimumDate={isEditMode ? undefined : new Date()}
            />

            {errors.date ? (
              <Text style={styles.errorText}>{errors.date}</Text>
            ) : null}
          </View>

          <View style={styles.field}>
            <TimePicker
              label="Time *"
              value={appointmentTime}
              onChange={(time) => {
                setAppointmentTime(time);
                setErrors((prev) => ({ ...prev, time: undefined }));
              }}
            />

            {errors.time ? (
              <Text style={styles.errorText}>{errors.time}</Text>
            ) : null}
          </View>

          <View style={styles.field}>
            <AppInput
              label="Veterinary Clinic"
              icon="business-outline"
              placeholder="Clinic or veterinarian"
              value={clinic}
              onFocus={() => scrollToField(520)}
              onChangeText={setClinic}
            />
          </View>

          <View style={styles.field}>
            <AppInput
              label="Notes"
              icon="create-outline"
              placeholder="Additional information"
              value={notes}
              onFocus={() => scrollToField(620)}
              onChangeText={setNotes}
            />
          </View>

          <AppButton
            title={
              isSubmitting
                ? "Saving..."
                : isEditMode
                  ? "Save Changes"
                  : "Save Appointment"
            }
            onPress={handleSave}
            disabled={
              isSubmitting ||
              loadingPets ||
              loadingAppointment ||
              pets.length === 0
            }
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
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 30,
  },
  loadErrorText: {
    fontSize: 14,
    color: COLORS.error,
    textAlign: "center",
    marginTop: 15,
    marginBottom: 20,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: COLORS.primaryLight,
  },
  retryText: {
    color: COLORS.primary,
    fontWeight: "700",
  },
  saveButton: {
    marginTop: 35,
  },
});
