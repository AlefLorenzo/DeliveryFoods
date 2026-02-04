import { NextResponse } from 'next/server';
import { ChatTripartiteService } from '@/lib/services/chat-tripartite.service';
import { TokenService } from '@/lib/services/token.service';
import { handleApiError, AppError } from '@/lib/error-handler';

// GET /api/chat/channels/[orderId] - Buscar canais de um pedido
export async function GET(
    request: Request,
    { params }: { params: { orderId: string } }
) {
    try {
        const authHeader = request.headers.get('authorization');
        if (!authHeader) throw new AppError('Não autorizado', 401);

        const token = authHeader.split(' ')[1];
        const decoded = TokenService.verifyToken(token);

        if (!decoded) throw new AppError('Token inválido', 401);

        const channels = await ChatTripartiteService.getChannelsByOrder(
            params.orderId,
            decoded.sub as string
        );

        return NextResponse.json(channels);
    } catch (error) {
        return handleApiError(error);
    }
}
