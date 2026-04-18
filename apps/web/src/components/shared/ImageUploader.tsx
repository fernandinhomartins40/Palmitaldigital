import { useRef, useState } from 'react';
import { useUpload } from '../../hooks/useUpload';
import { Spinner } from '@palmital/ui';
import { Image, X } from 'lucide-react';

interface ImageUploaderProps {
  onUpload: (mediaId: string, url: string) => void;
  maxFiles?: number;
}

export function ImageUploader({ onUpload, maxFiles = 4 }: ImageUploaderProps) {
  const { upload, isUploading } = useUpload();
  const inputRef = useRef<HTMLInputElement>(null);
  const [previews, setPreviews] = useState<{ id: string; url: string }[]>([]);

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    for (const file of files.slice(0, maxFiles - previews.length)) {
      const result = await upload(file);
      const preview = URL.createObjectURL(file);
      setPreviews((p) => [...p, { id: result.id, url: preview }]);
      onUpload(result.id, result.url);
    }
    if (inputRef.current) inputRef.current.value = '';
  }

  function removePreview(id: string) {
    setPreviews((p) => p.filter((item) => item.id !== id));
  }

  return (
    <div>
      {previews.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {previews.map((p) => (
            <div key={p.id} className="relative h-20 w-20">
              <img src={p.url} alt="" className="h-full w-full rounded-lg object-cover" />
              <button
                type="button"
                onClick={() => removePreview(p.id)}
                className="absolute -right-1 -top-1 rounded-full bg-red-500 p-0.5 text-white"
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
          <span>Adicionar foto</span>
        </button>
      )}
      <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleChange} />
    </div>
  );
}
