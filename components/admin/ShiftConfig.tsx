"use client";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Clock, Calendar, Save, Plus, Trash2 } from "lucide-react";
import { useAuthStore } from "@/lib/store";

interface Shift {
    id?: string;
    name: string;
    startTime: string;
    endTime: string;
}

interface OperatingDay {
    dayOfWeek: number;
    enabled: boolean;
}

export function ShiftConfig({ restaurantId }: { restaurantId: string }) {
    const { accessToken } = useAuthStore();
    const [days, setDays] = useState<OperatingDay[]>([]);
    const [shifts, setShifts] = useState<Shift[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const DAYS_MAP = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

    useEffect(() => {
        if (!restaurantId) return;

        // Fetch config
        fetch(`/api/restaurant/${restaurantId}/config`)
            .then(res => res.json())
            .then(data => {
                if (data.operatingDays) {
                    // Merge with defaults to ensure all 7 days exist in UI
                    const mergedDays = Array.from({ length: 7 }).map((_, i) => {
                        const existing = data.operatingDays.find((d: OperatingDay) => d.dayOfWeek === i);
                        return { dayOfWeek: i, enabled: existing ? existing.enabled : true };
                    });
                    setDays(mergedDays);
                } else {
                    setDays(Array.from({ length: 7 }).map((_, i) => ({ dayOfWeek: i, enabled: true })));
                }

                if (data.shifts) setShifts(data.shifts);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, [restaurantId]);

    const handleSave = async () => {
        if (!accessToken) {
            alert("Acesso não autorizado. Por favor, faça login novamente.");
            return;
        }

        setSaving(true);
        try {
            const res = await fetch(`/api/restaurant/${restaurantId}/config`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`
                },
                body: JSON.stringify({ operatingDays: days, shifts }),
            });
            if (res.ok) {
                alert("Configurações salvas!");
            } else {
                const data = await res.json();
                alert(`Erro ao salvar: ${data.error || "Erro desconhecido"}`);
            }
        } catch (e) {
            console.error("Erro ao salvar:", e);
            alert("Erro ao salvar");
        } finally {
            setSaving(false);
        }
    };

    const addShift = () => {
        setShifts([...shifts, { name: "", startTime: "11:00", endTime: "14:00" }]);
    };

    const updateShift = (index: number, field: keyof Shift, value: string) => {
        const newShifts = [...shifts];
        newShifts[index] = { ...newShifts[index], [field]: value };
        setShifts(newShifts);
    };

    const removeShift = (index: number) => {
        setShifts(shifts.filter((_, i) => i !== index));
    };

    const toggleDay = (index: number) => {
        const newDays = [...days];
        newDays[index] = { ...newDays[index], enabled: !newDays[index].enabled };
        setDays(newDays);
    }

    if (loading) return <div className="p-8 text-center"><Clock className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" /> <p className="font-bold">Carregando horários...</p></div>;

    return (
        <div className="space-y-6">
            <Card className="bg-card border-none shadow-2xl shadow-black/5 rounded-[40px] overflow-hidden">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Calendar className="w-5 h-5" /> Dias de Funcionamento</CardTitle>
                    <CardDescription>Selecione os dias que sua loja abre.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {days.map((day, idx) => (
                            <div
                                key={idx}
                                className={`p-4 rounded-2xl cursor-pointer border-2 transition-all select-none flex flex-col items-center justify-center text-center gap-2
                                    ${day.enabled ? 'border-primary bg-primary/10' : 'border-transparent bg-muted opacity-60'}`}
                                onClick={() => toggleDay(idx)}
                            >
                                <span className="font-bold text-lg">{DAYS_MAP[day.dayOfWeek]}</span>
                                <div className={`text-xs font-black uppercase tracking-widest px-2 py-1 rounded-full ${day.enabled ? 'bg-primary text-primary-foreground' : 'bg-muted-foreground/20 text-muted-foreground'}`}>
                                    {day.enabled ? "Aberto" : "Fechado"}
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <Card className="bg-card border-none shadow-2xl shadow-black/5 rounded-[40px] overflow-hidden">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Clock className="w-5 h-5" /> Turnos (Almoço / Jantar)</CardTitle>
                    <CardDescription>Defina os horários de funcionamento específicos.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {shifts.map((shift, idx) => (
                        <div key={idx} className="flex flex-col md:flex-row gap-4 items-end bg-muted/50 p-4 rounded-3xl border border-border">
                            <div className="flex-1 space-y-2 w-full">
                                <label className="text-xs font-black uppercase ml-1">Nome do Turno</label>
                                <Input
                                    value={shift.name}
                                    onChange={e => updateShift(idx, 'name', e.target.value)}
                                    placeholder="Ex: Almoço"
                                    className="bg-card"
                                />
                            </div>
                            <div className="w-full md:w-32 space-y-2">
                                <label className="text-xs font-black uppercase ml-1">Início</label>
                                <Input
                                    type="time"
                                    value={shift.startTime}
                                    onChange={e => updateShift(idx, 'startTime', e.target.value)}
                                    className="bg-card"
                                />
                            </div>
                            <div className="w-full md:w-32 space-y-2">
                                <label className="text-xs font-black uppercase ml-1">Fim</label>
                                <Input
                                    type="time"
                                    value={shift.endTime}
                                    onChange={e => updateShift(idx, 'endTime', e.target.value)}
                                    className="bg-card"
                                />
                            </div>
                            <Button variant="destructive" size="icon" onClick={() => removeShift(idx)} className="mb-1 rounded-xl shrink-0">
                                <Trash2 className="w-5 h-5" />
                            </Button>
                        </div>
                    ))}
                    <Button onClick={addShift} variant="outline" className="w-full h-12 rounded-2xl border-2 border-dashed border-primary/30 bg-transparent text-primary hover:bg-primary/5">
                        <Plus className="w-5 h-5 mr-2" /> Adicionar Turno
                    </Button>
                </CardContent>
            </Card>

            <div className="flex justify-end">
                <Button onClick={handleSave} disabled={saving} className="h-16 px-10 rounded-[28px] text-lg font-black shadow-xl shadow-primary/20">
                    <Save className="w-6 h-6 mr-2" /> {saving ? "Salvando..." : "Salvar Configurações"}
                </Button>
            </div>
        </div>
    );
}
