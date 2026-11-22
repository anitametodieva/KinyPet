import * as FileSystem from "expo-file-system/legacy";
import * as ImageManipulator from "expo-image-manipulator";
import { decode } from "base64-arraybuffer";

import { supabase } from "./supabase";

const BUCKET = "medical-documents";
const MAX_FILE_SIZE = 10 * 1024 * 1024;

const ALLOWED_TYPES = {
  "application/pdf": "pdf",
  "image/jpeg": "jpg",
  "image/png": "png",
};

function getFileExtension(fileName = "") {
  return fileName.split(".").pop()?.toLowerCase();
}

function getMimeType(file) {
  if (file.mimeType && ALLOWED_TYPES[file.mimeType]) {
    return file.mimeType;
  }

  const extension = getFileExtension(file.name);

  if (extension === "pdf") return "application/pdf";
  if (extension === "jpg" || extension === "jpeg") return "image/jpeg";
  if (extension === "png") return "image/png";

  return null;
}

function isHeicImage(file) {
  const extension = getFileExtension(file.name);

  return (
    file.mimeType === "image/heic" ||
    file.mimeType === "image/heif" ||
    extension === "heic" ||
    extension === "heif"
  );
}

async function prepareMedicalFile(file) {
  if (!isHeicImage(file)) {
    return file;
  }

  const context = ImageManipulator.ImageManipulator.manipulate(file.uri);

  const image = await context.renderAsync();

  const result = await image.saveAsync({
    compress: 0.85,
    format: ImageManipulator.SaveFormat.JPEG,
  });

  return {
    uri: result.uri,
    name: (file.name || "medical-photo").replace(/\.(heic|heif)$/i, ".jpg"),
    mimeType: "image/jpeg",
  };
}

export async function uploadMedicalDocument(file, userId) {
  if (!file?.uri) {
    throw new Error("No document selected.");
  }

  if (!userId) {
    throw new Error("User is not authenticated.");
  }

  // Convert HEIC/HEIF images to JPEG before uploading.
  const preparedFile = await prepareMedicalFile(file);

  const mimeType = getMimeType(preparedFile);

  if (!mimeType) {
    throw new Error("Only PDF, JPG and PNG files are supported.");
  }

  const fileInfo = await FileSystem.getInfoAsync(preparedFile.uri);

  if (!fileInfo.exists) {
    throw new Error("The selected file could not be found.");
  }

  // Check the actual file size after conversion.
  const fileSize = fileInfo.size;

  if (fileSize && fileSize > MAX_FILE_SIZE) {
    throw new Error("The document must be smaller than 10 MB.");
  }

  const extension = ALLOWED_TYPES[mimeType];

  const uniqueId = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

  const documentPath = `${userId}/${uniqueId}.${extension}`;

  const base64 = await FileSystem.readAsStringAsync(preparedFile.uri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(documentPath, decode(base64), {
      contentType: mimeType,
      upsert: false,
    });

  if (error) {
    throw error;
  }

  return documentPath;
}

export async function getMedicalDocumentUrl(documentPath) {
  if (!documentPath) {
    return null;
  }

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(documentPath, 60 * 5);

  if (error) {
    throw error;
  }

  return data.signedUrl;
}

export async function deleteMedicalDocument(documentPath) {
  if (!documentPath) {
    return;
  }

  const { error } = await supabase.storage.from(BUCKET).remove([documentPath]);

  if (error) {
    throw error;
  }
}
