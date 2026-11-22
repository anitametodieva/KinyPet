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

const MAX_ATTACHMENTS = 10;

function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function parseDate(dateString) {
  if (!dateString) return new Date();

  const [year, month, day] = dateString.split("-").map(Number);

  return new Date(year, month - 1, day);
}

function getStoredFileType(path) {
  const extension = path?.split(".").pop()?.toLowerCase();

  if (extension === "pdf") return "application/pdf";
  if (extension === "png") return "image/png";

  return "image/jpeg";
}

function getUploadedFileName(file, path) {
  const extension = path.split(".").pop()?.toLowerCase();
  const originalName = file.name || "medical-attachment";

  const nameWithoutExtension = originalName.replace(/\.[^.]+$/, "");

  return `${nameWithoutExtension}.${extension}`;
}

export default function AddMedicalRecordScreen({ route, navigation }) {
  const { user } = useAuth();

  const recordId = route.params?.recordId;
  const appointmentId = route.params?.appointmentId;

  const isEditMode = Boolean(recordId);
  const isFromAppointment = Boolean(appointmentId) && !isEditMode;

  const scrollRef = useRef(null);

  const [pets, setPets] = useState([]);
  const [loadingPets, setLoadingPets] = useState(true);
  const [loadingRecord, setLoadingRecord] = useState(
    isEditMode || isFromAppointment,
  );

  const [selectedPetId, setSelectedPetId] = useState(null);
  const [recordType, setRecordType] = useState("");
  const [title, setTitle] = useState("");
  const [recordDate, setRecordDate] = useState(new Date());
  const [clinic, setClinic] = useState("");
  const [notes, setNotes] = useState("");

  // Newly selected files, not uploaded yet.
  const [attachments, setAttachments] = useState([]);

  // Files already saved in Supabase.
  const [existingAttachments, setExistingAttachments] = useState([]);

  // Existing files marked for deletion when Save is pressed.
  const [removedAttachmentIds, setRemovedAttachmentIds] = useState([]);

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

  // Load the user's pets.
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

  // Load an existing medical record when editing.
  useEffect(() => {
    if (!isEditMode) {
      if (!isFromAppointment) {
        setLoadingRecord(false);
      }

      return;
    }

    let active = true;

    async function loadExistingRecord() {
      setLoadingRecord(true);

      try {
        const [recordResult, attachmentsResult] = await Promise.all([
          supabase
            .from("medical_records")
            .select(
              "id, pet_id, title, record_type, record_date, clinic, notes",
            )
            .eq("id", recordId)
            .eq("user_id", user.id)
            .single(),

          supabase
            .from("medical_attachments")
            .select("id, file_path, file_name, file_type")
            .eq("medical_record_id", recordId)
            .eq("user_id", user.id)
            .order("created_at", { ascending: true }),
        ]);

        if (recordResult.error) throw recordResult.error;
        if (attachmentsResult.error) throw attachmentsResult.error;

        if (!active) return;

        const data = recordResult.data;

        setSelectedPetId(data.pet_id);
        setRecordType(data.record_type);
        setTitle(data.title);
        setRecordDate(parseDate(data.record_date));
        setClinic(data.clinic || "");
        setNotes(data.notes || "");

        setExistingAttachments(attachmentsResult.data || []);
        setRemovedAttachmentIds([]);
        setAttachments([]);
      } catch (error) {
        if (active) {
          console.error("Error loading medical record:", error);
          setLoadError(error.message || "Could not load the medical record.");
        }
      } finally {
        if (active) setLoadingRecord(false);
      }
    }

    if (user?.id) {
      loadExistingRecord();
    } else {
      setLoadingRecord(false);
      setLoadError("Please sign in again.");
    }

    return () => {
      active = false;
    };
  }, [isEditMode, isFromAppointment, recordId, user?.id]);

  // Prefill the medical form from a completed appointment.
  useEffect(() => {
    if (!isFromAppointment) return;

    let active = true;

    async function loadAppointmentDetails() {
      setLoadingRecord(true);

      try {
        if (!user?.id) {
          throw new Error("Please sign in again.");
        }

        const { data: appointment, error } = await supabase
          .from("appointments")
          .select(
            "id, pet_id, title, appointment_type, appointment_date, clinic, notes, status",
          )
          .eq("id", appointmentId)
          .eq("user_id", user.id)
          .single();

        if (error) throw error;

        if (appointment.status !== "completed") {
          throw new Error(
            "Only completed appointments can be added to Medical Records.",
          );
        }

        const { data: existingRecord, error: existingError } = await supabase
          .from("medical_records")
          .select("id")
          .eq("appointment_id", appointmentId)
          .eq("user_id", user.id)
          .maybeSingle();

        if (existingError) throw existingError;

        if (existingRecord) {
          throw new Error("This appointment already has a medical record.");
        }

        if (!active) return;

        setSelectedPetId(appointment.pet_id);
        setTitle(appointment.title || "");

        setRecordType(
          RECORD_TYPES.includes(appointment.appointment_type)
            ? appointment.appointment_type
            : "",
        );

        setRecordDate(parseDate(appointment.appointment_date));
        setClinic(appointment.clinic || "");
        setNotes(appointment.notes || "");
      } catch (error) {
        if (active) {
          console.error("Error loading appointment:", error);

          setLoadError(error.message || "Could not load appointment details.");
        }
      } finally {
        if (active) setLoadingRecord(false);
      }
    }

    loadAppointmentDetails();

    return () => {
      active = false;
    };
  }, [appointmentId, isFromAppointment, user?.id]);

  const visibleExistingAttachments = existingAttachments.filter(
    (file) => !removedAttachmentIds.includes(file.id),
  );

  const attachmentCount =
    visibleExistingAttachments.length + attachments.length;

  function handleAttachmentsChange(newFiles) {
    const availableSlots = MAX_ATTACHMENTS - visibleExistingAttachments.length;

    if (newFiles.length > availableSlots) {
      Alert.alert(
        "Attachment Limit",
        `You can attach up to ${MAX_ATTACHMENTS} files in total.`,
      );
      return;
    }

    setAttachments(newFiles);
  }

  function removeExistingAttachment(attachmentId) {
    setRemovedAttachmentIds((current) => [...current, attachmentId]);
  }

  function undoExistingRemoval(attachmentId) {
    setRemovedAttachmentIds((current) =>
      current.filter((id) => id !== attachmentId),
    );
  }

  function validateForm() {
    const newErrors = {};

    if (!selectedPetId) {
      newErrors.pet = "Please select a pet.";
    } else if (!pets.some((pet) => pet.id === selectedPetId)) {
      newErrors.pet = "Selected pet is unavailable.";
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
    } else if (formatDate(recordDate) > formatDate(new Date())) {
      newErrors.date = "Medical records cannot have a future date.";
    }

    if (attachmentCount > MAX_ATTACHMENTS) {
      newErrors.attachments = "Too many attachments.";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  }

  function handleSaveSuccess() {
    navigation.popToTop();
  }

  async function handleSave() {
    Keyboard.dismiss();

    if (
      isSubmitting ||
      loadingPets ||
      loadingRecord ||
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

    const uploadedPaths = [];
    let targetRecordId = recordId;
    let recordSaved = false;

    try {
      // Recheck the appointment before saving.
      if (isFromAppointment) {
        const { data: appointment, error: appointmentError } = await supabase
          .from("appointments")
          .select("id, pet_id, status")
          .eq("id", appointmentId)
          .eq("user_id", user.id)
          .single();

        if (appointmentError) throw appointmentError;

        if (appointment.status !== "completed") {
          throw new Error(
            "Only completed appointments can be added to Medical Records.",
          );
        }

        if (appointment.pet_id !== selectedPetId) {
          throw new Error(
            "The medical record must belong to the same pet as the appointment.",
          );
        }
      }

      const recordData = {
        pet_id: selectedPetId,
        title: title.trim(),
        record_type: recordType,
        record_date: formatDate(recordDate),
        clinic: clinic.trim() || null,
        notes: notes.trim() || null,
        ...(!isEditMode && isFromAppointment
          ? { appointment_id: appointmentId }
          : {}),
      };

      // Save the medical record first.
      if (isEditMode) {
        const { data, error } = await supabase
          .from("medical_records")
          .update(recordData)
          .eq("id", recordId)
          .eq("user_id", user.id)
          .select("id")
          .single();

        if (error) throw error;

        targetRecordId = data.id;
      } else {
        const { data, error } = await supabase
          .from("medical_records")
          .insert({
            ...recordData,
            user_id: user.id,
          })
          .select("id")
          .single();

        if (error) throw error;

        targetRecordId = data.id;
      }

      recordSaved = true;

      // Upload and register each new attachment.
      for (const file of attachments) {
        const path = await uploadMedicalDocument(file, user.id);

        uploadedPaths.push(path);

        const { error } = await supabase.from("medical_attachments").insert({
          medical_record_id: targetRecordId,
          user_id: user.id,
          file_path: path,
          file_name: getUploadedFileName(file, path),
          file_type: getStoredFileType(path),
        });

        if (error) throw error;
      }

      // Remove attachment database rows after new files are saved.
      for (const file of existingAttachments) {
        if (!removedAttachmentIds.includes(file.id)) continue;

        const { error } = await supabase
          .from("medical_attachments")
          .delete()
          .eq("id", file.id)
          .eq("medical_record_id", targetRecordId)
          .eq("user_id", user.id);

        if (error) throw error;

        try {
          await deleteMedicalDocument(file.file_path);
        } catch (cleanupError) {
          console.error(
            "Could not remove attachment from Storage:",
            cleanupError,
          );
        }
      }

      Alert.alert(
        "Success",
        isEditMode
          ? "Medical record updated successfully."
          : "Medical record added successfully.",
        [
          {
            text: "OK",
            onPress: handleSaveSuccess,
          },
        ],
      );
    } catch (error) {
      console.error("Error saving medical record:", error);

      // The database record may already have been saved.
      // Do not delete uploaded files referenced by medical_attachments.
      if (!recordSaved) {
        for (const path of uploadedPaths) {
          try {
            await deleteMedicalDocument(path);
          } catch (cleanupError) {
            console.error("Cleanup failed:", cleanupError);
          }
        }
      }

      Alert.alert(
        "Error",
        error.message ||
          "Could not save all changes. Please reopen the record and check its attachments before retrying.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  const isLoading = loadingPets || loadingRecord;

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
            {isEditMode ? "Edit Medical Record" : "Add Medical Record"}
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
            {isEditMode ? "Edit Medical Record" : "Add Medical Record"}
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
          {isFromAppointment && (
            <View style={styles.appointmentNotice}>
              <Ionicons
                name="checkmark-circle-outline"
                size={22}
                color={COLORS.primary}
              />

              <Text style={styles.appointmentNoticeText}>
                Information from your completed appointment has been filled in
                automatically. You can edit the details and add medical
                documents.
              </Text>
            </View>
          )}

          <Text style={styles.sectionTitle}>Pet Information</Text>

          <Text style={styles.label}>Select Pet *</Text>

          {pets.length === 0 ? (
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
                    if (isFromAppointment) return;

                    setSelectedPetId(pet.id);
                    setErrors((prev) => ({
                      ...prev,
                      pet: undefined,
                    }));
                  }}
                  disabled={isFromAppointment}
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
            {isEditMode && existingAttachments.length > 0 && (
              <>
                <Text style={styles.label}>Saved Attachments</Text>

                {existingAttachments.map((file) => {
                  const isRemoved = removedAttachmentIds.includes(file.id);

                  return (
                    <View
                      key={file.id}
                      style={[
                        styles.existingAttachment,
                        isRemoved && styles.removedAttachment,
                      ]}
                    >
                      <Ionicons
                        name={
                          file.file_type === "application/pdf"
                            ? "document-text-outline"
                            : "image-outline"
                        }
                        size={23}
                        color={COLORS.primary}
                      />

                      <Text
                        style={styles.existingAttachmentText}
                        numberOfLines={1}
                      >
                        {file.file_name}
                      </Text>

                      <Pressable
                        style={styles.removeButton}
                        onPress={() =>
                          isRemoved
                            ? undoExistingRemoval(file.id)
                            : removeExistingAttachment(file.id)
                        }
                        accessibilityLabel={
                          isRemoved
                            ? "Undo attachment removal"
                            : "Remove attachment"
                        }
                      >
                        <Ionicons
                          name={
                            isRemoved ? "arrow-undo-outline" : "trash-outline"
                          }
                          size={21}
                          color={isRemoved ? COLORS.primary : COLORS.error}
                        />
                      </Pressable>
                    </View>
                  );
                })}
              </>
            )}

            <MedicalDocumentPicker
              files={attachments}
              onChange={handleAttachmentsChange}
            />

            {errors.attachments ? (
              <Text style={styles.errorText}>{errors.attachments}</Text>
            ) : null}

            <Text style={styles.attachmentCounter}>
              {attachmentCount} / {MAX_ATTACHMENTS} attachments
            </Text>
          </View>

          <AppButton
            title={
              isSubmitting
                ? "Saving..."
                : isEditMode
                  ? "Save Changes"
                  : "Save Medical Record"
            }
            onPress={handleSave}
            disabled={
              isSubmitting || loadingPets || loadingRecord || pets.length === 0
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

  appointmentNotice: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: COLORS.primaryLight,
    borderRadius: 14,
    padding: 16,
    marginTop: 18,
  },

  appointmentNoticeText: {
    flex: 1,
    color: COLORS.primary,
    fontSize: 13,
    lineHeight: 20,
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

  existingAttachment: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },

  existingAttachmentText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
  },

  removedAttachment: {
    opacity: 0.45,
  },

  removeButton: {
    padding: 5,
  },

  attachmentCounter: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 12,
    textAlign: "right",
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
