import prisma from '@/lib/prisma';
import { pusherServer, PUSHER_EVENTS } from '../pusher';
import { AppError } from '@/lib/error-handler';

// Definindo tipo para chatMessage já que não está no schema Prisma
type PrismaWithChat = typeof prisma & {
    chatMessage: {
        create: (args: {
            data: {
                orderId: string;
                userId: string;
                text: string;
                sender: string;
            };
            include?: {
                user?: {
                    select?: {
                        name?: boolean;
                        avatar?: boolean;
                    };
                };
            };
        }) => Promise<unknown>;
        findMany: (args: {
            where: { orderId: string };
            include?: {
                user?: {
                    select?: {
                        name?: boolean;
                        avatar?: boolean;
                    };
                };
            };
            orderBy?: { createdAt: 'asc' | 'desc' };
        }) => Promise<unknown[]>;
        deleteMany: (args: {
            where: {
                createdAt: {
                    lt: Date;
                };
            };
        }) => Promise<{ count: number }>;
    };
};

const prismaWithChat = prisma as PrismaWithChat;

export class ChatService {
    static async sendMessage(orderId: string, userId: string, text: string, sender: string) {
        // Validar se o pedido existe
        const order = await prisma.order.findUnique({
            where: { id: orderId }
        });
        if (!order) throw new AppError('Pedido não encontrado', 404);

        // Criar mensagem no banco
        const message = await prismaWithChat.chatMessage.create({
            data: {
                orderId,
                userId,
                text,
                sender
            },
            include: { user: { select: { name: true, avatar: true } } }
        });

        // Trigger em tempo real via Pusher
        try {
            await pusherServer.trigger(`order-${orderId}`, PUSHER_EVENTS.CHAT_MESSAGE, message);
        } catch (e) {
            console.warn('[PUSHER_ERROR]: Falha ao disparar mensagem de chat', e);
        }

        return message;
    }

    static async getMessages(orderId: string) {
        // Limpeza automática (mensagens somem após 24h)
        await this.cleanupOldMessages();

        return await prismaWithChat.chatMessage.findMany({
            where: { orderId },
            include: { user: { select: { name: true, avatar: true } } },
            orderBy: { createdAt: 'asc' }
        });
    }

    private static async cleanupOldMessages() {
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        try {
            await prismaWithChat.chatMessage.deleteMany({
                where: {
                    createdAt: {
                        lt: twentyFourHoursAgo
                    }
                }
            });
        } catch (e) {
            console.error('[CLEANUP_ERROR]: Falha ao limpar mensagens antigas', e);
        }
    }
}
