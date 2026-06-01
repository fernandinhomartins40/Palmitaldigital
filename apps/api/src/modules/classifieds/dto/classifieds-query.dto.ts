import { ClassifiedStatus } from '@palmital/types';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class ClassifiedsQueryDto {
  @IsOptional() @IsString() categoryId?: string;
  @IsOptional() @IsString() city?: string;
  @IsOptional() @IsString() q?: string;
  @IsOptional() @IsString() authorId?: string;
  @IsOptional() @IsEnum(ClassifiedStatus) status?: ClassifiedStatus;
  @IsOptional() @IsString() cursor?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(50) limit?: number = 20;
}
