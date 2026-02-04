"use client";
import { useState, useEffect, useRef } from "react";
import { Send, User, Loader2, Store, Bike } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/lib/store";
import { getPusherClient, PUSHER_EVENTS } from "@/lib/pusher";

type ChannelType = "CUSTOMER_RESTAURANT" | "CUSTOMER_COURIER";

interface Channel {
    id: string;
    type: ChannelType;
    lastMessage: { text: string; createdAt: string } | null;
}

interface Message {
    id: string;
    text: string;
    senderId: string | null;
    sender?: { id: string; name: string; avatar?: string; role: string } | null;
    createdAt: string;
    readBy: string[];
}

export function SharedChat({ orderId }: { orderId: string }) {
    const { accessToken, user } = useAuthStore();
    const [channels, setChannels] = useState<Channel[]>([]);
    const [activeChannelType, setActiveChannelType] = useState<ChannelType>("CUSTOMER_RESTAURANT");
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [quickMessages, setQuickMessages] = useState<{ id: string; text: string; icon?: string }[]>([]);
    const scrollRef = useRef<HTMLDivElement>(null);

    const activeChannel = channels.find((c) => c.type === activeChannelType);

    // Buscar canais do pedido
    useEffect(() => {
        if (!accessToken) return;

        const fetchChannels = async () => {
            try {
                const res = await fetch(`/api/chat/channels/${orderId}`, {
                    headers: { Authorization: `Bearer ${accessToken}` },
                });
                const data = await res.json();
                if (res.ok && Array.isArray(data)) setChannels(data);
            } catch (err) {
                console.error("Erro ao carregar canais do chat:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchChannels();
    }, [orderId, accessToken]);

    // Mensagens rápidas para canal Cliente-Entregador
    useEffect(() => {
        if (!accessToken || activeChannelType !== "CUSTOMER_COURIER") return;
        fetch("/api/chat/quick-messages?category=CUSTOMER_TO_COURIER", {
            headers: { Authorization: `Bearer ${accessToken}` },
        })
            .then((res) => res.json())
            .then((data) => (Array.isArray(data) ? setQuickMessages(data) : []))
            .catch(() => setQuickMessages([]));
    }, [accessToken, activeChannelType]);

    // Buscar mensagens do canal ativo e inscrever no Pusher
    useEffect(() => {
        if (!accessToken || !activeChannel) {
            setMessages([]);
            return;
        }

        const fetchMessages = async () => {
            try {
                const res = await fetch(`/api/chat/${orderId}/${activeChannel.type}`, {
                    headers: { Authorization: `Bearer ${accessToken}` },
                });
                const data = await res.json();
                if (res.ok && Array.isArray(data)) setMessages(data);
            } catch (err) {
                console.error("Erro ao carregar mensagens:", err);
            }
        };

        fetchMessages();

        const pusher = getPusherClient();
        if (pusher) {
            const channelName = `chat-${activeChannel.id}`;
            const channel = pusher.subscribe(channelName);
            channel.bind(PUSHER_EVENTS.CHAT_MESSAGE, (newMessage: Message) => {
                setMessages((prev) => {
                    if (prev.some((m) => m.id === newMessage.id)) return prev;
                    return [...prev, newMessage];
                });
            });
            return () => {
                pusher.unsubscribe(channelName);
            };
        }
    }, [orderId, accessToken, activeChannel?.id, activeChannel?.type]);

    useEffect(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }, [messages]);

    const handleSend = async () => {
        const text = input.trim();
        if (!text || !accessToken || !user || !activeChannel) return;

        setInput("");
        setSending(true);

        try {
            const res = await fetch(`/api/chat/${orderId}/${activeChannel.type}`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    text,
                    isTemplate: activeChannel.type === "CUSTOMER_COURIER",
                    templateId: undefined,
                }),
            });

            const data = await res.json();
            if (res.ok && data.id) {
                setMessages((prev) => [...prev, data]);
            } else {
                setInput(text);
                if (res.status === 429) {
                    alert(data.message || "Limite de mensagens por minuto. Aguarde um pouco.");
                }
            }
        } catch (err) {
            setInput(text);
            console.error("Erro ao enviar mensagem:", err);
        } finally {
            setSending(false);
        }
    };

    const isCustomerCourier = activeChannelType === "CUSTOMER_COURIER";
    const canWriteFree = !isCustomerCourier;

    return (
        <div className="flex flex-col h-[400px] bg-card border-2 border-border rounded-[32px] overflow-hidden shadow-2xl">
            <div className="bg-muted px-6 py-4 border-b border-border">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                    <h3 className="font-black text-foreground tracking-tight">Chat de Suporte</h3>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Pedido #{orderId.slice(0, 8)}</p>
                </div>

                {/* Toggle Restaurante / Entregador */}
                {channels.length > 0 && (
                    <div className="flex gap-2 mt-3">
                        {channels.some((c) => c.type === "CUSTOMER_RESTAURANT") && (
                            <Button
                                variant={activeChannelType === "CUSTOMER_RESTAURANT" ? "default" : "outline"}
                                size="sm"
                                className="rounded-xl gap-1.5 font-bold"
                                onClick={() => setActiveChannelType("CUSTOMER_RESTAURANT")}
                            >
                                <Store className="w-4 h-4" /> Restaurante
                            </Button>
                        )}
                        {channels.some((c) => c.type === "CUSTOMER_COURIER") && (
                            <Button
                                variant={activeChannelType === "CUSTOMER_COURIER" ? "default" : "outline"}
                                size="sm"
                                className="rounded-xl gap-1.5 font-bold"
                                onClick={() => setActiveChannelType("CUSTOMER_COURIER")}
                            >
                                <Bike className="w-4 h-4" /> Entregador
                            </Button>
                        )}
                    </div>
                )}
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
                {loading ? (
                    <div className="flex items-center justify-center h-32">
                        <Loader2 className="w-8 h-8 text-primary animate-spin" />
                    </div>
                ) : !activeChannel ? (
                    <p className="text-sm text-muted-foreground text-center py-8">Selecione um canal ou aguarde o entregador ser atribuído.</p>
                ) : (
                    messages.map((m) => {
                        const isMe = m.senderId === user?.id;
                        const isSystem = !m.senderId;
                        return (
                            <div key={m.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                                <div
                                    className={`max-w-[80%] p-4 rounded-2xl font-bold text-sm ${
                                        isMe
                                            ? "bg-primary text-white rounded-tr-none"
                                            : isSystem
                                              ? "bg-muted/50 text-muted-foreground text-center w-full border-2 border-dashed border-border"
                                              : "bg-muted text-foreground rounded-tl-none"
                                    }`}
                                >
                                    {!isSystem && !isMe && m.sender?.name && (
                                        <p className="text-[10px] opacity-70 mb-1">{m.sender.name}</p>
                                    )}
                                    {m.text}
                                    <p className={`text-[10px] mt-1 opacity-50 ${isMe ? "text-right" : "text-left"}`}>
                                        {new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                    </p>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {activeChannel && (
                <div className="p-4 border-t border-border bg-muted/20">
                    {isCustomerCourier && quickMessages.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                            {quickMessages.map((qm) => (
                                <Button
                                    key={qm.id}
                                    variant="outline"
                                    size="sm"
                                    className="rounded-xl font-bold text-xs"
                                    disabled={sending}
                                    onClick={() => sendMessage(qm.text, true, qm.id)}
                                >
                                    {qm.icon} {qm.text}
                                </Button>
                            ))}
                        </div>
                    )}
                    {isCustomerCourier && quickMessages.length === 0 && (
                        <p className="text-[10px] text-muted-foreground font-bold mb-2 uppercase tracking-wider">
                            Use as mensagens rápidas acima quando disponíveis.
                        </p>
                    )}
                    <div className="flex gap-2">
                        <Input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                            placeholder={isCustomerCourier ? "Apenas mensagens rápidas" : "Escreva sua mensagem..."}
                            className="h-12 rounded-xl bg-card border-transparent focus:border-primary transition-all font-bold"
                            disabled={isCustomerCourier}
                        />
                        {canWriteFree && (
                            <Button
                                onClick={handleSend}
                                disabled={sending}
                                className="h-12 w-12 rounded-xl bg-primary hover:bg-primary/90 p-0 shadow-lg shadow-primary/20"
                            >
                                {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 text-white" />}
                            </Button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
