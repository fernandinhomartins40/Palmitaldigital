export interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface CropImageOptions {
  fileName: string;
  width: number;
  height: number;
  quality?: number;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

export async function cropImageFile(
  file: File,
  cropArea: CropArea,
  options: CropImageOptions,
): Promise<File> {
  const imageUrl = URL.createObjectURL(file);

  try {
    const image = await loadImage(imageUrl);
    const canvas = document.createElement('canvas');
    canvas.width = options.width;
    canvas.height = options.height;

    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Nao foi possivel preparar a imagem');
    }

    context.drawImage(
      image,
      cropArea.x,
      cropArea.y,
      cropArea.width,
      cropArea.height,
      0,
      0,
      options.width,
      options.height,
    );

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (result) => {
          if (result) {
            resolve(result);
            return;
          }

          reject(new Error('Nao foi possivel exportar a imagem'));
        },
        'image/webp',
        options.quality ?? 0.82,
      );
    });

    return new File([blob], options.fileName.replace(/\.[^.]+$/, '') + '.webp', {
      type: 'image/webp',
      lastModified: Date.now(),
    });
  } finally {
    URL.revokeObjectURL(imageUrl);
  }
}
