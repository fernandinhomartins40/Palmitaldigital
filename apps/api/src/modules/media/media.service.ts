import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { UploadStorageService } from '../../common/storage/upload-storage.service';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class MediaService {
  constructor(
    private prisma: PrismaService,
    private uploadStorage: UploadStorageService,
  ) {}

  async saveMedia(uploaderId: string, file: Express.Multer.File) {
    const storedFile = await this.uploadStorage.storeMedia(file);

    return this.prisma.media.create({
      data: {
        uploaderId,
        url: storedFile.url,
        mimeType: storedFile.mimeType,
        sizeBytes: storedFile.sizeBytes,
        width: storedFile.width,
        height: storedFile.height,
        type: storedFile.type,
      },
    });
  }

  async remove(id: string, userId: string, role: string) {
    const media = await this.prisma.media.findUnique({ where: { id } });
    if (!media) throw new NotFoundException();
    if (media.uploaderId !== userId && role !== 'ADMIN') throw new ForbiddenException();

    await this.prisma.media.delete({ where: { id } });
    await this.uploadStorage.removeByUrl(media.url);
  }
}
