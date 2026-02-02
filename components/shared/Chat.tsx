"use client";
import { useState, useEffect, useRef } from "react";
import { Send, User, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/lib/store";
import { getPusherClient, PUSHER_EVENTS } from "@/lib/pusher";

interface Message {
    id: string;
    text: string;
    sender: 'USER' | 'RESTAURANT' | 'COURIER' | 'SYSTEM';
    createdAt: string;
    user?: { name: string; avatar?: string };
}

export function SharedChat({ orderId }: { orderId: string }) {
    const { accessToken, user } = useAuthStore();
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(true);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!accessToken) return;

        // Fetch history
        const fetchHistory = async () => {
            try {
                const res = await fetch(`/api/orders/${orderId}/chat`, {
                    headers: { 'Authorization': `Bearer ${accessToken}` }
                });
                const data = await res.json();
                if (res.ok) setMessages(data);
            } catch (err) {
                console.error("Erro ao carregar histórico do chat:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();

        // Pusher Subscription
        const pusher = getPusherClient();
        if (pusher) {
            const channel = pusher.subscribe(`order-${orderId}`);
            channel.bind(PUSHER_EVENTS.CHAT_MESSAGE, (newMessage: Message) => {
                setMessages(prev => {
                    if (prev.find(m => m.id === newMessage.id)) return prev;
                    return [...prev, newMessage];
                });
            });
            return () => {
                pusher.unsubscribe(`order-${orderId}`);
            };
        }
    }, [orderId, accessToken]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || !accessToken || !user) return;

        const originalInput = input;
        setInput("");

        const senderMap: Record<string, string> = {
            'CLIENT': 'USER',
            'RESTAURANT': 'RESTAURANT',
            'COURIER': 'COURIER',
            'ADMIN': 'SYSTEM'
        };

        try {
            const res = await fetch(`/api/orders/${orderId}/chat`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    text: originalInput,
                    sender: senderMap[user.role] || 'SYSTEM'
                })
            });

            if (!res.ok) {
                setInput(originalInput);
                console.error("Erro ao enviar mensagem");
            }
        } catch (err) {
            setInput(originalInput);
            console.error("Erro na requisição de envio:", err);
        }
    };

    return (
        <div className="flex flex-col h-[400px] bg-card border-2 border-border rounded-[32px] overflow-hidden shadow-2xl">
            <div className="bg-muted px-6 py-4 border-b border-border flex items-center justify-between">
                <div>
                    <h3 className="font-black text-foreground tracking-tight">Chat de Suporte</h3>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Pedido #{orderId}</p>
                </div>
                <div className="flex -space-x-2">
                    {[1, 2].map(i => (
                        <div key={i} className="w-8 h-8 rounded-full border-2 border-muted bg-primary/10 flex items-center justify-center">
                            <User className="w-4 h-4 text-primary" />
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
                {messages.map((m) => (
                    <div key={m.id} className={`flex ${m.sender === 'USER' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] p-4 rounded-2xl font-bold text-sm ${m.sender === 'USER' ? 'bg-primary text-white rounded-tr-none' :
                            m.sender === 'SYSTEM' ? 'bg-muted/50 text-muted-foreground text-center w-full border-2 border-dashed border-border' :
                                'bg-muted text-foreground rounded-tl-none'
                            }`}>
                            {m.text}
                            <p className={`text-[10px] mt-1 opacity-50 ${m.sender === 'USER' ? 'text-right' : 'text-left'}`}>
                                {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="p-4 border-t border-border bg-muted/20">
                <div className="flex gap-2">
                    <Input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Escreva sua mensagem..."
                        className="h-12 rounded-xl bg-card border-transparent focus:border-primary transition-all font-bold"
                    />
                    <Button onClick={handleSend} disabled={loading} className="h-12 w-12 rounded-xl bg-primary hover:bg-primary/90 p-0 shadow-lg shadow-primary/20">
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 text-white" />}
                    </Button>
                </div>
            </div>
        </div>
    );
}
