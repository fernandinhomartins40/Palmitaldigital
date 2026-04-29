import { Module } from '@nestjs/common';
import { UploadStorageModule } from '../../common/storage/upload-storage.module';
import { MediaService } from './media.service';
import { MediaController } from './media.controller';

@Module({
  imports: [UploadStorageModule],
  providers: [MediaService],
  controllers: [MediaController],
})
export class MediaModule {}
