/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useCallback, useRef } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useFairTix } from "./useFairTix";
import { EventCard } from "./EventCard";
import { CreateEventForm } from "./CreateEventForm";
import { TicketVault } from "./TicketVault";
import { LayoutGrid, Settings, ShieldCheck, Ticket, Loader2 } from "lucide-react";

export const FairTixApp: React.FC = () => {
    const { publicKey, connected } = useWallet();
    const walletAddress = publicKey?.toBase58();

    const [view, setView] = useState<"market" | "vault" | "admin">("market");
    const [isLoading, setIsLoading] = useState(false);
    
    const { program, getEvents, getMyTickets } = useFairTix(); // IMPORTAMOS getMyTickets
    const [events, setEvents] = useState<any[]>([]);
    const [tickets, setTickets] = useState<any[]>([]);
    const isFetching = useRef(false);

    const loadOnChainData = useCallback(async () => {
        if (!program || isFetching.current) return;
        isFetching.current = true;
        setIsLoading(true);
        try {
            if (view === 'market') {
                const allEvents = await getEvents();
                setEvents(allEvents || []);
            } else if (view === 'vault') {
                // --- FIX CRÍTICO: CARGAMOS LOS TICKETS REALES --- 🛠️
                // Eliminamos el setTickets([]) que borraba todo.
                const myTickets = await getMyTickets();
                console.log("🔥 APP SYNC: Tickets cargados en la bóveda:", myTickets.length);
                setTickets(myTickets || []);
            }
        } catch (err) {
            console.error("Error on-chain:", err);
        } finally {
            setIsLoading(false);
            isFetching.current = false;
        }
    }, [view, program, getEvents, getMyTickets]);

    useEffect(() => {
        loadOnChainData();
    }, [loadOnChainData, walletAddress]);

    return (
        <div className="min-h-screen text-white flex flex-col font-sans bg-[#09090b]">
            <nav className="glass-card mt-4 mx-4 px-8 py-4 flex items-center justify-between sticky top-4 z-50">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-tr from-purple-500 to-emerald-400 rounded-xl flex items-center justify-center rotate-6 shadow-lg shadow-purple-500/20">
                        <Ticket className="text-white w-6 h-6 -rotate-12" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-400 tracking-tight">FairTix</h1>
                        <p className="text-[9px] font-bold text-emerald-400">Protocolo de reventa justa</p>
                    </div>
                </div>

                <div className="flex items-center gap-1 bg-black/40 p-1 rounded-2xl border border-white/5">
                    <button onClick={() => setView('market')} className={`px-5 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${view === 'market' ? 'bg-white/10 text-white shadow-xl shadow-white/5' : 'text-zinc-500 hover:text-zinc-300'}`}>
                        <LayoutGrid className="w-4 h-4" /> Marketplace
                    </button>
                    <button onClick={() => setView('vault')} className={`px-5 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${view === 'vault' ? 'bg-white/10 text-white shadow-xl shadow-white/5' : 'text-zinc-500 hover:text-zinc-300'}`}>
                        <ShieldCheck className="w-4 h-4" /> Mis tickets
                    </button>
                    <button onClick={() => setView('admin')} className={`px-5 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${view === 'admin' ? 'bg-white/10 text-white shadow-xl shadow-white/5' : 'text-zinc-500 hover:text-zinc-300'}`}>
                        <Settings className="w-4 h-4" /> Admin
                    </button>
                </div>

                <div className="w-[120px] hidden md:block opacity-0 pointer-events-none"></div>
            </nav>

            <main className="flex-grow p-4 md:p-8">
                {isLoading && (view === 'market' ? events.length === 0 : tickets.length === 0) ? (
                    <div className="flex flex-col items-center justify-center py-32 space-y-4">
                        <Loader2 className="w-12 h-12 text-purple-400 animate-spin" />
                        <p className="text-xs font-bold text-zinc-500">Sincronizando con Solana...</p>
                    </div>
                ) : (
                    <>
                        {view === 'market' && (
                            <div className="space-y-12">
                                <div className="text-center py-12 space-y-4">
                                    <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight">Próximos eventos NFT</h2>
                                    <p className="max-w-xl mx-auto text-zinc-500 font-medium">Busca eventos y compra tickets verificados en Solana.</p>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 px-4">
                                    {events.length > 0 ? events.map((event, idx) => (
                                        <EventCard 
                                            key={idx} 
                                            name={event.name} 
                                            price={(event.basePrice || event.base_price) / 1e9}
                                            maxPrice={(event.secondaryMaxPrice || event.max_resale_price) / 1e9}
                                            totalSold={event.ticketsSold || event.tickets_sold}
                                            maxTickets={event.maxTickets || event.max_tickets}
                                            royalty={event.royaltyPercent || event.royalty_percent}
                                            eventPda={event.publicKey}
                                            organizer={event.organizer || event.organizer_key || event.creator}
                                        />
                                    )) : (
                                        <div className="col-span-3 text-center py-24 border-2 border-dashed border-white/5 rounded-3xl opacity-50 bg-white/5">
                                            <p className="text-zinc-500 font-bold mb-4">No hay eventos activos ahora mismo.</p>
                                            <button onClick={loadOnChainData} className="text-xs text-emerald-400 uppercase font-black hover:underline px-4 py-2 bg-emerald-500/10 rounded-lg">Cargar marketplace</button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                        {view === 'vault' && <TicketVault tickets={tickets} />}
                        {view === 'admin' && <CreateEventForm />}
                    </>
                )}
            </main>

            <footer className="p-8 border-t border-white/5 opacity-50 flex flex-col md:flex-row items-center justify-between gap-4">
                <p className="text-xs font-bold text-zinc-500 italic">© 2026 FairTix - Protocolo de tickets NFT</p>
                <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/10">
                    <div className={`w-2 h-2 rounded-full animate-pulse shadow-lg ${connected ? 'bg-emerald-500 shadow-emerald-500/50' : 'bg-amber-500 shadow-amber-500/50'}`} />
                    <span className="text-[9px] font-bold">
                        {connected ? 'SOLANA VIVA' : 'ESPERANDO CONEXIÓN'}
                    </span>
                </div>
            </footer>
        </div>
    );
};