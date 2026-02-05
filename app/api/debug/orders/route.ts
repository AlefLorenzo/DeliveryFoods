import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
    try {
        const orders = await prisma.order.findMany({
            include: {
                restaurant: { select: { name: true, ownerId: true } },
                user: { select: { name: true, email: true } },
                items: true
            },
            orderBy: { createdAt: 'desc' }
        });

        const count = await prisma.order.count();
        const restaurants = await prisma.restaurant.findMany({
            select: { id: true, name: true, ownerId: true }
        });
        const users = await prisma.user.findMany({
            select: { id: true, email: true, role: true }
        });

        return NextResponse.json({
            count,
            orders,
            restaurants,
            users
        });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
