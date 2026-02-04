"use client";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Store, Clock, DollarSign } from "lucide-react";
import { useAuthStore } from "@/lib/store";
import { ShiftConfig } from "@/components/admin/ShiftConfig";

export default function RestaurantSettings() {
    const [restaurantId, setRestaurantId] = useState<string | null>(null);

    useEffect(() => {
        if (user?.id) {
            fetch(`/api/restaurant/by-owner/${user.id}`)
                .then(res => res.json())
                .then(data => {
                    if (data.id) setRestaurantId(data.id);
                })
                .catch(err => console.error(err));
        }
    }, [user?.id]);

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setTimeout(() => {
            setLoading(false);
            alert("Informações básicas salvas! (Mock)");
            // In a real app we would PUT /api/restaurant/${restaurantId}
        }, 1000);
    };

    if (!restaurantId) return <div>Carregando perfil do restaurante...</div>;

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
            <header>
                <h1 className="text-4xl font-black text-foreground tracking-tighter">Configurações</h1>
                <p className="text-muted-foreground font-medium">Gerencie seu estabelecimento e turnos</p>
            </header>

            {/* Shift Configuration Section */}
            <ShiftConfig restaurantId={restaurantId} />

            <form onSubmit={handleSave} className="space-y-6">
                <Card className="bg-card border-none shadow-2xl shadow-black/5 rounded-[40px] overflow-hidden">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Store className="w-5 h-5 text-primary" /> Perfil da Loja
                        </CardTitle>
                        <CardDescription>Informações básicas que aparecem para os clientes</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Nome do Estabelecimento</label>
                                <Input defaultValue="Gourmet Burger Royale" className="h-12 rounded-2xl bg-muted border-transparent" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">E-mail de Contato</label>
                                <Input defaultValue={user?.email} className="h-12 rounded-2xl bg-muted border-transparent" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Descrição</label>
                            <textarea className="w-full h-24 rounded-2xl bg-muted border-transparent p-4 font-bold text-sm resize-none" defaultValue="O melhor hambúrguer artesanal da região, feito com ingredientes frescos e amor." />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-card border-none shadow-2xl shadow-black/5 rounded-[40px] overflow-hidden opacity-50 pointer-events-none grayscale">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Clock className="w-5 h-5 text-blue-500" /> Operação e Taxas (Use a configuração de turnos acima)
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Tempo Médio (min)</label>
                                <div className="relative">
                                    <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <Input defaultValue="30-45" className="h-12 rounded-2xl bg-muted border-transparent pl-11" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Taxa de Entrega (R$)</label>
                                <div className="relative">
                                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <Input defaultValue="5.90" className="h-12 rounded-2xl bg-muted border-transparent pl-11" />
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </form>
        </div>
    );
}
