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
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";

import { COLORS } from "../../constants/colors";
import { supabase } from "../../services/supabase";
import { useAuth } from "../../context/AuthContext";
import {
  getMedicalDocumentUrl,
  deleteMedicalDocument,
} from "../../services/medicalDocumentService";

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

function isImageAttachment(file) {
  return (
    file.file_type?.startsWith("image/") ||
    /\.(jpg|jpeg|png|heic|heif)$/i.test(file.file_name || "")
  );
}

export default function MedicalRecordDetailsScreen({ route, navigation }) {
  const { recordId } = route.params;
  const { user } = useAuth();

  const [record, setRecord] = useState(null);
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openingAttachmentId, setOpeningAttachmentId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
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
      // Load medical record and its attachments.
      const [recordResult, attachmentsResult] = await Promise.all([
        supabase
          .from("medical_records")
          .select(
            `
            id,
            title,
            record_type,
            record_date,
            clinic,
            notes,
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
          .single(),

        supabase
          .from("medical_attachments")
          .select("id, file_path, file_name, file_type, created_at")
          .eq("medical_record_id", recordId)
          .eq("user_id", user.id)
          .order("created_at", { ascending: true }),
      ]);

      if (recordResult.error) throw recordResult.error;
      if (attachmentsResult.error) throw attachmentsResult.error;

      // Generate signed URLs for image previews.
      const filesWithUrls = await Promise.all(
        (attachmentsResult.data || []).map(async (file) => {
          if (!isImageAttachment(file)) {
            return { ...file, previewUrl: null };
          }

          try {
            const previewUrl = await getMedicalDocumentUrl(file.file_path);

            return { ...file, previewUrl };
          } catch (previewError) {
            console.error("Could not load attachment preview:", previewError);

            return { ...file, previewUrl: null };
          }
        }),
      );

      setRecord(recordResult.data);
      setAttachments(filesWithUrls);
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

  function handleEdit() {
    navigation.navigate("EditMedicalRecord", {
      recordId: record.id,
    });
  }

  function handleDelete() {
    if (!record?.id || isDeleting) return;

    Alert.alert(
      "Delete Medical Record",
      "Are you sure you want to delete this medical record? This action cannot be undone.",
      [
        {
          text: "Cancel",
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
    if (!record?.id || !user?.id || isDeleting) return;

    setIsDeleting(true);

    try {
      // Read the current attachments directly from the database.
      const { data: files, error: filesError } = await supabase
        .from("medical_attachments")
        .select("file_path")
        .eq("medical_record_id", record.id)
        .eq("user_id", user.id);

      if (filesError) throw filesError;

      // Delete the medical record.
      // Related medical_attachments rows are removed by ON DELETE CASCADE.
      const { data: deletedRecord, error: deleteError } = await supabase
        .from("medical_records")
        .delete()
        .eq("id", record.id)
        .eq("user_id", user.id)
        .select("id")
        .single();

      if (deleteError) throw deleteError;

      if (!deletedRecord) {
        throw new Error("Medical record could not be deleted.");
      }

      // Delete the files from private Storage after the database deletion.
      // This avoids leaving database rows pointing to missing files.
      for (const file of files || []) {
        try {
          await deleteMedicalDocument(file.file_path);
        } catch (storageError) {
          console.error(
            "Could not delete medical attachment from Storage:",
            storageError,
          );
        }
      }

      Alert.alert("Deleted", "Medical record deleted successfully.", [
        {
          text: "OK",
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      console.error("Error deleting medical record:", error);

      Alert.alert(
        "Error",
        error.message || "Could not delete the medical record.",
      );
    } finally {
      setIsDeleting(false);
    }
  }

  async function handleOpenAttachment(file) {
    if (!file?.file_path || openingAttachmentId) return;

    setOpeningAttachmentId(file.id);

    try {
      // Create a fresh signed URL every time a file is opened.
      const signedUrl = await getMedicalDocumentUrl(file.file_path);

      if (!signedUrl) {
        throw new Error("Attachment is unavailable.");
      }

      const supported = await Linking.canOpenURL(signedUrl);

      if (!supported) {
        throw new Error("Cannot open this attachment.");
      }

      await Linking.openURL(signedUrl);
    } catch (err) {
      console.error("Error opening attachment:", err);

      Alert.alert("Error", err.message || "Could not open the attachment.");
    } finally {
      setOpeningAttachmentId(null);
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

        {attachments.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>
              Attachments ({attachments.length})
            </Text>

            {attachments.map((file) => {
              const isImage = isImageAttachment(file);
              const isOpening = openingAttachmentId === file.id;

              return (
                <Pressable
                  key={file.id}
                  style={styles.attachmentCard}
                  onPress={() => handleOpenAttachment(file)}
                  disabled={Boolean(openingAttachmentId)}
                >
                  {isImage && file.previewUrl ? (
                    <Image
                      source={{ uri: file.previewUrl }}
                      style={styles.attachmentPreview}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.attachmentIcon}>
                      <Ionicons
                        name={
                          isImage ? "image-outline" : "document-text-outline"
                        }
                        size={25}
                        color={COLORS.primary}
                      />
                    </View>
                  )}

                  <View style={styles.attachmentInfo}>
                    <Text style={styles.attachmentTitle} numberOfLines={2}>
                      {file.file_name || "Medical Attachment"}
                    </Text>

                    <Text style={styles.attachmentSubtitle}>
                      {isImage ? "Photo" : "PDF Document"} · Tap to open
                    </Text>
                  </View>

                  {isOpening ? (
                    <ActivityIndicator color={COLORS.primary} />
                  ) : (
                    <Ionicons
                      name="open-outline"
                      size={21}
                      color={COLORS.primary}
                    />
                  )}
                </Pressable>
              );
            })}
          </>
        )}

        <Pressable style={styles.editButton} onPress={handleEdit}>
          <Ionicons name="create-outline" size={20} color={COLORS.surface} />

          <Text style={styles.editButtonText}>Edit Medical Record</Text>
        </Pressable>

        <Pressable
          style={styles.deleteButton}
          onPress={handleDelete}
          disabled={isDeleting}
        >
          {isDeleting ? (
            <ActivityIndicator color={COLORS.error} />
          ) : (
            <>
              <Ionicons name="trash-outline" size={20} color={COLORS.error} />

              <Text style={styles.deleteButtonText}>Delete Medical Record</Text>
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
    padding: 12,
    gap: 12,
    marginBottom: 10,
  },

  attachmentIcon: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },

  attachmentPreview: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: COLORS.primaryLight,
  },

  attachmentInfo: {
    flex: 1,
  },

  attachmentTitle: {
    fontSize: 14,
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

  editButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 14,
    marginTop: 30,
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
});
