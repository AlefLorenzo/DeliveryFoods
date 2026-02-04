import { NextResponse } from 'next/server';
import { CourierEarningsService } from '@/lib/services/courier-earnings.service';
import { TokenService } from '@/lib/services/token.service';
import { handleApiError, AppError } from '@/lib/error-handler';

// GET /api/courier/earnings/[courierId] - Buscar ganhos totais
export async function GET(
    request: Request,
    { params }: { params: { courierId: string } }
) {
    try {
        const authHeader = request.headers.get('authorization');
        if (!authHeader) throw new AppError('Não autorizado', 401);

        const token = authHeader.split(' ')[1];
        const decoded = TokenService.verifyToken(token);

        if (!decoded) throw new AppError('Token inválido', 401);

        // Validar que é o próprio courier ou admin
        if (decoded.sub !== params.courierId && decoded.role !== 'ADMIN') {
            throw new AppError('Não autorizado', 403);
        }

        const { searchParams } = new URL(request.url);
        const period = searchParams.get('period'); // 'today', 'week', 'month', 'all'

        let earnings;

        switch (period) {
            case 'today':
                earnings = await CourierEarningsService.getTodayEarnings(params.courierId);
                break;
            case 'week':
                earnings = await CourierEarningsService.getWeekEarnings(params.courierId);
                break;
            case 'month':
                earnings = await CourierEarningsService.getMonthEarnings(params.courierId);
                break;
            default:
                earnings = await CourierEarningsService.getTotalEarnings(params.courierId);
        }

        return NextResponse.json(earnings);
    } catch (error) {
        return handleApiError(error);
    }
}
