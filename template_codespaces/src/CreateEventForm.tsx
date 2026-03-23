/* eslint-disable */
// @ts-nocheck
import React, { useState } from 'react';
import { useFairTix } from './useFairTix';
import { Ticket, DollarSign, Users, Award, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';

export const CreateEventForm: React.FC = () => {
    const { createEvent } = useFairTix();
    const [name, setName] = useState('');
    const [basePrice, setBasePrice] = useState(0.1);
    const [maxPrice, setMaxPrice] = useState(0.5);
    const [royalty, setRoyalty] = useState(5);
    const [maxTickets, setMaxTickets] = useState(100);
    const [resaleCooldown, setResaleCooldown] = useState(1); // Por defecto 1 día
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setStatus('idle');
        try {
            // Convertimos días a segundos para el contrato (60*60*24 = 86400)
            const cooldownSeconds = resaleCooldown * 86400;
            await createEvent(name, basePrice, maxPrice, royalty, maxTickets, cooldownSeconds);
            setStatus('success');
            setTimeout(() => setStatus('idle'), 5000); // 5 segundos de celebración
        } catch (err) {
            console.error("Fallo al crear el evento:", err);
            setStatus('error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-xl mx-auto space-y-8 animate-in slide-in-from-right-12 duration-500">
            <div className="text-center space-y-2">
                <div className="w-16 h-16 bg-gradient-to-tr from-emerald-500 to-emerald-300 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-emerald-500/20">
                    <Award className="text-green-950 w-8 h-8" />
                </div>
                <h3 className="text-3xl font-bold tracking-tight">Crea tu nuevo evento</h3>
                <p className="text-zinc-500 font-medium">Publica tu primer evento asegurado por el protocolo FairTix.</p>
            </div>

            <form onSubmit={handleSubmit} className="glass-card p-8 space-y-6">
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-1 flex items-center gap-1">
                        <Ticket className="w-3 h-3" /> Nombre del Evento
                    </label>
                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Hackathon Solana 2026" className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 px-6 text-sm font-bold focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none transition-all" required />
                </div>

                <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-1 flex items-center gap-1">
                            <DollarSign className="w-3 h-3" /> Precio Base (SOL)
                        </label>
                        <input type="number" step="0.01" value={basePrice} onChange={(e) => setBasePrice(parseFloat(e.target.value))} className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 px-6 text-sm font-black focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none transition-all" required />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-1 flex items-center gap-1">
                            <DollarSign className="w-3 h-3" /> Precio Máx (SOL)
                        </label>
                        <input type="number" step="0.01" value={maxPrice} onChange={(e) => setMaxPrice(parseFloat(e.target.value))} className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 px-6 text-sm font-black focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none transition-all" required />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-1 flex items-center gap-1">
                            Royalty (%)
                        </label>
                        <input type="number" value={royalty} onChange={(e) => setRoyalty(parseInt(e.target.value))} className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 px-6 text-sm font-black focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none transition-all" required />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-1 flex items-center gap-1">
                            <Users className="w-3 h-3" /> Total Tickets
                        </label>
                        <input type="number" value={maxTickets} onChange={(e) => setMaxTickets(parseInt(e.target.value))} className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 px-6 text-sm font-black focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none transition-all" required />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-1 flex items-center gap-1">
                         Cooldown de Reventa (Días)
                    </label>
                    <input type="number" value={resaleCooldown} onChange={(e) => setResaleCooldown(parseInt(e.target.value))} className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 px-6 text-sm font-black focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none transition-all" required />
                    <p className="text-[9px] text-zinc-500 font-medium pl-1">Tiempo que debe esperar un usuario para poder revender su entrada.</p>
                </div>

                {status === 'success' && (
                    <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-3 text-emerald-400">
                        <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                        <p className="text-xs font-bold leading-tight">¡Evento creado con éxito! Phantom ha aprobado tu transacción y ya está en la blockchain de Solana.</p>
                    </div>
                )}

                {status === 'error' && (
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-400">
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        <p className="text-xs font-bold leading-tight">Hubo un error al crear el evento. Revisa tu saldo de SOL de prueba y vuelve a intentarlo.</p>
                    </div>
                )}

                <button 
                    disabled={isSubmitting} 
                    type="submit" 
                    className={`w-full py-5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 active:scale-95 ${isSubmitting ? 'bg-zinc-800' : 'bg-gradient-to-r from-emerald-600 to-emerald-400 shadow-xl shadow-emerald-500/20 hover:brightness-110'}`}
                >
                    {isSubmitting ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Esculpiendo en Solana...
                        </>
                    ) : (
                        "Lanzar Evento"
                    )}
                </button>

                <p className="text-[9px] text-zinc-600 text-center font-bold px-8">Al crear este evento, despliegas un contrato inteligente único e inmutable en Solana.</p>
            </form>
        </div>
    );
};