import { PostReactionType } from '@palmital/types';
import { IsEnum, IsOptional } from 'class-validator';

export class ReactToPostDto {
  @IsOptional()
  @IsEnum(PostReactionType)
  type?: PostReactionType;
}
