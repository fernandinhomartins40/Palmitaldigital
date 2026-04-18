import { ClassifiedStatus } from '@palmital/types';
import { IsEnum, IsOptional, IsString, IsNumber, MaxLength } from 'class-validator';

export class UpdateClassifiedDto {
  @IsOptional() @IsString() @MaxLength(200) title?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsNumber() price?: number;
  @IsOptional() isFree?: boolean;
  @IsOptional() @IsString() categoryId?: string;
  @IsOptional() @IsString() city?: string;
}

export class UpdateClassifiedStatusDto {
  @IsEnum(ClassifiedStatus)
  status: ClassifiedStatus;
}
