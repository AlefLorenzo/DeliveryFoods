import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { TokenService } from '@/lib/services/token.service';
import { AppError, handleApiError } from '@/lib/error-handler';

// Estado em memória para quando o banco não está disponível
const courierStatusMemory = new Map<string, boolean>();

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const courierId = searchParams.get('courierId');

        if (!courierId) throw new AppError('courierId é obrigatório', 400);

        try {
            const status = await prisma.courierStatus.findUnique({
                where: { courierId }
            });
            return NextResponse.json({ isOnline: status ? !!status.isOnline : false });
        } catch (dbError) {
            // Fallback para memória
            return NextResponse.json({ isOnline: courierStatusMemory.get(courierId) || false });
        }
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

        try {
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
        } catch (dbError) {
            // Fallback para memória
            courierStatusMemory.set(courierId, isOnline);
            return NextResponse.json({ success: true, isOnline });
        }
    } catch (error) {
        return handleApiError(error);
    }
}
