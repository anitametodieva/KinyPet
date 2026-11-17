import {
  View,
  Text,
  Image,
  Pressable,
  Platform,
  ActionSheetIOS,
  Alert,
  Keyboard,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";

import { COLORS } from "../constants/colors";

export default function PetPhotoPicker({
  photo,
  onChangePhoto,
  existingPhotoUrl = null,
}) {
  async function chooseFromGallery() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        "Permission required",
        "Please allow access to your photo library.",
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
      base64: true,
    });

    if (!result.canceled) {
      onChangePhoto(result.assets[0]);
    }
  }

  async function takePhoto() {
    const permission = await ImagePicker.requestCameraPermissionsAsync();

    if (!permission.granted) {
      Alert.alert("Permission required", "Please allow access to your camera.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
      base64: true,
    });

    if (!result.canceled) {
      onChangePhoto(result.assets[0]);
    }
  }

  function handlePhotoPress() {
    Keyboard.dismiss();

    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ["Take Photo", "Choose from Gallery", "Cancel"],
          cancelButtonIndex: 2,
        },
        (buttonIndex) => {
          if (buttonIndex === 0) takePhoto();
          if (buttonIndex === 1) chooseFromGallery();
        },
      );
    } else {
      Alert.alert("Pet Photo", "Choose an option", [
        { text: "Take Photo", onPress: takePhoto },
        { text: "Choose from Gallery", onPress: chooseFromGallery },
        { text: "Cancel", style: "cancel" },
      ]);
    }
  }

  const imageUri = photo?.uri || existingPhotoUrl;

  return (
    <View style={styles.photoSection}>
      <Pressable style={styles.photoCircle} onPress={handlePhotoPress}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.petPhoto} />
        ) : (
          <Ionicons name="paw-outline" size={54} color={COLORS.primary} />
        )}

        <View style={styles.cameraButton}>
          <Ionicons name="camera" size={19} color={COLORS.surface} />
        </View>
      </Pressable>

      <Text style={styles.photoText}>
        {imageUri ? "Change photo" : "Add a photo"}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  photoSection: {
    alignItems: "center",
    marginBottom: 10,
  },

  photoCircle: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: COLORS.border,
  },

  cameraButton: {
    position: "absolute",
    right: 0,
    bottom: 5,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.secondary,
    borderWidth: 3,
    borderColor: COLORS.background,
    alignItems: "center",
    justifyContent: "center",
  },

  photoText: {
    marginTop: 12,
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: "600",
  },

  petPhoto: {
    width: "100%",
    height: "100%",
    borderRadius: 65,
  },
});
