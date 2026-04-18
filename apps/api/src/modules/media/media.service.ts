import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class MediaService {
  constructor(private prisma: PrismaService) {}

  async saveMedia(uploaderId: string, file: Express.Multer.File) {
    const url = `/uploads/media/${file.filename}`;
    return this.prisma.media.create({
      data: {
        uploaderId,
        url,
        mimeType: file.mimetype,
        sizeBytes: file.size,
        type: file.mimetype.startsWith('video') ? 'VIDEO' : 'IMAGE',
      },
    });
  }

  async remove(id: string, userId: string, role: string) {
    const media = await this.prisma.media.findUnique({ where: { id } });
    if (!media) throw new NotFoundException();
    if (media.uploaderId !== userId && role !== 'ADMIN') throw new ForbiddenException();
    await this.prisma.media.delete({ where: { id } });
  }
}
