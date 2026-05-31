import * as ImagePicker from 'expo-image-picker';
import { supabase } from './supabase';

export async function uploadPickedImageToPublicUrl(asset: ImagePicker.ImagePickerAsset, folder: string) {
  const response = await fetch(asset.uri);
  const bytes = await response.arrayBuffer();
  const extension = asset.uri.split('.').pop()?.split('?')[0] || 'jpg';
  const safeExtension = extension.replace(/[^a-zA-Z0-9]/g, '').slice(0, 5) || 'jpg';
  const path = `${folder}/${Date.now()}.${safeExtension}`;
  const { error } = await supabase.storage
    .from('content-images')
    .upload(path, bytes, { contentType: asset.mimeType ?? 'image/jpeg', upsert: true });
  if (error) {
    throw new Error(error.message);
  }
  const { data } = supabase.storage.from('content-images').getPublicUrl(path);
  return data.publicUrl;
}
