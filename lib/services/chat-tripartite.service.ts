import prisma from '@/lib/prisma';
import { pusherServer, PUSHER_EVENTS } from '../pusher';
import { AppError } from '@/lib/error-handler';

type ChannelType = 'CUSTOMER_RESTAURANT' | 'CUSTOMER_COURIER';

interface SendMessageParams {
    orderId: string;
    channelType: ChannelType;
    senderId: string;
    text: string;
    isTemplate?: boolean;
    templateId?: string;
}

/**
 * Serviço de Chat Tripartite com Isolamento Total
 * 
 * REGRAS:
 * 1. Cliente ↔ Restaurante: Chat LIVRE
 * 2. Cliente ↔ Entregador: Apenas MENSAGENS PRONTAS
 * 3. Cada canal é completamente isolado
 */
export class ChatTripartiteService {
    /**
     * Cria canal Cliente-Restaurante quando pedido é criado
     */
    static async createCustomerRestaurantChannel(orderId: string, customerId: string, restaurantOwnerId: string) {
        const order = await prisma.order.findUnique({
            where: { id: orderId }
        });

        if (!order) throw new AppError('Pedido não encontrado', 404);

        // Criar canal isolado
        const channel = await prisma.chatChannel.create({
            data: {
                orderId,
                type: 'CUSTOMER_RESTAURANT',
                participants: JSON.stringify([customerId, restaurantOwnerId])
            }
        });

        // Mensagem automática de boas-vindas
        await this.sendSystemMessage(channel.id,
            'Canal de comunicação aberto. Você pode fazer perguntas sobre seu pedido.');

        return channel;
    }

    /**
     * Cria canal Cliente-Entregador quando courier é atribuído
     */
    static async createCustomerCourierChannel(orderId: string, customerId: string, courierId: string) {
        const order = await prisma.order.findUnique({
            where: { id: orderId }
        });

        if (!order) throw new AppError('Pedido não encontrado', 404);

        const channel = await prisma.chatChannel.create({
            data: {
                orderId,
                type: 'CUSTOMER_COURIER',
                participants: JSON.stringify([customerId, courierId])
            }
        });

        // Mensagem automática
        await this.sendSystemMessage(channel.id,
            'Entregador atribuído ao seu pedido. Use as mensagens rápidas para comunicação.');

        return channel;
    }

    /**
     * Envia mensagem com validação de permissão
     * 
     * SEGURANÇA: Valida se sender está nos participants
     * REGRA: Cliente-Entregador só aceita templates
     */
    static async sendMessage(params: SendMessageParams) {
        const { orderId, channelType, senderId, text, isTemplate = false, templateId } = params;

        // 1. Buscar canal
        const channel = await prisma.chatChannel.findUnique({
            where: {
                orderId_type: {
                    orderId,
                    type: channelType
                }
            }
        });

        if (!channel) throw new AppError('Canal não encontrado', 404);

        // 2. VALIDAÇÃO CRÍTICA: Verificar permissão
        const participants = JSON.parse(channel.participants) as string[];
        if (!participants.includes(senderId)) {
            throw new AppError('Você não tem permissão para enviar mensagens neste canal', 403);
        }

        // 3. REGRA ESPECIAL: Cliente-Entregador só aceita templates
        if (channelType === 'CUSTOMER_COURIER' && !isTemplate) {
            throw new AppError('Apenas mensagens prontas são permitidas neste canal', 400);
        }

        // 4. Criar mensagem
        const message = await prisma.chatMessage.create({
            data: {
                channelId: channel.id,
                senderId,
                text,
                isTemplate,
                templateId,
                readBy: JSON.stringify([senderId]) // Sender já "leu"
            },
            include: {
                sender: {
                    select: {
                        id: true,
                        name: true,
                        avatar: true,
                        role: true
                    }
                }
            }
        });

        // 5. Broadcast via Pusher
        try {
            await pusherServer.trigger(
                `chat-${channel.id}`,
                PUSHER_EVENTS.CHAT_MESSAGE,
                {
                    ...message,
                    readBy: JSON.parse(message.readBy)
                }
            );
        } catch (e) {
            console.warn('[PUSHER_ERROR]:', e);
        }

        return {
            ...message,
            readBy: JSON.parse(message.readBy)
        };
    }

    /**
     * Busca mensagens com validação de permissão
     */
    static async getMessages(orderId: string, channelType: ChannelType, userId: string) {
        const channel = await prisma.chatChannel.findUnique({
            where: {
                orderId_type: {
                    orderId,
                    type: channelType
                }
            },
            include: {
                messages: {
                    include: {
                        sender: {
                            select: {
                                id: true,
                                name: true,
                                avatar: true,
                                role: true
                            }
                        }
                    },
                    orderBy: {
                        createdAt: 'asc'
                    }
                }
            }
        });

        if (!channel) throw new AppError('Canal não encontrado', 404);

        // VALIDAÇÃO CRÍTICA
        const participants = JSON.parse(channel.participants) as string[];
        if (!participants.includes(userId)) {
            throw new AppError('Você não tem permissão para ver este canal', 403);
        }

        // Parse readBy de cada mensagem
        return channel.messages.map(msg => ({
            ...msg,
            readBy: JSON.parse(msg.readBy)
        }));
    }

    /**
     * Marca mensagens como lidas
     */
    static async markAsRead(channelId: string, userId: string) {
        const channel = await prisma.chatChannel.findUnique({
            where: { id: channelId }
        });

        if (!channel) throw new AppError('Canal não encontrado', 404);

        const participants = JSON.parse(channel.participants) as string[];
        if (!participants.includes(userId)) {
            throw new AppError('Sem permissão', 403);
        }

        // Buscar mensagens não lidas
        const messages = await prisma.chatMessage.findMany({
            where: { channelId }
        });

        for (const message of messages) {
            const readBy = JSON.parse(message.readBy) as string[];
            if (!readBy.includes(userId)) {
                readBy.push(userId);
                await prisma.chatMessage.update({
                    where: { id: message.id },
                    data: { readBy: JSON.stringify(readBy) }
                });
            }
        }
    }

    /**
     * Mensagem automática do sistema
     */
    private static async sendSystemMessage(channelId: string, text: string) {
        await prisma.chatMessage.create({
            data: {
                channelId,
                senderId: 'SYSTEM', // ID especial
                text,
                isTemplate: false,
                readBy: JSON.stringify([])
            }
        });
    }

    /**
     * Busca canais de um pedido
     */
    static async getChannelsByOrder(orderId: string, userId: string) {
        const channels = await prisma.chatChannel.findMany({
            where: { orderId },
            include: {
                messages: {
                    orderBy: { createdAt: 'desc' },
                    take: 1 // Última mensagem
                }
            }
        });

        // Filtrar apenas canais onde user tem permissão
        return channels.filter(channel => {
            const participants = JSON.parse(channel.participants) as string[];
            return participants.includes(userId);
        }).map(channel => ({
            ...channel,
            participants: JSON.parse(channel.participants),
            lastMessage: channel.messages[0] ? {
                ...channel.messages[0],
                readBy: JSON.parse(channel.messages[0].readBy)
            } : null
        }));
    }
}
