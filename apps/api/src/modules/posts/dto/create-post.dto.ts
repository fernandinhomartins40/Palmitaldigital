import { PostType, PromotionKind } from '@palmital/types';
import { Type } from 'class-transformer';
import {
  IsArray,
  ArrayMaxSize,
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

class CreatePromotionInlineDto {
  @IsEnum(PromotionKind)
  kind: PromotionKind;

  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  headline: string;

  @IsOptional()
  @IsString()
  @MaxLength(140)
  subtitle?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  city?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  serviceArea?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(4)
  @IsString({ each: true })
  highlights?: string[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(4)
  @IsString({ each: true })
  productIds?: string[];
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

  @IsOptional()
  @ValidateNested()
  @Type(() => CreatePromotionInlineDto)
  promotion?: CreatePromotionInlineDto;
}
