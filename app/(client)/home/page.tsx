"use client";
import { useState, useEffect } from "react";
import { RestaurantCard } from "@/components/client/RestaurantCard";
import { Utensils, Bell, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useOrderStore } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";
import Link from "next/link";

const HERO_IMAGES = [
    "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200&q=80", // Gourmet mix
    "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=1200&q=80", // Pizza
    "https://images.unsplash.com/photo-1552332386-f8dd00dc2f85?w=1200&q=80", // Burguer
    "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=1200&q=80", // Sushi
];

import { Restaurant } from "@/types";

export default function ClientHome() {
    // const { restaurants } = useAdminStore(); // REPLACED WITH API FETCH
    const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
    const [loading, setLoading] = useState(true);

    const orders = useOrderStore((state) => state.orders);

    // Pedidos ativos (qualquer coisa menos DELIVERED)
    const activeOrders = orders.filter((o) => o.status !== 'DELIVERED').slice(0, 1);

    const categories = ["Todos", "Hambúrgueres", "Pizza", "Sushi", "Saudável", "Saladas", "Lanches", "Jantar"];
    const [selectedCategory, setSelectedCategory] = useState("Todos");
    const [searchQuery, setSearchQuery] = useState("");
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    // Fetch Restaurants with Availability
    useEffect(() => {
        fetch('/api/restaurants')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setRestaurants(data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to fetch restaurants", err);
                setLoading(false);
            });
    }, []);

    // Efeito para o Carrossel
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentImageIndex((prev) => (prev + 1) % HERO_IMAGES.length);
        }, 4000);
        return () => clearInterval(timer);
    }, []);

    const filteredRestaurants = restaurants.filter(r => {
        const matchesCategory = selectedCategory === "Todos" || (r.tags && r.tags.includes(selectedCategory));
        const matchesSearch = r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (r.products && r.products.some(p => p.name.toLowerCase().includes(searchQuery.toLowerCase())));
        return matchesCategory && matchesSearch;
    });

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Pedido Ativo / Notificação */}
            {activeOrders.length > 0 && (
                <Link href="/orders">
                    <Card className="bg-primary text-white border-none shadow-xl shadow-primary/20 rounded-[32px] overflow-hidden group hover:scale-[1.01] transition-all duration-300 cursor-pointer">
                        <CardContent className="p-5 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center animate-bounce">
                                    <Bell className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="font-black text-lg tracking-tight">Pedido em Andamento!</p>
                                    <p className="text-white/80 text-sm font-bold uppercase tracking-widest">{activeOrders[0].restaurantName} • {
                                        activeOrders[0].status === 'PENDING' ? 'Recebido' :
                                            activeOrders[0].status === 'PREPARING' ? 'Na Cozinha' :
                                                activeOrders[0].status === 'READY' ? 'Pronto para Coleta' : 'A Caminho'
                                    }</p>
                                </div>
                            </div>
                            <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
                        </CardContent>
                    </Card>
                </Link>
            )}

            {/* Seção Hero com Carrossel */}
            <div className="relative h-[400px] md:h-[500px] rounded-[40px] overflow-hidden group shadow-2xl">
                {/* Imagens do Carrossel */}
                {HERO_IMAGES.map((img, idx) => (
                    <div
                        key={idx}
                        className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${idx === currentImageIndex ? 'opacity-100' : 'opacity-0'}`}
                    >
                        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/30 to-black/70 z-10" />
                        <Image src={img} alt="Delivery Hero" fill className="object-cover scale-105" />
                    </div>
                ))}

                {/* Conteúdo Centralizado */}
                <div className="relative z-20 h-full flex flex-col items-center justify-center px-4 text-center space-y-8">
                    <div className="space-y-2 animate-in slide-in-from-top duration-700">
                        <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter drop-shadow-2xl">
                            Fome de <span className="text-primary italic">quê</span>?
                        </h1>
                        <p className="text-white/80 text-lg md:text-xl font-medium max-w-lg mx-auto">
                            Os pratos mais amados da cidade entregues na sua porta com um estalar de dedos.
                        </p>
                    </div>

                    {/* Barra de Busca Centralizada Abaixo */}
                    <div className="w-full max-w-2xl bg-card rounded-3xl p-2 shadow-2xl flex items-center gap-2 transform transition-all hover:scale-[1.02] focus-within:ring-2 ring-primary border border-border">
                        <div className="pl-4">
                            <Utensils className="w-6 h-6 text-muted-foreground" />
                        </div>
                        <Input
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Busque por restaurante ou prato..."
                            className="border-none focus-visible:ring-0 text-lg py-6 h-14 bg-transparent font-bold text-foreground"
                        />
                        <Button className="rounded-2xl h-14 px-10 text-lg font-bold shadow-lg shadow-primary/20">
                            Explorar
                        </Button>
                    </div>
                </div>
            </div>

            {/* Categorias */}
            <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar -mx-4 px-4">
                {categories.map((cat) => (
                    <Button
                        key={cat}
                        variant={selectedCategory === cat ? "default" : "secondary"}
                        className={`rounded-full whitespace-nowrap px-8 h-12 text-sm font-black transition-all ${selectedCategory === cat ? 'scale-110 shadow-lg shadow-primary/10' : 'bg-secondary text-secondary-foreground hover:bg-muted'}`}
                        onClick={() => setSelectedCategory(cat)}
                    >
                        {cat}
                    </Button>
                ))}
            </div>

            {/* Lista de Restaurantes */}
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-3xl font-black text-foreground tracking-tight">
                        {searchQuery ? `Resultados para "${searchQuery}"` :
                            selectedCategory === "Todos" ? "Restaurantes em Destaque" : `O melhor de ${selectedCategory}`}
                    </h2>
                    {(selectedCategory !== "Todos" || searchQuery) && (
                        <Button variant="ghost" onClick={() => { setSelectedCategory("Todos"); setSearchQuery(""); }} className="text-primary font-black hover:bg-primary/5 rounded-xl">
                            Limpar filtros
                        </Button>
                    )}
                </div>

                {loading ? (
                    <div className="text-center py-20">
                        <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
                        <p className="text-muted-foreground font-bold">Carregando restaurantes...</p>
                    </div>
                ) : filteredRestaurants.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filteredRestaurants.map(rest => (
                            <RestaurantCard key={rest.id} restaurant={rest} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-32 bg-muted rounded-[40px] border-4 border-dashed border-border">
                        <Utensils className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                        <h3 className="text-xl font-black text-foreground">Nenhum resultado encontrado</h3>
                        <p className="text-muted-foreground font-bold">Tente ajustar sua busca ou categoria.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
