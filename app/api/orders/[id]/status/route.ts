import { NextResponse } from 'next/server';
import { handleApiError, AppError } from '@/lib/error-handler';
import { TokenService } from '@/lib/services/token.service';
import { OrderService } from '@/lib/services/order.service';
import { OrderStatus } from '@prisma/client';
import prisma from '@/lib/prisma';

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const authHeader = request.headers.get('authorization');
        if (!authHeader) throw new AppError('Não autorizado', 401);

        const token = authHeader.split(' ')[1];
        const decoded = TokenService.verifyToken(token);
        if (!decoded) throw new AppError('Sessão expirada', 401);

        const body = await request.json();
        const { status, notes, courierId } = body;
        console.log(`Recebendo atualização de status para pedido ${id}:`, body);

        const targetStatus = status as OrderStatus;
        const targetNotes = notes;

        // Se o courierId foi passado ou se o usuário é COURIER aceitando/pegando o pedido
        const shouldSetCourier = courierId ||
            (decoded.role === 'COURIER' && ['PICKED_UP', 'DELIVERING'].includes(targetStatus));

        if (shouldSetCourier) {
            await prisma.order.update({
                where: { id },
                data: { courierId: courierId || decoded.sub }
            });
        }

        const order = await OrderService.updateStatus(id, targetStatus, decoded.sub, targetNotes);

        return NextResponse.json(order);

    } catch (error) {
        return handleApiError(error);
    }
}
