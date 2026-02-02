"use client";
import { useState, useEffect, useCallback } from "react";
import { useAuthStore } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Navigation, Clock, Wallet, Star, AlertCircle, ShoppingBag } from "lucide-react";
import { useRouter } from "next/navigation";
import { getPusherClient, PUSHER_EVENTS } from "@/lib/pusher";
import { useNotificationStore } from "@/lib/store";

interface CourierOrder {
    id: string;
    status: string;
    courierId?: string | null;
    deliveryFee: number;
    restaurant: { name: string; address: string };
    user: { name: string; details: { street: string } };
}

export default function CourierFeed() {
    const router = useRouter();
    const { accessToken } = useAuthStore();
    const [orders, setOrders] = useState<CourierOrder[]>([]);
    const [isOnline, setIsOnline] = useState(true);

    const fetchOrders = useCallback(async () => {
        try {
            const res = await fetch('/api/orders/history', {
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });
            const data = await res.json();
            if (res.ok) setOrders(data);
        } catch (err) {
            console.error("Erro ao carregar feed do entregador:", err);
        }
    }, [accessToken]);

    useEffect(() => {
        if (accessToken) {
            fetchOrders();
            const interval = setInterval(fetchOrders, 30000); // Pulse slower with real-time active
            return () => clearInterval(interval);
        }
    }, [accessToken, fetchOrders]);

    useEffect(() => {
        if (!accessToken || !isOnline) return;

        const pusher = getPusherClient();
        if (!pusher) return;

        // Entregadores assinam um canal global de novos pedidos ou notificações diretas
        const channel = pusher.subscribe('courier-feed');

        channel.bind(PUSHER_EVENTS.ORDER_STATUS_UPDATED, (updatedOrder: CourierOrder) => {
            if (updatedOrder.status === 'READY') {
                setOrders(prev => {
                    const exists = prev.find(o => o.id === updatedOrder.id);
                    if (exists) return prev.map(o => o.id === updatedOrder.id ? updatedOrder : o);
                    return [updatedOrder, ...prev];
                });
                useNotificationStore.getState().addNotification(`Novo pedido disponível para coleta!`, 'info');
            } else {
                // If order is no longer ready (e.g. accepted by another), remove it
                setOrders(prev => prev.filter(o => o.id !== updatedOrder.id || o.status === 'READY'));
            }
        });

        return () => {
            pusher.unsubscribe('courier-feed');
        };
    }, [accessToken, isOnline]);

    const handleAccept = async (orderId: string) => {
        try {
            const res = await fetch(`/api/orders/${orderId}/status`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status: 'PICKED_UP' }) // Aceitar = Coletado do restaurante
            });
            if (res.ok) {
                router.push(`/run/${orderId}`);
            }
        } catch (err) {
            console.error("Erro ao aceitar corrida:", err);
        }
    };

    // Entregadores veem pedidos PRONTOS para coleta (handled by API filter now, but we can refine here)
    const availableOrders = orders.filter((o) => o.status === 'READY' && !o.courierId);

    return (
        <div className="space-y-6 pb-4">
            {/* Status & Ganhos */}
            <div className="space-y-4">
                <div className="flex items-center justify-between bg-card p-2 rounded-[32px] border-2 border-border shadow-sm">
                    <div className="flex items-center gap-3 pl-4">
                        <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                        <span className="font-black text-sm uppercase tracking-widest text-foreground">
                            {isOnline ? 'Você está Online' : 'Você está Offline'}
                        </span>
                    </div>
                    <Button
                        onClick={() => setIsOnline(!isOnline)}
                        className={`rounded-[24px] px-6 h-12 font-black transition-all ${isOnline ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'} text-white`}
                    >
                        {isOnline ? 'Ficar Offline' : 'Ficar Online'}
                    </Button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <Card className="bg-primary/5 border-primary/20 rounded-[32px] shadow-lg">
                        <CardContent className="p-5 flex flex-col items-center text-center">
                            <Wallet className="w-5 h-5 text-primary mb-2" />
                            <div className="text-2xl font-black text-foreground">R$142,50</div>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Ganhos hoje</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-yellow-500/5 border-yellow-500/20 rounded-[32px] shadow-lg">
                        <CardContent className="p-5 flex flex-col items-center text-center">
                            <Star className="w-5 h-5 text-yellow-500 mb-2" />
                            <div className="text-2xl font-black text-foreground">4.92</div>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Sua Avaliação</p>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {!isOnline ? (
                <div className="flex flex-col items-center justify-center py-20 bg-muted/20 rounded-[40px] border-2 border-dashed border-border">
                    <AlertCircle className="w-16 h-16 mb-4 text-muted-foreground/30" />
                    <h2 className="text-xl font-black text-foreground tracking-tight">Modo Offline</h2>
                    <p className="text-sm font-medium text-muted-foreground mt-2 max-w-[200px] text-center">Fique online para começar a receber pedidos próximos.</p>
                </div>
            ) : availableOrders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 bg-muted/20 rounded-[40px] border-2 border-dashed border-border animate-pulse">
                    <Navigation className="w-16 h-16 mb-4 text-primary/30" />
                    <h2 className="text-xl font-black text-foreground tracking-tight">Buscando Pedidos...</h2>
                    <p className="text-sm font-medium text-muted-foreground mt-2">Nenhum pedido pronto no momento.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {availableOrders.map((order) => (
                        <Card key={order.id} className="overflow-hidden bg-card border-none shadow-xl shadow-black/5 rounded-[32px] hover:scale-[1.02] transition-all group">
                            <CardContent className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-3 bg-primary/10 rounded-2xl text-primary group-hover:scale-110 transition-transform">
                                        <ShoppingBag className="w-6 h-6" />
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs font-black text-muted-foreground/60 uppercase tracking-widest">Ganhos</p>
                                        <p className="text-xl font-black text-primary">R${(order.deliveryFee || 0).toFixed(2)}</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-start gap-3">
                                        <div className="mt-1 w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                                        <div>
                                            <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-[0.15em] mb-0.5">Retirada</p>
                                            <p className="text-sm font-black text-foreground line-clamp-1">{order.restaurant?.name || "Restaurante"}</p>
                                            <p className="text-xs text-muted-foreground font-medium">{order.restaurant?.address || "Rua do Restaurante"}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="mt-1 w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                                        <div>
                                            <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-[0.15em] mb-0.5">Entrega</p>
                                            <p className="text-sm font-black text-foreground line-clamp-1">{order.user?.name || "Cliente"}</p>
                                            <p className="text-xs text-muted-foreground font-medium">{order.user?.details?.street || "Endereço de Entrega"}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-6 pt-4 border-t border-border/50 flex items-center justify-between">
                                    <div className="flex items-center gap-1.5 text-orange-500">
                                        <Clock className="w-4 h-4" />
                                        <span className="text-xs font-black uppercase tracking-widest">8 min</span>
                                    </div>
                                    <Button
                                        onClick={() => handleAccept(order.id)}
                                        className="rounded-2xl font-black px-6 shadow-lg shadow-primary/20 hover:scale-[1.05] active:scale-95 transition-all"
                                    >
                                        Aceitar Run
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
