import { useCallback, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Alert,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";

import { COLORS } from "../../constants/colors";
import { supabase } from "../../services/supabase";
import { useAuth } from "../../context/AuthContext";
import { getMedicalDocumentUrl } from "../../services/medicalDocumentService";

const RECORD_ICONS = {
  Vaccination: "shield-checkmark-outline",
  Treatment: "medkit-outline",
  Surgery: "fitness-outline",
  "Check-up": "heart-outline",
  Medication: "medical-outline",
};

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

export default function MedicalRecordDetailsScreen({ route, navigation }) {
  const { recordId } = route.params;
  const { user } = useAuth();

  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [openingDocument, setOpeningDocument] = useState(false);
  const [error, setError] = useState("");

  const loadRecord = useCallback(async () => {
    if (!user?.id || !recordId) {
      setError("Medical record not found.");
      setLoading(false);
      return;
    }

    setLoading(true);
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
        .eq("id", recordId)
        .eq("user_id", user.id)
        .single();

      if (fetchError) throw fetchError;

      setRecord(data);
    } catch (err) {
      console.error("Error loading medical record:", err);

      setError(err.message || "Could not load the medical record.");
    } finally {
      setLoading(false);
    }
  }, [recordId, user?.id]);

  useFocusEffect(
    useCallback(() => {
      loadRecord();
    }, [loadRecord]),
  );

  async function handleOpenDocument() {
    if (!record?.document_path || openingDocument) return;

    setOpeningDocument(true);

    try {
      const signedUrl = await getMedicalDocumentUrl(record.document_path);

      if (!signedUrl) {
        throw new Error("Document is unavailable.");
      }

      const supported = await Linking.canOpenURL(signedUrl);

      if (!supported) {
        throw new Error("Cannot open this document.");
      }

      await Linking.openURL(signedUrl);
    } catch (err) {
      console.error("Error opening document:", err);

      Alert.alert("Error", err.message || "Could not open the document.");
    } finally {
      setOpeningDocument(false);
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

  if (error || !record) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.header}>
          <Pressable
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </Pressable>

          <Text style={styles.headerTitle}>Medical Details</Text>

          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.centerContainer}>
          <Ionicons
            name="alert-circle-outline"
            size={44}
            color={COLORS.error}
          />

          <Text style={styles.errorText}>
            {error || "Medical record not found."}
          </Text>

          <Pressable style={styles.retryButton} onPress={loadRecord}>
            <Text style={styles.retryText}>Try Again</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const recordIcon =
    RECORD_ICONS[record.record_type] || "document-text-outline";

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </Pressable>

        <Text style={styles.headerTitle}>Medical Details</Text>

        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroCard}>
          <View style={styles.heroIcon}>
            <Ionicons name={recordIcon} size={35} color={COLORS.primary} />
          </View>

          <Text style={styles.recordTitle}>{record.title}</Text>

          <View style={styles.typeBadge}>
            <Text style={styles.typeText}>{record.record_type}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Record Information</Text>

        <View style={styles.infoCard}>
          <DetailRow
            icon="paw-outline"
            label="Pet"
            value={record.pets?.name || "Unknown pet"}
          />

          <DetailRow
            icon="calendar-outline"
            label="Date"
            value={record.record_date}
          />

          <DetailRow
            icon="business-outline"
            label="Veterinary Clinic"
            value={record.clinic}
          />

          <DetailRow icon="create-outline" label="Notes" value={record.notes} />
        </View>

        {record.document_path ? (
          <>
            <Text style={styles.sectionTitle}>Attachment</Text>

            <Pressable
              style={styles.attachmentCard}
              onPress={handleOpenDocument}
              disabled={openingDocument}
            >
              <View style={styles.attachmentIcon}>
                <Ionicons
                  name="document-attach-outline"
                  size={25}
                  color={COLORS.primary}
                />
              </View>

              <View style={styles.attachmentInfo}>
                <Text style={styles.attachmentTitle}>Medical Document</Text>

                <Text style={styles.attachmentSubtitle}>
                  Tap to open attachment
                </Text>
              </View>

              {openingDocument ? (
                <ActivityIndicator color={COLORS.primary} />
              ) : (
                <Ionicons
                  name="open-outline"
                  size={21}
                  color={COLORS.primary}
                />
              )}
            </Pressable>
          </>
        ) : null}
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
    width: 76,
    height: 76,
    borderRadius: 24,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },

  recordTitle: {
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

  attachmentCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    gap: 12,
  },

  attachmentIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },

  attachmentInfo: {
    flex: 1,
  },

  attachmentTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 5,
  },

  attachmentSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
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
});
