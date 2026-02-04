import { NextResponse } from 'next/server';
import { handleApiError, AppError } from '@/lib/error-handler';
import { TokenService } from '@/lib/services/token.service';
import { OrderService } from '@/lib/services/order.service';
import { ChatTripartiteService } from '@/lib/services/chat-tripartite.service';
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
        const targetStatus = status as OrderStatus;
        const targetNotes = notes;

        const shouldSetCourier = courierId || (decoded.role === 'COURIER' && targetStatus === 'PICKED_UP');

        if (shouldSetCourier) {
            const assignedCourierId = courierId || decoded.sub;
            await prisma.order.update({
                where: { id },
                data: { courierId: assignedCourierId }
            });
            try {
                const order = await prisma.order.findUnique({
                    where: { id },
                    include: { restaurant: { select: { ownerId: true } } }
                });
                if (order?.userId && order.restaurant?.ownerId) {
                    const existingChannels = await prisma.chatChannel.findMany({
                        where: { orderId: id, type: { in: ['CUSTOMER_COURIER', 'RESTAURANT_COURIER'] } }
                    });
                    if (!existingChannels.some(c => c.type === 'CUSTOMER_COURIER')) {
                        await ChatTripartiteService.createCustomerCourierChannel(id, order.userId, assignedCourierId);
                    }
                    if (!existingChannels.some(c => c.type === 'RESTAURANT_COURIER')) {
                        await ChatTripartiteService.createRestaurantCourierChannel(id, order.restaurant.ownerId, assignedCourierId);
                    }
                }
            } catch (e) {
                console.warn('[CHAT]: Falha ao criar canais entregador', e);
            }
        }

        const order = await OrderService.updateStatus(id, targetStatus, decoded.sub, targetNotes);

        return NextResponse.json(order);

    } catch (error) {
        return handleApiError(error);
    }
}
