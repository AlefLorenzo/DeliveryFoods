import { NextResponse } from 'next/server';
import { orderSchema } from '@/lib/validations';
import { handleApiError, AppError } from '@/lib/error-handler';
import { TokenService } from '@/lib/services/token.service';
import { OrderService } from '@/lib/services/order.service';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
    try {
        const authHeader = request.headers.get('authorization');
        if (!authHeader) throw new AppError('Não autorizado', 401);

        const token = authHeader.split(' ')[1];
        const decoded = TokenService.verifyToken(token);
        if (!decoded) throw new AppError('Sessão expirada', 401);

        const body = await request.json();
        console.log("Recebendo novo pedido:", body);
        const validatedData = orderSchema.parse(body);

        const order = await OrderService.createOrder(
            decoded.sub,
            validatedData.restaurantId,
            validatedData.items,
            validatedData.paymentMethod,
            validatedData.discount || 0
        );
        console.log("Pedido criado com sucesso:", order.id);

        return NextResponse.json(order, { status: 201 });

    } catch (error) {
        return handleApiError(error);
    }
}

export async function GET(request: Request) {
    try {
        const authHeader = request.headers.get('authorization');
        if (!authHeader) throw new AppError('Não autorizado', 401);

        const token = authHeader.split(' ')[1];
        const decoded = TokenService.verifyToken(token);
        if (!decoded) throw new AppError('Sessão expirada', 401);

        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');

        const where: any = {};

        // Role-based filtering
        if (decoded.role === 'RESTAURANT') {
            const restaurant = await prisma.restaurant.findFirst({
                where: { ownerId: decoded.sub }
            });
            if (!restaurant) throw new AppError('Restaurante não encontrado para este usuário', 404);
            where.restaurantId = restaurant.id;
        } else if (decoded.role === 'COURIER') {
            // Couriers see READY orders or orders assigned to them
            where.OR = [
                { status: 'READY' },
                { courierId: decoded.sub }
            ];
        } else {
            // Clients see their own orders
            where.userId = decoded.sub;
        }

        if (status) {
            where.status = status;
        }

        const orders = await prisma.order.findMany({
            where,
            include: {
                items: { include: { product: true } },
                restaurant: true,
                user: { select: { name: true, phone: true } },
                timeline: { orderBy: { createdAt: 'desc' } }
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json(orders);
    } catch (error) {
        return handleApiError(error);
    }
}
