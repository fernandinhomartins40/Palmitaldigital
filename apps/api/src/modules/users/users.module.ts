import { Module } from '@nestjs/common';
import { UploadStorageModule } from '../../common/storage/upload-storage.module';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';

@Module({
  imports: [UploadStorageModule],
  providers: [UsersService],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule {}
