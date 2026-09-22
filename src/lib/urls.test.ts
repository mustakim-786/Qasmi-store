import { describe, expect, it } from 'vitest';
import { isHttpsUrl, isSupportedVideoUrl } from './urls';

describe('external URL validation', () => {
  it('allows HTTPS URLs only', () => {
    expect(isHttpsUrl('https://example.com/logo.png')).toBe(true);
    expect(isHttpsUrl('http://example.com/logo.png')).toBe(false);
    expect(isHttpsUrl('javascript:alert(1)')).toBe(false);
  });

  it('allows only supported video providers and formats', () => {
    expect(isSupportedVideoUrl('https://res.cloudinary.com/demo/video/upload/sample.mp4')).toBe(true);
    expect(isSupportedVideoUrl('https://youtu.be/example')).toBe(true);
    expect(isSupportedVideoUrl('https://example.com/file.mp4')).toBe(true);
    expect(isSupportedVideoUrl('https://example.com/file.exe')).toBe(false);
    expect(isSupportedVideoUrl('http://youtu.be/example')).toBe(false);
  });
});
