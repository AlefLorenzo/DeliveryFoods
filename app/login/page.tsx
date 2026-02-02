"use client";
import { useState, useEffect } from "react";
import { useAuthStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Chrome, Loader2 } from "lucide-react";
import { UserRole } from "@/types";

export default function LoginPage() {
    const { user, login, isAuthenticated, hasHydrated } = useAuthStore();
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    useEffect(() => {
        if (hasHydrated && isAuthenticated && user?.role) {
            const paths: Record<UserRole, string> = {
                'CLIENT': '/home',
                'RESTAURANT': '/dashboard',
                'COURIER': '/feed'
            };
            const targetPath = paths[user.role];
            if (targetPath) window.location.href = targetPath;
        }
    }, [hasHydrated, isAuthenticated, user?.role]);

    if (!hasHydrated) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Loader2 className="w-12 h-12 text-primary animate-spin" />
            </div>
        );
    }

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        console.log("Iniciando tentativa de login inteligente...");

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Erro ao realizar login');
            }

            const { user: apiUser, accessToken } = data;
            login(apiUser, accessToken);
            console.log("Login realizado com sucesso. Role detectada:", apiUser.role);

            // Redirecionamento baseado na Role retornada pelo banco
            const paths: Record<string, string> = {
                'CLIENT': '/home',
                'RESTAURANT': '/dashboard',
                'COURIER': '/feed'
            };

            const target = paths[apiUser.role] || '/';
            window.location.href = target;

        } catch (err: any) {
            console.error("Erro no processo de login:", err);
            alert(err.message || "Ocorreu um erro ao tentar entrar. Verifique suas credenciais.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4 transition-colors duration-300">
            <Card className="max-w-md w-full shadow-2xl border-border bg-card rounded-[40px] overflow-hidden transition-all duration-300 ring-1 ring-border/50">
                <div className="h-2 bg-primary w-full shadow-[0_4px_12px_rgba(var(--primary),0.3)]" />
                <CardHeader className="text-center pt-12 pb-8">
                    <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-6 ring-4 ring-primary/5">
                        <span className="text-3xl font-black text-primary">SD</span>
                    </div>
                    <CardTitle className="text-4xl font-black text-foreground tracking-tighter">SnapDelivery</CardTitle>
                    <CardDescription className="text-lg font-medium mt-2 text-muted-foreground">Acesse sua conta para continuar</CardDescription>
                </CardHeader>
                <CardContent className="pb-12 px-10">
                    <form onSubmit={handleLogin} className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">E-mail ou Celular</label>
                            <Input
                                type="text"
                                placeholder="exemplo@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="h-14 rounded-2xl bg-muted border-transparent focus:bg-card focus:border-border transition-all font-bold"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-center px-1">
                                <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Senha</label>
                                <button type="button" className="text-xs font-black text-primary hover:underline uppercase tracking-widest opacity-70">Esqueci a senha</button>
                            </div>
                            <Input
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="h-14 rounded-2xl bg-muted border-transparent focus:bg-card focus:border-border transition-all font-bold"
                                required
                            />
                        </div>

                        <div className="flex items-center gap-2 px-1 pt-2">
                            <input type="checkbox" id="remember" className="w-5 h-5 rounded-md border-2 border-muted-foreground/30 accent-primary cursor-pointer" />
                            <label htmlFor="remember" className="text-sm font-bold text-muted-foreground cursor-pointer">Manter conectado</label>
                        </div>

                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full h-16 rounded-[24px] text-lg font-black transition-all active:scale-95 shadow-xl shadow-primary/20 bg-primary hover:bg-primary/90 mt-4"
                        >
                            {loading ? (
                                <Loader2 className="w-6 h-6 animate-spin text-white" />
                            ) : (
                                "Entrar agora"
                            )}
                        </Button>

                        <div className="relative py-4">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-border" />
                            </div>
                            <div className="relative flex justify-center text-[10px] uppercase">
                                <span className="bg-card px-4 text-muted-foreground font-black tracking-[0.2em] opacity-50">ou acesse com</span>
                            </div>
                        </div>

                        <Button
                            type="button"
                            variant="outline"
                            className="w-full h-14 rounded-2xl border-2 hover:bg-muted font-bold gap-3"
                        >
                            <Chrome className="w-5 h-5 text-blue-500" /> Google
                        </Button>

                        <p className="text-center text-sm font-bold text-muted-foreground pt-4 leading-relaxed">
                            Ainda não tem conta? <br />
                            <button type="button" className="text-primary hover:underline font-black uppercase text-xs tracking-widest">Cadastrar nova conta</button>
                        </p>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
