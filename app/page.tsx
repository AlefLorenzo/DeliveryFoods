"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Utensils, Bike, ChefHat, ArrowRight, Loader2 } from "lucide-react";

import { UserRole } from "@/types";

export default function Home() {
  const { user, isAuthenticated, hasHydrated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (hasHydrated && isAuthenticated && user?.role) {
      const paths: Record<UserRole, string> = {
        'CLIENT': '/home',
        'RESTAURANT': '/dashboard',
        'COURIER': '/feed'
      };
      const targetPath = paths[user.role];
      if (targetPath) {
        window.location.href = targetPath;
      }
    }
  }, [hasHydrated, isAuthenticated, user?.role]);

  // Só mostra o loader se estiver de fato autenticado com uma role válida para redirecionar
  if (hasHydrated && isAuthenticated && user?.role) {
    const paths: Record<UserRole, string> = {
      'CLIENT': '/home',
      'RESTAURANT': '/dashboard',
      'COURIER': '/feed'
    };
    if (paths[user.role]) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-12 h-12 text-primary animate-spin" />
            <p className="text-muted-foreground font-bold animate-pulse">Redirecionando para seu portal...</p>
          </div>
        </div>
      );
    }
  }

  return (
    <main className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="max-w-5xl w-full text-center space-y-8">
        <div className="space-y-4">
          <h1 className="text-5xl font-extrabold tracking-tight text-foreground sm:text-7xl uppercase">
            Snap<span className="text-primary">Delivery</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto font-medium">
            A plataforma de delivery mais rápida e integrada do mercado.
            Escolha seu perfil para continuar.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          {/* Portal do Cliente */}
          <Link href="/login" onClick={() => localStorage.setItem('last_role', 'CLIENT')} className="group">
            <Card className="h-full transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 border-border bg-card rounded-[32px] overflow-hidden">
              <CardHeader className="pt-8">
                <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/20 rounded-3xl flex items-center justify-center mb-6 mx-auto group-hover:bg-blue-600 transition-all duration-500 group-hover:rotate-6">
                  <Utensils className="w-10 h-10 text-blue-600 dark:text-blue-400 group-hover:text-white transition-colors" />
                </div>
                <CardTitle className="text-3xl font-black tracking-tighter">Sou Cliente</CardTitle>
                <CardDescription className="text-muted-foreground font-bold mt-2">Peça os melhores pratos da cidade.</CardDescription>
              </CardHeader>
              <CardContent className="pb-8">
                <div className="flex items-center justify-center text-blue-600 dark:text-blue-400 font-black uppercase text-xs tracking-widest mt-4">
                  Entrar agora <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-2 transition-transform" />
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Portal do Restaurante */}
          <Link href="/login" onClick={() => localStorage.setItem('last_role', 'RESTAURANT')} className="group">
            <Card className="h-full transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 border-border bg-card rounded-[32px] overflow-hidden">
              <CardHeader className="pt-8">
                <div className="w-20 h-20 bg-orange-100 dark:bg-orange-900/20 rounded-3xl flex items-center justify-center mb-6 mx-auto group-hover:bg-orange-600 transition-all duration-500 group-hover:-rotate-6">
                  <ChefHat className="w-10 h-10 text-orange-600 dark:text-orange-400 group-hover:text-white transition-colors" />
                </div>
                <CardTitle className="text-3xl font-black tracking-tighter">Sou Restaurante</CardTitle>
                <CardDescription className="text-muted-foreground font-bold mt-2">Venda mais e gerencie sua cozinha.</CardDescription>
              </CardHeader>
              <CardContent className="pb-8">
                <div className="flex items-center justify-center text-orange-600 dark:text-orange-400 font-black uppercase text-xs tracking-widest mt-4">
                  Painel Parceiro <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-2 transition-transform" />
                </div>
              </CardContent>
            </Card>
          </Link>
          
          {/* Portal do Entregador */}
          <Link href="/login" onClick={() => localStorage.setItem('last_role', 'COURIER')} className="group">
            <Card className="h-full transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 border-border bg-card rounded-[32px] overflow-hidden">
              <CardHeader className="pt-8">
                <div className="w-20 h-20 bg-green-100 dark:bg-green-900/20 rounded-3xl flex items-center justify-center mb-6 mx-auto group-hover:bg-green-600 transition-all duration-500 group-hover:scale-110">
                  <Bike className="w-10 h-10 text-green-600 dark:text-green-400 group-hover:text-white transition-colors" />
                </div>
                <CardTitle className="text-3xl font-black tracking-tighter">Sou Entregador</CardTitle>
                <CardDescription className="text-muted-foreground font-bold mt-2">Ganhe dinheiro nas suas horas livres.</CardDescription>
              </CardHeader>
              <CardContent className="pb-8">
                <div className="flex items-center justify-center text-green-600 dark:text-green-400 font-black uppercase text-xs tracking-widest mt-4">
                  Fazer Entregas <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-2 transition-transform" />
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </main>
  );
}
