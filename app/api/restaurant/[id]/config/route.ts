import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { TokenService } from "@/lib/services/token.service";
import { AppError, handleApiError } from "@/lib/error-handler";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    try {
        const restaurant = await prisma.restaurant.findUnique({
            where: { id },
            include: {
                operatingDays: true,
                shifts: true,
            },
        });

        if (!restaurant) {
            return NextResponse.json(
                { error: "Restaurant not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            operatingDays: restaurant.operatingDays,
            shifts: restaurant.shifts,
        });
    } catch (error) {
        console.error("Error fetching restaurant config:", error);
        return handleApiError(error);
    }
}

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    try {
        const authHeader = request.headers.get('authorization');
        if (!authHeader) throw new AppError('Não autorizado', 401);

        const token = authHeader.split(' ')[1];
        const decoded = TokenService.verifyToken(token);
        if (!decoded) throw new AppError('Sessão expirada', 401);

        const restaurant = await prisma.restaurant.findUnique({
            where: { id }
        });

        if (!restaurant) throw new AppError('Restaurante não encontrado', 404);
        if (restaurant.ownerId !== decoded.sub && decoded.role !== 'RESTAURANT') {
            throw new AppError('Acesso negado', 403);
        }

        const body = await request.json();
        const { operatingDays, shifts } = body;
        // operatingDays: { dayOfWeek: number, enabled: boolean }[]
        // shifts: { name: string, startTime: string, endTime: string }[] (Might need ID for update)

        // Update Operating Days
        // Strategy: Delete all and recreate, or upsert.
        // For simplicity: Upsert loop.

        if (operatingDays && Array.isArray(operatingDays)) {
            for (const day of operatingDays) {
                await prisma.operatingDay.upsert({
                    where: {
                        restaurantId_dayOfWeek: {
                            restaurantId: id,
                            dayOfWeek: day.dayOfWeek,
                        },
                    },
                    update: { enabled: day.enabled },
                    create: {
                        restaurantId: id,
                        dayOfWeek: day.dayOfWeek,
                        enabled: day.enabled,
                    },
                });
            }
        }

        // Update Shifts
        // Strategy: If ID provided, update. If not, create. 
        // If we want to support delete, we might need a separate DELETE endpoint or a list of active IDs.
        // For this MVP, let's assume we replace shifts or add them. 
        // To handle deletions safely without ID tracking in UI, simplest is "Delete all for restaurant and recreate" 
        // BUT that destroys product associations. 
        // Better: Upsert if ID present, Create if not. 
        // Deletion: logic handled by explicit delete request usually. 
        // Let's implement Upsert/Create.

        if (shifts && Array.isArray(shifts)) {
            for (const shift of shifts) {
                if (shift.id) {
                    await prisma.shift.update({
                        where: { id: shift.id },
                        data: {
                            name: shift.name,
                            startTime: shift.startTime,
                            endTime: shift.endTime,
                        },
                    });
                } else {
                    await prisma.shift.create({
                        data: {
                            restaurantId: id,
                            name: shift.name,
                            startTime: shift.startTime,
                            endTime: shift.endTime,
                        },
                    });
                }
            }
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error updating config:", error);
        return handleApiError(error);
    }
}
