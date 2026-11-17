import { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Alert,
  Pressable,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { COLORS } from "../../constants/colors";
import { supabase } from "../../services/supabase";
import { useAuth } from "../../context/AuthContext";
import AppButton from "../../components/AppButton";

export default function PetDetailsScreen({ navigation, route }) {
  const { petId } = route.params;
  const { user } = useAuth();

  const [pet, setPet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    async function loadPet() {
      if (!user) {
        setError("You must be logged in.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const { data, error } = await supabase
          .from("pets")
          .select("*")
          .eq("id", petId)
          .eq("user_id", user.id)
          .single();

        if (error) throw error;

        setPet(data);
      } catch (error) {
        setError("Failed to load pet details.");
      } finally {
        setLoading(false);
      }
    }

    loadPet();
  }, [petId, user?.id, route.params?.refresh]);

  function formatDate(date) {
    if (!date) return "Not specified";

    const [year, month, day] = date.split("-");
    return `${day}.${month}.${year}`;
  }

  function formatValue(value) {
    if (value === null || value === undefined || value === "") {
      return "Not specified";
    }

    return value;
  }

  function renderDetail(icon, label, value) {
    return (
      <View style={styles.detailRow}>
        <View style={styles.detailIcon}>
          <Ionicons name={icon} size={22} color={COLORS.primary} />
        </View>

        <View style={styles.detailInfo}>
          <Text style={styles.detailLabel}>{label}</Text>
          <Text style={styles.detailValue}>{formatValue(value)}</Text>
        </View>
      </View>
    );
  }

  function confirmDelete() {
    if (deleting) return;

    Alert.alert(
      "Delete Pet",
      `Are you sure you want to delete ${pet.name}? This action cannot be undone.`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: handleDeletePet,
        },
      ],
    );
  }

  async function handleDeletePet() {
    if (deleting || !user) return;

    setDeleting(true);

    try {
      const { data, error } = await supabase
        .from("pets")
        .delete()
        .eq("id", petId)
        .eq("user_id", user.id)
        .select("id");

      if (error) throw error;

      if (!data || data.length === 0) {
        throw new Error("Pet not found or could not be deleted.");
      }

      navigation.popTo("PetsList", {
        refresh: Date.now(),
      });
    } catch (error) {
      Alert.alert(
        "Error",
        error.message || "Failed to delete pet. Please try again.",
      );
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.photoCircle}>
            {pet.photo_url ? (
              <Image source={{ uri: pet.photo_url }} style={styles.petPhoto} />
            ) : (
              <Ionicons name="paw" size={65} color={COLORS.primary} />
            )}
          </View>

          <Text style={styles.petName}>{pet.name}</Text>

          <Text style={styles.petSpecies}>
            {pet.species === "dog"
              ? "Dog"
              : pet.species === "cat"
                ? "Cat"
                : "Other"}
          </Text>
        </View>

        <View style={styles.detailsCard}>
          <Text style={styles.sectionTitle}>Pet Information</Text>

          {renderDetail("heart-outline", "Breed", pet.breed)}

          {renderDetail(
            "calendar-outline",
            "Date of Birth",
            formatDate(pet.birth_date),
          )}

          {renderDetail(
            "male-female-outline",
            "Gender",
            pet.gender
              ? pet.gender.charAt(0).toUpperCase() + pet.gender.slice(1)
              : null,
          )}

          {renderDetail(
            "scale-outline",
            "Weight",
            pet.weight != null ? `${pet.weight} kg` : null,
          )}
        </View>

        <AppButton
          title="Edit Pet"
          onPress={() => navigation.navigate("EditPet", { petId })}
          style={styles.editButton}
        />

        <Pressable
          style={[styles.deleteButton, deleting && styles.deleteButtonDisabled]}
          onPress={confirmDelete}
          disabled={deleting}
        >
          {deleting ? (
            <ActivityIndicator size="small" color={COLORS.error} />
          ) : (
            <>
              <Ionicons name="trash-outline" size={20} color={COLORS.error} />
              <Text style={styles.deleteButtonText}>Delete Pet</Text>
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

  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 25,
    paddingBottom: 40,
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
  },

  header: {
    alignItems: "center",
    marginBottom: 30,
  },

  photoCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: COLORS.primaryLight,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },

  petPhoto: {
    width: 140,
    height: 140,
    borderRadius: 70,
  },

  petName: {
    fontSize: 28,
    fontWeight: "700",
    color: COLORS.primary,
    marginBottom: 6,
  },

  petSpecies: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },

  detailsCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  sectionTitle: {
    fontSize: 19,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 20,
  },

  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },

  detailIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.primaryLight,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },

  detailInfo: {
    flex: 1,
  },

  detailLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },

  detailValue: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text,
  },

  editButton: {
    marginTop: 25,
  },

  deleteButton: {
    marginTop: 14,
    minHeight: 52,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.error,
    backgroundColor: COLORS.surface,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },

  deleteButtonDisabled: {
    opacity: 0.6,
  },

  deleteButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.error,
  },

  errorText: {
    fontSize: 15,
    color: COLORS.error,
    textAlign: "center",
    paddingHorizontal: 24,
  },
});
