import prisma from '@/lib/prisma';
import { pusherServer, PUSHER_EVENTS } from '../pusher';
import { AppError } from '@/lib/error-handler';

export class ChatService {
    static async sendMessage(orderId: string, userId: string, text: string, sender: string) {
        // Validar se o pedido existe
        const order = await prisma.order.findUnique({
            where: { id: orderId }
        });
        if (!order) throw new AppError('Pedido não encontrado', 404);

        // Criar mensagem no banco
        const message = await prisma.chatMessage.create({
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
        } catch (_e) {
            console.warn("[PUSHER_ERROR]: Falha ao disparar mensagem de chat", _e);
        }

        return message;
    }

    static async getMessages(orderId: string) {
        // Limpeza automática (mensagens somem após 24h)
        await this.cleanupOldMessages();

        return await prisma.chatMessage.findMany({
            where: { orderId },
            include: { user: { select: { name: true, avatar: true } } },
            orderBy: { createdAt: 'asc' }
        });
    }

    private static async cleanupOldMessages() {
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        try {
            await prisma.chatMessage.deleteMany({
                where: {
                    createdAt: {
                        lt: twentyFourHoursAgo
                    }
                }
            });
        } catch (_e) {
            console.error("[CLEANUP_ERROR]: Falha ao limpar mensagens antigas", _e);
        }
    }
}
