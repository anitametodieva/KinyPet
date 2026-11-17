import { decode } from "base64-arraybuffer";
import { supabase } from "./supabase";

const BUCKET_NAME = "pet-photos";

// Upload a pet photo to Supabase Storage
export async function uploadPetPhoto(photo, userId) {
  if (!photo?.base64) {
    throw new Error("Could not process the selected photo.");
  }

  if (!userId) {
    throw new Error("User is not authenticated.");
  }

  const filePath = `${userId}/${Date.now()}.jpg`;

  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, decode(photo.base64), {
      contentType: "image/jpeg",
      upsert: false,
    });

  if (error) {
    throw error;
  }

  const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filePath);

  return {
    photoUrl: data.publicUrl,
    filePath,
  };
}

// Delete a pet photo from Supabase Storage
export async function deletePetPhoto(photoUrl, userId) {
  if (!photoUrl || !userId) return;

  const marker = `/storage/v1/object/public/${BUCKET_NAME}/`;

  if (!photoUrl.includes(marker)) return;

  const filePath = decodeURIComponent(photoUrl.split(marker)[1].split("?")[0]);

  // Only delete photos belonging to the current user
  if (!filePath.startsWith(`${userId}/`)) return;

  const { error } = await supabase.storage.from(BUCKET_NAME).remove([filePath]);

  if (error) {
    throw error;
  }
}
