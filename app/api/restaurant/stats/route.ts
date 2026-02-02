import { NextResponse } from 'next/server';
import { RestaurantService } from '@/lib/services/restaurant.service';
import { handleApiError, AppError } from '@/lib/error-handler';
import { TokenService } from '@/lib/services/token.service';

export async function GET(request: Request) {
    try {
        const authHeader = request.headers.get('authorization');
        if (!authHeader) throw new AppError('Não autorizado', 401);

        const token = authHeader.split(' ')[1];
        const decoded = TokenService.verifyToken(token);
        if (!decoded || decoded.role !== 'RESTAURANT') throw new AppError('Não autorizado', 401);

        const stats = await RestaurantService.getStats(decoded.sub);

        if (!stats) {
            throw new AppError('Restaurante não encontrado para este usuário', 404);
        }

        return NextResponse.json({
            revenue: {
                daily: stats.revenue.daily,
                monthly: stats.revenue.monthly,
                total: stats.revenue.total
            },
            orders: {
                daily: stats.orders.daily,
                total: stats.orders.total
            },
            averageTicket: stats.averageTicket,
            recentOrders: stats.recentOrders.map(o => ({
                id: o.id,
                customer: o.user.name,
                total: o.total,
                status: o.status,
                createdAt: o.createdAt
            })),
            chartData: stats.chartData,
            summary: {
                daily: stats.revenue.daily,
                monthly: stats.revenue.monthly,
                totalOrders: stats.orders.total,
                avgTicket: stats.averageTicket
            }
        });

    } catch (error) {
        return handleApiError(error);
    }
}
