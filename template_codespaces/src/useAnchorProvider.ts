import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { AnchorProvider } from '@coral-xyz/anchor';
import { useMemo } from 'react';

export function useAnchorProvider() {
  const { connection } = useConnection();
  const wallet = useWallet();

  const provider = useMemo(() => {
    return new AnchorProvider(connection, wallet as any, {
      commitment: 'confirmed',
    });
  }, [connection, wallet]);

  return { provider, connection };
}
