"use client";
import { useState, useEffect, useMemo } from "react";
import { ProductCard } from "@/components/client/ProductCard";
import { Star, Clock, Loader2, Sparkles } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { Restaurant, Product } from "@/types";
import { Button } from "@/components/ui/button";

export default function RestaurantPage() {
    const params = useParams();
    const router = useRouter();
    const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
    const [loading, setLoading] = useState(true);
    const [onlyNew, setOnlyNew] = useState(false);

    const sortedProducts = useMemo(() => {
        if (!restaurant?.products) return [];
        const list = [...restaurant.products] as Product[];
        list.sort((a, b) => {
            const aNew = a.isNew ?? (a.createdAt && (Date.now() - new Date(a.createdAt).getTime() < 24 * 60 * 60 * 1000));
            const bNew = b.isNew ?? (b.createdAt && (Date.now() - new Date(b.createdAt).getTime() < 24 * 60 * 60 * 1000));
            if (aNew && !bNew) return -1;
            if (!aNew && bNew) return 1;
            if (a.createdAt && b.createdAt) return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            return 0;
        });
        return onlyNew ? list.filter((p) => p.isNew ?? (p.createdAt && (Date.now() - new Date(p.createdAt).getTime() < 24 * 60 * 60 * 1000))) : list;
    }, [restaurant?.products, onlyNew]);

    useEffect(() => {
        const fetchRestaurant = async () => {
            try {
                const res = await fetch('/api/restaurants');
                const data: Restaurant[] = await res.json();
                const found = data.find(r => r.id === params.id);
                if (found) {
                    setRestaurant(found);
                } else {
                    router.push("/home");
                }
            } catch (err) {
                console.error("Erro ao carregar restaurante:", err);
                router.push("/home");
            } finally {
                setLoading(false);
            }
        };

        if (params.id) fetchRestaurant();
    }, [params.id, router]);

    if (loading) return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
            <Loader2 className="w-12 h-12 text-primary animate-spin" />
            <p className="text-muted-foreground font-black animate-pulse uppercase tracking-widest text-xs">Carregando Cardápio...</p>
        </div>
    );

    if (!restaurant) return null;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Hero / Banner */}
            <div className="relative h-64 md:h-80 w-full rounded-xl overflow-hidden shadow-lg">
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10" />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src={restaurant.image}
                    alt={restaurant.name}
                    className="w-full h-full object-cover"
                />
                <div className="absolute bottom-0 left-0 p-6 z-20 text-white w-full">
                    <h1 className="text-3xl md:text-5xl font-bold mb-2">{restaurant.name}</h1>
                    <div className="flex flex-wrap items-center gap-4 text-sm md:text-base font-medium">
                        <div className="flex items-center text-yellow-400">
                            <Star className="w-5 h-5 fill-current mr-1" />
                            {restaurant.rating}
                        </div>
                        <span className="w-1 h-1 bg-white/50 rounded-full" />
                        <div className="flex items-center">
                            <Clock className="w-5 h-5 mr-1" />
                            {restaurant.deliveryTime}
                        </div>
                        <span className="w-1 h-1 bg-white/50 rounded-full" />
                        <div>
                            {restaurant.deliveryFee === 0 ? "Entrega Grátis" : `Entrega: R$${restaurant.deliveryFee.toFixed(2)}`}
                        </div>
                        <span className="w-1 h-1 bg-white/50 rounded-full" />
                        <div className="flex items-center opacity-90">
                            {restaurant.tags?.join(" • ") || "Restaurante"}
                        </div>
                    </div>
                </div>
            </div>

            {/* Cardápio / Produtos */}
            <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <h2 className="text-3xl font-black text-foreground tracking-tighter">Cardápio</h2>
                    <Button
                        variant={onlyNew ? "default" : "outline"}
                        size="sm"
                        className="rounded-xl gap-2 font-bold"
                        onClick={() => setOnlyNew((v) => !v)}
                    >
                        <Sparkles className="w-4 h-4" /> Apenas novidades
                    </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {sortedProducts.map((product) => (
                        <ProductCard
                            key={product.id}
                            product={product}
                            restaurant={restaurant}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
