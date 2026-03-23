/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import { QrCode, CreditCard, RotateCw, ShieldCheck, Ban, Ticket as TicketIcon } from 'lucide-react';

interface TicketItemProps {
  ticket: {
    event: any;
    mint: any;
    isUsed: boolean;
    pricePaid: any;
    publicKey: any;
  };
}

const TicketItem: React.FC<TicketItemProps> = ({ ticket }) => {
  const [showQR, setShowQR] = useState(false);
  const mintStr = ticket.mint.toBase58();
  const pricePaidSol = (Number(ticket.pricePaid) / 1e9).toFixed(2);

  return (
    <div className="glass-card overflow-hidden group">
      <div className={`h-24 flex items-center justify-center relative overflow-hidden ${ticket.isUsed ? 'bg-zinc-800/10 grayscale' : 'bg-gradient-to-r from-purple-500/10 to-blue-500/10'}`}>
         <div className="text-center p-4">
            <h4 className="text-sm font-bold text-white tracking-tight">Ticket de evento</h4>
            <p className="text-[10px] text-zinc-500 mt-1 font-mono italic tracking-tight">{mintStr.slice(0, 10)}...{mintStr.slice(-4)}</p>
         </div>
         {ticket.isUsed && (
            <div className="absolute -rotate-12 px-4 py-1 bg-black border border-white/10 rounded-md text-[10px] font-bold text-zinc-500 top-8 shadow-xl">
               Utilizado
            </div>
         )}
      </div>

      <div className="p-5 space-y-4">
        <div className="flex justify-between items-end">
            <div>
              <p className="text-[10px] font-bold text-zinc-500 italic">Pagado</p>
              <p className="text-lg font-bold text-white">{pricePaidSol} SOL</p>
            </div>
            <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md border ${ticket.isUsed ? 'bg-black border-zinc-700' : 'bg-emerald-500/10 border-emerald-500/30'}`}>
                {ticket.isUsed ? <Ban className="w-3 h-3 text-zinc-500" /> : <ShieldCheck className="w-3 h-3 text-emerald-400" />}
                <span className={`text-[10px] font-bold ${ticket.isUsed ? 'text-zinc-500' : 'text-emerald-400'}`}>
                  {ticket.isUsed ? 'Inválido' : 'Activo'}
                </span>
            </div>
        </div>

        {!ticket.isUsed ? (
          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={() => setShowQR(!showQR)}
              className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs font-bold hover:bg-white/10 transition-all flex flex-col items-center gap-2 group"
            >
              <QrCode className="w-5 h-5 text-purple-400 group-hover:scale-110 transition-transform" />
              Pase de acceso
            </button>
            <button 
              className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs font-bold hover:bg-white/10 transition-all flex flex-col items-center gap-2 group"
            >
              <RotateCw className="w-5 h-5 text-blue-400 group-hover:rotate-45 transition-transform" />
              Mercado secundario
            </button>
          </div>
        ) : (
          <button className="w-full py-2.5 bg-black text-zinc-700 rounded-xl text-xs font-bold tracking-tight border border-zinc-800 flex items-center justify-center gap-2 cursor-not-allowed italic">
            Ticket inactivo
          </button>
        )}

        {showQR && (
          <div className="bg-white p-4 rounded-xl flex flex-col items-center justify-center animate-in fade-in zoom-in duration-300">
             <div className="w-32 h-32 bg-zinc-100 rounded-lg flex items-center justify-center border-4 border-zinc-100 shadow-inner">
                <QrCode className="w-24 h-24 text-black" />
             </div>
             <p className="text-[10px] text-zinc-400 mt-2 font-bold tracking-tight">Escanear en la puerta</p>
          </div>
        )}

        <div className="flex items-center justify-center gap-1.5 pt-2 border-t border-white/5 opacity-40 hover:opacity-100 transition-opacity">
            <CreditCard className="w-3 h-3" />
            <span className="text-[9px] font-bold opacity-60">Ver en Solscan</span>
        </div>
      </div>
    </div>
  );
};

interface TicketVaultProps {
  tickets: any[];
}

export const TicketVault: React.FC<TicketVaultProps> = ({ tickets }) => {
    return (
        <div className="p-8 max-w-6xl mx-auto mt-12 bg-black/10 rounded-3xl min-h-[500px]">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                <div className="space-y-1">
                    <h2 className="text-4xl font-bold text-white flex items-center gap-4 italic tracking-tight">
                        Mi bóveda de tickets 
                        <span className="text-lg px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full border border-purple-500/30">
                            {tickets.length} NFTs
                        </span>
                    </h2>
                    <p className="text-zinc-500 max-w-lg font-sans">
                        Administra tus tickets verificados on-chain. Puedes entrar al evento o revenderlos respetando la economía justa del protocolo.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {tickets.map((t, idx) => (
                    <TicketItem key={idx} ticket={t} />
                ))}
            </div>

            {tickets.length === 0 && (
                <div className="py-32 flex flex-col items-center justify-center space-y-4 border-2 border-dashed border-white/5 rounded-3xl">
                    <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center border border-white/10 opacity-30">
                        <TicketIcon className="w-8 h-8 text-white" />
                    </div>
                    <p className="text-zinc-500 font-bold text-sm italic opacity-50">Tu bóveda está vacía ahora mismo</p>
                </div>
            )}
        </div>
    );
};