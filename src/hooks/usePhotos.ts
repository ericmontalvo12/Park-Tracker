import { useState, useEffect, useCallback } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import { Photo } from '../types';
import { getPhotosForPark, addPhoto, deletePhoto } from '../db/photos';
import { savePhotoToDocuments } from '../services/photoStorage';

export function usePhotos(parkId: string) {
  const db = useSQLiteContext();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const results = await getPhotosForPark(db, parkId);
    setPhotos(results);
    setLoading(false);
  }, [db, parkId]);

  useEffect(() => { load(); }, [load]);

  const addNewPhoto = useCallback(async (pickerUri: string, caption?: string) => {
    const permanentUri = await savePhotoToDocuments(pickerUri);
    const photo = await addPhoto(db, parkId, permanentUri, caption);
    setPhotos(prev => [photo, ...prev]);
    return photo;
  }, [db, parkId]);

  const removePhoto = useCallback(async (photoId: number) => {
    await deletePhoto(db, photoId);
    setPhotos(prev => prev.filter(p => p.id !== photoId));
  }, [db]);

  return { photos, loading, addNewPhoto, removePhoto, refresh: load };
}
