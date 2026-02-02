import prisma from '@/lib/prisma';

export class OrderQueryService {
    static async getActiveOrders(restaurantId: string) {
        return prisma.order.findMany({
            where: {
                restaurantId,
                status: { in: ['PENDING', 'CONFIRMED', 'PREPARING', 'READY'] }
            },
            include: {
                user: { select: { name: true } },
                items: { include: { product: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
    }

    static async getAvailableForCourier() {
        return prisma.order.findMany({
            where: { status: 'READY' },
            include: {
                restaurant: true,
                user: { select: { name: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
    }

    static async getCourierHistory(courierId: string) {
        return prisma.order.findMany({
            where: { courierId, status: 'DELIVERED' },
            include: { restaurant: true },
            orderBy: { createdAt: 'desc' }
        });
    }
}
