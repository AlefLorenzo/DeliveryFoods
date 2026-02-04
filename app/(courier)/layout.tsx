"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Bike, User, Map, History, LogOut, Loader2 } from "lucide-react";
import { useAuthStore } from "@/lib/store";

export default function CourierLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, isAuthenticated, hasHydrated, logout } = useAuthStore();
    const [isOnline, setIsOnline] = useState(false);

    useEffect(() => {
        if (user) {
            // Buscar status inicial (opcional, ou assumir offline)
            fetch(`/api/courier/status?courierId=${user.id}`, { method: 'GET' })
                .then(res => res.json())
                .then(data => setIsOnline(!!data.isOnline));
        }
    }, [user]);

    const toggleStatus = async () => {
        const newStatus = !isOnline;
        setIsOnline(newStatus);
        try {
            await fetch('/api/courier/status', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ courierId: user?.id, isOnline: newStatus })
            });
        } catch (error) {
            console.error("Erro ao atualizar status:", error);
        }
    };

    if (!hasHydrated) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Loader2 className="w-12 h-12 text-primary animate-spin" />
            </div>
        );
    }

    if (!isAuthenticated || !user || user.role !== 'COURIER') return null;
    return (
        <div className="min-h-screen bg-background pb-20 max-w-md mx-auto shadow-2xl overflow-hidden border-x border-border relative transition-colors duration-300">
            <header className="bg-card text-foreground border-b border-border p-4 sticky top-0 z-10 transition-colors duration-300">
                <div className="flex justify-between items-center">
                    <div className="font-bold text-lg flex items-center gap-2">
                        <Bike className={isOnline ? "text-green-500" : "text-muted-foreground"} />
                        <span className="tracking-tighter font-black">SnapCourier</span>
                    </div>
                    <button
                        onClick={toggleStatus}
                        className={`px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase transition-all shadow-lg ${isOnline
                            ? 'bg-green-500 text-white shadow-green-500/20 ring-1 ring-green-400'
                            : 'bg-muted text-muted-foreground shadow-black/5 border border-border'
                            }`}
                    >
                        {isOnline ? '● Online' : '○ Offline'}
                    </button>
                </div>
            </header>

            <main className="p-4">
                {children}
            </main>

            {/* Navegação Inferior */}
            <nav className="fixed bottom-0 max-w-md w-full bg-card border-t border-border flex justify-around p-3 pb-6 z-20 transition-colors duration-300">
                <Link href="/feed" className="flex flex-col items-center text-muted-foreground hover:text-primary active:text-primary transition-colors">
                    <Map className="w-6 h-6 mb-1" />
                    <span className="text-xs">Entregas</span>
                </Link>
                <Link href="/earnings" className="flex flex-col items-center text-muted-foreground hover:text-primary transition-colors">
                    <User className="w-6 h-6 mb-1" />
                    <span className="text-xs">Ganhos</span>
                </Link>
                <Link href="/history" className="flex flex-col items-center text-muted-foreground hover:text-primary transition-colors">
                    <History className="w-6 h-6 mb-1" />
                    <span className="text-xs">Histórico</span>
                </Link>
                <button
                    onClick={() => logout()}
                    className="flex flex-col items-center text-red-500 hover:text-red-400 transition-colors"
                >
                    <LogOut className="w-6 h-6 mb-1" />
                    <span className="text-xs">Sair</span>
                </button>
            </nav>
        </div>
    );
}
