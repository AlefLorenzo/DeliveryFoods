import Pusher from 'pusher';

const pusher = new Pusher({
    appId: process.env.PUSHER_APP_ID || '',
    key: process.env.PUSHER_KEY || '',
    secret: process.env.PUSHER_SECRET || '',
    cluster: process.env.PUSHER_CLUSTER || 'mt1',
    useTLS: true,
});

export class RealtimeService {
    static async notifyOrderUpdate(orderId: string, status: string, userId: string) {
        if (!process.env.PUSHER_APP_ID) {
            console.log(`[REALTIME_LOG]: Pedido ${orderId} atualizado para ${status}. Pusher não configurado.`);
            return;
        }
        await pusher.trigger(`user-${userId}`, 'order-update', {
            orderId,
            status,
            timestamp: new Date().toISOString(),
        });
    }

    static async emitLocation(courierId: string, lat: number, lng: number) {
        if (!process.env.PUSHER_APP_ID) return;
        await pusher.trigger(`courier-${courierId}`, 'location-update', { lat, lng });
    }
}
