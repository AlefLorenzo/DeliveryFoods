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

        const { status, notes, courierId } = await request.json();

        // 1. Validar transição (opcional, mas recomendado)
        // 2. Se for Courier tentando aceitar, o status deve ser 'READY' -> 'PICKED_UP' (ou similar)

        const targetStatus = status as OrderStatus;
        const targetNotes = notes;

        // Lógica Especial para Entregador aceitando pedido
        /*
        if (decoded.role === 'COURIER' && !status) {
            targetStatus = 'PICKED_UP'; // Ou 'DELIVERING' dependendo do enum
            targetNotes = 'Pedido coletado pelo entregador.';
        }
        */

        const order = await OrderService.updateStatus(id, targetStatus, decoded.sub, targetNotes);

        // Se o courierId foi passado (Aceite de corrida), atualizar o campo courierId explicitamente
        if (courierId || (decoded.role === 'COURIER' && targetStatus === 'PICKED_UP')) {
            await prisma.order.update({
                where: { id },
                data: { courierId: courierId || decoded.sub }
            });
        }

        return NextResponse.json(order);

    } catch (error) {
        return handleApiError(error);
    }
}
