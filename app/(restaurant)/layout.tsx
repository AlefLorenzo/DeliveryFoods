"use client";
import Link from "next/link";
import { LayoutDashboard, ShoppingBag, UtensilsCrossed, Settings, LogOut, Store, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/lib/store";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function RestaurantLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, isAuthenticated, hasHydrated, logout } = useAuthStore();
    const router = useRouter();

    useEffect(() => {
        if (!hasHydrated) return;

        if (!isAuthenticated) {
            router.push("/login");
            return;
        }

        if (user && user.role !== 'RESTAURANT') {
            const redirectPath = user.role === 'CLIENT' ? '/home' : '/feed';
            window.location.href = redirectPath;
        }
    }, [isAuthenticated, user, hasHydrated, router]);

    if (!hasHydrated) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Loader2 className="w-12 h-12 text-primary animate-spin" />
            </div>
        );
    }

    if (!isAuthenticated || !user || user.role !== 'RESTAURANT') return null;

    return (
        <div className="flex h-screen bg-background transition-colors duration-300">
            {/* Sidebar */}
            <aside className="w-64 bg-card text-foreground hidden md:flex flex-col border-r border-border">
                <div className="p-6 border-b border-border flex items-center gap-2">
                    <Store className="text-primary w-6 h-6" />
                    <span className="font-bold text-lg">Painel Parceiro</span>
                </div>

                <nav className="flex-1 p-4 space-y-2">
                    <Link href="/dashboard">
                        <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-foreground hover:bg-muted font-bold">
                            <LayoutDashboard className="w-5 h-5 mr-3" /> Painel Geral
                        </Button>
                    </Link>
                    <Link href="/kitchen">
                        <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-foreground hover:bg-muted font-bold">
                            <ShoppingBag className="w-5 h-5 mr-3" /> Pedidos ao Vivo
                        </Button>
                    </Link>
                    <Link href="/menu">
                        <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-foreground hover:bg-muted font-bold">
                            <UtensilsCrossed className="w-5 h-5 mr-3" /> Gerenciar Cardápio
                        </Button>
                    </Link>
                    <Link href="/settings">
                        <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-foreground hover:bg-muted font-bold">
                            <Settings className="w-5 h-5 mr-3" /> Configurações
                        </Button>
                    </Link>
                </nav>

                <div className="p-4 border-t border-border">
                    <Button
                        variant="ghost"
                        onClick={() => logout()}
                        className="w-full justify-start text-red-500 hover:text-red-400 hover:bg-destructive/10 font-bold"
                    >
                        <LogOut className="w-5 h-5 mr-3" /> Sair
                    </Button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto bg-background">
                <header className="h-16 bg-card border-b border-border flex items-center justify-between px-6 md:hidden">
                    <span className="font-black text-foreground">Painel Parceiro</span>
                    {/* Mobile menu trigger would go here */}
                </header>
                <div className="p-6 md:p-8 max-w-7xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}
