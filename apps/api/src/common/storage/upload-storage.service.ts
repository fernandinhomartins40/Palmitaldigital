import { Injectable } from '@nestjs/common';
import { mkdir, rm, writeFile } from 'fs/promises';
import { extname, join, resolve, sep } from 'path';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';

type UploadFolder = 'avatars' | 'companies' | 'media' | 'profiles';

interface StoreImageOptions {
  folder: UploadFolder;
  maxWidth: number;
  maxHeight: number;
  quality: number;
}

export interface StoredUpload {
  url: string;
  mimeType: string;
  sizeBytes: number;
  width?: number;
  height?: number;
  type: 'IMAGE' | 'VIDEO';
}

@Injectable()
export class UploadStorageService {
  private readonly uploadsRoot = resolve(process.cwd(), 'uploads');

  async storeAvatar(file: Express.Multer.File): Promise<StoredUpload> {
    return this.storeOptimizedImage(file, {
      folder: 'avatars',
      maxWidth: 512,
      maxHeight: 512,
      quality: 82,
    });
  }

  async storeMedia(file: Express.Multer.File): Promise<StoredUpload> {
    if (file.mimetype.startsWith('image/')) {
      return this.storeOptimizedImage(file, {
        folder: 'media',
        maxWidth: 2048,
        maxHeight: 2048,
        quality: 80,
      });
    }

    return this.storeBinaryFile(file, 'media');
  }

  async storeCompanyLogo(file: Express.Multer.File): Promise<StoredUpload> {
    return this.storeOptimizedImage(file, {
      folder: 'companies',
      maxWidth: 720,
      maxHeight: 720,
      quality: 82,
    });
  }

  async storeCompanyCover(file: Express.Multer.File): Promise<StoredUpload> {
    return this.storeOptimizedImage(file, {
      folder: 'companies',
      maxWidth: 1920,
      maxHeight: 1080,
      quality: 80,
    });
  }

  async storeProfileCover(file: Express.Multer.File): Promise<StoredUpload> {
    return this.storeOptimizedImage(file, {
      folder: 'profiles',
      maxWidth: 1920,
      maxHeight: 1080,
      quality: 80,
    });
  }

  async storeProductImage(file: Express.Multer.File): Promise<StoredUpload> {
    return this.storeOptimizedImage(file, {
      folder: 'companies',
      maxWidth: 1600,
      maxHeight: 1600,
      quality: 80,
    });
  }

  async removeByUrl(url?: string | null) {
    if (!url || !url.startsWith('/uploads/')) return;

    const relativePath = url.replace(/^\/uploads\//, '');
    const filePath = resolve(this.uploadsRoot, relativePath);
    if (!this.isInsideUploads(filePath)) return;

    await rm(filePath, { force: true });
  }

  private async storeOptimizedImage(
    file: Express.Multer.File,
    options: StoreImageOptions,
  ): Promise<StoredUpload> {
    const directory = this.folderPath(options.folder);
    await mkdir(directory, { recursive: true });

    const filename = `${uuidv4()}.webp`;
    const filePath = join(directory, filename);

    const image = sharp(file.buffer, { failOn: 'none' }).rotate().resize({
      width: options.maxWidth,
      height: options.maxHeight,
      fit: 'inside',
      withoutEnlargement: true,
    });

    const { data, info } = await image.webp({
      quality: options.quality,
      effort: 4,
      smartSubsample: true,
    }).toBuffer({ resolveWithObject: true });

    await writeFile(filePath, data);

    return {
      url: `/uploads/${options.folder}/${filename}`,
      mimeType: 'image/webp',
      sizeBytes: info.size,
      width: info.width,
      height: info.height,
      type: 'IMAGE',
    };
  }

  private async storeBinaryFile(
    file: Express.Multer.File,
    folder: UploadFolder,
  ): Promise<StoredUpload> {
    const directory = this.folderPath(folder);
    await mkdir(directory, { recursive: true });

    const extension = extname(file.originalname).toLowerCase() || '.bin';
    const filename = `${uuidv4()}${extension}`;
    const filePath = join(directory, filename);

    await writeFile(filePath, file.buffer);

    return {
      url: `/uploads/${folder}/${filename}`,
      mimeType: file.mimetype,
      sizeBytes: file.size,
      type: file.mimetype.startsWith('video/') ? 'VIDEO' : 'IMAGE',
    };
  }

  private folderPath(folder: UploadFolder) {
    return join(this.uploadsRoot, folder);
  }

  private isInsideUploads(targetPath: string) {
    return targetPath === this.uploadsRoot || targetPath.startsWith(`${this.uploadsRoot}${sep}`);
  }
}
