/* eslint-disable */
import { useMemo } from "react";
import { Program } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { useAnchorProvider } from "./useAnchorProvider";
import idl from "./idl.json";

// ID oficial de tu programa en Solana Devnet
export const PROGRAM_ID = new PublicKey("F8ZN7PUv4kQCeVAmCCKsftX3XhycrPqiyqqTgyGtM6DJ");

export function useFairTixProgram() {
  const { provider } = useAnchorProvider();

  // Si no hay provider (wallet no conectada), devolvemos null
  const program = useMemo(() => {
    if (!provider) return null;

    // Instanciamos el programa Anchor
    return new Program(idl as any, provider);
  }, [provider]);

  return program;
}
