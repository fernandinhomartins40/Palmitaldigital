import { Module } from '@nestjs/common';
import { UploadStorageModule } from '../../common/storage/upload-storage.module';
import { CompaniesService } from './companies.service';
import { CompaniesController } from './companies.controller';

@Module({
  imports: [UploadStorageModule],
  providers: [CompaniesService],
  controllers: [CompaniesController],
})
export class CompaniesModule {}
