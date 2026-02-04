import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkRestaurantStatus } from "@/lib/services/availability.service";

export async function GET() {
    try {
        const restaurants = await prisma.restaurant.findMany({
            include: {
                operatingDays: true,
                shifts: true,
                products: true, // Need products to filter/show tags? Or simplify.
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
<<<<<<< Current (Your changes)
                    nextOpen: status.nextOpen,
                    nextOpenMessage: status.nextOpenMessage,
                    tags: r.tags ? r.tags.split(',').map((t: string) => t.trim()) : ["Lanches", "Jantar"]
=======
                    nextOpen: status.nextOpen?.toISOString?.() ?? null,
                    tags: (r as { tags?: string }).tags ? (r as { tags: string }).tags.split(',').map((t: string) => t.trim()) : ["Cardápio"]
>>>>>>> Incoming (Background Agent changes)
                };
            })
        );

        return NextResponse.json(results);
    } catch (error) {
        console.error("Error listing restaurants:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
