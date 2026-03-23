/* eslint-disable */
import * as anchor from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";

// ID oficial del Programa FairTix proporcionado por el usuario
export const PROGRAM_ID = new PublicKey("F8ZN7PUv4kQCeVAmCCKsftX3XhycrPqiyqqTgyGtM6DJ");

// ID de Metaplex
export const METAPLEX_PROGRAM_ID = new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s");

/**
 * Obtiene la instancia del programa con protección de wallet
 */
export const getFairTixProgram = (provider: any, idl: any) => {
    // Si la wallet no está lista, devolvemos null en lugar de causar un TypeError
    if (!provider || !provider.wallet || !provider.wallet.publicKey) {
        return null;
    }
    return new anchor.Program(idl as any, provider);
};