import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Mock restaurant para demo
const MOCK_RESTAURANT = {
    id: "demo-restaurant",
    name: "Restaurante Demo",
    description: "Restaurante de demonstração",
    image: "https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=800&q=80",
    rating: 4.8,
    deliveryFee: 5.99,
    avgTime: "30-45 min",
    active: true,
    tags: "Lanches,Hambúrgueres"
};

export async function GET(
    request: Request,
    { params }: { params: Promise<{ userId: string }> }
) {
    const { userId } = await params;

    try {
        const restaurant = await prisma.restaurant.findFirst({
            where: { ownerId: userId },
        });

        if (!restaurant) {
            // Retornar mock para usuários demo
            if (userId.startsWith('demo-')) {
                return NextResponse.json({ ...MOCK_RESTAURANT, ownerId: userId });
            }
            return NextResponse.json(
                { error: "Restaurant not found for this user" },
                { status: 404 }
            );
        }

        return NextResponse.json(restaurant);
    } catch (error) {
        console.warn("Database unavailable, returning mock restaurant:", error);
        return NextResponse.json({ ...MOCK_RESTAURANT, ownerId: userId });
    }
}
