"use client";
import { useState, useEffect, useCallback } from "react";
import { useAuthStore, Order } from "@/lib/store";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, ChefHat, Bell } from "lucide-react";
import { getPusherClient, PUSHER_EVENTS } from "@/lib/pusher";
import { useNotificationStore } from "@/lib/store";

export default function RestaurantOrders() {
    const { accessToken, user } = useAuthStore();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchOrders = useCallback(async () => {
        try {
            const res = await fetch('/api/orders/history', {
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });
            const data = await res.json();
            if (res.ok && Array.isArray(data)) {
                setOrders(data);
            } else {
                console.error("Data is not an array:", data);
            }
        } catch (err) {
            console.error("Erro ao carregar pedidos da cozinha:", err);
        } finally {
            setLoading(false);
        }
    }, [accessToken]);

    useEffect(() => {
        if (accessToken) {
            fetchOrders();
            const interval = setInterval(fetchOrders, 30000); // Reduce polling to 30s as we have real-time
            return () => clearInterval(interval);
        }
    }, [accessToken, fetchOrders]);

    const [restaurantId, setRestaurantId] = useState<string | null>(null);

    useEffect(() => {
        if (!accessToken || !user?.id) return;

        const fetchRestaurantId = async () => {
            try {
                const res = await fetch(`/api/restaurant/by-owner/${user.id}`, {
                    headers: { 'Authorization': `Bearer ${accessToken}` }
                });
                const data = await res.json();
                if (res.ok && data?.id) {
                    setRestaurantId(data.id);
                } else {
                    console.error("Could not fetch restaurant ID for user:", user.id);
                    setRestaurantId(null);
                }
            } catch (err) {
                console.error("Error fetching restaurant ID:", err);
                setRestaurantId(null);
            }
        };

        fetchRestaurantId();
    }, [accessToken, user?.id]);

    useEffect(() => {
        if (!restaurantId) return;

        const pusher = getPusherClient();
        if (!pusher) return;

        const channel = pusher.subscribe(`restaurant-${restaurantId}`);

        channel.bind(PUSHER_EVENTS.ORDER_CREATED, (newOrder: Order) => {
            setOrders(prev => [newOrder, ...prev]);
            useNotificationStore.getState().addNotification(`Novo pedido recebido! #${newOrder.id.slice(0, 6)}`, 'info');
        });

        channel.bind(PUSHER_EVENTS.ORDER_STATUS_UPDATED, (updatedOrder: Order) => {
            setOrders(prev => prev.map(o => o.id === updatedOrder.id ? updatedOrder : o));
        });

        return () => {
            pusher.unsubscribe(`restaurant-${restaurantId}`);
        };
    }, [restaurantId]);

    const updateStatus = async (orderId: string, status: string) => {
        try {
            const res = await fetch(`/api/orders/${orderId}/status`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status })
            });
            if (res.ok) fetchOrders();
        } catch (err) {
            console.error("Erro ao atualizar status:", err);
        }
    };

    const readyOrders = orders.filter((o) => o.status === 'READY');

    return (
        <div className="h-[calc(100vh-140px)] flex flex-col">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-bold text-foreground">Display da Cozinha</h1>
                <Button variant="outline" size="sm" onClick={fetchOrders} className="gap-2">
                    {loading ? "Carregando..." : "Atualizar Agora"}
                </Button>
            </div>

            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 overflow-hidden min-h-0">

                {/* Coluna Novos Pedidos */}
                <div className="bg-muted/50 rounded-xl p-4 flex flex-col h-full border border-border">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-bold text-lg flex items-center gap-2">
                            <Bell className="w-5 h-5 text-yellow-500" /> Novos Pedidos
                        </h2>
                        <Badge variant="secondary">{orders.filter(o => o.status === 'PENDING').length}</Badge>
                    </div>
                    <div className="space-y-4 overflow-y-auto flex-1 pr-2 custom-scrollbar">
                        {orders.filter(o => o.status === 'PENDING').map(order => (
                            <OrderCard
                                key={order.id}
                                order={order}
                                actionLabel="Confirmar"
                                onAction={() => updateStatus(order.id, 'CONFIRMED')}
                                variant="default"
                            />
                        ))}
                        {orders.filter(o => o.status === 'PENDING').length === 0 && <EmptyState />}
                    </div>
                </div>

                {/* Coluna Preparando */}
                <div className="bg-muted/50 rounded-xl p-4 flex flex-col h-full border border-border">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-bold text-lg flex items-center gap-2">
                            <ChefHat className="w-5 h-5 text-orange-500" /> Em Preparo
                        </h2>
                        <Badge variant="secondary">{orders.filter(o => ['CONFIRMED', 'PREPARING'].includes(o.status)).length}</Badge>
                    </div>
                    <div className="space-y-4 overflow-y-auto flex-1 pr-2 custom-scrollbar">
                        {orders.filter(o => ['CONFIRMED', 'PREPARING'].includes(o.status)).map(order => (
                            <OrderCard
                                key={order.id}
                                order={order}
                                actionLabel={order.status === 'CONFIRMED' ? "Iniciar Preparo" : "Marcar Pronto"}
                                onAction={() => updateStatus(order.id, order.status === 'CONFIRMED' ? 'PREPARING' : 'READY')}
                                variant="secondary"
                            />
                        ))}
                        {orders.filter(o => ['CONFIRMED', 'PREPARING'].includes(o.status)).length === 0 && <EmptyState />}
                    </div>
                </div>

                {/* Coluna Pronto */}
                <div className="bg-muted/50 rounded-xl p-4 flex flex-col h-full border border-border">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-bold text-lg flex items-center gap-2">
                            <Check className="w-5 h-5 text-green-500" /> Pronto para Coleta
                        </h2>
                        <Badge variant="secondary">{readyOrders.length}</Badge>
                    </div>
                    <div className="space-y-4 overflow-y-auto flex-1 pr-2 custom-scrollbar">
                        {readyOrders.map(order => (
                            <OrderCard
                                key={order.id}
                                order={order}
                                variant="outline"
                            />
                        ))}
                        {readyOrders.length === 0 && <EmptyState />}
                    </div>
                </div>

            </div>
        </div>
    );
}

function OrderCard({ order, actionLabel, onAction, variant }: { order: Order, actionLabel?: string, onAction?: () => void, variant?: 'default' | 'secondary' | 'outline' }) {
    return (
        <Card className="animate-in fade-in slide-in-from-bottom-2 duration-300 bg-card">
            <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
                <span className="font-bold text-foreground">Pedido #{order.id.slice(0, 8)}</span>
                <span className="text-xs text-muted-foreground">{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </CardHeader>
            <CardContent className="p-4 pt-2">
                <div className="space-y-1 mb-4">
                    {order.items?.map((item: { id: string; quantity: number; product?: { name: string } }) => (
                        <div key={item.id} className="text-sm flex justify-between text-foreground/80">
                            <span>{item.quantity}x {item.product?.name || 'Item'}</span>
                        </div>
                    ))}
                </div>
                <div className="flex justify-between items-center border-t border-border pt-3">
                    <span className="font-bold text-lg text-foreground">R${order.total.toFixed(2)}</span>
                    {onAction && (
                        <Button size="sm" onClick={onAction} variant={variant === 'default' ? 'default' : 'outline'}>
                            {actionLabel}
                        </Button>
                    )}
                    {!onAction && (
                        <Badge className="bg-green-500/10 text-green-500 hover:bg-green-500/20 border border-green-500/20">Aguardando Entregador</Badge>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}

function EmptyState() {
    return (
        <div className="h-24 flex items-center justify-center text-muted-foreground italic text-sm border-2 border-dashed border-border rounded-lg">
            Sem pedidos
        </div>
    )
}
