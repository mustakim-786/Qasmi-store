const YOUTUBE_HOSTS = new Set(['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be']);

export function isHttpsUrl(value: string | undefined | null): value is string {
  if (!value) return false;
  try { return new URL(value).protocol === 'https:'; } catch { return false; }
}

export function isSupportedVideoUrl(value: string | undefined | null): value is string {
  if (!isHttpsUrl(value)) return false;
  const url = new URL(value);
  return YOUTUBE_HOSTS.has(url.hostname) || url.hostname.endsWith('.cloudinary.com') || /\.(mp4|webm|mov)(?:$|\?)/i.test(url.pathname);
}
