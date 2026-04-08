// Config stub for useMigrateFromBackend compatibility
// Since data is now stored in localStorage, migration from backend is a no-op.

import type { SasaranRecord, PaketMBGRecord, DistribusiRecord } from "./types/mbg";

export async function createActorWithConfig() {
  return {
    getSemuaSasaran: async (): Promise<SasaranRecord[]> => [],
    getSemuaPaket: async (): Promise<PaketMBGRecord[]> => [],
    getSemuaDistribusi: async (): Promise<DistribusiRecord[]> => [],
  };
}
