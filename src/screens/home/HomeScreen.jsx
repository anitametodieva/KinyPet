import { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";

import { useAuth } from "../../context/AuthContext";
import { COLORS } from "../../constants/colors";
import { getMedicalType } from "../../constants/medicalTypes";
import { supabase } from "../../services/supabase";

function formatDate(date) {
  if (!date) return "";

  const [year, month, day] = date.split("-");

  return `${day}.${month}.${year}`;
}

function formatTime(time) {
  return time ? time.slice(0, 5) : "";
}

function formatSpecies(species) {
  if (!species) return "Pet";

  return species.charAt(0).toUpperCase() + species.slice(1);
}

function SectionHeader({ title, onPress }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>

      {onPress && (
        <Pressable style={styles.seeAllButton} onPress={onPress}>
          <Text style={styles.seeAllText}>See All</Text>

          <Ionicons name="chevron-forward" size={16} color={COLORS.primary} />
        </Pressable>
      )}
    </View>
  );
}

function QuickAction({ icon, title, color, background, onPress }) {
  return (
    <Pressable style={styles.quickAction} onPress={onPress}>
      <View style={[styles.quickActionIcon, { backgroundColor: background }]}>
        <Ionicons name={icon} size={25} color={color} />
      </View>

      <Text style={styles.quickActionText}>{title}</Text>
    </Pressable>
  );
}

export default function HomeScreen({ navigation }) {
  const { user, signOut } = useAuth();

  const [pets, setPets] = useState([]);
  const [nextAppointment, setNextAppointment] = useState(null);
  const [medicalRecords, setMedicalRecords] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const firstName =
    user?.user_metadata?.full_name?.trim().split(/\s+/)[0] || "Pet Lover";

  const loadDashboard = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    setError("");

    try {
      const [petsResult, appointmentsResult, medicalResult] = await Promise.all(
        [
          supabase
            .from("pets")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false }),

          supabase
            .from("appointments")
            .select(
              `
              id,
              title,
              appointment_type,
              appointment_date,
              appointment_time,
              clinic,
              status,
              pets (
                id,
                name,
                photo_url
              )
            `,
            )
            .eq("user_id", user.id)
            .eq("status", "scheduled")
            .order("appointment_date", { ascending: true })
            .order("appointment_time", { ascending: true }),

          supabase
            .from("medical_records")
            .select(
              `
              id,
              title,
              record_type,
              record_date,
              pets (
                id,
                name
              )
            `,
            )
            .eq("user_id", user.id)
            .order("record_date", { ascending: false })
            .limit(3),
        ],
      );

      if (petsResult.error) throw petsResult.error;
      if (appointmentsResult.error) throw appointmentsResult.error;
      if (medicalResult.error) throw medicalResult.error;

      const now = new Date();

      const upcoming = (appointmentsResult.data || []).find((appointment) => {
        const appointmentDate = new Date(
          `${appointment.appointment_date}T${
            appointment.appointment_time || "23:59:59"
          }`,
        );

        return appointmentDate >= now;
      });

      setPets(petsResult.data || []);
      setNextAppointment(upcoming || null);
      setMedicalRecords(medicalResult.data || []);
    } catch (err) {
      console.error("Error loading dashboard:", err);

      setError("Could not load your dashboard. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      loadDashboard();
    }, [loadDashboard]),
  );

  async function handleRefresh() {
    setRefreshing(true);

    try {
      await loadDashboard();
    } finally {
      setRefreshing(false);
    }
  }

  async function handleLogout() {
    try {
      await signOut();
    } catch (error) {
      Alert.alert("Logout failed", error.message);
    }
  }

  function openPet(petId) {
    navigation.navigate("Pets", {
      screen: "PetDetails",
      initial: false,
      params: { petId },
    });
  }

  function openAppointment(appointmentId) {
    navigation.navigate("Appointments", {
      screen: "AppointmentDetails",
      initial: false,
      params: { appointmentId },
    });
  }

  function openMedicalRecord(recordId) {
    navigation.navigate("Medical", {
      screen: "MedicalRecordDetails",
      initial: false,
      params: { recordId },
    });
  }

  function openAddPet() {
    navigation.navigate("Pets", {
      screen: "AddPet",
      initial: false,
    });
  }

  function openAddMedicalRecord() {
    navigation.navigate("Medical", {
      screen: "AddMedicalRecord",
      initial: false,
    });
  }

  function openAddAppointment() {
    navigation.navigate("Appointments", {
      screen: "AddAppointment",
      initial: false,
    });
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
      >
        {/* Welcome header */}

        <View style={styles.header}>
          <View style={styles.brand}>
            <Ionicons name="paw" size={22} color={COLORS.primary} />

            <Text style={styles.brandText}>KinyPet</Text>
          </View>

          <Pressable
            style={styles.logoutButton}
            onPress={handleLogout}
            accessibilityLabel="Log out"
          >
            <Ionicons name="log-out-outline" size={24} color={COLORS.primary} />
          </Pressable>
        </View>

        <View style={styles.welcomeCard}>
          <View style={styles.welcomeContent}>
            <Text style={styles.welcomeLabel}>YOUR PET CARE COMPANION</Text>

            <Text style={styles.welcomeTitle}>Hello, {firstName}! 👋</Text>

            <Text style={styles.welcomeSubtitle}>
              A little care, a lot of love.
            </Text>

            <Text style={styles.welcomeDescription}>
              Everything your furry friends need, all in one place.
            </Text>
          </View>

          <Ionicons
            name="paw"
            size={100}
            color={COLORS.primary}
            style={styles.decorativePaw}
          />
        </View>

        {loading ? (
          <ActivityIndicator
            size="large"
            color={COLORS.primary}
            style={styles.loader}
          />
        ) : error ? (
          <View style={styles.emptyCard}>
            <Ionicons
              name="alert-circle-outline"
              size={38}
              color={COLORS.error}
            />

            <Text style={styles.errorText}>{error}</Text>

            <Pressable style={styles.smallButton} onPress={loadDashboard}>
              <Text style={styles.smallButtonText}>Try Again</Text>
            </Pressable>
          </View>
        ) : (
          <>
            {/* My Companions */}

            <SectionHeader
              title="My Companions"
              onPress={() => navigation.navigate("Pets")}
            />

            {pets.length > 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.petList}
              >
                {pets.map((pet) => (
                  <Pressable
                    key={pet.id}
                    style={styles.petCard}
                    onPress={() => openPet(pet.id)}
                  >
                    <View style={styles.petPhotoContainer}>
                      {pet.photo_url ? (
                        <Image
                          source={{ uri: pet.photo_url }}
                          style={styles.petPhoto}
                          resizeMode="cover"
                        />
                      ) : (
                        <Ionicons name="paw" size={45} color={COLORS.primary} />
                      )}
                    </View>

                    <View style={styles.petBadge}>
                      <Ionicons name="paw" size={15} color={COLORS.primary} />
                    </View>

                    <View style={styles.petInfo}>
                      <Text style={styles.petName} numberOfLines={1}>
                        {pet.name}
                      </Text>

                      <Text style={styles.petSpecies}>
                        {formatSpecies(pet.species)}
                      </Text>

                      {pet.breed ? (
                        <Text style={styles.petBreed} numberOfLines={1}>
                          {pet.breed}
                        </Text>
                      ) : null}
                    </View>
                  </Pressable>
                ))}

                <Pressable style={styles.addPetCard} onPress={openAddPet}>
                  <View style={styles.addPetIcon}>
                    <Ionicons name="add" size={32} color={COLORS.primary} />
                  </View>

                  <Text style={styles.addPetText}>Add Pet</Text>
                </Pressable>
              </ScrollView>
            ) : (
              <View style={styles.emptyCard}>
                <Ionicons name="paw-outline" size={42} color={COLORS.primary} />

                <Text style={styles.emptyTitle}>Meet your first companion</Text>

                <Text style={styles.emptyText}>
                  Add your pet and start your journey together.
                </Text>

                <Pressable style={styles.smallButton} onPress={openAddPet}>
                  <Text style={styles.smallButtonText}>Add Your First Pet</Text>
                </Pressable>
              </View>
            )}

            {/* Next Appointment */}

            <SectionHeader
              title="Next Appointment"
              onPress={() => navigation.navigate("Appointments")}
            />

            {nextAppointment ? (
              <Pressable
                style={styles.appointmentCard}
                onPress={() => openAppointment(nextAppointment.id)}
              >
                <View style={styles.appointmentIcon}>
                  {nextAppointment.pets?.photo_url ? (
                    <Image
                      source={{ uri: nextAppointment.pets.photo_url }}
                      style={styles.petPhoto}
                      resizeMode="cover"
                    />
                  ) : (
                    <Ionicons name="paw" size={30} color={COLORS.primary} />
                  )}
                </View>

                <View style={styles.appointmentInfo}>
                  <Text style={styles.upcomingLabel}>UPCOMING</Text>

                  <Text style={styles.appointmentTitle}>
                    {nextAppointment.title}
                  </Text>

                  <Text style={styles.appointmentPet}>
                    {nextAppointment.pets?.name || "Pet"}
                  </Text>

                  <Text style={styles.appointmentDate}>
                    {formatDate(nextAppointment.appointment_date)}
                    {nextAppointment.appointment_time
                      ? ` · ${formatTime(nextAppointment.appointment_time)}`
                      : ""}
                  </Text>

                  {nextAppointment.clinic ? (
                    <Text style={styles.appointmentClinic}>
                      {nextAppointment.clinic}
                    </Text>
                  ) : null}
                </View>

                <Ionicons
                  name="chevron-forward"
                  size={21}
                  color={COLORS.primary}
                />
              </Pressable>
            ) : (
              <View style={styles.emptyAppointment}>
                <View style={styles.appointmentIcon}>
                  <Ionicons
                    name="calendar-outline"
                    size={27}
                    color={COLORS.primary}
                  />
                </View>

                <View style={styles.appointmentInfo}>
                  <Text style={styles.emptyTitle}>
                    No upcoming appointments
                  </Text>

                  <Text style={styles.emptyTextLeft}>
                    Your next vet visit will appear here.
                  </Text>

                  <Pressable onPress={openAddAppointment}>
                    <Text style={styles.textLink}>Schedule a visit</Text>
                  </Pressable>
                </View>
              </View>
            )}

            {/* Quick Actions */}

            <SectionHeader title="Quick Actions" />

            <View style={styles.quickActionsRow}>
              <QuickAction
                icon="paw-outline"
                title="Add Pet"
                color={COLORS.primary}
                background={COLORS.primaryLight}
                onPress={openAddPet}
              />

              <QuickAction
                icon="medkit-outline"
                title="Add Record"
                color={COLORS.secondary}
                background={COLORS.secondaryLight}
                onPress={openAddMedicalRecord}
              />

              <QuickAction
                icon="calendar-outline"
                title="Add Visit"
                color={COLORS.primary}
                background={COLORS.primaryLight}
                onPress={openAddAppointment}
              />
            </View>

            {/* Recent Medical Records */}

            <SectionHeader
              title="Recent Records"
              onPress={() => navigation.navigate("Medical")}
            />

            {medicalRecords.length > 0 ? (
              medicalRecords.map((record) => {
                const medicalType = getMedicalType(record.record_type);

                return (
                  <Pressable
                    key={record.id}
                    style={styles.recordCard}
                    onPress={() => openMedicalRecord(record.id)}
                  >
                    <View
                      style={[
                        styles.recordIcon,
                        { backgroundColor: medicalType.background },
                      ]}
                    >
                      <MaterialCommunityIcons
                        name={medicalType.icon}
                        size={26}
                        color={medicalType.color}
                      />
                    </View>

                    <View style={styles.recordInfo}>
                      <Text style={styles.recordTitle}>{record.title}</Text>

                      <Text style={styles.recordSubtitle}>
                        {record.pets?.name || "Pet"} ·{" "}
                        <Text
                          style={{
                            color: medicalType.color,
                            fontWeight: "600",
                          }}
                        >
                          {record.record_type}
                        </Text>
                      </Text>

                      <Text style={styles.recordDate}>
                        {formatDate(record.record_date)}
                      </Text>
                    </View>

                    <Ionicons
                      name="chevron-forward"
                      size={19}
                      color={COLORS.textSecondary}
                    />
                  </Pressable>
                );
              })
            ) : (
              <View style={styles.emptyCard}>
                <Ionicons
                  name="medkit-outline"
                  size={36}
                  color={COLORS.secondary}
                />

                <Text style={styles.emptyTitle}>No medical records yet</Text>

                <Text style={styles.emptyText}>
                  Keep your pet's health history in one place.
                </Text>
              </View>
            )}

            <View style={styles.footer}>
              <Ionicons name="heart-outline" size={17} color={COLORS.primary} />

              <Text style={styles.footerText}>Made for the paws you love.</Text>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  scrollContent: {
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: 30,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 22,
  },

  brand: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  brandText: {
    fontSize: 24,
    fontWeight: "800",
    color: COLORS.primary,
  },

  logoutButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },

  welcomeCard: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: 24,
    padding: 22,
    overflow: "hidden",
    minHeight: 175,
    justifyContent: "center",
  },

  welcomeContent: {
    zIndex: 1,
  },

  welcomeLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.3,
    color: COLORS.primary,
    marginBottom: 12,
  },

  welcomeTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: COLORS.text,
    marginBottom: 7,
  },

  welcomeSubtitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.primary,
    marginBottom: 9,
  },

  welcomeDescription: {
    fontSize: 13,
    lineHeight: 20,
    color: COLORS.textSecondary,
    maxWidth: 235,
  },

  decorativePaw: {
    position: "absolute",
    right: -15,
    bottom: -15,
    opacity: 0.12,
    transform: [{ rotate: "-25deg" }],
  },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 28,
    marginBottom: 15,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.text,
  },

  seeAllButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },

  seeAllText: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.primary,
  },

  petList: {
    gap: 12,
    paddingBottom: 5,
  },

  petCard: {
    width: 140,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: "hidden",
  },

  petPhotoContainer: {
    height: 125,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },

  petPhoto: {
    width: "100%",
    height: "100%",
  },

  petBadge: {
    position: "absolute",
    top: 108,
    right: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.surface,
    alignItems: "center",
    justifyContent: "center",
  },

  petInfo: {
    padding: 12,
    paddingTop: 15,
  },

  petName: {
    fontSize: 17,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 4,
  },

  petSpecies: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },

  petBreed: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 4,
  },

  addPetCard: {
    width: 100,
    borderRadius: 20,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },

  addPetIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },

  addPetText: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.primary,
  },

  appointmentCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 17,
    backgroundColor: COLORS.primaryLight,
    borderRadius: 20,
  },

  appointmentIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },

  appointmentInfo: {
    flex: 1,
  },

  upcomingLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
    color: COLORS.primary,
    marginBottom: 6,
  },

  appointmentTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 5,
  },

  appointmentPet: {
    fontSize: 14,
    color: COLORS.text,
    marginBottom: 5,
  },

  appointmentDate: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },

  appointmentClinic: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
  },

  emptyAppointment: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 17,
    backgroundColor: COLORS.primaryLight,
    borderRadius: 20,
  },

  quickActionsRow: {
    flexDirection: "row",
    gap: 12,
  },

  quickAction: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 17,
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  quickActionIcon: {
    width: 49,
    height: 49,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },

  quickActionText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.text,
  },

  recordCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 17,
    padding: 15,
    gap: 12,
    marginBottom: 10,
  },

  recordIcon: {
    width: 48,
    height: 48,
    borderRadius: 15,
    backgroundColor: COLORS.secondaryLight,
    alignItems: "center",
    justifyContent: "center",
  },

  recordInfo: {
    flex: 1,
  },

  recordTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 4,
  },

  recordSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },

  recordDate: {
    fontSize: 12,
    color: COLORS.primary,
    marginTop: 5,
  },

  emptyCard: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 20,
    padding: 22,
    alignItems: "center",
  },

  emptyTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.text,
    marginTop: 5,
    marginBottom: 6,
  },

  emptyText: {
    fontSize: 13,
    lineHeight: 19,
    color: COLORS.textSecondary,
    textAlign: "center",
  },

  emptyTextLeft: {
    fontSize: 13,
    lineHeight: 19,
    color: COLORS.textSecondary,
  },

  smallButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 16,
  },

  smallButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.surface,
  },

  textLink: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: "700",
    marginTop: 10,
  },

  loader: {
    marginTop: 40,
  },

  errorText: {
    color: COLORS.error,
    textAlign: "center",
    marginTop: 12,
  },

  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 7,
    marginTop: 30,
    marginBottom: 10,
  },

  footerText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
});
