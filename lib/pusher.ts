import PusherServer from 'pusher';
import PusherClient from 'pusher-js';

// Server-side Pusher (for API routes)
export const pusherServer = new PusherServer({
    appId: process.env.PUSHER_APP_ID || '',
    key: process.env.NEXT_PUBLIC_PUSHER_KEY || '',
    secret: process.env.PUSHER_SECRET || '',
    cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'us2',
    useTLS: true,
});

// Client-side Pusher (for browser)
export const getPusherClient = () => {
    if (!process.env.NEXT_PUBLIC_PUSHER_KEY) return null;
    return new PusherClient(process.env.NEXT_PUBLIC_PUSHER_KEY, {
        cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'us2',
    });
};

export const PUSHER_EVENTS = {
    ORDER_CREATED: 'order:created',
    ORDER_STATUS_UPDATED: 'order-status-updated',
    CHAT_MESSAGE: 'chat-message',
    LOCATION_UPDATED: 'location-updated',
};
