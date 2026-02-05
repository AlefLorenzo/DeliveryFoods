"use client";
import { useState } from "react";
import { useAuthStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MapPin, User as UserIcon, ChevronLeft, Heart, Ticket, Settings as SettingsIcon } from "lucide-react";
import Link from "next/link";
import { RestaurantCard } from "@/components/client/RestaurantCard";

export default function ProfilePage() {
    const { user, updateUser, favorites, coupons } = useAuthStore();

    const [activeTab, setActiveTab] = useState<'profile' | 'favorites' | 'coupons'>('profile');

    const [formData, setFormData] = useState({
        name: user?.name || "",
        email: user?.email || "",
        street: user?.address?.street || "",
        number: user?.address?.number || "",
        neighborhood: user?.address?.neighborhood || "",
        city: user?.address?.city || "",
        state: user?.address?.state || "",
        zipCode: user?.address?.zipCode || "",
    });

    const [saved, setSaved] = useState(false);

    const handleSave = () => {
        if (!user) return;
        updateUser({
            ...user,
            name: formData.name,
            email: formData.email,
            address: {
                street: formData.street,
                number: formData.number,
                neighborhood: formData.neighborhood,
                city: formData.city,
                state: formData.state,
                zipCode: formData.zipCode,
            }
        });
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
    };

    const [favoriteRestaurants, setFavoriteRestaurants] = useState<Restaurant[]>([]);

    useEffect(() => {
        const fetchFavoriteRestaurants = async () => {
            if (favorites.length > 0) {
                try {
                    const res = await fetch("/api/restaurants");
                    const data: Restaurant[] = await res.json();
                    setFavoriteRestaurants(data.filter(r => favorites.includes(r.id)));
                } catch (error) {
                    console.error("Erro ao buscar restaurantes favoritos:", error);
                }
            }
        };
        fetchFavoriteRestaurants();
    }, [favorites]);

    return (
        <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700 pb-20 transition-colors">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <Link href="/home">
                        <Button variant="ghost" size="icon" className="rounded-2xl bg-card border border-border shadow-xl dark:shadow-none hover:bg-muted transition-all">
                            <ChevronLeft className="w-6 h-6" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-4xl font-black text-foreground tracking-tighter">Minha Conta</h1>
                        <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">{user?.name}</p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex bg-muted p-1.5 rounded-3xl self-start md:self-center transition-colors">
                    <Button
                        variant={activeTab === 'profile' ? 'default' : 'ghost'}
                        onClick={() => setActiveTab('profile')}
                        className={`rounded-2xl px-6 font-black gap-2 transition-all ${activeTab === 'profile' ? 'shadow-lg shadow-primary/20 scale-105' : ''}`}
                    >
                        <SettingsIcon className="w-4 h-4" /> Perfil
                    </Button>
                    <Button
                        variant={activeTab === 'favorites' ? 'default' : 'ghost'}
                        onClick={() => setActiveTab('favorites')}
                        className={`rounded-2xl px-6 font-black gap-2 transition-all ${activeTab === 'favorites' ? 'shadow-lg shadow-primary/20 scale-105' : ''}`}
                    >
                        <Heart className="w-4 h-4" /> Favoritos
                    </Button>
                    <Button
                        variant={activeTab === 'coupons' ? 'default' : 'ghost'}
                        onClick={() => setActiveTab('coupons')}
                        className={`rounded-2xl px-6 font-black gap-2 transition-all ${activeTab === 'coupons' ? 'shadow-lg shadow-primary/20 scale-105' : ''}`}
                    >
                        <Ticket className="w-4 h-4" /> Cupons
                    </Button>
                </div>
            </div>

            {activeTab === 'profile' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                    <div className="lg:col-span-2 space-y-8 animate-in slide-in-from-left duration-500">
                        {/* Dados Pessoais */}
                        <Card className="rounded-[40px] border border-border shadow-2xl bg-card backdrop-blur-md overflow-hidden transition-colors">
                            <CardHeader className="p-8 pb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                                        <UserIcon className="w-5 h-5 text-primary" />
                                    </div>
                                    <CardTitle className="text-2xl font-black tracking-tight text-foreground">Dados Pessoais</CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent className="p-8 pt-4 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Nome Completo</label>
                                        <Input
                                            className="h-14 rounded-2xl bg-muted border-transparent focus:bg-card focus:border-border transition-all text-lg font-bold"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">E-mail de Contato</label>
                                        <Input
                                            className="h-14 rounded-2xl bg-muted border-transparent focus:bg-card focus:border-border transition-all text-lg font-bold"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Endereço */}
                        <Card className="rounded-[40px] border border-border shadow-2xl bg-card backdrop-blur-md overflow-hidden transition-colors">
                            <CardHeader className="p-8 pb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                                        <MapPin className="w-5 h-5 text-primary" />
                                    </div>
                                    <CardTitle className="text-2xl font-black tracking-tight text-foreground">Endereço de Entrega</CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent className="p-8 pt-4 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
                                    <div className="md:col-span-4 space-y-2">
                                        <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Logradouro / Rua</label>
                                        <Input className="h-14 rounded-2xl bg-muted border-transparent transition-all font-bold focus:bg-card focus:border-border" value={formData.street} onChange={(e) => setFormData({ ...formData, street: e.target.value })} />
                                    </div>
                                    <div className="md:col-span-2 space-y-2">
                                        <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Número</label>
                                        <Input className="h-14 rounded-2xl bg-muted border-transparent transition-all font-bold focus:bg-card focus:border-border" value={formData.number} onChange={(e) => setFormData({ ...formData, number: e.target.value })} />
                                    </div>
                                    <div className="md:col-span-3 space-y-2">
                                        <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Bairro</label>
                                        <Input className="h-14 rounded-2xl bg-muted border-transparent transition-all font-bold focus:bg-card focus:border-border" value={formData.neighborhood} onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })} />
                                    </div>
                                    <div className="md:col-span-3 space-y-2">
                                        <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">CEP</label>
                                        <Input className="h-14 rounded-2xl bg-muted border-transparent transition-all font-bold focus:bg-card focus:border-border" value={formData.zipCode} onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })} />
                                    </div>
                                    <div className="md:col-span-4 space-y-2">
                                        <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Cidade</label>
                                        <Input className="h-14 rounded-2xl bg-muted border-transparent transition-all font-bold focus:bg-card focus:border-border" value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} />
                                    </div>
                                    <div className="md:col-span-2 space-y-2">
                                        <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Estado</label>
                                        <Input className="h-14 rounded-2xl bg-muted border-transparent transition-all font-bold focus:bg-card focus:border-border" value={formData.state} onChange={(e) => setFormData({ ...formData, state: e.target.value })} />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="space-y-6">
                        <Card className="rounded-[40px] border-none shadow-xl bg-primary text-white p-8">
                            <h3 className="text-2xl font-black mb-4 tracking-tighter">Salvar Alterações</h3>
                            <p className="text-white/80 text-sm font-bold mb-8">Mantenha seu perfil atualizado para ganhar agilidade nos seus pedidos!</p>
                            <Button
                                onClick={handleSave}
                                className={`w-full h-16 rounded-[24px] text-lg font-black transition-all active:scale-95 shadow-2xl ${saved ? 'bg-green-500 scale-105' : 'bg-background text-primary hover:bg-background/90 ring-4 ring-white/10'}`}
                            >
                                {saved ? "Perfil Atualizado!" : "Confirmar Mudanças"}
                            </Button>
                        </Card>

                        <div className="p-8 text-center text-muted-foreground font-black text-xs uppercase tracking-widest">
                            Membro desde 2026
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'favorites' && (
                <div className="animate-in slide-in-from-right duration-500">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-2xl font-black text-foreground">Seus Restaurantes Amados</h2>
                        <span className="bg-primary/10 text-primary px-4 py-2 rounded-full text-xs font-black uppercase">{favoriteRestaurants.length} favoritos</span>
                    </div>

                    {favoriteRestaurants.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {favoriteRestaurants.map(rest => (
                                <RestaurantCard key={rest.id} restaurant={rest} />
                            ))}
                        </div>
                    ) : (
                        <div className="py-32 text-center bg-muted/50 rounded-[40px] border-4 border-dashed border-border transition-colors">
                            <Heart className="w-16 h-16 text-muted-foreground/30 mx-auto mb-6" />
                            <h3 className="text-xl font-black text-foreground">Ainda sem favoritos</h3>
                            <p className="text-muted-foreground max-w-xs mx-auto mt-2 font-bold">Favorite os melhores restaurantes para tê-los sempre à mão!</p>
                            <Link href="/home">
                                <Button className="mt-8 rounded-full px-8 h-12 font-black">Começar a Explorar</Button>
                            </Link>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'coupons' && (
                <div className="animate-in slide-in-from-right duration-500 max-w-2xl">
                    <h2 className="text-2xl font-black text-foreground mb-8">Cupons Disponíveis</h2>
                    <div className="space-y-4">
                        {coupons.map((coupon, idx) => (
                            <Card key={idx} className="group overflow-hidden rounded-[32px] border border-border shadow-xl bg-card backdrop-blur-md hover:scale-[1.02] transition-all">
                                <CardContent className="p-4 flex">
                                    <div className="w-24 bg-primary rounded-2xl flex flex-col items-center justify-center text-white font-black p-2 shadow-lg">
                                        <span className="text-xs opacity-70">OFF</span>
                                        <span className="text-2xl tracking-tighter">{coupon.discount > 0 ? `R$${coupon.discount}` : 'FRETE'}</span>
                                        <span className="text-[10px] opacity-70">{coupon.discount > 0 ? '' : 'GRÁTIS'}</span>
                                    </div>
                                    <div className="p-6 flex-1">
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className="font-black text-xl text-foreground">{coupon.code}</h3>
                                            <Badge className="bg-green-500/10 text-green-500 font-black border-none">Ativo</Badge>
                                        </div>
                                        <p className="text-sm font-bold text-muted-foreground">{coupon.description}</p>
                                    </div>
                                </CardContent>
                                <div className="h-2 bg-primary/20 scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-500" />
                            </Card>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
