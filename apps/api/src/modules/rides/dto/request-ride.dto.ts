import { IsInt, IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class RequestRideDto {
  @IsString()
  @MaxLength(200)
  originLabel: string;

  @IsNumber()
  originLat: number;

  @IsNumber()
  originLng: number;

  @IsString()
  @MaxLength(200)
  destinationLabel: string;

  @IsNumber()
  destinationLat: number;

  @IsNumber()
  destinationLng: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  distanceMeters?: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

export class RateRideDto {
  @IsInt()
  @Min(1)
  rating: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  comment?: string;
}

export class CancelRideDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  reason?: string;
}
