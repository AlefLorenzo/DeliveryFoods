"use client";
import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { Restaurant } from "@/types";
import { Store, Clock, DollarSign } from "lucide-react";
import { useAuthStore } from "@/lib/store";
import { ShiftConfig } from "@/components/admin/ShiftConfig";

export default function RestaurantSettings() {
    const { user, accessToken } = useAuthStore();
    const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        description: ""
    });

    const fetchRestaurantData = useCallback(async () => {
        if (!accessToken || !user?.id) return;
        try {
            const res = await fetch(`/api/restaurant/by-owner/${user.id}`, {
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });
            const data = await res.json();
            if (res.ok && data) {
                setRestaurant(data);
                setFormData({
                    name: data.name || "",
                    email: user.email || "",
                    description: data.description || ""
                });
            } else {
                console.error("Could not fetch restaurant for user:", user.id);
            }
        } catch (err) {
            console.error("Error fetching restaurant:", err);
        } finally {
            setLoading(false);
        }
    }, [accessToken, user?.id, user?.email]);

    useEffect(() => {
        fetchRestaurantData();
    }, [fetchRestaurantData]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!restaurant?.id) return;

        try {
            const res = await fetch(`/api/restaurant/${restaurant.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`
                },
                body: JSON.stringify({
                    name: formData.name,
                    description: formData.description
                })
            });

            if (res.ok) {
                const updatedRestaurant = await res.json();
                setRestaurant(updatedRestaurant);
                alert("Informações básicas salvas com sucesso!");
            } else {
                console.error("Failed to save restaurant info");
                alert("Erro ao salvar informações básicas.");
            }
        } catch (error) {
            console.error("Error saving restaurant info:", error);
            alert("Erro ao salvar informações básicas.");
        }
    };

    if (loading) return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
            <Loader2 className="w-12 h-12 text-primary animate-spin" />
            <p className="text-muted-foreground font-black animate-pulse uppercase tracking-widest text-xs">Carregando Configurações...</p>
        </div>
    );

    if (!restaurant) return <div className="p-10 text-center font-bold text-muted-foreground">Nenhum restaurante encontrado para este usuário.</div>;

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
            <header>
                <h1 className="text-4xl font-black text-foreground tracking-tighter">Configurações</h1>
                <p className="text-muted-foreground font-medium">Gerencie seu estabelecimento e turnos</p>
            </header>

            {/* Shift Configuration Section */}
            <ShiftConfig restaurantId={restaurant.id} />

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
                                <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="h-12 rounded-2xl bg-muted border-transparent" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">E-mail de Contato</label>
                                <Input value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="h-12 rounded-2xl bg-muted border-transparent" disabled />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Descrição</label>
                            <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="min-h-[100px] rounded-2xl bg-muted border-transparent p-4 font-bold text-sm resize-none" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-card border-none shadow-2xl shadow-black/5 rounded-[40px] overflow-hidden">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Clock className="w-5 h-5 text-blue-500" /> Operação e Taxas
                        </CardTitle>
                        <CardDescription>Gerencie o tempo médio de preparo e a taxa de entrega.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Tempo Médio de Preparo (min)</Label>
                                <div className="relative">
                                    <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <Input
                                        type="number"
                                        value={restaurant.avgPreparationTime || 0}
                                        onChange={(e) => setRestaurant({ ...restaurant, avgPreparationTime: parseInt(e.target.value) })}
                                        className="h-12 rounded-2xl bg-muted border-transparent pl-11"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Taxa de Entrega (R$)</Label>
                                <div className="relative">
                                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <Input
                                        type="number"
                                        value={restaurant.deliveryFee || 0}
                                        onChange={(e) => setRestaurant({ ...restaurant, deliveryFee: parseFloat(e.target.value) })}
                                        className="h-12 rounded-2xl bg-muted border-transparent pl-11"
                                    />
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Button type="submit" className="w-full h-12 rounded-2xl font-bold text-lg shadow-lg shadow-primary/20">Salvar Alterações</Button>
            </form>
        </div>
    );
}
