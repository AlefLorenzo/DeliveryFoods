import { NextResponse } from 'next/server';
import { RestaurantService } from '@/lib/services/restaurant.service';
import { handleApiError, AppError } from '@/lib/error-handler';
import { TokenService } from '@/lib/services/token.service';

// Mock stats para quando o banco não está disponível
const MOCK_STATS = {
    revenue: { daily: 0, monthly: 0, total: 0 },
    orders: { daily: 0, total: 0 },
    averageTicket: 0,
    recentOrders: [],
    chartData: [
        { name: 'Seg', value: 0 },
        { name: 'Ter', value: 0 },
        { name: 'Qua', value: 0 },
        { name: 'Qui', value: 0 },
        { name: 'Sex', value: 0 },
        { name: 'Sab', value: 0 },
        { name: 'Dom', value: 0 },
    ],
    summary: { daily: 0, monthly: 0, totalOrders: 0, avgTicket: 0 }
};

export async function GET(request: Request) {
    try {
        const authHeader = request.headers.get('authorization');
        if (!authHeader) throw new AppError('Não autorizado', 401);

        const token = authHeader.split(' ')[1];
        const decoded = TokenService.verifyToken(token);

        if (!decoded) {
            throw new AppError('Token inválido', 401);
        }

        if (decoded.role !== 'RESTAURANT') {
            throw new AppError('Não autorizado', 401);
        }

        try {
            const stats = await RestaurantService.getStats(decoded.sub as string);

            if (!stats) {
                return NextResponse.json(MOCK_STATS);
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
        } catch (dbError) {
            console.warn("Database unavailable for restaurant stats:", dbError);
            return NextResponse.json(MOCK_STATS);
        }

    } catch (error) {
        return handleApiError(error);
    }
}
