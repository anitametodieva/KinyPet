import { useCallback, useState } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";

import { COLORS } from "../../constants/colors";
import { getMedicalType } from "../../constants/medicalTypes";
import { supabase } from "../../services/supabase";
import { useAuth } from "../../context/AuthContext";

const STATUS_LABELS = {
  scheduled: "Scheduled",
  completed: "Completed",
  cancelled: "Cancelled",
};

function formatDate(dateString) {
  if (!dateString) return "";

  const [year, month, day] = dateString.split("-");

  return `${day}.${month}.${year}`;
}

function formatTime(timeString) {
  if (!timeString) return "";

  return timeString.slice(0, 5);
}

function DetailRow({ icon, label, value }) {
  if (!value) return null;

  return (
    <View style={styles.detailRow}>
      <View style={styles.detailIcon}>
        <Ionicons name={icon} size={21} color={COLORS.primary} />
      </View>

      <View style={styles.detailTextContainer}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue}>{value}</Text>
      </View>
    </View>
  );
}

export default function AppointmentDetailsScreen({ route, navigation }) {
  const appointmentId = route.params?.appointmentId;
  const { user } = useAuth();

  const [appointment, setAppointment] = useState(null);
  const [medicalRecordId, setMedicalRecordId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");

  const loadAppointment = useCallback(async () => {
    if (!user?.id || !appointmentId) {
      setError("Appointment not found.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const { data, error: appointmentError } = await supabase
        .from("appointments")
        .select(
          `
          id,
          pet_id,
          title,
          appointment_type,
          appointment_date,
          appointment_time,
          clinic,
          notes,
          status,
         pets (
            id,
            name,
            species,
            photo_url
          ) 
        `,
        )
        .eq("id", appointmentId)
        .eq("user_id", user.id)
        .single();

      if (appointmentError) throw appointmentError;

      const { data: medicalData, error: medicalError } = await supabase
        .from("medical_records")
        .select("id")
        .eq("appointment_id", appointmentId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (medicalError) throw medicalError;

      setAppointment(data);
      setMedicalRecordId(medicalData?.id || null);
    } catch (err) {
      console.error("Error loading appointment:", err);

      setError(err.message || "Could not load the appointment.");
    } finally {
      setLoading(false);
    }
  }, [appointmentId, user?.id]);

  useFocusEffect(
    useCallback(() => {
      loadAppointment();
    }, [loadAppointment]),
  );

  function handleEdit() {
    if (!appointment) return;

    navigation.navigate("AddAppointment", {
      appointmentId: appointment.id,
    });
  }

  async function updateStatus(newStatus) {
    if (!appointment?.id || !user?.id || isUpdating || isDeleting) {
      return;
    }

    setIsUpdating(true);

    try {
      const { data, error: updateError } = await supabase
        .from("appointments")
        .update({ status: newStatus })
        .eq("id", appointment.id)
        .eq("user_id", user.id)
        .select("id, status")
        .single();

      if (updateError) throw updateError;

      setAppointment((current) => ({
        ...current,
        status: data.status,
      }));

      Alert.alert(
        "Success",
        newStatus === "completed"
          ? "Appointment marked as completed."
          : "Appointment cancelled successfully.",
      );
    } catch (err) {
      console.error("Error updating appointment:", err);

      Alert.alert("Error", err.message || "Could not update the appointment.");
    } finally {
      setIsUpdating(false);
    }
  }

  function handleComplete() {
    Alert.alert(
      "Complete Appointment",
      "Has this veterinary visit been completed?",
      [
        {
          text: "Not Yet",
          style: "cancel",
        },
        {
          text: "Yes, Completed",
          onPress: () => updateStatus("completed"),
        },
      ],
    );
  }

  function handleCancel() {
    Alert.alert(
      "Cancel Appointment",
      "Are you sure you want to cancel this appointment?",
      [
        {
          text: "Keep Appointment",
          style: "cancel",
        },
        {
          text: "Cancel Appointment",
          style: "destructive",
          onPress: () => updateStatus("cancelled"),
        },
      ],
    );
  }

  function handleDelete() {
    if (!appointment?.id || isDeleting) return;

    Alert.alert(
      "Delete Appointment",
      "Are you sure you want to delete this appointment? This action cannot be undone.",
      [
        {
          text: "Keep",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: confirmDelete,
        },
      ],
    );
  }

  async function confirmDelete() {
    if (!appointment?.id || !user?.id || isDeleting || isUpdating) {
      return;
    }

    setIsDeleting(true);

    try {
      const { data, error: deleteError } = await supabase
        .from("appointments")
        .delete()
        .eq("id", appointment.id)
        .eq("user_id", user.id)
        .select("id")
        .single();

      if (deleteError) throw deleteError;

      if (!data) {
        throw new Error("Appointment could not be deleted.");
      }

      Alert.alert("Deleted", "Appointment deleted successfully.", [
        {
          text: "OK",
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (err) {
      console.error("Error deleting appointment:", err);

      Alert.alert("Error", err.message || "Could not delete the appointment.");
    } finally {
      setIsDeleting(false);
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !appointment) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.header}>
          <Pressable
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </Pressable>

          <Text style={styles.headerTitle}>Appointment Details</Text>

          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.centerContainer}>
          <Ionicons
            name="alert-circle-outline"
            size={44}
            color={COLORS.error}
          />

          <Text style={styles.errorText}>
            {error || "Appointment not found."}
          </Text>

          <Pressable style={styles.retryButton} onPress={loadAppointment}>
            <Text style={styles.retryText}>Try Again</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const medicalType = getMedicalType(appointment.appointment_type);

  const isScheduled = appointment.status === "scheduled";
  const isCompleted = appointment.status === "completed";
  const isCancelled = appointment.status === "cancelled";

  const isBusy = isUpdating || isDeleting;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </Pressable>

        <Text style={styles.headerTitle}>Appointment Details</Text>

        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroCard}>
          <View style={styles.heroIcon}>
            {appointment.pets?.photo_url ? (
              <Image
                source={{ uri: appointment.pets.photo_url }}
                style={styles.petPhoto}
                resizeMode="cover"
              />
            ) : (
              <Ionicons name="paw" size={45} color={COLORS.primary} />
            )}
          </View>

          <Text style={styles.appointmentTitle}>{appointment.title}</Text>

          <View
            style={[
              styles.typeBadge,
              { backgroundColor: medicalType.background },
            ]}
          >
            <Text style={[styles.typeText, { color: medicalType.color }]}>
              {appointment.appointment_type}
            </Text>
          </View>

          <View
            style={[
              styles.statusBadge,
              isCompleted && styles.completedBadge,
              isCancelled && styles.cancelledBadge,
            ]}
          >
            <Ionicons
              name={
                isCompleted
                  ? "checkmark-circle-outline"
                  : isCancelled
                    ? "close-circle-outline"
                    : "time-outline"
              }
              size={16}
              color={
                isCompleted
                  ? COLORS.secondary
                  : isCancelled
                    ? COLORS.error
                    : COLORS.primary
              }
            />

            <Text
              style={[
                styles.statusText,
                isCompleted && styles.completedText,
                isCancelled && styles.cancelledText,
              ]}
            >
              {STATUS_LABELS[appointment.status] || "Scheduled"}
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Appointment Information</Text>

        <View style={styles.infoCard}>
          <DetailRow
            icon="paw-outline"
            label="Pet"
            value={appointment.pets?.name || "Unknown pet"}
          />

          <DetailRow
            icon="calendar-outline"
            label="Date"
            value={formatDate(appointment.appointment_date)}
          />

          <DetailRow
            icon="time-outline"
            label="Time"
            value={formatTime(appointment.appointment_time)}
          />

          <DetailRow
            icon="business-outline"
            label="Veterinary Clinic"
            value={appointment.clinic}
          />

          <DetailRow
            icon="create-outline"
            label="Notes"
            value={appointment.notes}
          />
        </View>

        {isCompleted && (
          <>
            <Text style={styles.sectionTitle}>Medical Record</Text>

            <Pressable
              style={styles.medicalCard}
              disabled={!medicalRecordId}
              onPress={() => {
                if (!medicalRecordId) return;

                navigation.getParent()?.navigate("Medical", {
                  screen: "MedicalRecordDetails",
                  initial: false,
                  params: {
                    recordId: medicalRecordId,
                  },
                });
              }}
            >
              <Ionicons
                name={
                  medicalRecordId
                    ? "checkmark-circle-outline"
                    : "document-text-outline"
                }
                size={27}
                color={COLORS.primary}
              />

              <View style={styles.medicalTextContainer}>
                <Text style={styles.medicalTitle}>
                  {medicalRecordId
                    ? "Medical Record Added"
                    : "No Medical Record Yet"}
                </Text>

                <Text style={styles.medicalSubtitle}>
                  {medicalRecordId
                    ? "This appointment is linked to a medical record."
                    : "Save the visit details and documents in Medical."}
                </Text>
              </View>

              {medicalRecordId && (
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={COLORS.textSecondary}
                />
              )}
            </Pressable>

            {!medicalRecordId && (
              <Pressable
                style={styles.addMedicalButton}
                onPress={() =>
                  navigation.getParent()?.navigate("Medical", {
                    screen: "AddMedicalRecord",
                    initial: false,
                    params: {
                      appointmentId: appointment.id,
                    },
                  })
                }
              >
                <Ionicons
                  name="medkit-outline"
                  size={21}
                  color={COLORS.surface}
                />

                <Text style={styles.addMedicalButtonText}>
                  Add to Medical Records
                </Text>
              </Pressable>
            )}
          </>
        )}

        {isScheduled && (
          <>
            <Pressable
              style={[styles.completeButton, isBusy && styles.disabledButton]}
              onPress={handleComplete}
              disabled={isBusy}
            >
              {isUpdating ? (
                <ActivityIndicator color={COLORS.surface} />
              ) : (
                <>
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={21}
                    color={COLORS.surface}
                  />

                  <Text style={styles.completeButtonText}>
                    Mark as Completed
                  </Text>
                </>
              )}
            </Pressable>

            <Pressable
              style={[styles.cancelButton, isBusy && styles.disabledButton]}
              onPress={handleCancel}
              disabled={isBusy}
            >
              <Ionicons
                name="close-circle-outline"
                size={20}
                color={COLORS.error}
              />

              <Text style={styles.cancelButtonText}>Cancel Appointment</Text>
            </Pressable>
          </>
        )}

        {!isCancelled && !medicalRecordId && (
          <Pressable
            style={[styles.editButton, isBusy && styles.disabledButton]}
            onPress={handleEdit}
            disabled={isBusy}
          >
            <Ionicons name="create-outline" size={20} color={COLORS.surface} />

            <Text style={styles.editButtonText}>Edit Appointment</Text>
          </Pressable>
        )}

        <Pressable
          style={[styles.deleteButton, isBusy && styles.disabledButton]}
          onPress={handleDelete}
          disabled={isBusy}
        >
          {isDeleting ? (
            <ActivityIndicator color={COLORS.error} />
          ) : (
            <>
              <Ionicons name="trash-outline" size={20} color={COLORS.error} />

              <Text style={styles.deleteButtonText}>Delete Appointment</Text>
            </>
          )}
        </Pressable>
      </ScrollView>
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
    paddingHorizontal: 24,
    paddingBottom: 40,
  },

  heroCard: {
    alignItems: "center",
    backgroundColor: COLORS.surface,
    padding: 28,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: 15,
  },

  heroIcon: {
    width: 100,
    height: 100,
    borderRadius: 28,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
    overflow: "hidden",
  },

  petPhoto: {
    width: "100%",
    height: "100%",
  },

  appointmentTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: COLORS.text,
    textAlign: "center",
    marginBottom: 14,
  },

  typeBadge: {
    backgroundColor: COLORS.secondaryLight,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },

  typeText: {
    color: COLORS.secondary,
    fontSize: 13,
    fontWeight: "700",
  },

  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 12,
  },

  statusText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: "700",
  },

  completedBadge: {
    backgroundColor: COLORS.secondaryLight,
  },

  completedText: {
    color: COLORS.secondary,
  },

  cancelledBadge: {
    backgroundColor: "#FDECEE",
  },

  cancelledText: {
    color: COLORS.error,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.text,
    marginTop: 28,
    marginBottom: 15,
  },

  infoCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 18,
    paddingVertical: 8,
  },

  detailRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 15,
    gap: 14,
  },

  detailIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },

  detailTextContainer: {
    flex: 1,
    paddingTop: 2,
  },

  detailLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 5,
  },

  detailValue: {
    fontSize: 15,
    color: COLORS.text,
    fontWeight: "600",
    lineHeight: 22,
  },

  medicalCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    padding: 18,
  },

  medicalTextContainer: {
    flex: 1,
  },

  medicalTitle: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 5,
  },

  medicalSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 13,
    lineHeight: 19,
  },

  completeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: COLORS.secondary,
    paddingVertical: 16,
    borderRadius: 14,
    marginTop: 30,
  },

  completeButtonText: {
    color: COLORS.surface,
    fontSize: 15,
    fontWeight: "700",
  },

  cancelButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: "#FDECEE",
    borderWidth: 1,
    borderColor: COLORS.error,
    paddingVertical: 16,
    borderRadius: 14,
    marginTop: 12,
  },

  cancelButtonText: {
    color: COLORS.error,
    fontSize: 15,
    fontWeight: "700",
  },

  editButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 14,
    marginTop: 12,
  },

  editButtonText: {
    color: COLORS.surface,
    fontSize: 15,
    fontWeight: "700",
  },

  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: "#FDECEE",
    borderWidth: 1,
    borderColor: COLORS.error,
    paddingVertical: 16,
    borderRadius: 14,
    marginTop: 12,
  },

  deleteButtonText: {
    color: COLORS.error,
    fontSize: 15,
    fontWeight: "700",
  },

  disabledButton: {
    opacity: 0.5,
  },

  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 30,
  },

  errorText: {
    fontSize: 14,
    color: COLORS.error,
    textAlign: "center",
    marginTop: 16,
    marginBottom: 20,
  },

  retryButton: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },

  retryText: {
    color: COLORS.primary,
    fontWeight: "700",
  },

  addMedicalButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: COLORS.secondary,
    paddingVertical: 16,
    borderRadius: 14,
    marginTop: 15,
  },

  addMedicalButtonText: {
    color: COLORS.surface,
    fontSize: 15,
    fontWeight: "700",
  },
});
