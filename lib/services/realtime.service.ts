import { pusherServer, PUSHER_EVENTS } from '../pusher';

export class RealtimeService {
    static async notifyOrderUpdate(orderId: string, status: string, userId: string) {
        try {
            await pusherServer.trigger(`user-${userId}`, PUSHER_EVENTS.ORDER_STATUS_UPDATED, {
            orderId,
            status,
            timestamp: new Date().toISOString(),
        });
    }

    static async emitLocation(courierId: string, lat: number, lng: number) {
        try {
            await pusherServer.trigger(`courier-${courierId}`, PUSHER_EVENTS.LOCATION_UPDATED, { lat, lng });
        } catch (e) {
            console.warn('[PUSHER_ERROR]: Falha ao disparar evento de localização em tempo real', e);
        }
    }
}
