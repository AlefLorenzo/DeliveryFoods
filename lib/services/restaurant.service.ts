import prisma from '@/lib/prisma';

export class RestaurantService {
    static async getNearby() {
        // Em produção real, poderíamos usar extensões PostGIS
        return prisma.restaurant.findMany({
            where: { active: true },
            include: {
                owner: { select: { name: true, avatar: true } },
                products: { take: 1 }
            }
        });
    }

    static async getById(id: string) {
        return prisma.restaurant.findUnique({
            where: { id },
            include: {
                products: { where: { active: true } },
                owner: true
            }
        });
    }

    static async getStats(ownerId: string) {
        const restaurant = await prisma.restaurant.findFirst({
            where: { ownerId }
        });

        if (!restaurant) return null;

        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        const [dailyStats, monthlyStats, totalStats, recentOrders, weeklyData] = await Promise.all([
            // Receita Diária
            prisma.order.aggregate({
                where: { restaurantId: restaurant.id, createdAt: { gte: startOfDay } },
                _sum: { total: true },
                _count: { id: true }
            }),
            // Receita Mensal
            prisma.order.aggregate({
                where: { restaurantId: restaurant.id, createdAt: { gte: startOfMonth } },
                _sum: { total: true }
            }),
            // Total e Ticket Médio
            prisma.order.aggregate({
                where: { restaurantId: restaurant.id },
                _sum: { total: true },
                _count: { id: true },
                _avg: { total: true }
            }),
            // Pedidos Recentes
            prisma.order.findMany({
                where: { restaurantId: restaurant.id },
                orderBy: { createdAt: 'desc' },
                take: 5,
                include: { user: { select: { name: true } } }
            }),
            // Dados para o Gráfico (últimos 7 dias)
            prisma.order.groupBy({
                by: ['createdAt'],
                where: { restaurantId: restaurant.id, createdAt: { gte: sevenDaysAgo } },
                _sum: { total: true },
            })
        ]);

        // Processar dados do gráfico por dia
        const chartData = Array.from({ length: 7 }, (_, i) => {
            const date = new Date(now.getTime() - (6 - i) * 24 * 60 * 60 * 1000);
            const dateStr = date.toLocaleDateString('pt-BR', { weekday: 'short' });
            const dayTotal = weeklyData
                .filter(d => d.createdAt.toDateString() === date.toDateString())
                .reduce((acc, d) => acc + (d._sum.total || 0), 0);
            return { name: dateStr, value: dayTotal };
        });

        return {
            revenue: {
                daily: dailyStats._sum.total || 0,
                monthly: monthlyStats._sum.total || 0,
                total: totalStats._sum.total || 0
            },
            orders: {
                daily: dailyStats._count.id,
                total: totalStats._count.id
            },
            averageTicket: totalStats._avg.total || 0,
            recentOrders,
            chartData
        };
    }
}
