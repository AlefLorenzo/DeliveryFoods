import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkRestaurantStatus } from "@/lib/services/availability.service";
import { MOCK_RESTAURANTS } from "@/lib/data";

export async function GET() {
    try {
        const restaurants = await prisma.restaurant.findMany({
            include: {
                operatingDays: true,
                shifts: true,
                products: true,
            },
        });

        const now = Date.now();
        const twentyFourHoursAgo = now - 24 * 60 * 60 * 1000;

        const results = await Promise.all(
            restaurants.map(async (r) => {
                const status = await checkRestaurantStatus(r.id);
                const products = (r.products as { id: string; name: string; description: string | null; price: number; image: string | null; category: string; active: boolean; isNew?: boolean; createdAt: Date }[]).map((p) => ({
                    ...p,
                    isNew: p.isNew ?? (new Date(p.createdAt).getTime() > twentyFourHoursAgo),
                }));

                return {
                    ...r,
                    products,
                    isOpen: status.isOpen,
                    statusMessage: status.message,
                    currentShift: status.currentShift,
                    nextOpen: status.nextOpen?.toISOString?.() ?? null,
                    nextOpenMessage: status.nextOpenMessage ?? null,
                    tags: (r as { tags?: string }).tags ? (r as { tags: string }).tags.split(',').map((t: string) => t.trim()) : ["Lanches", "Jantar"]
                };
            })
        );

        return NextResponse.json(results);
    } catch (error) {
        // Fallback para dados mock quando o banco de dados não está disponível
        console.warn("Database unavailable, using mock data:", error);
        return NextResponse.json(MOCK_RESTAURANTS);
    }
}
