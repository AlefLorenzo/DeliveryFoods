"use client";
import { useNotificationStore } from "@/lib/store";
import { CheckCircle2, AlertCircle, X, Info } from "lucide-react";

export function ToastContainer() {
    const { notifications, removeNotification } = useNotificationStore();

    return (
        <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
            {notifications.map((n) => (
                <div
                    key={n.id}
                    className={`pointer-events-auto flex items-center gap-4 px-8 py-5 rounded-[40px] shadow-2xl animate-in slide-in-from-right duration-500 border-2 backdrop-blur-md ${n.type === 'success' ? 'bg-green-500/90 border-green-400/30 text-white shadow-green-500/20' :
                        n.type === 'error' ? 'bg-red-500/90 border-red-400/30 text-white shadow-red-500/20' :
                            'bg-primary/90 border-primary/30 text-white shadow-primary/20'
                        }`}
                >
                    <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center shrink-0">
                        {n.type === 'success' && <CheckCircle2 className="w-6 h-6" />}
                        {n.type === 'error' && <AlertCircle className="w-6 h-6" />}
                        {n.type === 'info' && <Info className="w-6 h-6" />}
                    </div>

                    <span className="font-black text-base tracking-tight">{n.message}</span>

                    <button
                        onClick={() => removeNotification(n.id)}
                        className="ml-4 p-2 hover:bg-white/20 rounded-2xl transition-all active:scale-90"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
            ))}
        </div>
    );
}
