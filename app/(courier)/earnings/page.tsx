"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, Calendar } from "lucide-react";

export default function CourierEarnings() {
    return (
        <div className="space-y-6 pb-20 animate-in slide-in-from-bottom-4 duration-500">
            <header>
                <h1 className="text-3xl font-black text-foreground tracking-tighter">Meus Ganhos</h1>
                <p className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest mt-1">Saldos e Estatísticas</p>
            </header>

            <Card className="bg-primary text-white border-none shadow-2xl shadow-primary/30 rounded-[32px] overflow-hidden">
                <CardContent className="p-8">
                    <p className="text-xs font-black uppercase tracking-widest opacity-80 mb-2">Disponível para saque</p>
                    <div className="text-5xl font-black tracking-tighter mb-6">R$ 482,90</div>
                    <button className="w-full h-14 bg-white text-primary rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-black/10 active:scale-95 transition-all">
                        Solicitar Resgate
                    </button>
                </CardContent>
            </Card>

            <div className="grid grid-cols-2 gap-4">
                <Card className="bg-card border-none shadow-xl shadow-black/5 rounded-[24px]">
                    <CardContent className="p-5">
                        <TrendingUp className="w-5 h-5 text-green-500 mb-2" />
                        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Semana</p>
                        <p className="text-xl font-black text-foreground">R$ 1.240</p>
                    </CardContent>
                </Card>
                <Card className="bg-card border-none shadow-xl shadow-black/5 rounded-[24px]">
                    <CardContent className="p-5">
                        <DollarSign className="w-5 h-5 text-blue-500 mb-2" />
                        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Gorjetas</p>
                        <p className="text-xl font-black text-foreground">R$ 156</p>
                    </CardContent>
                </Card>
            </div>

            <Card className="bg-card border-none shadow-xl shadow-black/5 rounded-[32px]">
                <CardHeader>
                    <CardTitle className="text-lg font-black flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-primary" /> Histórico Semanal
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {[
                        { day: 'Segunda', val: 180 },
                        { day: 'Terça', val: 210 },
                        { day: 'Quarta', val: 155 },
                        { day: 'Quinta', val: 245 },
                        { day: 'Sexta', val: 320 },
                    ].map((d, i) => (
                        <div key={i} className="flex items-center justify-between group cursor-pointer hover:bg-muted/50 p-2 rounded-xl transition-all">
                            <span className="font-bold text-muted-foreground">{d.day}</span>
                            <div className="flex items-center gap-3">
                                <div className="h-2 w-24 bg-muted rounded-full overflow-hidden">
                                    <div className="h-full bg-primary" style={{ width: `${(d.val / 350) * 100}%` }} />
                                </div>
                                <span className="font-black text-foreground">R${d.val}</span>
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
    );
}
