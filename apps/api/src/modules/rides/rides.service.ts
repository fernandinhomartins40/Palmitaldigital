import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RegisterDriverDto, TogglePixKeyDto, UpdateDriverLocationDto } from './dto/register-driver.dto';
import { CancelRideDto, RateRideDto, RequestRideDto } from './dto/request-ride.dto';

const SEARCH_RADIUS_DEGREES = 0.1;

@Injectable()
export class RidesService {
  constructor(private prisma: PrismaService) {}

  // ─── Driver ───

  async registerDriver(userId: string, dto: RegisterDriverDto) {
    const existing = await this.prisma.driver.findUnique({ where: { userId } });
    if (existing) {
      throw new BadRequestException('Você já está cadastrado como motorista');
    }

    const driver = await this.prisma.driver.create({
      data: {
        userId,
        licensePlate: dto.licensePlate.toUpperCase(),
        vehicleModel: dto.vehicleModel,
        vehicleColor: dto.vehicleColor,
        vehicleYear: dto.vehicleYear,
        documentUrl: dto.documentUrl,
      },
    });

    await this.prisma.user.update({
      where: { id: userId },
      data: { role: 'DRIVER' },
    });

    return driver;
  }

  async getMyDriverProfile(userId: string) {
    return this.prisma.driver.findUnique({
      where: { userId },
      include: { user: { include: { profile: true } } },
    });
  }

  async setStatus(userId: string, status: 'ONLINE' | 'OFFLINE' | 'ON_RIDE') {
    const driver = await this.prisma.driver.findUnique({ where: { userId } });
    if (!driver) throw new NotFoundException('Motorista não encontrado');

    return this.prisma.driver.update({
      where: { id: driver.id },
      data: { status, lastSeenAt: new Date() },
    });
  }

  async updateLocation(userId: string, dto: UpdateDriverLocationDto) {
    const driver = await this.prisma.driver.findUnique({ where: { userId } });
    if (!driver) throw new NotFoundException('Motorista não encontrado');

    return this.prisma.driver.update({
      where: { id: driver.id },
      data: { currentLat: dto.lat, currentLng: dto.lng, lastSeenAt: new Date() },
    });
  }

  async setPixKey(userId: string, dto: TogglePixKeyDto) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { pixKey: dto.pixKey, pixKeyType: dto.pixKeyType },
      select: { id: true, pixKey: true, pixKeyType: true },
    });
  }

  // ─── Ride ───

  async requestRide(passengerId: string, dto: RequestRideDto) {
    return this.prisma.ride.create({
      data: {
        passengerId,
        originLabel: dto.originLabel,
        originLat: dto.originLat,
        originLng: dto.originLng,
        destinationLabel: dto.destinationLabel,
        destinationLat: dto.destinationLat,
        destinationLng: dto.destinationLng,
        distanceMeters: dto.distanceMeters,
        notes: dto.notes,
      },
      include: { passenger: { include: { profile: true } } },
    });
  }

  async findNearbyDriversForRide(ride: { originLat: number; originLng: number }) {
    return this.prisma.driver.findMany({
      where: {
        status: 'ONLINE',
        isVerified: true,
        currentLat: {
          gte: ride.originLat - SEARCH_RADIUS_DEGREES,
          lte: ride.originLat + SEARCH_RADIUS_DEGREES,
        },
        currentLng: {
          gte: ride.originLng - SEARCH_RADIUS_DEGREES,
          lte: ride.originLng + SEARCH_RADIUS_DEGREES,
        },
      },
      include: { user: { include: { profile: true } } },
      take: 20,
    });
  }

  async acceptRide(driverUserId: string, rideId: string) {
    const driver = await this.prisma.driver.findUnique({ where: { userId: driverUserId } });
    if (!driver) throw new ForbiddenException('Apenas motoristas podem aceitar corridas');

    const ride = await this.prisma.ride.findUnique({ where: { id: rideId } });
    if (!ride) throw new NotFoundException('Corrida não encontrada');
    if (ride.status !== 'REQUESTED') {
      throw new BadRequestException('Esta corrida já foi atendida');
    }

    const [updated] = await this.prisma.$transaction([
      this.prisma.ride.update({
        where: { id: rideId },
        data: { driverId: driver.id, status: 'ACCEPTED', acceptedAt: new Date() },
        include: {
          driver: { include: { user: { include: { profile: true } } } },
          passenger: { include: { profile: true } },
        },
      }),
      this.prisma.driver.update({ where: { id: driver.id }, data: { status: 'ON_RIDE' } }),
    ]);

    return updated;
  }

  async updateRideStatus(userId: string, rideId: string, status: 'DRIVER_ARRIVED' | 'IN_PROGRESS' | 'COMPLETED') {
    const ride = await this.prisma.ride.findUnique({
      where: { id: rideId },
      include: { driver: true },
    });
    if (!ride) throw new NotFoundException('Corrida não encontrada');
    if (ride.driver?.userId !== userId) {
      throw new ForbiddenException('Apenas o motorista pode atualizar o status');
    }

    const data: any = { status };
    if (status === 'IN_PROGRESS') data.startedAt = new Date();
    if (status === 'COMPLETED') data.completedAt = new Date();

    const updated = await this.prisma.ride.update({
      where: { id: rideId },
      data,
      include: {
        driver: { include: { user: { include: { profile: true } } } },
        passenger: { include: { profile: true } },
      },
    });

    if (status === 'COMPLETED' && ride.driverId) {
      await this.prisma.driver.update({
        where: { id: ride.driverId },
        data: { status: 'ONLINE' },
      });
    }

    return updated;
  }

  async cancelRide(userId: string, rideId: string, dto: CancelRideDto) {
    const ride = await this.prisma.ride.findUnique({
      where: { id: rideId },
      include: { driver: true },
    });
    if (!ride) throw new NotFoundException('Corrida não encontrada');

    const isPassenger = ride.passengerId === userId;
    const isDriver = ride.driver?.userId === userId;
    if (!isPassenger && !isDriver) throw new ForbiddenException('Sem permissão');

    if (['COMPLETED', 'CANCELLED'].includes(ride.status)) {
      throw new BadRequestException('Corrida não pode ser cancelada');
    }

    const updated = await this.prisma.ride.update({
      where: { id: rideId },
      data: { status: 'CANCELLED', cancelledAt: new Date(), cancelReason: dto.reason },
    });

    if (ride.driverId) {
      await this.prisma.driver.update({
        where: { id: ride.driverId },
        data: { status: 'ONLINE' },
      });
    }

    return updated;
  }

  async rateRide(userId: string, rideId: string, dto: RateRideDto) {
    const ride = await this.prisma.ride.findUnique({
      where: { id: rideId },
      include: { driver: true },
    });
    if (!ride) throw new NotFoundException('Corrida não encontrada');
    if (ride.status !== 'COMPLETED') {
      throw new BadRequestException('Corrida não está concluída');
    }

    const isPassenger = ride.passengerId === userId;
    const isDriver = ride.driver?.userId === userId;
    if (!isPassenger && !isDriver) throw new ForbiddenException('Sem permissão');

    const rating = Math.max(1, Math.min(5, dto.rating));

    if (isPassenger) {
      await this.prisma.ride.update({
        where: { id: rideId },
        data: { passengerRating: rating },
      });
      if (ride.driverId) {
        const stats = await this.prisma.ride.aggregate({
          where: { driverId: ride.driverId, passengerRating: { not: null } },
          _avg: { passengerRating: true },
          _count: { passengerRating: true },
        });
        await this.prisma.driver.update({
          where: { id: ride.driverId },
          data: {
            ratingAvg: stats._avg.passengerRating ?? 5,
            ratingCount: stats._count.passengerRating,
          },
        });
      }
    } else {
      await this.prisma.ride.update({
        where: { id: rideId },
        data: { driverRating: rating },
      });
    }

    return this.prisma.ride.findUnique({ where: { id: rideId } });
  }

  async getRide(userId: string, rideId: string) {
    const ride = await this.prisma.ride.findUnique({
      where: { id: rideId },
      include: {
        passenger: { include: { profile: true } },
        driver: { include: { user: { include: { profile: true } } } },
        locations: { orderBy: { recordedAt: 'desc' }, take: 50 },
      },
    });
    if (!ride) throw new NotFoundException('Corrida não encontrada');

    const isPassenger = ride.passengerId === userId;
    const isDriver = ride.driver?.userId === userId;
    if (!isPassenger && !isDriver) throw new ForbiddenException('Sem permissão');

    return ride;
  }

  async listMyRides(userId: string) {
    return this.prisma.ride.findMany({
      where: { OR: [{ passengerId: userId }, { driver: { userId } }] },
      include: {
        passenger: { include: { profile: true } },
        driver: { include: { user: { include: { profile: true } } } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async listAvailableRidesForDriver(driverUserId: string) {
    const driver = await this.prisma.driver.findUnique({ where: { userId: driverUserId } });
    if (!driver) throw new ForbiddenException('Apenas motoristas');
    if (driver.currentLat == null || driver.currentLng == null) return [];

    return this.prisma.ride.findMany({
      where: {
        status: 'REQUESTED',
        originLat: {
          gte: driver.currentLat - SEARCH_RADIUS_DEGREES,
          lte: driver.currentLat + SEARCH_RADIUS_DEGREES,
        },
        originLng: {
          gte: driver.currentLng - SEARCH_RADIUS_DEGREES,
          lte: driver.currentLng + SEARCH_RADIUS_DEGREES,
        },
      },
      include: { passenger: { include: { profile: true } } },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  }

  async recordRideLocation(driverUserId: string, rideId: string, dto: UpdateDriverLocationDto) {
    const ride = await this.prisma.ride.findUnique({
      where: { id: rideId },
      include: { driver: true },
    });
    if (!ride) throw new NotFoundException('Corrida não encontrada');
    if (ride.driver?.userId !== driverUserId) throw new ForbiddenException('Sem permissão');
    if (!['ACCEPTED', 'DRIVER_ARRIVED', 'IN_PROGRESS'].includes(ride.status)) {
      throw new BadRequestException('Corrida não está ativa');
    }

    await this.prisma.driver.update({
      where: { id: ride.driverId! },
      data: { currentLat: dto.lat, currentLng: dto.lng, lastSeenAt: new Date() },
    });

    return this.prisma.rideLocation.create({
      data: {
        rideId,
        lat: dto.lat,
        lng: dto.lng,
        heading: dto.heading,
        speed: dto.speed,
      },
    });
  }
}
