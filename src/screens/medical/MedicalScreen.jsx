import { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";

import { COLORS } from "../../constants/colors";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../services/supabase";

const RECORD_ICONS = {
  Vaccination: "shield-checkmark-outline",
  Treatment: "medkit-outline",
  Surgery: "fitness-outline",
  "Check-up": "heart-outline",
  Medication: "medical-outline",
};

export default function MedicalScreen({ navigation }) {
  const { user } = useAuth();

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadRecords = useCallback(
    async (showLoader = true) => {
      if (!user?.id) {
        setRecords([]);
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
          .from("medical_records")
          .select(
            `
          id,
          title,
          record_type,
          record_date,
          clinic,
          notes,
          document_path,
          pet_id,
          pets (
            id,
            name,
            species
          )
        `,
          )
          .eq("user_id", user.id)
          .order("record_date", { ascending: false });

        if (fetchError) {
          throw fetchError;
        }

        setRecords(data || []);
      } catch (err) {
        console.error("Error loading medical records:", err);

        setError(err.message || "Could not load medical records.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [user?.id],
  );

  useFocusEffect(
    useCallback(() => {
      loadRecords();
    }, [loadRecords]),
  );

  function handleRefresh() {
    setRefreshing(true);
    loadRecords(false);
  }

  function handleAddRecord() {
    navigation.navigate("AddMedicalRecord");
  }

  function handleRecordPress(record) {
    navigation.navigate("MedicalRecordDetails", {
      recordId: record.id,
    });
  }

  function renderRecord({ item }) {
    const icon = RECORD_ICONS[item.record_type] || "document-text-outline";

    return (
      <TouchableOpacity
        style={styles.recordCard}
        activeOpacity={0.8}
        onPress={() => handleRecordPress(item)}
      >
        <View style={styles.recordIcon}>
          <Ionicons name={icon} size={25} color={COLORS.primary} />
        </View>

        <View style={styles.recordInfo}>
          <Text style={styles.recordTitle}>{item.title}</Text>

          <Text style={styles.petName}>{item.pets?.name || "Unknown pet"}</Text>

          <View style={styles.recordMeta}>
            <Text style={styles.recordType}>{item.record_type}</Text>

            <Text style={styles.metaSeparator}>•</Text>

            <Text style={styles.recordDate}>{item.record_date}</Text>
          </View>

          {item.clinic ? (
            <Text style={styles.clinic} numberOfLines={1}>
              {item.clinic}
            </Text>
          ) : null}

          {item.document_path ? (
            <View style={styles.attachmentRow}>
              <Ionicons
                name="attach-outline"
                size={16}
                color={COLORS.secondary}
              />

              <Text style={styles.attachmentText}>Attachment</Text>
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
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIcon}>
          <Ionicons name="medkit-outline" size={44} color={COLORS.primary} />
        </View>

        <Text style={styles.emptyTitle}>No medical records yet</Text>

        <Text style={styles.emptyText}>
          Keep your pet's health history organized in one place.
        </Text>

        <TouchableOpacity style={styles.emptyButton} onPress={handleAddRecord}>
          <Ionicons name="add" size={20} color={COLORS.surface} />

          <Text style={styles.emptyButtonText}>Add Medical Record</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Medical Records</Text>

          <Text style={styles.subtitle}>Your pets' health history</Text>
        </View>

        <TouchableOpacity style={styles.addButton} onPress={handleAddRecord}>
          <Ionicons name="add" size={27} color={COLORS.surface} />
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
            onPress={() => loadRecords()}
          >
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={records}
          keyExtractor={(item) => item.id}
          renderItem={renderRecord}
          contentContainerStyle={[
            styles.listContent,
            records.length === 0 && styles.emptyList,
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

  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 35,
  },

  emptyList: {
    flexGrow: 1,
  },

  recordCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  recordIcon: {
    width: 50,
    height: 50,
    borderRadius: 15,
    backgroundColor: COLORS.primaryLight,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },

  recordInfo: {
    flex: 1,
  },

  recordTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 5,
  },

  petName: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.primary,
    marginBottom: 6,
  },

  recordMeta: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },

  recordType: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },

  metaSeparator: {
    marginHorizontal: 7,
    color: COLORS.textSecondary,
  },

  recordDate: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },

  clinic: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 6,
  },

  attachmentRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 7,
  },

  attachmentText: {
    fontSize: 12,
    color: COLORS.secondary,
    marginLeft: 4,
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
