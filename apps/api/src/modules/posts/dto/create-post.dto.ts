import { PostType } from '@palmital/types';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';

class CreateClassifiedInlineDto {
  @IsString() @IsNotEmpty() title: string;
  @IsString() @IsNotEmpty() description: string;
  @IsOptional() @IsNumber() price?: number;
  @IsOptional() isFree?: boolean;
  @IsOptional() @IsString() categoryId?: string;
  @IsOptional() @IsString() city?: string;
}

export class CreatePostDto {
  @IsEnum(PostType)
  type: PostType;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  content?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  mediaIds?: string[];

  @IsOptional()
  @IsString()
  companyId?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => CreateClassifiedInlineDto)
  classified?: CreateClassifiedInlineDto;
}
