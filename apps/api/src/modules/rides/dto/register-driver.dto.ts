import { IsBoolean, IsInt, IsOptional, IsString, MaxLength, Min, MinLength } from 'class-validator';

export class RegisterDriverDto {
  @IsString()
  @MinLength(7)
  @MaxLength(10)
  licensePlate: string;

  @IsString()
  @MinLength(2)
  @MaxLength(80)
  vehicleModel: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  vehicleColor?: string;

  @IsOptional()
  @IsInt()
  @Min(1990)
  vehicleYear?: number;

  @IsOptional()
  @IsString()
  documentUrl?: string;
}

export class UpdateDriverStatusDto {
  @IsString()
  status: 'ONLINE' | 'OFFLINE' | 'ON_RIDE';
}

export class UpdateDriverLocationDto {
  lat: number;
  lng: number;

  @IsOptional()
  heading?: number;

  @IsOptional()
  speed?: number;
}

export class TogglePixKeyDto {
  @IsOptional()
  @IsString()
  pixKey?: string;

  @IsOptional()
  @IsString()
  pixKeyType?: string;
}
