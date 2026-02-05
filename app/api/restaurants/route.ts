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

        const results = await Promise.all(
            restaurants.map(async (r) => {
                // Enforce types if needed, casting to any because of checkRestaurantStatus expecting specific shape if types aren't synced
                // checkRestaurantStatus takes string ID. We should update it to take object if possible to save DB call?
                // But checkRestaurantStatus currently does a findUnique. Inefficient for N restaurants. 
                // Optimization: Refactor checkRestaurantStatus to accept the data object.
                // For now, to be safe and use existing logic:
                const status = await checkRestaurantStatus(r.id);

                return {
                    ...r,
                    isOpen: status.isOpen,
                    statusMessage: status.message,
                    currentShift: status.currentShift,
                };
            })
        );

        return NextResponse.json(results);
    } catch (error) {   console.error("Error listing restaurants:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
