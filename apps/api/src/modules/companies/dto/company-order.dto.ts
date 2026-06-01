import { IsArray, IsInt, IsOptional, IsString, MaxLength, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CompanyOrderItemDto {
  @IsString()
  productId: string;

  @IsInt()
  @Min(1)
  quantity: number;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  notes?: string;
}

export class CreateCompanyOrderDto {
  @IsString()
  companyId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CompanyOrderItemDto)
  items: CompanyOrderItemDto[];

  @IsString()
  @MaxLength(120)
  customerName: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  customerPhone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

export class UpdateCompanyOrderStatusDto {
  @IsString()
  status: 'ACCEPTED' | 'PREPARING' | 'READY' | 'COMPLETED' | 'CANCELLED';

  @IsOptional()
  @IsString()
  @MaxLength(200)
  cancelReason?: string;
}
