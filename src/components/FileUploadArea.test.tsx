import { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FileUploadArea, type UploadedFile } from './FileUploadArea';
import { uploadToCloudinary } from '@/lib/cloudinary';

vi.mock('@/context/LanguageContext', () => ({ useLang: () => ({ t: (english: string) => english }) }));
vi.mock('@/lib/cloudinary', () => ({
  deleteFromCloudinary: vi.fn(),
  uploadToCloudinary: vi.fn(),
}));

function UploadHarness() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  return <FileUploadArea label="Cover image" accept="image/jpeg" multiple={false} onFilesChange={setFiles} files={files} type="image" />;
}

describe('FileUploadArea', () => {
  beforeEach(() => {
    Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: vi.fn(() => 'blob:preview') });
    Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: vi.fn() });
  });

  afterEach(() => vi.clearAllMocks());

  it('shows the upload failure detail to the admin', async () => {
    vi.mocked(uploadToCloudinary).mockRejectedValueOnce(new Error('Upload authorization failed'));
    const { container } = render(<UploadHarness />);
    const input = container.querySelector('input[type="file"]');
    expect(input).not.toBeNull();

    fireEvent.change(input!, { target: { files: [new File(['image'], 'cover.jpg', { type: 'image/jpeg' })] } });

    expect((await screen.findByRole('status')).textContent).toContain('Upload authorization failed');
  });
});
