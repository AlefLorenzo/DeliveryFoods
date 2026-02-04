import prisma from '@/lib/prisma';

interface QuickMessageData {
    text: string;
    category: 'COURIER_TO_CUSTOMER' | 'CUSTOMER_TO_COURIER';
    icon?: string;
    order?: number;
}

/**
 * Serviço de Mensagens Prontas
 * 
 * Para comunicação Cliente ↔ Entregador
 */
export class QuickMessageService {
    /**
     * Busca mensagens prontas por categoria
     */
    static async getByCategory(category: 'COURIER_TO_CUSTOMER' | 'CUSTOMER_TO_COURIER') {
        return await prisma.quickMessage.findMany({
            where: { category },
            orderBy: { order: 'asc' }
        });
    }

    /**
     * Cria mensagem pronta
     */
    static async create(data: QuickMessageData) {
        return await prisma.quickMessage.create({
            data: {
                text: data.text,
                category: data.category,
                icon: data.icon,
                order: data.order || 0
            }
        });
    }

    /**
     * Seed inicial de mensagens prontas
     */
    static async seedDefaultMessages() {
        // Mensagens do Entregador para Cliente
        const courierMessages = [
            { text: '🚴 Já estou a caminho!', icon: '🚴', order: 1 },
            { text: '📍 Já cheguei!', icon: '📍', order: 2 },
            { text: '🔍 Não achei o endereço', icon: '🔍', order: 3 },
            { text: '⏰ Vou atrasar 5 minutos', icon: '⏰', order: 4 },
            { text: '📞 Pode atender o telefone?', icon: '📞', order: 5 }
        ];

        // Mensagens do Cliente para Entregador
        const customerMessages = [
            { text: '❓ Já está a caminho?', icon: '❓', order: 1 },
            { text: '📍 Já chegou?', icon: '📍', order: 2 },
            { text: '🏠 Estou no portão', icon: '🏠', order: 3 },
            { text: '⏰ Pode esperar 2 minutos?', icon: '⏰', order: 4 }
        ];

        // Criar mensagens do entregador
        for (const msg of courierMessages) {
            await prisma.quickMessage.upsert({
                where: {
                    id: `courier-${msg.order}` // ID fixo para evitar duplicatas
                },
                create: {
                    id: `courier-${msg.order}`,
                    text: msg.text,
                    category: 'COURIER_TO_CUSTOMER',
                    icon: msg.icon,
                    order: msg.order
                },
                update: {}
            });
        }

        // Criar mensagens do cliente
        for (const msg of customerMessages) {
            await prisma.quickMessage.upsert({
                where: {
                    id: `customer-${msg.order}`
                },
                create: {
                    id: `customer-${msg.order}`,
                    text: msg.text,
                    category: 'CUSTOMER_TO_COURIER',
                    icon: msg.icon,
                    order: msg.order
                },
                update: {}
            });
        }
    }

    /**
     * Busca todas as mensagens prontas
     */
    static async getAll() {
        return await prisma.quickMessage.findMany({
            orderBy: [
                { category: 'asc' },
                { order: 'asc' }
            ]
        });
    }
}
