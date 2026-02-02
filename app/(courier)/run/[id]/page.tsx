"use client";
import { useState, use, useEffect, useCallback } from "react";
import { useAuthStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { MapPin, Phone, MessageSquare, CheckCircle, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { SharedChat } from "@/components/shared/Chat";

export default function DeliveryRun({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const { accessToken } = useAuthStore();
    const [order, setOrder] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [showChat, setShowChat] = useState(false);

    const fetchOrder = useCallback(async () => {
        try {
            const res = await fetch('/api/orders/history', {
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });
            const data = await res.json();
            const found = data.find((o: any) => o.id === id);
            if (found) setOrder(found);
        } catch (err) {
            console.error("Erro ao carregar pedido:", err);
        } finally {
            setLoading(false);
        }
    }, [accessToken, id]);

    useEffect(() => {
        if (accessToken) fetchOrder();
    }, [accessToken, fetchOrder]);

    const updateStatus = async (status: string) => {
        try {
            const res = await fetch(`/api/orders/${id}/status`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status })
            });
            if (res.ok) fetchOrder();
        } catch (err) {
            console.error("Erro ao atualizar status:", err);
        }
    };

    const getStep = (status: string) => {
        if (status === 'DELIVERED') return 'COMPLETE';
        if (status === 'PICKED_UP' || status === 'DELIVERING') return 'DROPOFF';
        return 'PICKUP';
    };

    const step = order ? getStep(order.status) : 'PICKUP';

    if (loading) return <div className="p-8 text-center">Carregando...</div>;
    if (!order) {
        return <div className="p-8 text-center">Pedido não encontrado</div>;
    }

    const handlePickup = () => {
        updateStatus('PICKED_UP');
    };

    const handleDeliver = () => {
        updateStatus('DELIVERED');
        setTimeout(() => {
            router.push('/feed');
        }, 2000);
    };

    if (step === 'COMPLETE') {
        return (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center space-y-4">
                <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center text-green-500 mb-4 ring-2 ring-green-500/20">
                    <CheckCircle className="w-10 h-10" />
                </div>
                <h1 className="text-2xl font-black text-foreground">Entrega Concluída!</h1>
                <p className="text-muted-foreground font-bold">Você ganhou R${(order.total * 0.2).toFixed(2)}</p>
                <Button onClick={() => router.push('/feed')} className="w-full h-12 rounded-2xl font-black">
                    Voltar para o Feed
                </Button>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-[calc(100vh-140px)]">
            {/* Mapa (Placeholder) */}
            <div className="flex-1 bg-muted/30 w-full relative overflow-hidden">
                {showChat ? (
                    <div className="absolute inset-0 z-30 p-4 animate-in slide-in-from-bottom duration-500">
                        <div className="flex justify-between items-center mb-2 bg-background/80 backdrop-blur-md p-3 rounded-2xl border border-border">
                            <h3 className="font-black text-xs uppercase tracking-widest text-primary">Chat da Entrega</h3>
                            <Button variant="ghost" size="sm" onClick={() => setShowChat(false)} className="h-8 w-8 p-0 rounded-full hover:bg-red-500/10 hover:text-red-500">
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                        <SharedChat orderId={id} />
                    </div>
                ) : (
                    <>
                        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/20 font-black text-center p-10 uppercase tracking-[0.3em] pointer-events-none">
                            Mapa de Navegação
                        </div>

                        {/* Mock do Desenho da Rota com Estética Dark */}
                        <div className="absolute top-1/4 left-1/4 w-5 h-5 bg-primary rounded-full border-4 border-background shadow-[0_0_15px_rgba(var(--primary),0.5)] z-10" />
                        <div className="absolute bottom-1/3 right-1/3 w-5 h-5 bg-red-500 rounded-full border-4 border-background shadow-[0_0_15px_rgba(239,68,68,0.5)] z-10" />

                        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-50">
                            <path d="M120 180 Q 200 300 280 400" stroke="hsl(var(--primary))" strokeWidth="4" fill="none" strokeDasharray="10 5" />
                        </svg>
                    </>
                )}
            </div>

            {/* Folha de Ação */}
            <div className="bg-card p-6 rounded-t-[40px] shadow-[0_-10px_40px_rgba(0,0,0,0.1)] dark:shadow-[0_-10px_40px_rgba(0,0,0,0.5)] border-t border-border -mt-10 relative z-20 transition-all duration-300">
                <div className="w-16 h-1.5 bg-muted rounded-full mx-auto mb-8 opacity-50" />

                <div className="mb-8">
                    <h2 className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em] mb-3 opacity-70">
                        {step === 'PICKUP' ? 'Coletar em' : 'Entregar em'}
                    </h2>
                    <div className="flex items-start gap-5">
                        <div className="bg-muted p-4 rounded-2xl ring-1 ring-border">
                            <MapPin className={`w-6 h-6 ${step === 'PICKUP' ? 'text-primary' : 'text-red-500'}`} />
                        </div>
                        <div>
                            <h3 className="font-black text-xl text-foreground tracking-tight">
                                {step === 'PICKUP' ? order.restaurantName : 'Endereço do Cliente'}
                            </h3>
                            <p className="text-muted-foreground text-sm font-bold mt-1">
                                {step === 'PICKUP' ? 'Rua do Restaurante, 123, São Paulo' : 'Avenida do Cliente, 456, Apt 4B'}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-8">
                    <Button variant="outline" className="h-12 rounded-2xl flex items-center gap-2 font-black border-2 hover:bg-muted transition-all active:scale-95" onClick={() => alert("Iniciando chamada...")}>
                        <Phone className="w-4 h-4" /> Ligar
                    </Button>
                    <Button
                        variant={showChat ? "default" : "outline"}
                        className={`h-12 rounded-2xl flex items-center gap-2 font-black border-2 transition-all active:scale-95 ${showChat ? 'bg-primary text-white border-primary' : 'hover:bg-muted'}`}
                        onClick={() => setShowChat(!showChat)}
                    >
                        <MessageSquare className="w-4 h-4" /> Chat
                    </Button>
                </div>

                <div className="space-y-4">
                    <div className="bg-muted/30 p-5 rounded-2xl border border-border/50">
                        <h4 className="font-black text-xs uppercase tracking-widest mb-3 text-primary">Detalhes do Pedido</h4>
                        <ul className="text-sm text-foreground/80 font-bold space-y-2">
                            {order.items?.map((item: any) => (
                                <li key={item.id} className="flex justify-between items-center bg-card/50 p-2 rounded-lg border border-border/50">
                                    <span>{item.product?.name || 'Item'}</span>
                                    <span className="bg-primary/10 text-primary px-3 py-1 rounded-xl text-xs font-black">{item.quantity}x</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {step === 'PICKUP' ? (
                        <Button className="w-full h-14 text-lg font-black rounded-2xl shadow-xl shadow-primary/20 bg-primary hover:bg-primary/90 text-white" onClick={handlePickup}>
                            Confirmar Coleta
                        </Button>
                    ) : (
                        <Button className="w-full h-14 text-lg font-black rounded-2xl shadow-xl shadow-green-500/20 bg-green-500 hover:bg-green-600 text-white" onClick={handleDeliver}>
                            Concluir Entrega
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
