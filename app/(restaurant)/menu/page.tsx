"use client";
import { useState } from "react";
import { useAdminStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus, Edit, Trash2, X, Check } from "lucide-react";
import { Product } from "@/types";

export default function MenuManager() {
    const { restaurants, addProduct, updateProduct, deleteProduct } = useAdminStore();
    // Para simplificar no demo, pegamos o primeiro restaurante
    const restaurant = restaurants[0];
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState<Partial<Product>>({
        name: "",
        description: "",
        price: 0,
        category: "",
        image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80"
    });

    const handleSave = () => {
        if (!formData.name || !formData.price) return;

        if (editingId) {
            updateProduct(restaurant.id, { ...formData, id: editingId } as Product);
            setEditingId(null);
        } else {
            const newProduct = {
                ...formData,
                id: Math.random().toString(36).substr(2, 9)
            } as Product;
            addProduct(restaurant.id, newProduct);
            setIsAdding(false);
        }
        setFormData({ name: "", description: "", price: 0, category: "", image: formData.image });
    };

    const startEdit = (p: Product) => {
        setFormData(p);
        setEditingId(p.id);
        setIsAdding(true);
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Gerenciar Cardápio</h1>
                    <p className="text-muted-foreground font-medium">Adicione ou edite os pratos do seu restaurante.</p>
                </div>
                <Button onClick={() => { setIsAdding(true); setEditingId(null); setFormData({ name: "", description: "", price: 0, category: "", image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80" }); }} className="gap-2 rounded-xl font-bold">
                    <Plus className="w-5 h-5" /> Novo Item
                </Button>
            </div>

            {isAdding && (
                <Card className="border-primary/20 bg-primary/5 rounded-2xl overflow-hidden shadow-xl animate-in zoom-in-95 duration-300">
                    <CardHeader className="border-b border-primary/10">
                        <CardTitle className="text-foreground">{editingId ? "Editar Item" : "Novo Item"}</CardTitle>
                        <CardDescription className="text-muted-foreground font-medium">Preencha os detalhes abaixo.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6 pt-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-black text-foreground/70 uppercase tracking-widest pl-1">Nome</label>
                                <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Ex: Burgão Especial" className="h-12 rounded-xl bg-card border-border font-bold text-foreground" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-black text-foreground/70 uppercase tracking-widest pl-1">Preço (R$)</label>
                                <Input type="number" value={formData.price} onChange={e => setFormData({ ...formData, price: parseFloat(e.target.value) })} placeholder="0.00" className="h-12 rounded-xl bg-card border-border font-bold text-foreground" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-black text-foreground/70 uppercase tracking-widest pl-1">Categoria</label>
                                <Input value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} placeholder="Ex: Lanches, Pizzas..." className="h-12 rounded-xl bg-card border-border font-bold text-foreground" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-black text-foreground/70 uppercase tracking-widest pl-1">URL da Imagem</label>
                                <Input value={formData.image} onChange={e => setFormData({ ...formData, image: e.target.value })} placeholder="http://..." className="h-12 rounded-xl bg-card border-border font-bold text-foreground" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-black text-foreground/70 uppercase tracking-widest pl-1">Descrição</label>
                            <Input value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Descreva os ingredientes..." className="h-12 rounded-xl bg-card border-border font-bold text-foreground" />
                        </div>
                        <div className="flex justify-end gap-3 pt-4 border-t border-primary/10">
                            <Button variant="ghost" onClick={() => setIsAdding(false)} className="gap-2 font-bold text-muted-foreground hover:bg-muted rounded-xl h-12 px-6">
                                <X className="w-4 h-4" /> Cancelar
                            </Button>
                            <Button onClick={handleSave} className="gap-2 font-black rounded-xl h-12 px-8 shadow-lg shadow-primary/20">
                                <Check className="w-4 h-4" /> Salvar Item
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            <div className="grid grid-cols-1 gap-4">
                {restaurant.products.map(product => (
                    <Card key={product.id} className="overflow-hidden bg-card border-border shadow-md hover:shadow-xl hover:scale-[1.01] transition-all duration-300 rounded-[28px] group">
                        <div className="flex items-center p-4 gap-6">
                            <div className="relative w-24 h-24 rounded-2xl overflow-hidden shrink-0">
                                <img src={product.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt={product.name} />
                                <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center justify-between mb-1">
                                    <h3 className="font-black text-xl text-foreground tracking-tight">{product.name}</h3>
                                    <span className="font-black text-primary text-lg">R${product.price.toFixed(2)}</span>
                                </div>
                                <p className="text-sm text-muted-foreground font-medium line-clamp-1">{product.description}</p>
                                <div className="mt-3 inline-flex items-center px-3 py-1 bg-muted rounded-full text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 border border-border">
                                    {product.category}
                                </div>
                            </div>
                            <div className="flex flex-col gap-2">
                                <Button variant="ghost" size="icon" onClick={() => startEdit(product)} className="w-11 h-11 rounded-xl bg-muted/50 text-foreground hover:bg-primary/10 hover:text-primary transition-all">
                                    <Edit className="w-5 h-5" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => deleteProduct(restaurant.id, product.id)} className="w-11 h-11 rounded-xl bg-muted/50 text-red-500 hover:bg-red-500/10 hover:text-red-600 transition-all">
                                    <Trash2 className="w-5 h-5" />
                                </Button>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
}
