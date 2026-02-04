import prisma from "@/lib/prisma";

export type RestaurantStatus = {
    isOpen: boolean;
    message: string;
    currentShift?: {
        id: string;
        name: string;
    };
<<<<<<< Current (Your changes)
    nextOpen?: string; // HH:MM ou "Amanhã" para countdown
    nextOpenMessage?: string; // "Abre às 18:00"
=======
    /** Para countdown: próxima abertura (ex.: "Disponível a partir das 18:00") */
    nextOpen?: Date;
    /** Horário da próxima abertura em string HH:MM para exibição */
    nextOpenAt?: string;
>>>>>>> Incoming (Background Agent changes)
};

interface OperatingDay {
    dayOfWeek: number;
    enabled: boolean;
}

interface Shift {
    id: string;
    name: string;
    startTime: string;
    endTime: string;
}

export async function checkRestaurantStatus(
    restaurantId: string
): Promise<RestaurantStatus> {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = Sunday

    // Format current time as HH:MM for comparison
    const currentHours = now.getHours().toString().padStart(2, '0');
    const currentMinutes = now.getMinutes().toString().padStart(2, '0');
    const currentTimeStr = `${currentHours}:${currentMinutes}`;

    const restaurant = await prisma.restaurant.findUnique({
        where: { id: restaurantId },
        include: {
            operatingDays: true,
            shifts: true,
        },
    });

    if (!restaurant) {
        return { isOpen: false, message: "Restaurant not found" };
    }

    // 1. Check if ACTIVE globally
    if (!restaurant.active) {
        return { isOpen: false, message: "Temporarily Closed" };
    }

    // 2. Check Operating Day
    // If no operating days defined, assume OPEN for backward compatibility 
    // (OR assume CLOSED if strict. Prompt said "mandatory config", but to avoid breaking existing, 
    // we might check if they have ANY operating days set. If count > 0, enforce it.)
    if (restaurant.operatingDays.length > 0) {
        const todayConfig = restaurant.operatingDays.find((d: OperatingDay) => d.dayOfWeek === dayOfWeek);
        if (!todayConfig || !todayConfig.enabled) {
            return { isOpen: false, message: "Closed Today" };
        }
    }

    // 3. Check Shifts
    // If no shifts defined, assume OPEN 24h? Or Closed? 
    // "The system blocks automatically outside of hours". 
    // If undefined, let's treat as "check operating day only" or create a default "All Day" shift.
    // For now, if no shifts, we treat as Open if Day is OK (Legacy mode). 
    // BUT the prompt implies strict Shift control. 
    // If shifts exist, enforce them.

    if (restaurant.shifts.length > 0) {
        const activeShift = restaurant.shifts.find((shift: Shift) => {
            // Simple string comparison HH:MM works if time is same day. 
            // Does not support overnight shifts (23:00 - 02:00) easily without more logic.
            // Assuming intraday shifts for "Lunch/Dinner".
            return currentTimeStr >= shift.startTime && currentTimeStr <= shift.endTime;
        });

        if (activeShift) {
            return {
                isOpen: true,
                message: `Open for ${activeShift.name}`,
                currentShift: { id: activeShift.id, name: activeShift.name },
            };
        } else {
            // Find next shift today for countdown
            const sortedShifts = [...restaurant.shifts].sort((a, b) => a.startTime.localeCompare(b.startTime));
            const nextShift = sortedShifts.find(s => s.startTime > currentTimeStr);

            if (nextShift) {
                const [h, m] = nextShift.startTime.split(':').map(Number);
                const nextOpen = new Date(now);
                nextOpen.setHours(h, m, 0, 0);
                return {
                    isOpen: false,
                    message: `Fechado - Abre às ${nextShift.startTime} (${nextShift.name})`,
                    nextOpen,
<<<<<<< Current (Your changes)
                    nextOpenAt: nextShift.startTime,
=======
>>>>>>> Incoming (Background Agent changes)
                };
            } else {
                return { isOpen: false, message: "Fechado por hoje" };
            }
        }
    }

    return { isOpen: true, message: "Aberto" };
}
