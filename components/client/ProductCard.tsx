"use client";
import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Product, Restaurant } from "@/types";
import { useCartStore, useNotificationStore } from "@/lib/store";

interface ProductCardProps {
    product: Product;
    restaurant: Restaurant;
}

export function ProductCard({ product, restaurant }: ProductCardProps) {
    const addToCart = useCartStore((state) => state.addToCart);
    const addNotification = useNotificationStore((state) => state.addNotification);
    const [added, setAdded] = useState(false);

    const handleAdd = (e: React.MouseEvent) => {
        e.stopPropagation();
        addToCart(product, restaurant);
        addNotification(`${product.name} adicionado ao carrinho!`, 'success');
        setAdded(true);
        setTimeout(() => setAdded(false), 2000);
    };

    return (
        <Card
            onClick={handleAdd}
            className="overflow-hidden flex flex-row h-32 md:h-40 cursor-pointer hover:border-primary transition-all group active:scale-[0.95] hover:shadow-lg"
        >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
                src={product.image}
                alt={product.name}
                className="w-32 md:w-40 h-full object-cover transition-transform group-hover:scale-110"
            />
            <div className="flex-1 p-4 flex flex-col justify-between bg-card relative">
                <div>
                    <h3 className="font-bold text-foreground line-clamp-1">{product.name}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{product.description}</p>
                </div>
                <div className="flex justify-between items-center mt-2">
                    <span className="font-bold text-primary group-hover:scale-110 transition-transform origin-left">R${product.price.toFixed(2)}</span>
                    <Button
                        size="sm"
                        variant={added ? "default" : "secondary"}
                        className={`transition-all duration-300 ${added ? 'bg-green-500 hover:bg-green-600 text-white border-none' : 'md:opacity-0 md:group-hover:opacity-100'}`}
                    >
                        {added ? (
                            <span className="flex items-center gap-1"><Plus className="w-4 h-4" /> Adicionado!</span>
                        ) : (
                            <span className="flex items-center gap-1"><Plus className="w-4 h-4" /> Adicionar</span>
                        )}
                    </Button>
                </div>
            </div>
        </Card>
    );
}
