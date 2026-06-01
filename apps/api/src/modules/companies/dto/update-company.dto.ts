import { IsBoolean, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateCompanyDto {
  @IsOptional() @IsString() @MaxLength(100) name?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() whatsapp?: string;
  @IsOptional() @IsString() address?: string;
  @IsOptional() @IsString() city?: string;
  @IsOptional() @IsString() category?: string;
  @IsOptional() @IsIn(['CONTACT', 'CART', 'BOTH']) sellMode?: 'CONTACT' | 'CART' | 'BOTH';
  @IsOptional() @IsString() pixKey?: string;
  @IsOptional() @IsString() pixKeyType?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
}
