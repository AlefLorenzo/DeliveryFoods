"use client";
import Link from "next/link";
import { Star, Clock, Heart } from "lucide-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Restaurant } from "@/types";
import { useAuthStore, useNotificationStore } from "@/lib/store";

interface RestaurantCardProps {
    restaurant: Restaurant;
}

export function RestaurantCard({ restaurant }: RestaurantCardProps) {
    const { favorites, toggleFavorite } = useAuthStore();
    const { addNotification } = useNotificationStore();
    const isFavorite = favorites.includes(restaurant.id);

    const handleFavorite = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        toggleFavorite(restaurant.id);
        addNotification(
            isFavorite ? "Removido dos favoritos" : "Adicionado aos favoritos!",
            isFavorite ? "info" : "success"
        );
    };

    return (
        <div className="relative group">
            <Button
                variant="ghost"
                size="icon"
                onClick={handleFavorite}
                className={`absolute top-4 right-4 z-20 rounded-full transition-all duration-300 shadow-xl backdrop-blur-md ${isFavorite ? 'bg-red-500 text-white scale-110' : 'bg-white/80 dark:bg-slate-800/80 text-slate-900 dark:text-white hover:bg-white dark:hover:bg-slate-700 hover:text-red-500'}`}
            >
                <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
            </Button>

            <Link href={`/restaurant/${restaurant.id}`}>
                <Card className="overflow-hidden hover:shadow-2xl transition-all duration-500 border-none shadow-lg bg-card group-hover:-translate-y-2">
                    <div className="relative h-48 w-full overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={restaurant.image}
                            alt={restaurant.name}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                        {restaurant.isOpen && (
                            <span className="absolute top-2 left-2 bg-green-500 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-lg flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-white animate-pulse" /> ABERTO AGORA
                            </span>
                        )}
                        {!restaurant.isOpen && restaurant.statusMessage && (
                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm z-10">
                                <span className="bg-red-600 text-white font-black uppercase text-xs px-4 py-2 rounded-full shadow-2xl tracking-widest border border-white/20">
                                    🔴 FECHADO
                                </span>
                                {restaurant.nextOpenMessage && (
                                    <span className="absolute bottom-4 left-4 right-4 text-center text-white/90 text-[10px] font-bold">
                                        {restaurant.nextOpenMessage}
                                    </span>
                                )}
                            </div>
                        )}

                        {restaurant.isOpen && restaurant.deliveryFee === 0 && (
                            <span className="absolute top-2 right-2 bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-lg">
                                Entrega Grátis
                            </span>
                        )}

                        {restaurant.isOpen && restaurant.statusMessage && !restaurant.statusMessage.startsWith("Aberto") && (
                            <span className="absolute bottom-2 right-2 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-lg">
                                {restaurant.statusMessage}
                            </span>
                        )}
                    </div>

                    <CardContent className="p-5">
                        <div className="flex justify-between items-start mb-2">
                            <h3 className="font-black text-xl truncate text-foreground tracking-tight">{restaurant.name}</h3>
                            <div className="flex items-center bg-yellow-400/10 dark:bg-yellow-400/20 text-yellow-600 dark:text-yellow-400 px-2 py-1 rounded-lg text-xs font-black">
                                <Star className="w-3.5 h-3.5 fill-current mr-1" />
                                {restaurant.rating}
                            </div>
                        </div>
                        <p className="text-muted-foreground text-sm font-medium">
                            {restaurant.tags ? restaurant.tags.join(" • ") : "Restaurante"}
                        </p>
                    </CardContent>

                    <CardFooter className="p-5 pt-0 text-sm text-muted-foreground flex justify-between items-center border-t border-border mt-2 pt-4">
                        <div className="flex items-center gap-1.5 font-bold">
                            <Clock className="w-4 h-4 text-primary" />
                            {restaurant.deliveryTime || restaurant.avgTime || "30-45 min"}
                        </div>
                        <div className="bg-primary/5 dark:bg-primary/20 text-primary px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">
                            Ver Menu
                        </div>
                    </CardFooter>
                </Card>
            </Link>
        </div>
    );
}
