import { Module } from '@nestjs/common';
import { ClassifiedsService } from './classifieds.service';
import { ClassifiedsController } from './classifieds.controller';

@Module({
  providers: [ClassifiedsService],
  controllers: [ClassifiedsController],
})
export class ClassifiedsModule {}
