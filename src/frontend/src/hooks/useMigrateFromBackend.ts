import { useEffect, useRef } from "react";
import { createActorWithConfig } from "../config";
import {
  getDistribusiList,
  getPaketList,
  getSasaranList,
} from "../utils/localStore";

const MIGRATED_KEY = "mbg_migrated_v1";
const ID_KEY = "mbg_nextId";
const SASARAN_KEY = "mbg_sasaran";
const PAKET_KEY = "mbg_paket";
const DISTRIBUSI_KEY = "mbg_distribusi";

const replacer = (_: string, v: unknown) =>
  typeof v === "bigint" ? `__bigint__${v.toString()}` : v;

function serialize<T>(data: T): string {
  return JSON.stringify(data, replacer);
}

export function useMigrateFromBackend() {
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    if (localStorage.getItem(MIGRATED_KEY)) return;
    hasRun.current = true;

    const migrate = async () => {
      try {
        const actor = await createActorWithConfig();
        const [sasaran, paket, distribusi] = await Promise.all([
          actor.getSemuaSasaran(),
          actor.getSemuaPaket(),
          actor.getSemuaDistribusi(),
        ]);

        if (
          sasaran.length === 0 &&
          paket.length === 0 &&
          distribusi.length === 0
        ) {
          // Backend is empty, nothing to migrate
          localStorage.setItem(MIGRATED_KEY, "1");
          return;
        }

        // Merge with existing localStorage data (prefer localStorage if already has data)
        const existingSasaran = getSasaranList();
        const existingPaket = getPaketList();
        const existingDistribusi = getDistribusiList();

        const existingSasaranIds = new Set(
          existingSasaran.map((s) => s.id.toString()),
        );
        const existingPaketIds = new Set(
          existingPaket.map((p) => p.id.toString()),
        );
        const existingDistribusiIds = new Set(
          existingDistribusi.map((d) => d.id.toString()),
        );

        const mergedSasaran = [
          ...existingSasaran,
          ...sasaran.filter((s) => !existingSasaranIds.has(s.id.toString())),
        ];
        const mergedPaket = [
          ...existingPaket,
          ...paket.filter((p) => !existingPaketIds.has(p.id.toString())),
        ];
        const mergedDistribusi = [
          ...existingDistribusi,
          ...distribusi.filter(
            (d) => !existingDistribusiIds.has(d.id.toString()),
          ),
        ];

        localStorage.setItem(SASARAN_KEY, serialize(mergedSasaran));
        localStorage.setItem(PAKET_KEY, serialize(mergedPaket));
        localStorage.setItem(DISTRIBUSI_KEY, serialize(mergedDistribusi));

        // Update ID counters
        const maxSasaranId = mergedSasaran.reduce(
          (max, s) => (s.id > max ? s.id : max),
          BigInt(0),
        );
        const maxPaketId = mergedPaket.reduce(
          (max, p) => (p.id > max ? p.id : max),
          BigInt(0),
        );
        const maxDistribusiId = mergedDistribusi.reduce(
          (max, d) => (d.id > max ? d.id : max),
          BigInt(0),
        );

        localStorage.setItem(
          ID_KEY,
          JSON.stringify({
            sasaran: Number(maxSasaranId),
            paket: Number(maxPaketId),
            distribusi: Number(maxDistribusiId),
          }),
        );

        localStorage.setItem(MIGRATED_KEY, "1");
        console.log(
          `Migrasi selesai: ${mergedSasaran.length} sasaran, ${mergedPaket.length} paket, ${mergedDistribusi.length} distribusi`,
        );

        // Reload page to show migrated data
        if (sasaran.length > 0 || distribusi.length > 0 || paket.length > 0) {
          window.location.reload();
        }
      } catch (err) {
        console.error("Migrasi data gagal:", err);
        localStorage.setItem(MIGRATED_KEY, "1");
      }
    };

    migrate();
  }, []);
}
