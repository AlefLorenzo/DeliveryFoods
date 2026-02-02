import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { TokenService } from '@/lib/services/token.service';
import { handleApiError, AppError } from '@/lib/error-handler';

export async function GET(request: Request) {
    try {
        const authHeader = request.headers.get('authorization');
        if (!authHeader) throw new AppError('Não autorizado', 401);

        const token = authHeader.split(' ')[1];
        const decoded = TokenService.verifyToken(token);
        if (!decoded) throw new AppError('Sessão expirada', 401);

        let where: any = {};
        console.log(`Buscando histórico para: ${decoded.email} (${decoded.role}) ID: ${decoded.sub}`);

        if (decoded.role === 'CLIENT') {
            where = { userId: decoded.sub };
        } else if (decoded.role === 'RESTAURANT') {
            where = { restaurant: { ownerId: decoded.sub } };
        } else if (decoded.role === 'COURIER') {
            where = {
                OR: [
                    { courierId: decoded.sub },
                    { status: 'READY', courierId: null }
                ]
            };
        }
        console.log("Filtro aplicado:", JSON.stringify(where));

        const orders = await prisma.order.findMany({
            where,
            include: {
                restaurant: { select: { id: true, name: true, image: true, deliveryFee: true } },
                user: { select: { name: true, phone: true, details: { select: { street: true, city: true, neighborhood: true, state: true, number: true } } } },
                items: { include: { product: { select: { name: true, image: true } } } },
                timeline: { orderBy: { createdAt: 'desc' } }
            },
            orderBy: { createdAt: 'desc' }
        });
        console.log(`Encontrados ${orders.length} pedidos para este filtro.`);

        return NextResponse.json(orders);

    } catch (error) {
        return handleApiError(error);
    }
}
