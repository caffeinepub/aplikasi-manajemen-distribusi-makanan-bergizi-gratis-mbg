// Local actor stub for LaporanPage compatibility
// Since all data is stored in localStorage, we provide a local implementation
// of the methods that LaporanPage expects from the backend actor.

import type { Kategori, LaporanData } from "../types/mbg";
import * as localStore from "../utils/localStore";

interface LocalActor {
  getDataUntukLaporan: (
    startTime: bigint,
    endTime: bigint,
  ) => Promise<LaporanData>;
  getLaporanByKategori: (
    kategori: Kategori,
    startTime: bigint,
    endTime: bigint,
  ) => Promise<LaporanData>;
}

function createLocalActor(): LocalActor {
  return {
    async getDataUntukLaporan(
      startTime: bigint,
      endTime: bigint,
    ): Promise<LaporanData> {
      const allDistribusi = localStore.getDistribusiList();
      const distribusi = allDistribusi.filter(
        (d) =>
          d.tanggalDistribusi >= startTime && d.tanggalDistribusi <= endTime,
      );
      return {
        sasaran: localStore.getSasaranList(),
        paket: localStore.getPaketList(),
        distribusi,
      };
    },
    async getLaporanByKategori(
      kategori: Kategori,
      startTime: bigint,
      endTime: bigint,
    ): Promise<LaporanData> {
      const allDistribusi = localStore.getDistribusiList();
      const allSasaran = localStore.getSasaranList();
      const sasaranByKategori = new Set(
        allSasaran
          .filter((s) => s.kategori === kategori)
          .map((s) => s.id.toString()),
      );
      const distribusi = allDistribusi.filter(
        (d) =>
          d.tanggalDistribusi >= startTime &&
          d.tanggalDistribusi <= endTime &&
          sasaranByKategori.has(d.idSasaran.toString()),
      );
      return {
        sasaran: allSasaran,
        paket: localStore.getPaketList(),
        distribusi,
      };
    },
  };
}

const localActor = createLocalActor();

export function useActor() {
  return {
    actor: localActor,
    isFetching: false,
  };
}
