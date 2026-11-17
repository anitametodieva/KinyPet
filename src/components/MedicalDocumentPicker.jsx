import { useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Alert,
  ActionSheetIOS,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";

import { COLORS } from "../constants/colors";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

export default function MedicalDocumentPicker({ file, onChange }) {
  const [isPicking, setIsPicking] = useState(false);

  function validateAndSelect(selectedFile) {
    if (!selectedFile?.uri) return;

    if (selectedFile.size && selectedFile.size > MAX_FILE_SIZE) {
      Alert.alert("File Too Large", "Maximum file size is 10 MB.");
      return;
    }

    onChange(selectedFile);
  }

  async function pickDocument() {
    try {
      setIsPicking(true);

      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/pdf", "image/jpeg", "image/png"],
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets?.length) return;

      const asset = result.assets[0];

      validateAndSelect({
        uri: asset.uri,
        name: asset.name,
        size: asset.size,
        mimeType: asset.mimeType,
      });
    } catch (error) {
      Alert.alert("Error", error.message || "Could not select document.");
    } finally {
      setIsPicking(false);
    }
  }

  async function pickImage() {
    try {
      setIsPicking(true);

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
        allowsEditing: false,
        quality: 0.8,
      });

      if (result.canceled || !result.assets?.length) return;

      const asset = result.assets[0];

      validateAndSelect({
        uri: asset.uri,
        name: asset.fileName || `medical-${Date.now()}.jpg`,
        size: asset.fileSize,
        mimeType: asset.mimeType || "image/jpeg",
      });
    } catch (error) {
      Alert.alert("Error", error.message || "Could not select image.");
    } finally {
      setIsPicking(false);
    }
  }

  async function takePhoto() {
    try {
      setIsPicking(true);

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

      validateAndSelect({
        uri: asset.uri,
        name: asset.fileName || `medical-${Date.now()}.jpg`,
        size: asset.fileSize,
        mimeType: asset.mimeType || "image/jpeg",
      });
    } catch (error) {
      Alert.alert("Error", error.message || "Could not take photo.");
    } finally {
      setIsPicking(false);
    }
  }

  function openPicker() {
    if (isPicking) return;

    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ["Cancel", "Choose Document", "Choose Photo", "Take Photo"],
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) pickDocument();
          if (buttonIndex === 2) pickImage();
          if (buttonIndex === 3) takePhoto();
        },
      );
    } else {
      Alert.alert("Add Attachment", "Choose an option", [
        { text: "Document", onPress: pickDocument },
        { text: "Gallery", onPress: pickImage },
        { text: "Camera", onPress: takePhoto },
        { text: "Cancel", style: "cancel" },
      ]);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Attachment (optional)</Text>

      {file ? (
        <View style={styles.selectedFile}>
          <Ionicons
            name={
              file.mimeType === "application/pdf"
                ? "document-text-outline"
                : "image-outline"
            }
            size={24}
            color={COLORS.primary}
          />

          <Text style={styles.fileName} numberOfLines={1}>
            {file.name}
          </Text>

          <Pressable
            onPress={() => onChange(null)}
            style={styles.removeButton}
            accessibilityLabel="Remove attachment"
          >
            <Ionicons name="close-circle" size={23} color={COLORS.error} />
          </Pressable>
        </View>
      ) : (
        <Pressable
          style={styles.pickButton}
          onPress={openPicker}
          disabled={isPicking}
        >
          <Ionicons name="attach-outline" size={22} color={COLORS.primary} />

          <Text style={styles.pickText}>
            {isPicking ? "Opening..." : "Add Photo or PDF"}
          </Text>

          <Ionicons name="add" size={20} color={COLORS.primary} />
        </Pressable>
      )}

      <Text style={styles.hint}>PDF, JPG or PNG · Max 10 MB</Text>
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
  },
  pickText: {
    flex: 1,
    color: COLORS.primary,
    fontSize: 15,
    fontWeight: "600",
  },
  selectedFile: {
    height: 58,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    gap: 10,
    backgroundColor: COLORS.primaryLight,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 12,
  },
  fileName: {
    flex: 1,
    color: COLORS.text,
    fontSize: 14,
  },
  removeButton: {
    padding: 4,
  },
  hint: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 7,
  },
});
