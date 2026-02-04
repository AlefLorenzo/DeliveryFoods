import prisma from '@/lib/prisma';
import { pusherServer } from '../pusher';
import { AppError } from '@/lib/error-handler';

/**
 * Serviço de Ganhos do Entregador
 * 
 * REGRAS:
 * 1. Entregador começa com R$ 0,00
 * 2. Ganha valor da entrega quando CLIENTE CONFIRMA recebimento
 * 3. Histórico em tempo real via Pusher
 */
export class CourierEarningsService {
    /**
     * Registra ganho quando cliente confirma entrega
     * 
     * TRIGGER: Quando Order.status muda para DELIVERED
     */
    static async registerEarning(orderId: string, courierId: string) {
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: { restaurant: true }
        });

        if (!order) throw new AppError('Pedido não encontrado', 404);

        if (order.courierId !== courierId) {
            throw new AppError('Este pedido não pertence a você', 403);
        }

        if (order.status !== 'DELIVERED') {
            throw new AppError('Pedido ainda não foi entregue', 400);
        }

        // Verificar se já foi registrado
        const existing = await prisma.courierEarnings.findUnique({
            where: { orderId }
        });

        if (existing) {
            throw new AppError('Ganho já registrado para este pedido', 400);
        }

        // Calcular valor do ganho (taxa de entrega)
        const amount = order.deliveryFee;

        // Registrar ganho
        const earning = await prisma.courierEarnings.create({
            data: {
                courierId,
                orderId,
                amount,
                confirmedAt: new Date()
            }
        });

        // Broadcast em tempo real
        try {
            const totalEarnings = await this.getTotalEarnings(courierId);
            await pusherServer.trigger(
                `courier-${courierId}-earnings`,
                'earning-added',
                {
                    earning,
                    totalEarnings
                }
            );
        } catch (e) {
            console.warn('[PUSHER_ERROR]:', e);
        }

        return earning;
    }

    /**
     * Busca ganhos totais do entregador
     */
    static async getTotalEarnings(courierId: string) {
        const result = await prisma.courierEarnings.aggregate({
            where: { courierId },
            _sum: {
                amount: true
            },
            _count: {
                id: true
            }
        });

        return {
            total: result._sum.amount || 0,
            deliveries: result._count.id || 0,
            average: result._count.id > 0
                ? (result._sum.amount || 0) / result._count.id
                : 0
        };
    }

    /**
     * Busca histórico de ganhos
     */
    static async getEarningsHistory(courierId: string, limit = 50) {
        const earnings = await prisma.courierEarnings.findMany({
            where: { courierId },
            orderBy: {
                confirmedAt: 'desc'
            },
            take: limit,
            include: {
                courier: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            }
        });

        return earnings;
    }

    /**
     * Busca ganhos por período
     */
    static async getEarningsByPeriod(
        courierId: string,
        startDate: Date,
        endDate: Date
    ) {
        const earnings = await prisma.courierEarnings.findMany({
            where: {
                courierId,
                confirmedAt: {
                    gte: startDate,
                    lte: endDate
                }
            },
            orderBy: {
                confirmedAt: 'desc'
            }
        });

        const total = earnings.reduce((sum, e) => sum + e.amount, 0);

        return {
            earnings,
            total,
            count: earnings.length,
            average: earnings.length > 0 ? total / earnings.length : 0
        };
    }

    /**
     * Busca ganhos de hoje
     */
    static async getTodayEarnings(courierId: string) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        return this.getEarningsByPeriod(courierId, today, tomorrow);
    }

    /**
     * Busca ganhos desta semana
     */
    static async getWeekEarnings(courierId: string) {
        const today = new Date();
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay()); // Domingo
        startOfWeek.setHours(0, 0, 0, 0);

        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 7);

        return this.getEarningsByPeriod(courierId, startOfWeek, endOfWeek);
    }

    /**
     * Busca ganhos deste mês
     */
    static async getMonthEarnings(courierId: string) {
        const today = new Date();
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59);

        return this.getEarningsByPeriod(courierId, startOfMonth, endOfMonth);
    }
}
