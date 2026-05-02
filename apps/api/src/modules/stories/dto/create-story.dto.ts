import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateStoryDto {
  @IsString()
  @IsNotEmpty()
  mediaId: string;

  @IsOptional()
  @IsString()
  @MaxLength(280)
  caption?: string;
}
