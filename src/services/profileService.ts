import { STORAGE_BUCKETS, supabase } from '../lib/supabase';
import { TABLES } from '../constants/database';
import { logStorageError } from '../utils/errors';
import type { Profile } from '../types/auth';

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase.from(TABLES.PROFILES).select('*').eq('id', userId).maybeSingle();
  if (error) throw error;
  return data;
}

export async function createProfileIfMissing(userId: string, displayName: string | null = null): Promise<Profile> {
  const existing = await getProfile(userId);
  if (existing) return existing;

  const { data, error } = await supabase
    .from(TABLES.PROFILES)
    .insert({ id: userId, role: 'student', display_name: displayName })
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function updateProfile(userId: string, updates: Pick<Profile, 'display_name' | 'profile_picture_url'>): Promise<Profile> {
  const { data, error } = await supabase
    .from(TABLES.PROFILES)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function fetchProfilePictureUrl(userId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from(TABLES.PROFILES)
    .select('profile_picture_url')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    logStorageError('profileService.fetchProfilePictureUrl', error);
    return null;
  }

  if (!data?.profile_picture_url) return null;

  const path = extractStoragePath(data.profile_picture_url, STORAGE_BUCKETS.AVATARS);
  if (!path) return null;

  const { data: signedUrl, error: signedUrlError } = await supabase.storage
    .from(STORAGE_BUCKETS.AVATARS)
    .createSignedUrl(path, 60 * 60);

  if (signedUrlError) {
    logStorageError('profileService.fetchProfilePictureUrl', signedUrlError);
    return null;
  }

  return signedUrl.signedUrl;
}

export async function saveProfilePicture(userId: string, dataUrl: string): Promise<string | null> {
  try {
    const blob = await dataUrlToBlob(dataUrl);
    const extension = blob.type.split('/')[1] || 'png';
    const path = `${userId}/avatar.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKETS.AVATARS)
      .upload(path, blob, { upsert: true, contentType: blob.type });

    if (uploadError) {
      logStorageError('profileService.saveProfilePicture.upload', uploadError);
      return null;
    }

    const { error: updateError } = await supabase
      .from(TABLES.PROFILES)
      .update({ profile_picture_url: path, updated_at: new Date().toISOString() })
      .eq('id', userId);

    if (updateError) {
      logStorageError('profileService.saveProfilePicture.update', updateError);
      return null;
    }

    const { data: signedUrl, error: signedUrlError } = await supabase.storage
      .from(STORAGE_BUCKETS.AVATARS)
      .createSignedUrl(path, 60 * 60);

    if (signedUrlError) {
      logStorageError('profileService.saveProfilePicture.createSignedUrl', signedUrlError);
      return null;
    }

    return signedUrl.signedUrl;
  } catch (error) {
    logStorageError('profileService.saveProfilePicture', error);
    return null;
  }
}

export async function removeProfilePicture(userId: string): Promise<boolean> {
  const { data } = await supabase
    .from(TABLES.PROFILES)
    .select('profile_picture_url')
    .eq('id', userId)
    .maybeSingle();

  if (data?.profile_picture_url) {
    const path = extractStoragePath(data.profile_picture_url, STORAGE_BUCKETS.AVATARS);
    if (path) {
      await supabase.storage.from(STORAGE_BUCKETS.AVATARS).remove([path]);
    }
  }

  const { error } = await supabase
    .from(TABLES.PROFILES)
    .update({ profile_picture_url: null, updated_at: new Date().toISOString() })
    .eq('id', userId);

  if (error) {
    logStorageError('profileService.removeProfilePicture', error);
    return false;
  }

  return true;
}

async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const response = await fetch(dataUrl);
  return response.blob();
}

function extractStoragePath(publicUrl: string, bucket: string): string | null {
  if (!publicUrl.includes('://')) return publicUrl;

  const marker = `/storage/v1/object/public/${bucket}/`;
  const index = publicUrl.indexOf(marker);
  if (index === -1) return null;
  const pathWithQuery = publicUrl.slice(index + marker.length);
  return pathWithQuery.split('?')[0] ?? null;
}
