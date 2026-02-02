"use client";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, MapPin } from "lucide-react";

export default function CourierHistory() {
    const history = [
        { id: '1024', date: 'Hoje, 14:20', from: 'Gourmet Royale', to: 'Rua das Palmeiras, 45', val: 18.50, status: 'DELIVERED' },
        { id: '1023', date: 'Hoje, 11:45', from: 'Pizza Prime', to: 'Av. Paulista, 1000', val: 12.00, status: 'DELIVERED' },
        { id: '1022', date: 'Ontem, 20:10', from: 'Sushi House', to: 'Rua Bela Cintra, 200', val: 22.40, status: 'DELIVERED' },
    ];

    return (
        <div className="space-y-6 pb-20 animate-in slide-in-from-bottom-4 duration-500">
            <header>
                <h1 className="text-3xl font-black text-foreground tracking-tighter">Histórico</h1>
                <p className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest mt-1">Suas entregas concluídas</p>
            </header>

            <div className="space-y-4">
                {history.map((item) => (
                    <Card key={item.id} className="bg-card border-none shadow-xl shadow-black/5 rounded-[28px] overflow-hidden group hover:scale-[1.02] transition-all">
                        <CardContent className="p-6">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-10 h-10 bg-green-500/10 rounded-full flex items-center justify-center">
                                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                                    </div>
                                    <div>
                                        <p className="font-black text-foreground tracking-tight">Pedido #{item.id}</p>
                                        <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">{item.date}</p>
                                    </div>
                                </div>
                                <div className="text-lg font-black text-primary">R${item.val.toFixed(2)}</div>
                            </div>

                            <div className="space-y-3 relative">
                                <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-muted-foreground/10" />
                                <div className="flex items-center gap-3 relative">
                                    <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center ring-4 ring-card">
                                        <div className="w-2 h-2 rounded-full bg-orange-500" />
                                    </div>
                                    <p className="text-xs font-bold text-muted-foreground truncate">{item.from}</p>
                                </div>
                                <div className="flex items-center gap-3 relative">
                                    <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center ring-4 ring-card">
                                        <MapPin className="w-3 h-3 text-primary" />
                                    </div>
                                    <p className="text-xs font-bold text-foreground truncate">{item.to}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
