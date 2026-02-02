"use client";
import { useState, useEffect, useCallback } from "react";
import { useAuthStore, Order } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, MapPin, CheckCircle2, Package, Bike, ChefHat, Timer, History, ChevronRight, Search, MessageSquare, X, Loader2 } from "lucide-react";
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
            const res = await fetch('/api/orders/history', {
                headers: { 'Authorization': `Bearer ${accessToken}` }
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
            setOrders(prev => prev.map(o => o.id === updatedOrder.id ? updatedOrder : o));
            useNotificationStore.getState().addNotification(`Status do pedido #${updatedOrder.id.slice(0, 6)} atualizado: ${updatedOrder.status}`, 'info');
        });

        channel.bind(PUSHER_EVENTS.ORDER_CREATED, (newOrder: Order) => {
            setOrders(prev => [newOrder, ...prev]);
        });

        return () => {
            pusher.unsubscribe(`user-${user.id}`);
        };
    }, [accessToken]);

    const updateOrderStatus = async (orderId: string, status: string, notes?: string) => {
        try {
            const res = await fetch(`/api/orders/${orderId}/status`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status, notes })
            });
            if (res.ok) fetchOrders();
        } catch (err) {
            console.error("Erro ao atualizar status:", err);
        }
    };

    const getStatusInfo = (status: string) => {
        switch (status) {
            case 'PENDING': return { label: 'Aguardando Restaurante', icon: <Timer className="w-5 h-5" />, color: 'bg-yellow-500', progress: 15 };
            case 'CONFIRMED': return { label: 'Confirmado pelo Restaurante', icon: <ChefHat className="w-5 h-5" />, color: 'bg-orange-400', progress: 30 };
            case 'PREPARING': return { label: 'Em Preparo', icon: <ChefHat className="w-5 h-5" />, color: 'bg-orange-500', progress: 50 };
            case 'READY': return { label: 'Pronto para Coleta', icon: <Package className="w-5 h-5" />, color: 'bg-blue-500', progress: 75 };
            case 'PICKED_UP': return { label: 'Em Rota de Entrega', icon: <Bike className="w-5 h-5" />, color: 'bg-purple-500', progress: 90 };
            case 'DELIVERING': return { label: 'Entregando', icon: <Bike className="w-5 h-5" />, color: 'bg-purple-600', progress: 95 };
            case 'DELIVERED': return { label: 'Pedido Entregue', icon: <CheckCircle2 className="w-5 h-5" />, color: 'bg-green-600', progress: 100 };
            default: return { label: 'Processando', icon: <Clock className="w-5 h-5" />, color: 'bg-muted', progress: 10 };
        }
    };

    const filteredOrders = orders.filter(order => {
        const matchesSearch = (order.restaurant?.name || "Restaurante").toLowerCase().includes(searchQuery.toLowerCase());
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
                    <p className="text-muted-foreground font-bold uppercase tracking-widest text-xs">Histórico Completo</p>
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
                {['TODOS', 'PENDING', 'PREPARING', 'READY', 'PICKED_UP', 'DELIVERED'].map((s) => (
                    <Button
                        key={s}
                        variant={statusFilter === s ? "default" : "ghost"}
                        onClick={() => setStatusFilter(s)}
                        className={`rounded-full px-6 h-10 font-black text-xs uppercase tracking-widest transition-all ${statusFilter === s ? 'shadow-lg shadow-primary/20 scale-105' : 'text-muted-foreground hover:bg-muted'}`}
                    >
                        {s === 'TODOS' ? 'Todos' :
                            s === 'PENDING' ? 'Pendentes' :
                                s === 'PREPARING' ? 'Em Preparo' :
                                    s === 'READY' ? 'Prontos' :
                                        s === 'PICKED_UP' ? 'Em Entrega' : 'Entregues'}
                    </Button>
                ))}
            </div>

            <div className="space-y-8">
                {filteredOrders.length > 0 ? (
                    filteredOrders.map((order) => {
                        const statusInfo = getStatusInfo(order.status);
                        return (
                            <Card key={order.id} className="overflow-hidden border-none shadow-2xl bg-card/40 backdrop-blur-xl group hover:shadow-primary/5 transition-all duration-500 ring-1 ring-border rounded-[40px]">
                                <CardHeader className="bg-muted/50 border-b border-border p-8">
                                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                        <div>
                                            <div className="flex items-center gap-3 mb-2">
                                                <CardTitle className="text-3xl font-black tracking-tight">{order.restaurant?.name || 'Restaurante'}</CardTitle>
                                                <Badge variant="outline" className="font-black border-2 border-primary/20 text-primary py-1 px-3 rounded-xl uppercase tracking-widest text-[10px]">#{order.id}</Badge>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground font-bold">
                                                <Clock className="w-4 h-4" />
                                                <span>Hoje às {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {order.status !== 'DELIVERED' && order.status !== 'CANCELLED' && (
                                                <Button
                                                    onClick={() => setActiveChatOrderId(order.id)}
                                                    variant="outline"
                                                    className="rounded-2xl h-11 border-2 font-black gap-2 hover:bg-primary hover:text-white transition-all"
                                                >
                                                    <MessageSquare className="w-4 h-4" /> Chat
                                                </Button>
                                            )}
                                            {order.status === 'PENDING' && (
                                                <Button
                                                    onClick={() => updateOrderStatus(order.id, 'CANCELLED', 'Cancelado pelo cliente.')}
                                                    variant="destructive"
                                                    className="rounded-2xl h-11 font-black gap-2"
                                                >
                                                    <X className="w-4 h-4" /> Cancelar
                                                </Button>
                                            )}
                                            {(order.status === 'DELIVERING' || order.status === 'PICKED_UP') && (
                                                <Button
                                                    onClick={() => updateOrderStatus(order.id, 'DELIVERED', 'Entrega confirmada pelo cliente.')}
                                                    className="rounded-2xl h-11 font-black gap-2 bg-green-600 hover:bg-green-700 text-white"
                                                >
                                                    <CheckCircle2 className="w-4 h-4" /> Confirmar Entrega
                                                </Button>
                                            )}
                                            <div className={`flex items-center gap-3 px-6 py-3 rounded-2xl ${statusInfo.color} text-white font-black text-sm shadow-xl shadow-${statusInfo.color.split('-')[1]}-500/20 animate-pulse`}>
                                                {statusInfo.icon}
                                                {statusInfo.label}
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>

                                <CardContent className="p-8">
                                    {/* Tracking Visual Premium */}
                                    <div className="space-y-10 mb-12">
                                        <div className="relative h-4 bg-secondary rounded-full overflow-hidden shadow-inner ring-4 ring-background">
                                            <div
                                                className={`absolute top-0 left-0 h-full ${statusInfo.color} transition-all duration-1000 ease-out shadow-[0_0_20px_rgba(var(--primary),0.3)]`}
                                                style={{ width: `${statusInfo.progress}%` }}
                                            >
                                                <div className="w-full h-full bg-[linear-gradient(45deg,rgba(255,255,255,0.2)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.2)_50%,rgba(255,255,255,0.2)_75%,transparent_75%,transparent)] bg-[length:40px_40px] animate-[progress-bar-stripes_1s_linear_infinite]" />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-5 gap-1">
                                            {['PENDING', 'PREPARING', 'READY', 'PICKED_UP', 'DELIVERED'].map((s, idx) => {
                                                const info = getStatusInfo(s);
                                                const steps = ['PENDING', 'PREPARING', 'READY', 'PICKED_UP', 'DELIVERED'];
                                                const isActive = idx <= steps.indexOf(order.status);
                                                const isCurrent = order.status === s;

                                                return (
                                                    <div key={s} className="flex flex-col items-center gap-3 group/step">
                                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-lg ${isActive ? statusInfo.color + ' text-white' : 'bg-muted text-muted-foreground grayscale'} ${isCurrent ? 'scale-125 ring-4 ring-card z-10 animate-bounce' : ''}`}>
                                                            {info.icon}
                                                        </div>
                                                        <span className={`text-[10px] font-black uppercase tracking-tighter text-center max-w-[80px] leading-none ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                                                            {info.label.replace('Aguardando ', '').replace('para Coleta', '').replace('de Entrega', '')}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-8 border-t dark:border-slate-800">
                                        <div className="space-y-6">
                                            <div className="flex items-center justify-between">
                                                <h3 className="font-black text-xs uppercase tracking-[0.2em] text-primary">Itens do Pedido</h3>
                                                <span className="text-xs font-bold text-muted-foreground">{order.items?.length || 0} itens</span>
                                            </div>
                                            <div className="space-y-3">
                                                {order.items?.map((item) => (
                                                    <div key={item.id} className="flex justify-between items-center bg-muted/30 p-4 rounded-2xl border border-border hover:border-primary/20 transition-all group/item">
                                                        <div className="flex items-center gap-4">
                                                            <div className="bg-primary text-white w-8 h-8 flex items-center justify-center rounded-xl text-xs font-black shadow-lg shadow-primary/20 group-hover/item:scale-110 transition-transform">
                                                                {item.quantity}
                                                            </div>
                                                            <span className="font-bold text-foreground/80">{item.product?.name || 'Produto'}</span>
                                                        </div>
                                                        <span className="font-black text-foreground">R${(item.price * item.quantity).toFixed(2)}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="space-y-8">
                                            <div className="bg-muted/20 p-6 rounded-[32px] space-y-4 shadow-inner">
                                                <h3 className="font-black text-xs uppercase tracking-[0.2em] text-primary">Resumo do Pagamento</h3>
                                                <div className="space-y-3">
                                                    <div className="flex justify-between text-muted-foreground font-bold text-sm">
                                                        <span>Subtotal</span>
                                                        <span>R${(order.total - 7).toFixed(2)}</span>
                                                    </div>
                                                    <div className="flex justify-between text-muted-foreground font-bold text-sm">
                                                        <span>TAXA DE ENTREGA</span>
                                                        <span className="text-green-500">GRÁTIS</span>
                                                    </div>
                                                    <div className="pt-4 flex justify-between items-baseline">
                                                        <span className="font-black text-foreground">TOTAL</span>
                                                        <span className="text-4xl font-black text-primary tracking-tighter">R${order.total.toFixed(2)}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-4 p-5 rounded-[28px] bg-slate-900 dark:bg-primary text-white shadow-2xl">
                                                <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
                                                    <MapPin className="w-6 h-6" />
                                                </div>
                                                <div>
                                                    <p className="font-black text-[10px] uppercase opacity-70 mb-0.5">Entregar para:</p>
                                                    <p className="text-sm font-black truncate max-w-[200px]">Seu Endereço Cadastrado</p>
                                                </div>
                                                <Button variant="ghost" className="ml-auto rounded-xl hover:bg-white/10 text-white font-bold text-xs uppercase">
                                                    Mapa
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })
                ) : (
                    <div className="text-center py-32 bg-muted rounded-[40px] border-4 border-dashed border-border">
                        <Search className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-foreground">Nenhum pedido encontrado</h3>
                        <p className="text-muted-foreground">Tente buscar por outro termo ou status.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
