import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { RidesService } from './rides.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RegisterDriverDto, TogglePixKeyDto, UpdateDriverLocationDto, UpdateDriverStatusDto } from './dto/register-driver.dto';
import { CancelRideDto, RateRideDto, RequestRideDto } from './dto/request-ride.dto';

@Controller('rides')
export class RidesController {
  constructor(private rides: RidesService) {}

  // ─── Driver ───

  @Post('drivers')
  registerDriver(@CurrentUser() user: any, @Body() dto: RegisterDriverDto) {
    return this.rides.registerDriver(user.id, dto);
  }

  @Get('drivers/me')
  myDriverProfile(@CurrentUser() user: any) {
    return this.rides.getMyDriverProfile(user.id);
  }

  @Patch('drivers/me/status')
  setStatus(@CurrentUser() user: any, @Body() dto: UpdateDriverStatusDto) {
    return this.rides.setStatus(user.id, dto.status);
  }

  @Patch('drivers/me/location')
  updateLocation(@CurrentUser() user: any, @Body() dto: UpdateDriverLocationDto) {
    return this.rides.updateLocation(user.id, dto);
  }

  @Patch('drivers/me/pix')
  setPixKey(@CurrentUser() user: any, @Body() dto: TogglePixKeyDto) {
    return this.rides.setPixKey(user.id, dto);
  }

  @Get('drivers/available')
  listAvailable(@CurrentUser() user: any) {
    return this.rides.listAvailableRidesForDriver(user.id);
  }

  // ─── Rides ───

  @Post()
  requestRide(@CurrentUser() user: any, @Body() dto: RequestRideDto) {
    return this.rides.requestRide(user.id, dto);
  }

  @Get('my')
  listMyRides(@CurrentUser() user: any) {
    return this.rides.listMyRides(user.id);
  }

  @Get(':id')
  getRide(@CurrentUser() user: any, @Param('id') id: string) {
    return this.rides.getRide(user.id, id);
  }

  @Post(':id/accept')
  acceptRide(@CurrentUser() user: any, @Param('id') id: string) {
    return this.rides.acceptRide(user.id, id);
  }

  @Patch(':id/arrived')
  driverArrived(@CurrentUser() user: any, @Param('id') id: string) {
    return this.rides.updateRideStatus(user.id, id, 'DRIVER_ARRIVED');
  }

  @Patch(':id/start')
  startRide(@CurrentUser() user: any, @Param('id') id: string) {
    return this.rides.updateRideStatus(user.id, id, 'IN_PROGRESS');
  }

  @Patch(':id/complete')
  completeRide(@CurrentUser() user: any, @Param('id') id: string) {
    return this.rides.updateRideStatus(user.id, id, 'COMPLETED');
  }

  @Delete(':id')
  cancelRide(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: CancelRideDto) {
    return this.rides.cancelRide(user.id, id, dto);
  }

  @Post(':id/rating')
  rateRide(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: RateRideDto) {
    return this.rides.rateRide(user.id, id, dto);
  }

  @Post(':id/locations')
  recordLocation(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: UpdateDriverLocationDto,
  ) {
    return this.rides.recordRideLocation(user.id, id, dto);
  }
}
