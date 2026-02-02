import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { TokenService } from '@/lib/services/token.service';
import { AppError, handleApiError } from '@/lib/error-handler';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const courierId = searchParams.get('courierId');

        if (!courierId) throw new AppError('courierId é obrigatório', 400);

        const status = await prisma.courierStatus.findUnique({
            where: { courierId }
        });
        return NextResponse.json({ isOnline: status ? !!status.isOnline : false });
    } catch (error) {
        return handleApiError(error);
    }
}

export async function POST(request: Request) {
    try {
        const authHeader = request.headers.get('authorization');
        if (!authHeader) throw new AppError('Não autorizado', 401);

        const token = authHeader.split(' ')[1];
        const decoded = TokenService.verifyToken(token);
        if (!decoded || decoded.role !== 'COURIER') throw new AppError('Acesso negado', 403);

        const { isOnline } = await request.json();
        const courierId = decoded.sub;

        // Upsert logic with Prisma
        const result = await prisma.courierStatus.upsert({
            where: { courierId },
            update: {
                isOnline,
                lastUpdate: new Date()
            },
            create: {
                courierId,
                isOnline,
                lastUpdate: new Date()
            }
        });

        return NextResponse.json({ success: true, isOnline: result.isOnline });
    } catch (error) {
        return handleApiError(error);
    }
}
