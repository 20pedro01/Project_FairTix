/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import { Ticket, ShieldCheck, ShoppingCart, Info, TrendingUp, Users, Loader2 } from 'lucide-react';
import { useFairTix } from './useFairTix';
import { PublicKey } from '@solana/web3.js';

interface EventCardProps {
    name?: string;
    description?: string;
    price?: number;
    maxPrice?: number;
    totalSold?: number;
    maxTickets?: number;
    royalty?: number;
    eventPda?: any; // Recibimos el PDA del evento
    organizer?: any; // Recibimos el PubKey del organizador
}

export const EventCard: React.FC<EventCardProps> = (props) => {
    const { name = "Evento sin nombre", price = 0, maxPrice = 0, totalSold = 0, maxTickets = 0, royalty = 0, eventPda } = props;
    const { buyTicket } = useFairTix();
    const [isBuying, setIsBuying] = useState(false);

    const handleBuy = async () => {
        if (!eventPda) return;
        setIsBuying(true);
        try {
            const pda = typeof eventPda === 'string' ? new PublicKey(eventPda) : eventPda;
            await buyTicket(pda, props);
            alert("¡Ticket NFT comprado con éxito! Revise su wallet.");
        } catch (err: any) {
            console.error(err);
            alert("Error al comprar ticket: " + (err.message || "Error on-chain"));
        } finally {
            setIsBuying(false);
        }
    };

    const safePrice = price || 0;
    const safeMaxPrice = maxPrice || 0;
    const progress = maxTickets > 0 ? (totalSold / maxTickets) * 100 : 0;

    return (
        <div className="glass-card group hover:scale-[1.02] transition-all duration-500 overflow-hidden border border-white/5 hover:border-emerald-500/30">
            <div className="p-6 space-y-4">
                <div className="flex justify-between items-start">
                    <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center group-hover:bg-emerald-500/10 transition-colors">
                        <Ticket className="text-emerald-400 w-6 h-6" />
                    </div>
                    <div className="bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                        <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3" /> Verificado
                        </span>
                    </div>
                </div>

                <div>
                    <h3 className="text-xl font-black text-white group-hover:text-emerald-400 transition-colors truncate">{name}</h3>
                    <div className="flex items-center gap-2 mt-2">
                        <span className="text-[10px] font-bold text-zinc-500">{totalSold || 0} personas ya tienen su ticket</span>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 py-4 border-y border-white/5">
                    <div className="space-y-1">
                        <p className="text-[10px] font-bold text-zinc-600 uppercase flex items-center gap-1"><TrendingUp className="w-3 h-3" /> Reventa Máx</p>
                        <p className="text-sm font-black text-zinc-300">{safeMaxPrice.toFixed(4)} SOL</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-[10px] font-bold text-zinc-600 uppercase flex items-center gap-1"><Info className="w-3 h-3" /> Royalty</p>
                        <p className="text-sm font-black text-emerald-400/80">{royalty || 0}%</p>
                    </div>
                </div>

                <div className="space-y-2">
                    <div className="flex justify-between text-[10px] font-black uppercase">
                        <span className="text-zinc-500 flex items-center gap-1"><Users className="w-3 h-3" /> Disponibilidad</span>
                        <span className={progress > 90 ? 'text-rose-500' : 'text-emerald-400'}>{totalSold || 0} / {maxTickets || 0}</span>
                    </div>
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-1000" style={{ width: `${Math.min(progress, 100)}%` }} />
                    </div>
                </div>

                <div className="flex justify-between items-end pt-2">
                    <div className="space-y-1">
                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Precio entrada</p>
                        <p className="text-2xl font-black text-white tracking-tighter">
                            {safePrice.toFixed(4)} <span className="text-xs text-zinc-500 font-bold">SOL</span>
                        </p>
                    </div>
                    <button 
                        disabled={isBuying}
                        onClick={handleBuy}
                        className={`bg-white text-black px-6 py-3 rounded-xl font-black text-xs uppercase hover:bg-emerald-400 transition-all active:scale-95 flex items-center gap-2 ${isBuying ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {isBuying ? <Loader2 className="w-4 h-4 animate-spin text-black" /> : <ShoppingCart className="w-4 h-4" />}
                        {isBuying ? 'Procesando...' : 'Comprar'}
                    </button>
                </div>
            </div>
        </div>
    );
};

