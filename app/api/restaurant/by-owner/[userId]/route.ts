import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
    request: Request,
    { params }: { params: { userId: string } }
) {
    const { userId } = params;

    try {
        const restaurant = await prisma.restaurant.findFirst({
            where: { ownerId: userId },
        });

        if (!restaurant) {
            return NextResponse.json(
                { error: "Restaurant not found for this user" },
                { status: 404 }
            );
        }

        return NextResponse.json(restaurant);
    } catch (error) {
        console.error("Error fetching restaurant:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
