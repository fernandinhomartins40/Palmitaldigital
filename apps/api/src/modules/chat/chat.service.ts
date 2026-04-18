import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { MessagesQueryDto } from './dto/messages-query.dto';

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) {}

  async getConversations(userId: string) {
    const participations = await this.prisma.conversationParticipant.findMany({
      where: { userId },
      include: {
        conversation: {
          include: {
            participants: {
              include: {
                user: { include: { profile: { select: { displayName: true, avatarUrl: true } } } },
              },
            },
            messages: {
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
          },
        },
      },
      orderBy: { conversation: { updatedAt: 'desc' } },
    });

    return participations.map((p) => p.conversation);
  }

  async createConversation(userId: string, dto: CreateConversationDto) {
    if (userId === dto.recipientId) throw new BadRequestException('Cannot chat with yourself');

    const existing = await this.prisma.conversation.findFirst({
      where: {
        AND: [
          { participants: { some: { userId } } },
          { participants: { some: { userId: dto.recipientId } } },
        ],
      },
      include: { participants: { include: { user: { include: { profile: true } } } } },
    });

    if (existing) return existing;

    return this.prisma.conversation.create({
      data: {
        participants: {
          create: [{ userId }, { userId: dto.recipientId }],
        },
      },
      include: {
        participants: {
          include: { user: { include: { profile: true } } },
        },
      },
    });
  }

  async getMessages(conversationId: string, userId: string, query: MessagesQueryDto) {
    await this.assertParticipant(conversationId, userId);
    const limit = query.limit ?? 30;
    let cursorFilter = {};

    if (query.cursor) {
      const msg = await this.prisma.message.findUnique({ where: { id: query.cursor } });
      if (msg) cursorFilter = { createdAt: { lt: msg.createdAt } };
    }

    const messages = await this.prisma.message.findMany({
      where: { conversationId, ...cursorFilter },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        sender: { include: { profile: { select: { displayName: true, avatarUrl: true } } } },
      },
    });

    return {
      messages: messages.reverse(),
      nextCursor: messages.length === limit ? messages[0]?.id : null,
    };
  }

  async saveMessage(conversationId: string, senderId: string, content: string) {
    await this.assertParticipant(conversationId, senderId);

    const message = await this.prisma.message.create({
      data: { conversationId, senderId, content },
      include: {
        sender: { include: { profile: { select: { displayName: true, avatarUrl: true } } } },
      },
    });

    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    return message;
  }

  async markRead(conversationId: string, userId: string) {
    await this.prisma.conversationParticipant.updateMany({
      where: { conversationId, userId },
      data: { lastReadAt: new Date() },
    });
  }

  async assertParticipant(conversationId: string, userId: string) {
    const participant = await this.prisma.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId, userId } },
    });
    if (!participant) throw new ForbiddenException('Not a participant');
    return participant;
  }
}
