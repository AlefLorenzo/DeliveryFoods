"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { ShoppingBag, MapPin, Loader2, LogOut, Settings, History, Home, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCartStore, useAuthStore, useThemeStore } from "@/lib/store";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function ClientHeader() {
    const totalItems = useCartStore((state) => state.totalItems());
    const { user, logout, isAuthenticated } = useAuthStore();
    const { theme, toggleTheme } = useThemeStore();
    const [address, setAddress] = useState("Localizando...");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user?.address) {
            setAddress(`${user.address.street}, ${user.address.number}`);
            setLoading(false);
            return;
        }
        // ... geolocalização existente
    }, [user]);

    if (!isAuthenticated) return null;

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md transition-colors duration-300">
            <div className="container mx-auto px-4 h-20 flex items-center justify-between gap-4">

                {/* Logo & Home Icon */}
                <div className="flex items-center gap-4">
                    <Link href="/" className="p-2.5 rounded-2xl bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all shadow-sm group">
                        <Home className="w-5 h-5 group-active:scale-90" />
                    </Link>

                    <Link href="/home" className="text-xl font-black text-primary flex items-center group">
                        <span className="bg-primary text-white px-2 py-1 rounded-xl mr-2 transition-transform group-hover:rotate-12">SD</span>
                        <span className="hidden lg:block tracking-tighter">SnapDelivery</span>
                    </Link>

                    <div className="hidden md:flex items-center text-sm text-muted-foreground bg-muted/50 px-4 py-2 rounded-full cursor-pointer hover:bg-muted transition-all border border-border/50">
                        {loading ? <Loader2 className="w-4 h-4 mr-2 text-primary animate-spin" /> : <MapPin className="w-4 h-4 mr-2 text-primary" />}
                        <span className="truncate max-w-[150px] lg:max-w-[250px] font-bold">{address}</span>
                    </div>
                </div>

                {/* Ações */}
                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={toggleTheme}
                        className="rounded-full w-11 h-11 border-2 border-border/10 bg-background/50 backdrop-blur-md shadow-sm"
                    >
                        {theme === 'dark' ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-slate-700" />}
                    </Button>

                    <Link href="/cart">
                        <Button variant="default" className="relative rounded-full h-11 px-6 font-black shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all">
                            <ShoppingBag className="w-5 h-5 mr-2" />
                            <span className="hidden sm:inline">Carrinho</span>
                            {totalItems > 0 && (
                                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-6 h-6 flex items-center justify-center rounded-full font-black border-2 border-background ring-4 ring-red-500/10">
                                    {totalItems}
                                </span>
                            )}
                        </Button>
                    </Link>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="flex items-center gap-3 h-14 pl-2 pr-4 rounded-full hover:bg-muted/50 transition-all border-2 border-transparent hover:border-primary/20 bg-background shadow-sm overflow-hidden">
                                <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary/30 shadow-inner">
                                    <img src={user?.avatar} alt={user?.name} className="w-full h-full object-cover" />
                                </div>
                                <div className="hidden md:flex flex-col items-start leading-tight">
                                    <span className="text-sm font-black text-foreground">{user?.name}</span>
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Premium</span>
                                </div>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-68 rounded-[32px] p-2 mt-4 bg-card border-2 border-border/50 shadow-2xl animate-in zoom-in-95 duration-200" align="end">
                            <DropdownMenuLabel className="p-4 bg-muted/50 rounded-[24px] mb-2 border border-border/30">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-primary shadow-lg ring-4 ring-primary/10">
                                        <img src={user?.avatar} alt={user?.name} className="w-full h-full object-cover" />
                                    </div>
                                    <div className="flex-1 overflow-hidden">
                                        <p className="font-black text-foreground truncate text-lg tracking-tight">{user?.name}</p>
                                        <p className="text-xs text-muted-foreground font-bold truncate">{user?.email}</p>
                                    </div>
                                </div>
                            </DropdownMenuLabel>

                            <div className="space-y-1">
                                <Link href="/orders">
                                    <DropdownMenuItem className="rounded-2xl h-12 cursor-pointer gap-3 px-4 focus:bg-primary focus:text-white transition-all font-black text-foreground/80">
                                        <History className="w-5 h-5" /> Meus Pedidos
                                    </DropdownMenuItem>
                                </Link>
                                <Link href="/profile">
                                    <DropdownMenuItem className="rounded-2xl h-12 cursor-pointer gap-3 px-4 focus:bg-primary focus:text-white transition-all font-black text-foreground/80">
                                        <Settings className="w-5 h-5" /> Dados da Conta
                                    </DropdownMenuItem>
                                </Link>
                            </div>

                            <DropdownMenuSeparator className="my-2 bg-border/50" />

                            <DropdownMenuItem onClick={logout} className="rounded-2xl h-12 cursor-pointer gap-3 px-4 text-red-500 focus:bg-red-500 focus:text-white transition-all font-black group">
                                <LogOut className="w-5 h-5 group-hover:scale-110" /> Sair Agora
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </header>
    );
}
