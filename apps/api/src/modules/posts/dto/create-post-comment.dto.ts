import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreatePostCommentDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  content: string;
}
