"use client";
import { useState, useEffect, useCallback } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuthStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, ShoppingBag, TrendingUp } from "lucide-react";

interface DashboardStats {
    summary: {
        daily: number;
        monthly: number;
        totalOrders: number;
        avgTicket: number;
    };
    chartData: Array<{ name: string; value: number }>;
    recentOrders: Array<{
        id: string;
        customer: string;
        createdAt: string;
        total: number;
        status: string;
        items?: Array<{ id: string; quantity: number; product?: { name: string } }>;
    }>;
}

export default function RestaurantDashboard() {
    const { user, accessToken } = useAuthStore();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchStats = useCallback(async () => {
        try {
            const res = await fetch('/api/restaurant/stats', {
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });
            const data = await res.json();
            if (res.ok) {
                setStats(data);
            }
        } catch (err) {
            console.error("Erro ao carregar dashboard:", err);
        } finally {
            setLoading(false);
        }
    }, [accessToken]);

    useEffect(() => {
        if (accessToken) {
            fetchStats();
            const interval = setInterval(fetchStats, 5000); // 5s pulse para "tempo real"
            return () => clearInterval(interval);
        }
    }, [accessToken, fetchStats]);

    if (loading) return (
        <div className="space-y-8 animate-pulse">
            <div className="h-10 w-48 bg-muted rounded-xl" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-muted rounded-[32px]" />)}
            </div>
            <div className="h-96 bg-muted rounded-[40px]" />
        </div>
    );

    if (!stats) return <div className="p-10 text-center font-bold text-muted-foreground">Nenhum dado encontrado para este restaurante.</div>;

    const summaryCards = [
        { title: "Receita Hoje", value: `R$${stats?.summary?.daily?.toFixed(2) || "0,00"}`, icon: DollarSign, trend: "+12%", color: "bg-primary/10 text-primary" },
        { title: "Receita Mensal", value: `R$${stats?.summary?.monthly?.toFixed(2) || "0,00"}`, icon: TrendingUp, color: "bg-blue-500/10 text-blue-500" },
        { title: "Pedidos", value: stats?.summary?.totalOrders?.toString() || "0", icon: ShoppingBag, color: "bg-orange-500/10 text-orange-500" },
        { title: "Ticket Médio", value: `R$${stats?.summary?.avgTicket?.toFixed(2) || "0,00"}`, icon: TrendingUp, color: "bg-purple-500/10 text-purple-500" }
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-black text-foreground tracking-tighter">Painel de Controle</h1>
                    <p className="text-muted-foreground font-medium">Bem-vindo de volta, {user?.name}</p>
                </div>
                <div className="flex items-center gap-4">
                    <button onClick={fetchStats} className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline">
                        {loading ? "Sincronizando..." : "Sincronizar Agora"}
                    </button>
                    <div className="bg-primary/10 text-primary px-4 py-2 rounded-2xl font-bold text-sm ring-1 ring-primary/20">
                        Hoje: {new Date().toLocaleDateString('pt-BR')}
                    </div>
                </div>
            </div>

            {/* Grade de Métricas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {summaryCards.map((card, i) => (
                    <Card key={i} className="bg-card border-none shadow-xl shadow-black/5 rounded-[32px] overflow-hidden group hover:scale-[1.02] transition-transform">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-black uppercase tracking-widest opacity-60">{card.title}</CardTitle>
                            <card.icon className={`h-5 w-5 ${card.color.split(' ')[1]}`} />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-black text-foreground tracking-tighter">{card.value}</div>
                            {card.trend && <p className="text-xs text-green-500 font-bold mt-1">{card.trend} vs ontem</p>}
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Gráfico de Performance */}
            <Card className="bg-card border-none shadow-2xl shadow-black/5 rounded-[40px] overflow-hidden">
                <CardHeader className="pb-2">
                    <CardTitle className="text-xl font-black text-foreground tracking-tight">Faturamento Semanal</CardTitle>
                </CardHeader>
                <CardContent className="h-[300px] w-full pt-4">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={stats.chartData}>
                            <defs>
                                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#88888820" />
                            <XAxis
                                dataKey="name"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#888888', fontSize: 12, fontWeight: 'bold' }}
                            />
                            <YAxis hide />
                            <Tooltip
                                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', fontWeight: 'bold' }}
                                cursor={{ stroke: '#f59e0b', strokeWidth: 2 }}
                            />
                            <Area
                                type="monotone"
                                dataKey="value"
                                stroke="#f59e0b"
                                strokeWidth={4}
                                fillOpacity={1}
                                fill="url(#colorTotal)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {/* Atividade Recente */}
            <Card className="bg-card border-none shadow-2xl shadow-black/5 rounded-[40px] overflow-hidden">
                <CardHeader className="border-b border-border/50 pb-4">
                    <CardTitle className="text-xl font-black text-foreground tracking-tight">Últimos Pedidos</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="divide-y divide-border/50">
                        {(!stats?.recentOrders || stats.recentOrders.length === 0) ? (
                            <div className="p-12 text-center">
                                <ShoppingBag className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
                                <p className="text-sm text-muted-foreground font-bold">Aguardando seu primeiro pedido de hoje...</p>
                            </div>
                        ) : (
                            stats.recentOrders.map((order) => (
                                <div key={order.id} className="flex items-center justify-between p-6 hover:bg-muted/30 transition-colors group">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center font-black text-primary text-xs group-hover:scale-110 transition-transform">
                                            #{order.id.slice(-4)}
                                        </div>
                                        <div>
                                            <p className="font-black text-foreground tracking-tight">{order.customer}</p>
                                            <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">
                                                {new Date(order.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                                {' '}
                                                • R${order.total.toFixed(2)}
                                            </p>
                                        </div>
                                    </div>
                                    <div className={`px-4 py-1.5 rounded-full text-[10px] font-black tracking-[0.1em] uppercase shadow-sm ${order.status === 'PENDING' ? 'bg-orange-500/10 text-orange-500 ring-1 ring-orange-500/30' :
                                        order.status === 'DELIVERED' ? 'bg-green-500/10 text-green-500 ring-1 ring-green-500/30' :
                                            'bg-blue-500/10 text-blue-500 ring-1 ring-blue-500/30'
                                        }`}>
                                        {order.status === 'PENDING' ? 'Novo' :
                                            order.status === 'PREPARING' ? 'Cozinha' :
                                                order.status === 'READY' ? 'Pronto' :
                                                    order.status === 'PICKED_UP' ? 'Entregando' : 'Entregue'}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
