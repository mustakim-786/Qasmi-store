import { useRef, useState, useCallback, useEffect, type SetStateAction } from 'react';
import { X, Film, Image as ImageIcon, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useLang } from '@/context/LanguageContext';
import { deleteFromCloudinary, uploadToCloudinary, type CloudinaryUploadResult } from '@/lib/cloudinary';

export interface UploadedFile {
  id: string;
  file: File;
  previewUrl: string;
  dataUrl?: string;
  cloudinaryUrl?: string;
  cloudinaryPublicId?: string;
  uploadStatus: 'pending' | 'uploading' | 'done' | 'error';
  uploadError?: string;
}

export interface CropSettings {
  enabled: boolean;
  width?: number;
  height?: number;
  mode: 'fill' | 'fit' | 'scale' | 'limit';
}

export interface OptimizationSettings {
  optimizeImages: boolean;
  optimizeVideos: boolean;
  imageCrop: CropSettings;
}

interface FileUploadAreaProps {
  label: string;
  accept: string;
  multiple: boolean;
  onFilesChange: (files: SetStateAction<UploadedFile[]>) => void;
  files: UploadedFile[];
  type: 'image' | 'video';
  optimizationSettings?: OptimizationSettings;
}

const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif']);
const ALLOWED_VIDEO_TYPES = new Set(['video/mp4', 'video/webm', 'video/quicktime']);
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_VIDEO_BYTES = 100 * 1024 * 1024;

export function FileUploadArea({
  label,
  accept,
  multiple,
  onFilesChange,
  files,
  type,
  optimizationSettings,
}: FileUploadAreaProps) {
  const { t } = useLang();
  const inputRef = useRef<HTMLInputElement>(null);
  const filesRef = useRef(files);
  const [isDragging, setIsDragging] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => { filesRef.current = files; }, [files]);
  useEffect(() => () => {
    filesRef.current.forEach((file) => URL.revokeObjectURL(file.previewUrl));
  }, []);

  const handleFiles = useCallback(async (fileList: FileList) => {
    const newFiles: UploadedFile[] = [];
    const rejected: string[] = [];
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      const validType = type === 'image' ? ALLOWED_IMAGE_TYPES.has(file.type) : ALLOWED_VIDEO_TYPES.has(file.type);
      const maxBytes = type === 'image' ? MAX_IMAGE_BYTES : MAX_VIDEO_BYTES;
      if (!validType || file.size > maxBytes) {
        rejected.push(file.name);
        continue;
      }
      const previewUrl = URL.createObjectURL(file);
      newFiles.push({
        id: `file-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 7)}`,
        file,
        previewUrl,
        uploadStatus: 'uploading',
      });
    }
    setValidationError(rejected.length ? `${rejected.join(', ')} does not meet the ${type === 'image' ? 'image' : 'video'} upload policy.` : null);
    if (!newFiles.length) return;

    if (multiple) {
      onFilesChange([...files, ...newFiles]);
    } else {
      onFilesChange(newFiles.slice(0, 1));
    }

    const optimize = type === 'image' ? Boolean(optimizationSettings?.optimizeImages) : Boolean(optimizationSettings?.optimizeVideos);

    for (const newFile of newFiles) {
      try {
        const result: CloudinaryUploadResult = await uploadToCloudinary(newFile.file, {
          resourceType: type,
          optimize,
        });

        onFilesChange(prev => prev.map(f => f.id === newFile.id ? {
          ...f,
          cloudinaryUrl: result.url,
          cloudinaryPublicId: result.publicId,
          uploadStatus: 'done' as const,
        } : f));
      } catch (err) {
        onFilesChange(prev => prev.map(f => f.id === newFile.id ? {
          ...f,
          uploadStatus: 'error' as const,
          uploadError: err instanceof Error ? err.message : 'Upload failed',
        } : f));
      }
    }
  }, [files, multiple, onFilesChange, type, optimizationSettings]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  }, [handleFiles]);

  const removeFile = (id: string) => {
    const fileToRemove = files.find((f) => f.id === id);
    if (fileToRemove) URL.revokeObjectURL(fileToRemove.previewUrl);
    onFilesChange(files.filter((f) => f.id !== id));
    if (fileToRemove?.cloudinaryPublicId) {
      void deleteFromCloudinary(fileToRemove.cloudinaryPublicId, type).catch(() => {
        setValidationError('The file was removed from this form, but remote cleanup failed. Save the product and retry cleanup later.');
      });
    }
  };

  return (
    <div>
      <label className="label-field">{label}</label>
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`relative flex min-h-32 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-4 transition-all ${
          isDragging ? 'border-brand-500 bg-brand-50' : 'border-brand-200 bg-brand-50/50 hover:border-brand-400 hover:bg-brand-50'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              handleFiles(e.target.files);
            }
            e.target.value = '';
          }}
        />
        {type === 'image' ? (
          <ImageIcon className="h-8 w-8 text-brand-400" />
        ) : (
          <Film className="h-8 w-8 text-brand-400" />
        )}
        <p className="mt-2 text-sm font-medium text-muted">
          {t('Click to upload or drag and drop', 'اپ لوڈ کرنے کے لیے کلک کریں یا کھینچ کر چھوڑیں')}
        </p>
        <p className="mt-0.5 text-xs text-muted/70">
          {type === 'image'
            ? t('PNG, JPG, WEBP — uploaded to Cloudinary', 'PNG، JPG، WEBP — کلاؤڈینری پر اپ لوڈ')
            : t('MP4, WebM, MOV — uploaded to Cloudinary', 'MP4، WebM، MOV — کلاؤڈینری پر اپ لوڈ')}
        </p>
      </div>

      <div aria-live="polite">
        {validationError && <p className="mt-2 text-xs text-red-600">{validationError}</p>}
      </div>

      {files.length > 0 && (
        <div className={`mt-3 ${multiple ? 'grid grid-cols-3 gap-2 sm:grid-cols-4' : 'flex'}`}>
          {files.map((file) => (
            <div key={file.id} className={`group relative ${multiple ? '' : 'w-full max-w-48'}`}>
              {type === 'image' ? (
                <img
                  src={file.cloudinaryUrl || file.previewUrl}
                  alt={file.file.name}
                  className="h-24 w-full rounded-lg border border-brand-200 object-cover"
                />
              ) : (
                <video
                  src={file.cloudinaryUrl || file.previewUrl}
                  className="h-24 w-full rounded-lg border border-brand-200 object-cover"
                  muted
                />
              )}

              {/* Upload status overlay */}
              {file.uploadStatus === 'uploading' && (
                <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/40">
                  <Loader2 className="h-5 w-5 animate-spin text-white" />
                </div>
              )}
              {file.uploadStatus === 'done' && (
                <div className="absolute top-1 start-1 flex items-center gap-0.5 rounded-full bg-green-500/90 px-1.5 py-0.5 text-xs text-white">
                  <CheckCircle2 className="h-3 w-3" />
                </div>
              )}
              {file.uploadStatus === 'error' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center rounded-lg bg-red-500/80 px-1 text-center">
                  <AlertCircle className="h-4 w-4 text-white" />
                  <span className="mt-0.5 text-[10px] text-white" role="status">{file.uploadError || 'Upload failed. Remove the file and try again.'}</span>
                </div>
              )}

              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); removeFile(file.id); }}
                className="absolute -top-1.5 -end-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white shadow-soft transition-transform hover:scale-110 active:scale-95"
                aria-label="Remove file"
              >
                <X className="h-3.5 w-3.5" />
              </button>
              <p className="mt-1 truncate text-xs text-muted">{file.file.name}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
