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
import { ChatService } from './chat.service';
import { AuthService } from '../auth/auth.service';

@WebSocketGateway({
  namespace: '/chat',
  cors: { origin: '*', credentials: true },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  constructor(
    private chatService: ChatService,
    private authService: AuthService,
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

  @SubscribeMessage('join_conversation')
  async handleJoin(@ConnectedSocket() client: Socket, @MessageBody() data: { conversationId: string }) {
    try {
      await this.chatService.assertParticipant(data.conversationId, client.data.userId);
      client.join(`conversation_${data.conversationId}`);
      return { event: 'joined', data: { conversationId: data.conversationId } };
    } catch {
      return { event: 'error', data: { message: 'Not a participant' } };
    }
  }

  @SubscribeMessage('leave_conversation')
  handleLeave(@ConnectedSocket() client: Socket, @MessageBody() data: { conversationId: string }) {
    client.leave(`conversation_${data.conversationId}`);
  }

  @SubscribeMessage('send_message')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string; content: string },
  ) {
    if (!data.content?.trim()) return;

    try {
      const message = await this.chatService.saveMessage(
        data.conversationId,
        client.data.userId,
        data.content.trim(),
      );

      this.server.to(`conversation_${data.conversationId}`).emit('new_message', message);
      return message;
    } catch (err: any) {
      return { event: 'error', data: { message: err.message } };
    }
  }

  @SubscribeMessage('mark_read')
  async handleMarkRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    await this.chatService.markRead(data.conversationId, client.data.userId);
    this.server
      .to(`conversation_${data.conversationId}`)
      .emit('messages_read', { userId: client.data.userId, conversationId: data.conversationId });
  }

  @SubscribeMessage('typing_start')
  handleTypingStart(@ConnectedSocket() client: Socket, @MessageBody() data: { conversationId: string }) {
    client.to(`conversation_${data.conversationId}`).emit('user_typing', {
      userId: client.data.userId,
      conversationId: data.conversationId,
    });
  }

  @SubscribeMessage('typing_stop')
  handleTypingStop(@ConnectedSocket() client: Socket, @MessageBody() data: { conversationId: string }) {
    client.to(`conversation_${data.conversationId}`).emit('user_stopped_typing', {
      userId: client.data.userId,
      conversationId: data.conversationId,
    });
  }
}
