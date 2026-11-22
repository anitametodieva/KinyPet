import { useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Alert,
  Modal,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";

import { COLORS } from "../constants/colors";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_FILES = 10;

function getFileType(file) {
  const extension = file.name?.split(".").pop()?.toLowerCase();

  if (file.mimeType === "application/pdf" || extension === "pdf") {
    return "pdf";
  }

  return "image";
}

export default function MedicalDocumentPicker({ files = [], onChange }) {
  const [isPicking, setIsPicking] = useState(false);
  const [showOptions, setShowOptions] = useState(false);

  function addFiles(selectedFiles) {
    const validFiles = [];

    for (const file of selectedFiles) {
      if (!file?.uri) continue;

      if (file.size && file.size > MAX_FILE_SIZE) {
        Alert.alert(
          "File Too Large",
          `${file.name || "A file"} exceeds the 10 MB limit.`,
        );
        continue;
      }

      validFiles.push({
        ...file,
        localId: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
      });
    }

    const availableSlots = MAX_FILES - files.length;

    if (availableSlots <= 0) {
      Alert.alert(
        "Attachment Limit",
        `You can attach up to ${MAX_FILES} files.`,
      );
      return;
    }

    if (validFiles.length > availableSlots) {
      Alert.alert(
        "Attachment Limit",
        `Only ${availableSlots} more file(s) can be added.`,
      );
    }

    const filesToAdd = validFiles.slice(0, availableSlots);

    if (filesToAdd.length > 0) {
      onChange([...files, ...filesToAdd]);
    }
  }

  async function pickDocuments() {
    setShowOptions(false);

    try {
      setIsPicking(true);

      // Wait for the modal to close before opening the file picker.
      await new Promise((resolve) => setTimeout(resolve, 500));

      const result = await DocumentPicker.getDocumentAsync({
        type: [
          "application/pdf",
          "image/jpeg",
          "image/png",
          "image/heic",
          "image/heif",
        ],
        multiple: true,
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets?.length) return;

      const selectedFiles = result.assets.map((asset) => ({
        uri: asset.uri,
        name: asset.name,
        size: asset.size,
        mimeType: asset.mimeType,
      }));

      addFiles(selectedFiles);
    } catch (error) {
      console.error("Document picker error:", error);

      Alert.alert("Error", error.message || "Could not select documents.");
    } finally {
      setIsPicking(false);
    }
  }

  async function pickImages() {
    setShowOptions(false);
    setIsPicking(true);

    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          "Permission Required",
          "Please allow access to your photo library.",
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsMultipleSelection: true,
        selectionLimit: MAX_FILES - files.length,
        quality: 0.8,
      });

      if (result.canceled || !result.assets?.length) return;

      const selectedFiles = result.assets.map((asset, index) => ({
        uri: asset.uri,
        name: asset.fileName || `medical-${Date.now()}-${index}.jpg`,
        size: asset.fileSize,
        mimeType: asset.mimeType || "image/jpeg",
      }));

      addFiles(selectedFiles);
    } catch (error) {
      Alert.alert("Error", error.message || "Could not select images.");
    } finally {
      setIsPicking(false);
    }
  }

  async function takePhoto() {
    setShowOptions(false);
    setIsPicking(true);

    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          "Permission Required",
          "Please allow access to your camera.",
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ["images"],
        allowsEditing: false,
        quality: 0.8,
      });

      if (result.canceled || !result.assets?.length) return;

      const asset = result.assets[0];

      addFiles([
        {
          uri: asset.uri,
          name: asset.fileName || `medical-${Date.now()}.jpg`,
          size: asset.fileSize,
          mimeType: asset.mimeType || "image/jpeg",
        },
      ]);
    } catch (error) {
      Alert.alert("Error", error.message || "Could not take photo.");
    } finally {
      setIsPicking(false);
    }
  }

  function removeFile(localId) {
    onChange(files.filter((file) => file.localId !== localId));
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Attachments (optional)</Text>

      {files.map((file) => (
        <View key={file.localId} style={styles.selectedFile}>
          <View style={styles.fileIcon}>
            <Ionicons
              name={
                getFileType(file) === "pdf"
                  ? "document-text-outline"
                  : "image-outline"
              }
              size={23}
              color={COLORS.primary}
            />
          </View>

          <View style={styles.fileInfo}>
            <Text style={styles.fileName} numberOfLines={1}>
              {file.name || "Medical attachment"}
            </Text>

            <Text style={styles.fileType}>
              {getFileType(file) === "pdf" ? "PDF Document" : "Photo"}
            </Text>
          </View>

          <Pressable
            style={styles.removeButton}
            onPress={() => removeFile(file.localId)}
            accessibilityLabel={`Remove ${file.name || "attachment"}`}
          >
            <Ionicons name="trash-outline" size={21} color={COLORS.error} />
          </Pressable>
        </View>
      ))}

      {files.length < MAX_FILES && (
        <Pressable
          style={styles.pickButton}
          onPress={() => setShowOptions(true)}
          disabled={isPicking}
        >
          {isPicking ? (
            <ActivityIndicator color={COLORS.primary} />
          ) : (
            <Ionicons name="attach-outline" size={22} color={COLORS.primary} />
          )}

          <Text style={styles.pickText}>
            {isPicking
              ? "Opening..."
              : files.length > 0
                ? "Add More Files"
                : "Add Photos or PDFs"}
          </Text>

          <Ionicons name="add" size={20} color={COLORS.primary} />
        </Pressable>
      )}

      <Text style={styles.hint}>
        PDF, JPG, PNG or HEIC · Max 10 MB per file · Up to 10 files
      </Text>

      <Modal
        visible={showOptions}
        transparent
        animationType="fade"
        onRequestClose={() => setShowOptions(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowOptions(false)}
        >
          <Pressable
            style={styles.modalContent}
            onPress={(event) => event.stopPropagation()}
          >
            <Text style={styles.modalTitle}>Add Attachment</Text>

            <Text style={styles.modalSubtitle}>Choose an option</Text>

            <Pressable style={styles.modalOption} onPress={pickDocuments}>
              <Ionicons
                name="document-outline"
                size={22}
                color={COLORS.primary}
              />

              <Text style={styles.modalOptionText}>Choose Documents</Text>
            </Pressable>

            <Pressable style={styles.modalOption} onPress={pickImages}>
              <Ionicons
                name="images-outline"
                size={22}
                color={COLORS.primary}
              />

              <Text style={styles.modalOptionText}>Choose Photos</Text>
            </Pressable>

            <Pressable style={styles.modalOption} onPress={takePhoto}>
              <Ionicons
                name="camera-outline"
                size={22}
                color={COLORS.primary}
              />

              <Text style={styles.modalOptionText}>Take Photo</Text>
            </Pressable>

            <Pressable
              style={styles.cancelButton}
              onPress={() => setShowOptions(false)}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },

  label: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 8,
  },

  selectedFile: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    gap: 12,
  },

  fileIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },

  fileInfo: {
    flex: 1,
  },

  fileName: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text,
  },

  fileType: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
  },

  removeButton: {
    padding: 7,
  },

  pickButton: {
    height: 58,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    gap: 12,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    borderStyle: "dashed",
  },

  pickText: {
    flex: 1,
    color: COLORS.primary,
    fontSize: 15,
    fontWeight: "600",
  },

  hint: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 9,
    lineHeight: 18,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    justifyContent: "center",
    paddingHorizontal: 25,
  },

  modalContent: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 22,
  },

  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.text,
    textAlign: "center",
  },

  modalSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: "center",
    marginTop: 7,
    marginBottom: 20,
  },

  modalOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },

  modalOptionText: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.text,
  },

  cancelButton: {
    marginTop: 22,
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
  },

  cancelText: {
    color: COLORS.primary,
    fontSize: 15,
    fontWeight: "700",
  },
});
