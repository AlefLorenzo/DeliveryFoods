
"use client";
import { useState, useEffect, useCallback } from "react";
import { useAuthStore, Order } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle2, Package, Bike, ChefHat, Timer, History, ChevronRight, Search, MessageSquare, X, Loader2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SharedChat } from "@/components/shared/Chat";
import { Input } from "@/components/ui/input";
import { getPusherClient, PUSHER_EVENTS } from "@/lib/pusher";
import { useNotificationStore } from "@/lib/store";

export default function OrdersPage() {
    const { accessToken } = useAuthStore();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("TODOS");
    const [activeChatOrderId, setActiveChatOrderId] = useState<string | null>(null);

    const fetchOrders = useCallback(async () => {
        try {
            const res = await fetch("/api/orders/history", {
                headers: { Authorization: `Bearer ${accessToken}` },
            });
            const data = await res.json();
            if (res.ok) setOrders(data);
        } catch (err) {
            console.error("Erro ao carregar pedidos:", err);
        } finally {
            setLoading(false);
        }
    }, [accessToken]);

    useEffect(() => {
        if (accessToken) {
            fetchOrders();
            const interval = setInterval(fetchOrders, 30000); // 30s pulse (Pusher handles real-time)
            return () => clearInterval(interval);
        }
    }, [accessToken, fetchOrders]);

    useEffect(() => {
        const { user } = useAuthStore.getState();
        if (!accessToken || !user) return;

        const pusher = getPusherClient();
        if (!pusher) return;

        const channel = pusher.subscribe(`user-${user.id}`);

        channel.bind(PUSHER_EVENTS.ORDER_STATUS_UPDATED, (updatedOrder: Order) => {
            setOrders((prev) =>
                prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o))
            );
            useNotificationStore
                .getState()
                .addNotification(
                    `Status do pedido #${updatedOrder.id.slice(0, 6)} atualizado: ${updatedOrder.status}`,
                    "info"
                );
        });

        channel.bind(PUSHER_EVENTS.ORDER_CREATED, (newOrder: Order) => {
            setOrders((prev) => [newOrder, ...prev]);
        });

        return () => {
            pusher.unsubscribe(`user-${user.id}`);
        };
    }, [accessToken]);



    const getStatusInfo = (status: string) => {
        switch (status) {
            case "PENDING":
                return { label: "Aguardando Restaurante", icon: <Timer className="w-5 h-5" />, color: "bg-yellow-500", progress: 15 };
            case "CONFIRMED":
                return { label: "Confirmado pelo Restaurante", icon: <ChefHat className="w-5 h-5" />, color: "bg-orange-400", progress: 30 };
            case "PREPARING":
                return { label: "Em Preparo", icon: <ChefHat className="w-5 h-5" />, color: "bg-orange-500", progress: 50 };
            case "READY":
                return { label: "Pronto para Coleta", icon: <Package className="w-5 h-5" />, color: "bg-blue-500", progress: 75 };
            case "PICKED_UP":
                return { label: "Em Rota de Entrega", icon: <Bike className="w-5 h-5" />, color: "bg-purple-500", progress: 90 };
            case "DELIVERING":
                return { label: "Entregando", icon: <Bike className="w-5 h-5" />, color: "bg-purple-600", progress: 95 };
            case "DELIVERED":
                return { label: "Pedido Entregue", icon: <CheckCircle2 className="w-5 h-5" />, color: "bg-green-600", progress: 100 };
            default:
                return { label: "Processando", icon: <Clock className="w-5 h-5" />, color: "bg-muted", progress: 10 };
        }
    };

    const filteredOrders = orders.filter((order) => {
        const matchesSearch = (order.restaurant?.name || "Restaurante")
            .toLowerCase()
            .includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === "TODOS" || order.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <Loader2 className="w-12 h-12 text-primary animate-spin" />
            </div>
        );
    }

    if (orders.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground space-y-6 animate-in fade-in zoom-in duration-500 transition-colors">
                <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center">
                    <History className="w-12 h-12 opacity-20" />
                </div>
                <div className="text-center">
                    <h2 className="text-2xl font-black text-foreground">Nenhum pedido realizado</h2>
                    <p className="max-w-xs mx-auto text-sm text-muted-foreground">Seus pedidos aparecerão aqui assim que você finalizar uma compra deliciosa.</p>
                </div>
                <Link href="/home">
                    <Button className="rounded-full px-8 h-12 font-bold gap-2">
                        Explorar Restaurantes <ChevronRight className="w-4 h-4" />
                    </Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Overlay de Chat */}
            {activeChatOrderId && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div className="w-full max-w-lg relative animate-in zoom-in-95 duration-300">
                        <Button
                            variant="secondary"
                            size="icon"
                            className="absolute -top-4 -right-4 rounded-full shadow-2xl z-[110]"
                            onClick={() => setActiveChatOrderId(null)}
                        >
                            <X className="w-4 h-4" />
                        </Button>
                        <SharedChat orderId={activeChatOrderId} />
                    </div>
                </div>
            )}

            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                    <h1 className="text-5xl font-black text-foreground tracking-tighter">Meus Pedidos</h1>
                    <p className="text-muted-foreground font-bold uppercase tracking-widest text-xs">Histórico Completa</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                    <div className="relative flex-1 sm:w-64">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Buscar restaurante..."
                            className="pl-11 rounded-2xl h-12 bg-card border-none shadow-xl placeholder:font-bold font-bold text-foreground"
                        />
                    </div>
                </div>
            </div>

            {/* Filtros de Status */}
            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                {["TODOS", "PENDING", "PREPARING", "READY", "PICKED_UP", "DELIVERED"].map((s) => (
                    <Button
                        key={s}
                        variant={statusFilter === s ? "default" : "ghost"}
                        onClick={() => setStatusFilter(s)}
                        className={`rounded-full px-6 h-10 font-black text-xs uppercase tracking-widest transition-all ${statusFilter === s ? "shadow-lg shadow-primary/20 scale-105" : "text-muted-foreground hover:bg-muted"}`}
                    >
                        {s === "TODOS"
                            ? "Todos"
                            : s === "PENDING"
                            ? "Pendentes"
                            : s === "PREPARING"
                            ? "Em Preparo"
                            : s === "READY"
                            ? "Prontos"
                            : s === "PICKED_UP"
                            ? "Em Entrega"
                            : "Entregues"}
                    </Button>
                ))}
            </div>

            <div className="space-y-8">
                {filteredOrders.length > 0 ? (
                    filteredOrders.map((order) => {
                        const statusInfo = getStatusInfo(order.status);
                        return (
                            <Card
                                key={order.id}
                                className="overflow-hidden border-none shadow-2xl bg-card/40 backdrop-blur-xl group hover:shadow-primary/5 transition-all duration-500 ring-1 ring-border rounded-[40px]"
                            >
                                <CardHeader className="bg-muted/50 border-b border-border p-8">
                                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                        <div>
                                            <div className="flex items-center gap-3 mb-2">
                                                <CardTitle className="text-3xl font-black tracking-tight">
                                                    {order.restaurant?.name || "Restaurante"}
                                                </CardTitle>
                                                <Badge
                                                    variant="outline"
                                                    className="font-black border-2 border-primary/20 text-primary py-1 px-3 rounded-xl uppercase tracking-widest text-[10px]"
                                                >
                                                    #{order.id}
                                                </Badge>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground font-bold">
                                                <Clock className="w-4 h-4" />
                                                <span>
                                                    Hoje às {" "}
                                                    {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {order.status !== "DELIVERED" &&
                                                order.status !== "CANCELLED" && (
                                                    <Button
                                                        onClick={() => setActiveChatOrderId(order.id)}
                                                        variant="outline"
                                                        className="rounded-2xl h-11 border-2 font-black gap-2 hover:bg-primary hover:text-white transition-all"
                                                    >
                                                        <MessageSquare className="w-4 h-4" /> Chat
                                                    </Button>
                                                )}
                                            {order.status === "PENDING" && (
                                                <Button
                                                    onClick={() =>
                                                        updateOrderStatus(
                                                            order.id,
                                                            "CANCELLED",
                                                            "Cancelado pelo cliente."
                                                        )
                                                    }
                                                    variant="destructive"
                                                    className="rounded-2xl h-11 font-black gap-2"
                                                >
                                                    <X className="w-4 h-4" /> Cancelar
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-8">
                                    <div className="flex items-center gap-4 mb-6">
                                        <div
                                            className={`w-12 h-12 rounded-full flex items-center justify-center ${statusInfo.color} text-white shadow-lg shadow-${statusInfo.color}/30`}
                                        >
                                            {statusInfo.icon}
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground font-bold">
                                                Status do Pedido
                                            </p>
                                            <h3 className="font-black text-xl tracking-tight">
                                                {statusInfo.label}
                                            </h3>
                                        </div>
                                    </div>

                                    <div className="w-full bg-muted rounded-full h-2.5 mb-6">
                                        <div
                                            className="bg-primary h-2.5 rounded-full transition-all duration-500 ease-out"
                                            style={{ width: `${statusInfo.progress}%` }}
                                        ></div>
                                    </div>

                                    <div className="space-y-4 mb-6">
                                        {order.items.map((item) => (
                                            <div
                                                key={item.id}
                                                className="flex justify-between items-center"
                                            >
                                                <p className="text-muted-foreground font-medium">
                                                    {item.quantity}x {item.product.name}
                                                </p>
                                                <p className="font-bold">
                                                    R${item.price.toFixed(2)}
                                                </p>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="border-t border-dashed border-border pt-4 space-y-2">
                                        <div className="flex justify-between items-center">
                                            <p className="text-muted-foreground font-medium">Subtotal</p>
                                            <p className="font-bold">R${order.total.toFixed(2)}</p>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <p className="text-muted-foreground font-medium">Entrega</p>
                                            <p className="font-bold">
                                                R${order.deliveryFee.toFixed(2)}
                                            </p>
                                        </div>
                                        {order.discount > 0 && (
                                            <div className="flex justify-between items-center">
                                                <p className="text-muted-foreground font-medium">Desconto</p>
                                                <p className="font-bold text-red-500">
                                                    -R${order.discount.toFixed(2)}
                                                </p>
                                            </div>
                                        )}
                                        <div className="flex justify-between items-center text-xl font-black pt-2">
                                            <p>Total</p>
                                            <p>R${order.total.toFixed(2)}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })
                ) : (
                    <div className="text-center text-muted-foreground py-10">
                        <p className="font-bold">Nenhum pedido encontrado com os filtros aplicados.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
