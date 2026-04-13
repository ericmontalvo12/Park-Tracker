import * as FileSystem from 'expo-file-system/legacy';
import * as ImageManipulator from 'expo-image-manipulator';

const PHOTOS_DIR = `${FileSystem.documentDirectory ?? ''}park-photos/`;

async function ensurePhotoDir(): Promise<void> {
  const info = await FileSystem.getInfoAsync(PHOTOS_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(PHOTOS_DIR, { intermediates: true });
  }
}

/**
 * Resize and copy a picked photo URI to app's documentDirectory.
 * Returns the permanent file:// URI.
 */
export async function savePhotoToDocuments(sourceUri: string): Promise<string> {
  await ensurePhotoDir();

  // Resize to max 1200px wide to keep storage sane
  const manipulated = await ImageManipulator.manipulateAsync(
    sourceUri,
    [{ resize: { width: 1200 } }],
    { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
  );

  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;
  const destUri = `${PHOTOS_DIR}${filename}`;
  await FileSystem.copyAsync({ from: manipulated.uri, to: destUri });

  return destUri;
}

export async function deletePhotoFile(uri: string): Promise<void> {
  try {
    await FileSystem.deleteAsync(uri, { idempotent: true });
  } catch {
    // Ignore — file may already be gone
  }
}
