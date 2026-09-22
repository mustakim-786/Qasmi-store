import { supabase } from '@/lib/supabase';

interface SignResponse {
  signature: string;
  timestamp: number;
  apiKey: string;
  cloudName: string;
  folder: string;
  resourceType: 'image' | 'video';
  tags: string;
  eager?: string;
  allowedFormats: string;
}

async function getSignature(params: {
  resourceType: 'image' | 'video';
  optimize?: boolean;
  fileName: string;
  fileSize: number;
  mimeType: string;
}): Promise<SignResponse> {
  const { data, error } = await supabase.functions.invoke<SignResponse>('cloudinary-sign', {
    body: params,
  });
  if (error || !data) throw new Error('Unable to authorize this upload.');
  return data;
}

export interface CloudinaryUploadResult {
  url: string;
  publicId: string;
  secureUrl: string;
  width?: number;
  height?: number;
  format?: string;
  resourceType: string;
}

export async function uploadToCloudinary(
  file: File,
  options: {
    resourceType: 'image' | 'video';
    optimize?: boolean;
  }
): Promise<CloudinaryUploadResult> {
  const { resourceType, optimize } = options;
  const sign = await getSignature({
    resourceType,
    optimize: Boolean(optimize),
    fileName: file.name,
    fileSize: file.size,
    mimeType: file.type,
  });

  const formData = new FormData();
  formData.append('file', file);
  formData.append('signature', sign.signature);
  formData.append('timestamp', String(sign.timestamp));
  formData.append('api_key', sign.apiKey);
  formData.append('folder', sign.folder);
  formData.append('tags', sign.tags);
  formData.append('allowed_formats', sign.allowedFormats);

  if (sign.eager) {
    formData.append('eager', sign.eager);
  }

  const uploadUrl = `https://api.cloudinary.com/v1_1/${sign.cloudName}/${resourceType}/upload`;
  const response = await fetch(uploadUrl, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Upload failed' }));
    throw new Error(error.error?.message || 'Upload failed');
  }

  const result = await response.json();

  let url = result.secure_url;
  if (optimize) {
    url = applyOptimizations(url, resourceType);
  }

  return {
    url,
    publicId: result.public_id,
    secureUrl: result.secure_url,
    width: result.width,
    height: result.height,
    format: result.format,
    resourceType,
  };
}

export async function deleteFromCloudinary(publicId: string, resourceType: 'image' | 'video'): Promise<void> {
  const { error } = await supabase.functions.invoke('cloudinary-delete', {
    body: { publicId, resourceType },
  });
  if (error) throw new Error('Media cleanup could not be completed. You can retry it safely.');
}

export function applyOptimizations(
  url: string,
  resourceType: 'image' | 'video',
  options?: { width?: number; height?: number; crop?: string; quality?: string }
): string {
  if (!url.includes('cloudinary.com')) return url;

  const parts = url.split('/upload/');
  if (parts.length !== 2) return url;

  const transforms: string[] = [];

  if (resourceType === 'image') {
    transforms.push('f_auto', 'q_auto');
    if (options?.width) transforms.push(`w_${options.width}`);
    if (options?.height) transforms.push(`h_${options.height}`);
    if (options?.crop) transforms.push(`c_${options.crop}`);
  } else if (resourceType === 'video') {
    transforms.push('f_auto', 'q_auto');
    if (options?.width) transforms.push(`w_${options.width}`);
    if (options?.height) transforms.push(`h_${options.height}`);
    if (options?.crop) transforms.push(`c_${options.crop}`);
  }

  return `${parts[0]}/upload/${transforms.join(',')}/${parts[1]}`;
}

export function buildOptimizedUrl(
  publicIdOrUrl: string,
  cloudName: string,
  resourceType: 'image' | 'video',
  transforms: string[]
): string {
  const baseUrl = `https://res.cloudinary.com/${cloudName}/${resourceType}/upload/`;
  if (publicIdOrUrl.startsWith(baseUrl)) {
    const parts = publicIdOrUrl.split('/upload/');
    return `${parts[0]}/upload/${transforms.join(',')}/${parts[1]}`;
  }
  return `${baseUrl}${transforms.join(',')}/${publicIdOrUrl}`;
}

export function getCloudinaryPoster(videoUrl: string): string {
  if (!videoUrl.includes('cloudinary.com')) return '';
  const parts = videoUrl.split('/upload/');
  if (parts.length !== 2) return '';
  return `${parts[0]}/upload/f_auto,q_auto,so_0/${parts[1].replace(/\.(mp4|webm|mov)$/i, '.jpg')}`;
}

export function getOptimizedVideoUrl(videoUrl: string): string {
  if (!videoUrl.includes('cloudinary.com')) return videoUrl;
  const parts = videoUrl.split('/upload/');
  if (parts.length !== 2) return videoUrl;
  return `${parts[0]}/upload/f_auto,q_auto,vs_auto/${parts[1]}`;
}
