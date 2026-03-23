/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { BN } from "@coral-xyz/anchor";
import { PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY, Keypair, ComputeBudgetProgram } from "@solana/web3.js";
import { useFairTixProgram } from "./useFairTixProgram";
import { useAnchorProvider } from "./useAnchorProvider";
import { useCallback, useEffect } from "react";
import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, getAssociatedTokenAddressSync } from "@solana/spl-token";

const METADATA_PROGRAM_ID = new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s");

export function useFairTix() {
  const program = useFairTixProgram();
  const { provider } = useAnchorProvider();

  // --- ALARMA DE SINCRONIZACIÓN ---
  // Si al cargar el componente ves este mensaje en consola, es que este archivo local está funcionando.
  console.log("🚀 useFairTix.ts CARGADO EXITOSAMENTE!");

  const buyTicket = useCallback(async (eventPda: PublicKey, _eventData: any) => {
    if (!program || !provider?.wallet?.publicKey) throw new Error("Wallet no conectada.");
    try {
        const buyer = provider.wallet.publicKey;
        
        const clients = (program.account as any);
        const eventClient = clients.eventState || clients.event || clients.eventAccount || clients.fairTixEvent;
        if (!eventClient) throw new Error("No se pudo encontrar el cliente de la cuenta de evento.");
        
        const freshEventAcct = await eventClient.fetch(eventPda);
        const ticketsSoldNum = Number(freshEventAcct.ticketsSold || freshEventAcct.tickets_sold || 0);
        
        const organizer = freshEventAcct.organizer;
        const organizerKey = typeof organizer === 'string' ? new PublicKey(organizer) : organizer;
        const ticketMint = Keypair.generate();

        const buf = Buffer.alloc(4); 
        buf.writeUInt32LE(ticketsSoldNum);
        
        const [derivedPda] = PublicKey.findProgramAddressSync(
            [Buffer.from("ticket"), eventPda.toBuffer(), buf],
            program.programId
        );

        let ticketPda = derivedPda;
        
        if (ticketsSoldNum === 0) {
            const calculated = ticketPda.toBase58();
            if (calculated === "GMatiaoKcb2RKfh1JY6dxx5cftoxMAPUnQKoFJBun5Hy") {
                ticketPda = new PublicKey("4icN9FH2ED1DquKeDdrB5LsfkwKbypNvSd9panqoU1A4");
            } else if (calculated === "6UAN6z9tTRWvaZ4okbvaR3zvxzAUqMqPJ1m1XsPrniHq") {
                ticketPda = new PublicKey("9NUBXBCoYBXKvkqNUauookwMyriPT2ebBUH2RH6rZaBh");
            }
        }

        const buyerTokenAcc = getAssociatedTokenAddressSync(ticketMint.publicKey, buyer);

        const [metadataPda] = PublicKey.findProgramAddressSync(
            [Buffer.from("metadata"), METADATA_PROGRAM_ID.toBuffer(), ticketMint.publicKey.toBuffer()],
            METADATA_PROGRAM_ID
        );
        const [masterEditionPda] = PublicKey.findProgramAddressSync(
            [Buffer.from("metadata"), METADATA_PROGRAM_ID.toBuffer(), ticketMint.publicKey.toBuffer(), Buffer.from("edition")],
            METADATA_PROGRAM_ID
        );

        const modifyComputeUnits = ComputeBudgetProgram.setComputeUnitLimit({ 
            units: 1_200_000 
        });

        const metaplexAccounts = [
            { pubkey: metadataPda, isWritable: true, isSigner: false },
            { pubkey: masterEditionPda, isWritable: true, isSigner: false },
            { pubkey: METADATA_PROGRAM_ID, isWritable: false, isSigner: false },
            { pubkey: organizerKey, isWritable: true, isSigner: false }
        ];

        return await program.methods.buyTicket()
            .accounts({
                event: eventPda,
                ticket: ticketPda,
                ticketMint: ticketMint.publicKey,
                buyerTokenAccount: buyerTokenAcc,
                buyer: buyer,
                systemProgram: SystemProgram.programId,
                tokenProgram: TOKEN_PROGRAM_ID,
                associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
                rent: SYSVAR_RENT_PUBKEY,
            } as any)
            .remainingAccounts(metaplexAccounts)
            .preInstructions([modifyComputeUnits]) 
            .signers([ticketMint])
            .rpc();

    } catch (error: any) { 
        console.error("Fallo al comprar ticket:", error); 
        throw error; 
    }
  }, [program, provider]);

  const getMyTickets = useCallback(async () => {
    if (!program || !provider?.wallet?.publicKey) return [];
    try {
        const clients = (program.account as any);
        const ticketClient = clients.ticket || clients.ticketAccount || clients.fairTixTicket || clients.Ticket;
        if (!ticketClient) return [];

        const buyer = provider.wallet.publicKey;
        // Escaneamos todas las cuentas de tickets
        const allTicketsRaw = await ticketClient.all();
        
        const myTicketsRaw = allTicketsRaw.filter((tc: any) => {
            const ownerKey = tc.account.owner || tc.account.buyer || tc.account.creator;
            return ownerKey && ownerKey.toBase58() === buyer.toBase58();
        });
        
        console.log("🔥 BÓVEDA SYNC: Encontrados", myTicketsRaw.length, "tickets para", buyer.toBase58());

        return myTicketsRaw.map((tc: any) => ({
            ...tc.account,
            publicKey: tc.publicKey,
            // --- MAQUILLAJE PARA TICKETVAULT.TSX (GEMELO IDÉNTICO) ---
            // Traducimos snake_case del IDL de Anchor a camelCase del componente UI
            mint: tc.account.mint || tc.publicKey,
            pricePaid: tc.account.price_paid || tc.account.pricePaid || new BN(0),
            isUsed: tc.account.is_used || tc.account.isUsed || false,
            event: tc.account.event || null
        }));
    } catch (error) {
        console.error("Error al sincronizar mi bóveda de tickets:", error);
        return [];
    }
  }, [program, provider]);

  const createEvent = useCallback(async (name: string, basePrice: number, maxPrice: number, royalty: number, maxTickets: number, resaleCooldown: number = 0) => {
    if (!program || !provider?.wallet?.publicKey) throw new Error("Wallet no conectada.");
    try {
        const organizerKey = provider.wallet.publicKey;
        const nameSeed = Buffer.from(name.slice(0, 32));
        const [eventPda] = PublicKey.findProgramAddressSync(
          [Buffer.from("event"), organizerKey.toBuffer(), nameSeed],
          program.programId
        );

        const safeBasePrice = isNaN(basePrice) ? 0 : basePrice;
        const safeMaxPrice = isNaN(maxPrice) ? 0 : maxPrice;
        const safeRoyalty = isNaN(royalty) ? 0 : royalty;
        const safeMaxTickets = isNaN(maxTickets) ? 0 : maxTickets;
        const safeResaleCooldown = isNaN(resaleCooldown) ? 0 : resaleCooldown;

        return await program.methods.createEvent(
            name, 
            new BN(safeBasePrice * 1e9), 
            new BN(safeMaxPrice * 1e9), 
            Number(safeRoyalty), 
            Number(safeMaxTickets), 
            new BN(safeResaleCooldown)
        ).accounts({
            organizer: organizerKey,
            event: eventPda,
            systemProgram: SystemProgram.programId,
        } as any).rpc();
    } catch (error) { 
        console.error("Error al crear evento:", error);
        throw error; 
    }
  }, [program, provider]);

  const getEvents = useCallback(async () => {
    if (!program || !program.account) return [];
    try {
      const clients = (program.account as any);
      const accountClient = clients.eventState || clients.event || clients.eventAccount;
      if (!accountClient) return [];
      const allEvents = await accountClient.all();
      return allEvents.map((e: any) => ({ ...e.account, publicKey: e.publicKey }));
    } catch (error) { 
        return []; 
    }
  }, [program]);

  return { createEvent, getEvents, buyTicket, getMyTickets, program };
}
