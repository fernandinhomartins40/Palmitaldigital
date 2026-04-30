import { useEffect, useState } from 'react';
import Cropper, { type Area } from 'react-easy-crop';
import { Button, Spinner } from '@palmital/ui';
import { cropImageFile } from '../../utils/cropImage';
import { useUIStore } from '../../store/uiStore';
import 'react-easy-crop/react-easy-crop.css';

interface ImageCropDialogProps {
  open: boolean;
  file: File | null;
  title: string;
  aspect: number;
  cropShape?: 'rect' | 'round';
  outputWidth: number;
  outputHeight: number;
  quality?: number;
  onCancel: () => void;
  onConfirm: (file: File) => void;
}

export function ImageCropDialog({
  open,
  file,
  title,
  aspect,
  cropShape = 'rect',
  outputWidth,
  outputHeight,
  quality,
  onCancel,
  onConfirm,
}: ImageCropDialogProps) {
  const addToast = useUIStore((s) => s.addToast);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!file) {
      setImageUrl(null);
      return;
    }

    const nextUrl = URL.createObjectURL(file);
    setImageUrl(nextUrl);
    setCrop({ x: 0, y: 0 });
    setZoom(1);

    return () => URL.revokeObjectURL(nextUrl);
  }, [file]);

  if (!open || !file || !imageUrl) {
    return null;
  }

  async function handleConfirm() {
    if (!file || !croppedAreaPixels) {
      addToast('Ajuste o recorte antes de continuar', 'error');
      return;
    }

    setIsProcessing(true);
    try {
      const croppedFile = await cropImageFile(file, croppedAreaPixels, {
        fileName: file.name,
        width: outputWidth,
        height: outputHeight,
        quality,
      });
      onConfirm(croppedFile);
    } catch {
      addToast('Nao foi possivel processar a imagem', 'error');
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/70 p-4">
      <div className="w-full max-w-3xl rounded-[28px] bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">{title}</h2>
            <p className="text-sm text-gray-500">Recorte e compacte a imagem antes do envio.</p>
          </div>
        </div>

        <div className="space-y-4 p-5">
          <div className="relative h-[22rem] overflow-hidden rounded-3xl bg-slate-950">
            <Cropper
              image={imageUrl}
              crop={crop}
              zoom={zoom}
              aspect={aspect}
              cropShape={cropShape}
              showGrid
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={(_, croppedPixels) => setCroppedAreaPixels(croppedPixels)}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>Zoom</span>
              <span>{zoom.toFixed(1)}x</span>
            </div>
            <input
              type="range"
              min={1}
              max={3}
              step={0.1}
              value={zoom}
              onChange={(event) => setZoom(Number(event.target.value))}
              className="w-full"
            />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button variant="secondary" fullWidth onClick={onCancel} disabled={isProcessing}>
              Cancelar
            </Button>
            <Button fullWidth onClick={handleConfirm} disabled={isProcessing}>
              {isProcessing ? (
                <>
                  <Spinner size="sm" />
                  <span className="ml-2">Processando</span>
                </>
              ) : (
                'Usar imagem'
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
