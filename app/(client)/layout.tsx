"use client";
import { useEffect } from "react";
import { useAuthStore } from "@/lib/store";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { ClientHeader } from "@/components/client/Header";

export default function ClientLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, isAuthenticated, hasHydrated } = useAuthStore();
    const router = useRouter();

    useEffect(() => {
        if (!hasHydrated) return;

        if (!isAuthenticated) {
            router.push("/login");
            return;
        }

        if (user && user.role !== 'CLIENT') {
            const redirectPath = user.role === 'RESTAURANT' ? '/dashboard' : '/feed';
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

    if (!isAuthenticated || !user || user.role !== 'CLIENT') {
        return null; // Redirecionamento pelo useEffect cuidará disso
    }

    return (
        <div className="min-h-screen bg-background pb-20 transition-colors duration-300">
            <ClientHeader />
            <main className="container mx-auto px-4 py-8">
                {children}
            </main>
        </div>
    );
}
