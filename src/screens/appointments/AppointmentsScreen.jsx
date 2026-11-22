import { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";

import { COLORS } from "../../constants/colors";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../services/supabase";

const APPOINTMENT_ICONS = {
  Vaccination: "shield-checkmark-outline",
  Treatment: "medkit-outline",
  Surgery: "fitness-outline",
  "Check-up": "heart-outline",
  Medication: "medical-outline",
  Other: "calendar-outline",
};

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

function isUpcoming(appointment) {
  // Completed and cancelled appointments belong in Past.
  if (appointment.status !== "scheduled") {
    return false;
  }

  const date = appointment.appointment_date;
  const time = appointment.appointment_time;

  if (!date || !time) return false;

  const appointmentDate = new Date(`${date}T${time}`);

  return appointmentDate.getTime() >= Date.now();
}

export default function AppointmentsScreen({ navigation }) {
  const { user } = useAuth();

  const [appointments, setAppointments] = useState([]);
  const [activeTab, setActiveTab] = useState("upcoming");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadAppointments = useCallback(
    async (showLoader = true) => {
      if (!user?.id) {
        setAppointments([]);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      if (showLoader) {
        setLoading(true);
      }

      setError("");

      try {
        const { data, error: fetchError } = await supabase
          .from("appointments")
          .select(
            `
            id,
            title,
            appointment_type,
            appointment_date,
            appointment_time,
            clinic,
            notes,
            pet_id,
            status,
            pets (
              id,
              name,
              species
            )
          `,
          )
          .eq("user_id", user.id)
          .order("appointment_date", { ascending: true })
          .order("appointment_time", { ascending: true });

        if (fetchError) {
          throw fetchError;
        }

        setAppointments(data || []);
      } catch (err) {
        console.error("Error loading appointments:", err);

        setError(err.message || "Could not load appointments.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [user?.id],
  );

  useFocusEffect(
    useCallback(() => {
      loadAppointments();
    }, [loadAppointments]),
  );

  function handleRefresh() {
    setRefreshing(true);
    loadAppointments(false);
  }

  function handleAddAppointment() {
    navigation.navigate("AddAppointment");
  }

  function handleAppointmentPress(appointment) {
    navigation.navigate("AppointmentDetails", {
      appointmentId: appointment.id,
    });
  }

  const upcomingAppointments = appointments.filter(isUpcoming);

  const pastAppointments = appointments
    .filter((appointment) => !isUpcoming(appointment))
    .reverse();

  const displayedAppointments =
    activeTab === "upcoming" ? upcomingAppointments : pastAppointments;

  function renderAppointment({ item }) {
    const icon = APPOINTMENT_ICONS[item.appointment_type] || "calendar-outline";

    const isCompleted = item.status === "completed";
    const isCancelled = item.status === "cancelled";

    return (
      <TouchableOpacity
        style={styles.appointmentCard}
        activeOpacity={0.8}
        onPress={() => handleAppointmentPress(item)}
      >
        <View style={styles.appointmentIcon}>
          <Ionicons name={icon} size={25} color={COLORS.primary} />
        </View>

        <View style={styles.appointmentInfo}>
          <Text style={styles.appointmentTitle}>{item.title}</Text>

          <Text style={styles.petName}>{item.pets?.name || "Unknown pet"}</Text>

          <View style={styles.appointmentMeta}>
            <Ionicons
              name="calendar-outline"
              size={14}
              color={COLORS.textSecondary}
            />

            <Text style={styles.metaText}>
              {formatDate(item.appointment_date)}
            </Text>

            <Ionicons
              name="time-outline"
              size={14}
              color={COLORS.textSecondary}
            />

            <Text style={styles.metaText}>
              {formatTime(item.appointment_time)}
            </Text>
          </View>

          <View style={styles.typeRow}>
            <Text style={styles.appointmentType}>{item.appointment_type}</Text>
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
              size={14}
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
              {STATUS_LABELS[item.status] || "Scheduled"}
            </Text>
          </View>

          {item.clinic ? (
            <View style={styles.clinicRow}>
              <Ionicons
                name="location-outline"
                size={14}
                color={COLORS.textSecondary}
              />

              <Text style={styles.clinicText} numberOfLines={1}>
                {item.clinic}
              </Text>
            </View>
          ) : null}
        </View>

        <Ionicons
          name="chevron-forward"
          size={20}
          color={COLORS.textSecondary}
        />
      </TouchableOpacity>
    );
  }

  function renderEmpty() {
    const upcoming = activeTab === "upcoming";

    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIcon}>
          <Ionicons
            name={upcoming ? "calendar-outline" : "time-outline"}
            size={44}
            color={COLORS.primary}
          />
        </View>

        <Text style={styles.emptyTitle}>
          {upcoming ? "No upcoming appointments" : "No past appointments"}
        </Text>

        <Text style={styles.emptyText}>
          {upcoming
            ? "Keep track of your pets' veterinary visits and never miss an appointment."
            : "Your pets' previous veterinary appointments will appear here."}
        </Text>

        {upcoming && (
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={handleAddAppointment}
          >
            <Ionicons name="add" size={20} color={COLORS.surface} />

            <Text style={styles.emptyButtonText}>Add Appointment</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.title}>Appointments</Text>

          <Text style={styles.subtitle}>Your pets' veterinary visits</Text>
        </View>

        <TouchableOpacity
          style={styles.addButton}
          onPress={handleAddAppointment}
        >
          <Ionicons name="add" size={27} color={COLORS.surface} />
        </TouchableOpacity>
      </View>

      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === "upcoming" && styles.activeTabButton,
          ]}
          onPress={() => setActiveTab("upcoming")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "upcoming" && styles.activeTabText,
            ]}
          >
            Upcoming ({upcomingAppointments.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === "past" && styles.activeTabButton,
          ]}
          onPress={() => setActiveTab("past")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "past" && styles.activeTabText,
            ]}
          >
            Past ({pastAppointments.length})
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <Ionicons
            name="alert-circle-outline"
            size={42}
            color={COLORS.error}
          />

          <Text style={styles.errorText}>{error}</Text>

          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => loadAppointments()}
          >
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={displayedAppointments}
          keyExtractor={(item) => item.id}
          renderItem={renderAppointment}
          contentContainerStyle={[
            styles.listContent,
            displayedAppointments.length === 0 && styles.emptyList,
          ]}
          ListEmptyComponent={renderEmpty}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={COLORS.primary}
              colors={[COLORS.primary]}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 22,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  headerText: {
    flex: 1,
    paddingRight: 12,
  },

  title: {
    fontSize: 28,
    fontWeight: "700",
    color: COLORS.text,
  },

  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 5,
  },

  addButton: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },

  tabsContainer: {
    flexDirection: "row",
    backgroundColor: COLORS.primaryLight,
    marginHorizontal: 20,
    padding: 5,
    borderRadius: 16,
    marginBottom: 22,
  },

  tabButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  activeTabButton: {
    backgroundColor: COLORS.surface,
  },

  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textSecondary,
  },

  activeTabText: {
    color: COLORS.primary,
    fontWeight: "700",
  },

  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 35,
  },

  emptyList: {
    flexGrow: 1,
  },

  appointmentCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  appointmentIcon: {
    width: 50,
    height: 50,
    borderRadius: 15,
    backgroundColor: COLORS.primaryLight,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },

  appointmentInfo: {
    flex: 1,
  },

  appointmentTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 5,
  },

  petName: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.primary,
    marginBottom: 8,
  },

  appointmentMeta: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 8,
  },

  metaText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginRight: 8,
  },

  typeRow: {
    flexDirection: "row",
    marginBottom: 5,
  },

  appointmentType: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.secondary,
  },

  clinicRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 5,
    gap: 5,
  },

  clinicText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    flex: 1,
  },

  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 6,
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    marginTop: 5,
    marginBottom: 7,
  },

  statusText: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.primary,
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
    marginTop: 15,
    marginBottom: 20,
  },

  retryButton: {
    paddingHorizontal: 25,
    paddingVertical: 12,
    backgroundColor: COLORS.primaryLight,
    borderRadius: 12,
  },

  retryText: {
    color: COLORS.primary,
    fontWeight: "700",
  },

  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 25,
    paddingBottom: 70,
  },

  emptyIcon: {
    width: 100,
    height: 100,
    borderRadius: 30,
    backgroundColor: COLORS.primaryLight,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 25,
  },

  emptyTitle: {
    fontSize: 21,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 10,
    textAlign: "center",
  },

  emptyText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 25,
  },

  emptyButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primary,
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
  },

  emptyButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.surface,
  },
});
