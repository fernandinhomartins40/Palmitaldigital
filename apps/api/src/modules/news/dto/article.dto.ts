import { IsArray, IsBoolean, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class ApplyJournalistDto {
  @IsString()
  @MinLength(30)
  @MaxLength(800)
  bio: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  portfolio?: string;

  @IsString()
  @MinLength(30)
  @MaxLength(800)
  reason: string;
}

export class ReviewApplicationDto {
  @IsString()
  status: 'APPROVED' | 'REJECTED';

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

export class CreateArticleDto {
  @IsString()
  @MinLength(5)
  @MaxLength(160)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  excerpt?: string;

  @IsString()
  @MinLength(30)
  body: string;

  @IsOptional()
  @IsString()
  coverUrl?: string;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsArray()
  tags?: string[];
}

export class UpdateArticleDto {
  @IsOptional()
  @IsString()
  @MaxLength(160)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  excerpt?: string;

  @IsOptional()
  @IsString()
  body?: string;

  @IsOptional()
  @IsString()
  coverUrl?: string;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsArray()
  tags?: string[];
}

export class SubmitArticleDto {
  @IsString()
  action: 'PUBLISH' | 'DRAFT' | 'ARCHIVE';
}

export class ReviewArticleDto {
  @IsString()
  status: 'PUBLISHED' | 'REJECTED';

  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

export class CreateArticleCommentDto {
  @IsString()
  @MinLength(1)
  @MaxLength(1000)
  content: string;

  @IsOptional()
  @IsString()
  parentId?: string;
}

export class CreateArticleCategoryDto {
  @IsString()
  @MinLength(2)
  @MaxLength(60)
  name: string;

  @IsOptional()
  @IsString()
  color?: string;
}
