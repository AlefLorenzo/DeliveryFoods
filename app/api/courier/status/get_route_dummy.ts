import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const courierId = searchParams.get('courierId');

    if (!courierId) {
        return NextResponse.json({ error: 'courierId é obrigatório' }, { status: 400 });
    }

    try {
        const status = await prisma.courierStatus.findUnique({
            where: { courierId }
        });
        return NextResponse.json({ isOnline: status ? !!status.isOnline : false });
    } catch {
        return NextResponse.json({ error: 'Erro ao buscar status' }, { status: 500 });
    }
}
