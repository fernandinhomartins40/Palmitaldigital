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
import { DeliveryService } from './delivery.service';

@WebSocketGateway({
  namespace: '/delivery',
  cors: { origin: '*', credentials: true },
})
export class DeliveryGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  constructor(
    private authService: AuthService,
    private deliveryService: DeliveryService,
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

  @SubscribeMessage('join_order')
  async handleJoinOrder(@ConnectedSocket() client: Socket, @MessageBody() data: { orderId: string }) {
    try {
      await this.deliveryService.getOrder(client.data.userId, data.orderId);
      client.join(`order_${data.orderId}`);
      return { event: 'joined', data: { orderId: data.orderId } };
    } catch {
      return { event: 'error', data: { message: 'Sem acesso ao pedido' } };
    }
  }

  @SubscribeMessage('leave_order')
  handleLeaveOrder(@ConnectedSocket() client: Socket, @MessageBody() data: { orderId: string }) {
    client.leave(`order_${data.orderId}`);
  }

  /** Chamado pelo service quando um pedido muda de status para emitir aos participantes */
  emitOrderUpdate(orderId: string, payload: any) {
    this.server.to(`order_${orderId}`).emit('order_update', payload);
  }
}
