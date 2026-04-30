import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Spinner } from '@palmital/ui';
import { Image, X } from 'lucide-react';
import { useUpload } from '../../hooks/useUpload';
import { api } from '../../services/api';
import { useUIStore } from '../../store/uiStore';

interface ImageUploaderProps {
  onUpload: (mediaId: string, url: string) => void;
  onRemove?: (mediaId: string) => void;
  onUploadingChange?: (isUploading: boolean) => void;
  maxFiles?: number;
}

interface UploadPreview {
  localId: string;
  mediaId?: string;
  url: string;
  kind: 'image' | 'video';
  status: 'uploading' | 'uploaded' | 'error';
}

type UploadResult = { id: string; url: string };

export interface ImageUploaderHandle {
  finalizeUploads: () => Promise<string[]>;
}

export const ImageUploader = forwardRef<ImageUploaderHandle, ImageUploaderProps>(function ImageUploader(
  {
    onUpload,
    onRemove,
    onUploadingChange,
    maxFiles = 4,
  },
  ref,
) {
  const { upload, isUploading } = useUpload();
  const addToast = useUIStore((s) => s.addToast);
  const inputRef = useRef<HTMLInputElement>(null);
  const previewUrlsRef = useRef<string[]>([]);
  const previewsRef = useRef<UploadPreview[]>([]);
  const uploadTasksRef = useRef(new Map<string, Promise<UploadResult>>());
  const [previews, setPreviews] = useState<UploadPreview[]>([]);

  function updatePreviews(
    updater: UploadPreview[] | ((current: UploadPreview[]) => UploadPreview[]),
  ) {
    setPreviews((current) => {
      const next = typeof updater === 'function' ? updater(current) : updater;
      previewsRef.current = next;
      return next;
    });
  }

  useImperativeHandle(ref, () => ({
    async finalizeUploads() {
      const pendingTasks = Array.from(uploadTasksRef.current.values());
      if (pendingTasks.length) {
        await Promise.allSettled(pendingTasks);
      }

      const failedUploads = previewsRef.current.filter((preview) => preview.status === 'error');
      if (failedUploads.length) {
        throw new Error('Existem arquivos que falharam no envio. Remova ou reenvie antes de publicar.');
      }

      return previewsRef.current
        .filter((preview) => preview.status === 'uploaded' && preview.mediaId)
        .map((preview) => preview.mediaId as string);
    },
  }));

  useEffect(() => {
    const hasPendingUploads = previews.some((preview) => preview.status === 'uploading');
    onUploadingChange?.(hasPendingUploads);
  }, [onUploadingChange, previews]);

  useEffect(() => {
    return () => {
      previewUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      previewUrlsRef.current = [];
    };
  }, []);

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    const availableSlots = Math.max(0, maxFiles - previewsRef.current.length);

    for (const file of files.slice(0, availableSlots)) {
      const localId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const previewUrl = URL.createObjectURL(file);
      const kind = file.type.startsWith('video/') ? 'video' : 'image';
      previewUrlsRef.current.push(previewUrl);

      updatePreviews((current) => [
        ...current,
        { localId, url: previewUrl, kind, status: 'uploading' },
      ]);

      const task = upload(file)
        .then((result) => {
          updatePreviews((current) =>
            current.map((preview) =>
              preview.localId === localId
                ? { ...preview, mediaId: result.id, status: 'uploaded' }
                : preview,
            ),
          );
          onUpload(result.id, result.url);
          return result;
        })
        .catch((error: any) => {
          updatePreviews((current) =>
            current.map((preview) =>
              preview.localId === localId ? { ...preview, status: 'error' } : preview,
            ),
          );
          addToast(error.response?.data?.message || error.message || 'Erro ao enviar arquivo', 'error');
          throw error;
        })
        .finally(() => {
          uploadTasksRef.current.delete(localId);
        });

      uploadTasksRef.current.set(localId, task);
    }

    if (inputRef.current) {
      inputRef.current.value = '';
    }
  }

  async function removePreview(preview: UploadPreview) {
    updatePreviews((current) => current.filter((item) => item.localId !== preview.localId));
    URL.revokeObjectURL(preview.url);
    previewUrlsRef.current = previewUrlsRef.current.filter((url) => url !== preview.url);

    if (!preview.mediaId) {
      return;
    }

    onRemove?.(preview.mediaId);

    try {
      await api.delete(`/media/${preview.mediaId}`);
    } catch {
      addToast('Nao foi possivel remover a midia do servidor', 'error');
    }
  }

  return (
    <div>
      {previews.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {previews.map((preview) => (
            <div key={preview.localId} className="relative h-20 w-20 overflow-hidden rounded-lg bg-gray-100">
              {preview.kind === 'video' ? (
                <video
                  src={preview.url}
                  className="h-full w-full object-cover"
                  muted
                  playsInline
                  preload="metadata"
                />
              ) : (
                <img src={preview.url} alt="" className="h-full w-full object-cover" />
              )}

              <div className="absolute inset-x-0 bottom-0 bg-black/55 px-1 py-0.5 text-center text-[10px] font-medium text-white">
                {preview.status === 'uploading'
                  ? 'Enviando'
                  : preview.status === 'error'
                    ? 'Falhou'
                    : preview.kind === 'video'
                      ? 'Video'
                      : 'Imagem'}
              </div>

              {preview.status === 'uploading' && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/25">
                  <Spinner size="sm" />
                </div>
              )}

              <button
                type="button"
                onClick={() => removePreview(preview)}
                className="absolute right-1 top-1 rounded-full bg-red-500 p-0.5 text-white"
                disabled={preview.status === 'uploading'}
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      {previews.length < maxFiles && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600"
          disabled={isUploading}
        >
          {isUploading ? <Spinner size="sm" /> : <Image size={18} />}
          <span>Adicionar foto ou video</span>
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,video/mp4"
        multiple
        className="hidden"
        onChange={handleChange}
      />

      <p className="mt-2 text-xs text-gray-400">
        Suporta JPG, PNG, WEBP e video MP4.
      </p>
    </div>
  );
});
