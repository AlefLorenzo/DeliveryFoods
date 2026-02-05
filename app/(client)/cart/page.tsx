"use client";
import { useState } from "react";
import { useCartStore, useAuthStore, useNotificationStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Trash2, Plus, ArrowRight, CreditCard, QrCode, Banknote, ShieldCheck, Loader2, MapPin, Ticket, Tag, ShoppingBag as ShoppingBagIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import Link from "next/link";

const CartPage = () => {
    const router = useRouter();
    const cart = useCartStore();
    const { user, coupons, accessToken } = useAuthStore();
    const { addNotification } = useNotificationStore();

    const [step, setStep] = useState<'cart' | 'payment'>('cart');
    const [paymentMethod, setPaymentMethod] = useState<string>('credit');
    const [isProcessing, setIsProcessing] = useState(false);
    const [selectedCoupon, setSelectedCoupon] = useState<{ code: string, discount: number } | null>(null);
    const [needsChange, setNeedsChange] = useState(false);
    const [changeFor, setChangeFor] = useState("");

    const subtotal = cart.totalPrice();
    const deliveryFee = cart.restaurant?.deliveryFee || 0;
    const discount = selectedCoupon ? selectedCoupon.discount : 0;
    const total = Math.max(0, subtotal + deliveryFee - discount);

    const handleNextStep = () => {
        if (cart.items.length === 0) return;
        if (!user?.address) {
            addNotification("Cadastre seu endereço no perfil para continuar.", "error");
            return;
        }
        setStep('payment');
    };

    const handlePlaceOrder = async () => {
        if (!accessToken) {
            addNotification("Por favor, faça login para realizar o pedido", "error");
            return;
        }

        setIsProcessing(true);
        try {
            // Map payment methods to API enum
            const methodMap: Record<string, 'STRIPE' | 'PIX' | 'CARD_ON_DELIVERY'> = {
                'credit': 'STRIPE',
                'pix': 'PIX',
                'cash': 'CARD_ON_DELIVERY'
            };

            const payload = {
                restaurantId: cart.restaurant?.id,
                items: cart.items.map(item => ({
                    productId: item.id,
                    quantity: item.quantity
                })),
                paymentMethod: methodMap[paymentMethod] || 'CARD_ON_DELIVERY',
                discount,
                needsChange: paymentMethod === 'cash' ? needsChange : false,
                changeFor: (paymentMethod === 'cash' && needsChange) ? parseFloat(changeFor) : undefined
            };

            const res = await fetch('/api/orders', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Falha ao criar pedido");
            }

            cart.clearCart();
            addNotification("Seu pedido foi enviado para a cozinha! 🍕", "success");
            router.push("/orders");
        } catch (err) {
            console.error("Erro no checkout:", err);
            const message = err instanceof Error ? err.message : "Erro ao processar checkout";
            addNotification(message, "error");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleApplyCoupon = (code: string) => {
        const coupon = coupons.find(c => c.code === code);
        if (coupon) {
            setSelectedCoupon(coupon);
            addNotification(`Cupom ${code} aplicado com sucesso!`, "success");
        } else {
            addNotification("Código do cupom inválido", "error");
        }
    };

    if (cart.items.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 animate-in fade-in zoom-in duration-300 transition-colors">
                <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-6">
                    <ShoppingBagIcon className="w-12 h-12 text-muted-foreground/50" />
                </div>
                <h2 className="text-2xl font-black mb-2 text-foreground">Seu carrinho está vazio</h2>
                <p className="text-muted-foreground font-bold mb-8">Parece que você ainda não adicionou nada delicioso.</p>
                <Link href="/home">
                    <Button className="rounded-full px-8 h-12 font-black">Começar a Comprar</Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700 pb-20">
            <div className="flex items-center gap-4 mb-2">
                <div className={`h-2 flex-1 rounded-full transition-all duration-700 ${step === 'cart' || step === 'payment' ? 'bg-primary shadow-[0_0_15px_rgba(var(--primary),0.5)]' : 'bg-secondary'}`} />
                <div className={`h-2 flex-1 rounded-full transition-all duration-700 ${step === 'payment' ? 'bg-primary shadow-[0_0_15px_rgba(var(--primary),0.5)]' : 'bg-secondary'}`} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
                <div className="lg:col-span-2 space-y-8">
                    {step === 'cart' ? (
                        <div className="space-y-6 animate-in slide-in-from-left duration-500">
                            <h1 className="text-4xl font-black text-foreground tracking-tighter">Seu Pedido</h1>
                            <div className="space-y-4">
                                {cart.items.map((item) => (
                                    <Card key={item.id} className="flex p-5 gap-6 overflow-hidden group border-none shadow-xl bg-card/40 backdrop-blur-md rounded-[32px] hover:scale-[1.01] transition-all">
                                        <div className="w-28 h-28 rounded-[24px] overflow-hidden">
                                            <img src={item.image} alt={item.name} className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-500" />
                                        </div>
                                        <div className="flex-1 flex flex-col justify-between py-1">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h3 className="font-black text-xl tracking-tight">{item.name}</h3>
                                                    <p className="text-sm text-muted-foreground font-medium line-clamp-1">{item.description}</p>
                                                </div>
                                                <span className="font-black text-lg text-primary">R${(item.price * item.quantity).toFixed(2)}</span>
                                            </div>
                                            <div className="flex items-center justify-between mt-4">
                                                <div className="flex items-center bg-secondary p-1 rounded-2xl">
                                                    <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-background hover:text-red-500 transition-all" onClick={() => cart.updateQuantity(item.id, item.quantity - 1)}>
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                    <span className="font-black w-8 text-center text-lg">{item.quantity}</span>
                                                    <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-background transition-all" onClick={() => cart.updateQuantity(item.id, item.quantity + 1)}>
                                                        <Plus className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </Card>
                                ))}
                            </div>

                            {/* Endereço */}
                            <Card className="p-8 border-none shadow-xl bg-card/40 backdrop-blur-md rounded-[32px] ring-2 ring-primary/10">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-black flex items-center gap-3 text-lg">
                                        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                                            <MapPin className="w-5 h-5 text-primary" />
                                        </div>
                                        Endereço de Entrega
                                    </h3>
                                    <Link href="/profile">
                                        <Button variant="ghost" className="text-primary font-black hover:bg-primary/5 rounded-xl">
                                            {user?.address ? "Alterar" : "Cadastrar"}
                                        </Button>
                                    </Link>
                                </div>
                                <div className="pl-13">
                                    {user?.address ? (
                                        <>
                                            <p className="font-black text-foreground">{user.address.street}, {user.address.number}</p>
                                            <p className="text-sm font-bold text-muted-foreground">{user.address.neighborhood} • {user.address.city}</p>
                                        </>
                                    ) : (
                                        <p className="text-muted-foreground font-bold">Adicione seu endereço no perfil para continuar.</p>
                                    )}
                                </div>
                            </Card>
                        </div>
                    ) : (
                        <div className="space-y-8 animate-in slide-in-from-right duration-500">
                            <h1 className="text-4xl font-black text-foreground tracking-tighter">Pagamento</h1>

                            <Card className="p-8 border-none shadow-xl bg-card/40 backdrop-blur-md rounded-[32px]">
                                <h2 className="font-black text-xl mb-6 tracking-tight flex items-center gap-3">
                                    <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                                        <CreditCard className="w-5 h-5 text-primary" />
                                    </div>
                                    Método de Pagamento
                                </h2>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {[
                                        { id: 'credit', label: 'Cartão', icon: CreditCard },
                                        { id: 'pix', label: 'PIX', icon: QrCode },
                                        { id: 'cash', label: 'Dinheiro', icon: Banknote },
                                    ].map((method) => (
                                        <div
                                            key={method.id}
                                            onClick={() => setPaymentMethod(method.id)}
                                            className={`flex flex-col items-center justify-center p-6 border-2 rounded-[28px] cursor-pointer transition-all duration-300 ${paymentMethod === method.id ? 'border-primary bg-primary/5 scale-105 shadow-xl shadow-primary/10' : 'border-border hover:border-primary/20 opacity-60'}`}
                                        >
                                            <method.icon className={`w-8 h-8 mb-3 ${paymentMethod === method.id ? 'text-primary' : 'text-muted-foreground'}`} />
                                            <p className="font-black text-sm uppercase tracking-widest">{method.label}</p>
                                        </div>
                                    ))}
                                </div>

                                {paymentMethod === 'cash' && (
                                    <div className="mt-8 p-6 bg-primary/5 rounded-[24px] border border-primary/10 animate-in zoom-in-95 duration-300">
                                        <div className="flex items-center justify-between mb-4">
                                            <label className="font-black text-sm uppercase tracking-tighter cursor-pointer select-none" htmlFor="needs-change">
                                                Precisa de troco?
                                            </label>
                                            <input
                                                id="needs-change"
                                                type="checkbox"
                                                className="w-6 h-6 rounded-md accent-primary cursor-pointer"
                                                checked={needsChange}
                                                onChange={(e) => setNeedsChange(e.target.checked)}
                                            />
                                        </div>
                                        {needsChange && (
                                            <div className="space-y-3 animate-in slide-in-from-top-2 duration-300">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Troco para quanto?</label>
                                                <div className="relative">
                                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-primary">R$</span>
                                                    <Input
                                                        type="number"
                                                        placeholder="Ex: 100.00"
                                                        value={changeFor}
                                                        onChange={(e) => setChangeFor(e.target.value)}
                                                        className="h-14 pl-12 rounded-xl bg-card border-none font-black text-xl shadow-inner focus:ring-2 focus:ring-primary"
                                                    />
                                                </div>
                                                <p className="text-[10px] font-bold text-primary/60 italic ml-1">
                                                    Troco estimado: R${Math.max(0, (parseFloat(changeFor) || 0) - total).toFixed(2)}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </Card>

                            <div className="flex items-center justify-center gap-3 text-muted-foreground text-xs font-black uppercase tracking-[0.2em] py-4 opacity-50">
                                <ShieldCheck className="w-5 h-5" /> Pagamento 100% Seguro
                            </div>
                        </div>
                    )}
                </div>

                {/* Resumo lateral Premium */}
                <div className="sticky top-24 space-y-6">
                    <Card className={`p-8 border-none shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] dark:shadow-none dark:bg-slate-900/60 backdrop-blur-xl rounded-[40px] transition-all duration-500 ${isProcessing ? 'blur-[2px] pointer-events-none' : ''}`}>
                        <h2 className="text-2xl font-black mb-8 tracking-tighter">Resumo Financeiro</h2>

                        <div className="space-y-4 mb-8">
                            <div className="flex justify-between font-bold text-muted-foreground text-sm">
                                <span>Subtotal</span>
                                <span>R${subtotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between font-bold text-muted-foreground text-sm">
                                <span>Taxa de Entrega</span>
                                <span className="text-green-500 font-black">GRÁTIS</span>
                            </div>
                            {selectedCoupon && (
                                <div className="flex justify-between font-bold text-green-500 text-sm bg-green-500/10 p-2 rounded-lg border border-green-500/20">
                                    <span className="flex items-center gap-1.5"><Tag className="w-3 h-3" /> Cupom ({selectedCoupon.code})</span>
                                    <span>- R${discount.toFixed(2)}</span>
                                </div>
                            )}
                            <div className="border-t border-border pt-6 mt-6">
                                <div className="flex justify-between items-baseline">
                                    <span className="font-black text-lg text-foreground">TOTAL</span>
                                    <span className="text-4xl font-black text-primary tracking-tighter">R${total.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>

                        {step === 'cart' && (
                            <div className="space-y-6">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Tem um cupom?</label>
                                    <div className="flex gap-2">
                                        <Input
                                            placeholder="Ex: PRIME10"
                                            className="rounded-xl h-12 bg-muted border-transparent font-bold uppercase transition-colors"
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') handleApplyCoupon((e.target as HTMLInputElement).value);
                                            }}
                                        />
                                        <Button variant="outline" className="rounded-xl h-12 px-4 border-2 font-black">Ok</Button>
                                    </div>
                                </div>

                                <Button className="w-full h-16 text-xl font-black rounded-[24px] shadow-2xl shadow-primary/30 hover:scale-[1.03] active:scale-95 transition-all group" onClick={handleNextStep}>
                                    Check-out <ArrowRight className="w-6 h-6 ml-2 group-hover:translate-x-1 transition-all" />
                                </Button>
                            </div>
                        )}

                        {step === 'payment' && (
                            <div className="space-y-4">
                                <Button
                                    className={`w-full h-16 text-xl font-black rounded-[24px] transition-all duration-500 shadow-2xl ${isProcessing ? 'bg-orange-500' : 'bg-green-600 hover:bg-green-700 shadow-green-600/20'}`}
                                    onClick={handlePlaceOrder}
                                    disabled={isProcessing}
                                >
                                    {isProcessing ? (
                                        <span className="flex items-center gap-2">
                                            <Loader2 className="w-6 h-6 animate-spin" /> Processando...
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-3 italic tracking-tighter">
                                            PAGAR AGORA <ShieldCheck className="w-6 h-6 not-italic" />
                                        </span>
                                    )}
                                </Button>
                                <Button
                                    variant="ghost"
                                    className="w-full text-slate-400 h-10 font-bold hover:bg-transparent"
                                    onClick={() => setStep('cart')}
                                    disabled={isProcessing}
                                >
                                    Alterar Pedido
                                </Button>
                            </div>
                        )}
                    </Card>

                    <div className="p-4 bg-yellow-500/10 border-2 border-dashed border-yellow-500/20 rounded-[32px] flex items-center gap-4">
                        <div className="w-12 h-12 bg-yellow-500/20 rounded-2xl flex items-center justify-center">
                            <Ticket className="w-6 h-6 text-yellow-600" />
                        </div>
                        <p className="text-[10px] font-black text-yellow-700 dark:text-yellow-500 uppercase leading-snug">
                            Você tem cupons ativos.<br />Use &apos;PRIMEIRO10&apos; para desconto.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default CartPage;

function ShoppingBagIcon({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" /><path d="M3 6h18" /><path d="M16 10a4 4 0 0 1-8 0" /></svg>
    );
}
