import * as FileSystem from "expo-file-system/legacy";
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

export async function uploadMedicalDocument(file, userId) {
  if (!file?.uri) {
    throw new Error("No document selected.");
  }

  if (!userId) {
    throw new Error("User is not authenticated.");
  }

  const mimeType = getMimeType(file);

  if (!mimeType) {
    throw new Error("Only PDF, JPG and PNG files are supported.");
  }

  const fileInfo = await FileSystem.getInfoAsync(file.uri);

  if (!fileInfo.exists) {
    throw new Error("The selected file could not be found.");
  }

  const fileSize = file.size ?? fileInfo.size;

  if (fileSize && fileSize > MAX_FILE_SIZE) {
    throw new Error("The document must be smaller than 10 MB.");
  }

  const extension = ALLOWED_TYPES[mimeType];

  const uniqueId = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

  const documentPath = `${userId}/${uniqueId}.${extension}`;

  const base64 = await FileSystem.readAsStringAsync(file.uri, {
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
