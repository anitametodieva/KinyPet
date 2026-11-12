import { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  Pressable,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import AppButton from "../../components/AppButton";
import { COLORS } from "../../constants/colors";
import { supabase } from "../../services/supabase";
import { useAuth } from "../../context/AuthContext";

export default function PetsScreen({ navigation, route }) {
  const { user } = useAuth();

  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const loadPets = useCallback(
    async (showLoading = false) => {
      if (!user) {
        setPets([]);
        setLoading(false);
        return;
      }

      if (showLoading) {
        setLoading(true);
      }

      setError("");

      try {
        const { data, error } = await supabase
          .from("pets")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (error) throw error;

        setPets(data || []);
      } catch (error) {
        setError("Failed to load pets. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    [user?.id],
  );

  useEffect(() => {
    loadPets();
  }, [loadPets, route.params?.refresh]);

  async function handleRefresh() {
    setRefreshing(true);

    try {
      await loadPets();
    } finally {
      setRefreshing(false);
    }
  }

  function renderPet({ item }) {
    return (
      <Pressable
        style={styles.petCard}
        onPress={() =>
          navigation.navigate("PetDetails", {
            petId: item.id,
          })
        }
      >
        <View style={styles.petIcon}>
          <Ionicons name="paw" size={28} color={COLORS.primary} />
        </View>

        <View style={styles.petInfo}>
          <Text style={styles.petName}>{item.name}</Text>

          <Text style={styles.petDetails}>
            {item.species === "dog"
              ? "Dog"
              : item.species === "cat"
                ? "Cat"
                : "Other"}
            {item.breed ? ` • ${item.breed}` : ""}
          </Text>
        </View>

        <Ionicons
          name="chevron-forward"
          size={22}
          color={COLORS.textSecondary}
        />
      </Pressable>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Text style={styles.title}>My Pets 🐾</Text>

      {loading ? (
        <ActivityIndicator
          size="large"
          color={COLORS.primary}
          style={styles.center}
        />
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>

          <AppButton title="Try Again" onPress={() => loadPets(true)} />
        </View>
      ) : (
        <FlatList
          data={pets}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderPet}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[COLORS.primary]}
              tintColor={COLORS.primary}
            />
          }
          contentContainerStyle={
            pets.length === 0 ? styles.emptyList : styles.list
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="paw-outline" size={60} color={COLORS.primary} />

              <Text style={styles.emptyTitle}>No pets yet</Text>

              <Text style={styles.emptyText}>
                Add your first pet to get started!
              </Text>
            </View>
          }
        />
      )}

      <AppButton
        title="Add New Pet"
        onPress={() => navigation.navigate("AddPet")}
        style={styles.addButton}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 24,
    backgroundColor: COLORS.background,
  },

  title: {
    fontSize: 28,
    fontWeight: "700",
    color: COLORS.primary,
    marginBottom: 25,
  },

  list: {
    paddingBottom: 20,
  },

  emptyList: {
    flexGrow: 1,
    justifyContent: "center",
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  petCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  petIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },

  petInfo: {
    flex: 1,
  },

  petName: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 5,
  },

  petDetails: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },

  emptyContainer: {
    alignItems: "center",
  },

  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.text,
    marginTop: 16,
  },

  emptyText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 8,
    textAlign: "center",
  },

  errorText: {
    color: COLORS.error,
    textAlign: "center",
    marginBottom: 16,
  },

  addButton: {
    marginTop: 12,
  },
});
