import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { AuthService } from '../auth/auth.service';
import { RidesService } from './rides.service';

@WebSocketGateway({
  namespace: '/rides',
  cors: { origin: '*', credentials: true },
})
export class RidesGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  constructor(
    private authService: AuthService,
    private ridesService: RidesService,
  ) {}

  async handleConnection(client: Socket) {
    const token = client.handshake.auth?.token as string;
    if (!token) return client.disconnect();

    const user = await this.authService.validateWsToken(token);
    if (!user) return client.disconnect();

    client.data.userId = user.id;
    client.join(`user_${user.id}`);
  }

  handleDisconnect(client: Socket) {
    client.rooms.forEach((room) => client.leave(room));
  }

  @SubscribeMessage('join_ride')
  async handleJoinRide(@ConnectedSocket() client: Socket, @MessageBody() data: { rideId: string }) {
    try {
      await this.ridesService.getRide(client.data.userId, data.rideId);
      client.join(`ride_${data.rideId}`);
      return { event: 'joined', data: { rideId: data.rideId } };
    } catch {
      return { event: 'error', data: { message: 'Sem acesso à corrida' } };
    }
  }

  @SubscribeMessage('leave_ride')
  handleLeaveRide(@ConnectedSocket() client: Socket, @MessageBody() data: { rideId: string }) {
    client.leave(`ride_${data.rideId}`);
  }

  @SubscribeMessage('driver_location')
  async handleDriverLocation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { rideId: string; lat: number; lng: number; heading?: number; speed?: number },
  ) {
    try {
      const location = await this.ridesService.recordRideLocation(client.data.userId, data.rideId, {
        lat: data.lat,
        lng: data.lng,
        heading: data.heading,
        speed: data.speed,
      });
      this.server.to(`ride_${data.rideId}`).emit('location_update', location);
      return location;
    } catch (err: any) {
      return { event: 'error', data: { message: err.message } };
    }
  }

  /** Util: chamado pelo controller quando um motorista aceita uma corrida (mas mantemos REST principal) */
  emitRideUpdate(rideId: string, payload: any) {
    this.server.to(`ride_${rideId}`).emit('ride_update', payload);
  }
}
