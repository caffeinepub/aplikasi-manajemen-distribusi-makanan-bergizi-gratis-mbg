import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  BatchedDistribusiResult,
  DistribusiRecord,
  DistribusiStatus,
  Jenis,
  Kategori,
  PaketMBGRecord,
  PendingBatchedDistribusi,
  SasaranRecord,
} from "../backend";
import * as localStore from "../utils/localStore";

// ===================== Statistics Queries =====================
export function useGetStatistikDistribusi() {
  return useQuery({
    queryKey: ["statistik"],
    queryFn: async () => localStore.getStatistik(),
  });
}

// ===================== Sasaran (Beneficiary) Queries =====================
export function useGetSemuaSasaran() {
  return useQuery<SasaranRecord[]>({
    queryKey: ["sasaran"],
    queryFn: async () => localStore.getSasaranList(),
  });
}

export function useFilterSasaranByStatus(aktif: boolean) {
  return useQuery<SasaranRecord[]>({
    queryKey: ["sasaran", "status", aktif],
    queryFn: async () => {
      const list = localStore.getSasaranList();
      return list.filter((s) =>
        aktif ? String(s.status) === "aktif" : String(s.status) !== "aktif",
      );
    },
  });
}

export function useFilterSasaranByKategori(kategori: Kategori) {
  return useQuery<SasaranRecord[]>({
    queryKey: ["sasaran", "kategori", kategori],
    queryFn: async () => {
      const list = localStore.getSasaranList();
      return list.filter((s) => s.kategori === kategori);
    },
  });
}

export function useTambahSasaran() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      nama: string;
      alamat: string;
      nomorIdentitas: string;
      catatan: string | null;
      kategori: Kategori;
    }) => localStore.tambahSasaran(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sasaran"] });
      queryClient.invalidateQueries({ queryKey: ["statistik"] });
    },
  });
}

export function useUbahStatusSasaran() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { id: bigint; aktif: boolean }) => {
      localStore.ubahStatusSasaran(data.id, data.aktif);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sasaran"] });
    },
  });
}

// ===================== Paket (Package) Queries =====================
export function useGetSemuaPaket() {
  return useQuery<PaketMBGRecord[]>({
    queryKey: ["paket"],
    queryFn: async () => localStore.getPaketList(),
  });
}

export function useTambahPaket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      jenis: Jenis;
      nama: string;
      keterangan: string | null;
    }) => localStore.tambahPaket(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["paket"] });
      queryClient.invalidateQueries({ queryKey: ["statistik"] });
    },
  });
}

// ===================== Distribusi Queries =====================
export function useGetSemuaDistribusi() {
  return useQuery<DistribusiRecord[]>({
    queryKey: ["distribusi"],
    queryFn: async () => localStore.getDistribusiList(),
  });
}

export function useCatatDistribusiBatched() {
  const queryClient = useQueryClient();

  return useMutation<BatchedDistribusiResult, Error, PendingBatchedDistribusi>({
    mutationFn: async (pending: PendingBatchedDistribusi) =>
      localStore.catatDistribusiBatched(pending),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["distribusi"] });
      queryClient.invalidateQueries({ queryKey: ["statistik"] });
    },
  });
}

export function useEditDistribusi() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      id: bigint;
      idPaket: bigint;
      jumlahPaket: bigint;
      tanggalDistribusi: bigint;
      statusDistribusi: DistribusiStatus;
      keterangan: string | undefined;
    }) =>
      localStore.editDistribusi(data.id, {
        idPaket: data.idPaket,
        jumlahPaket: data.jumlahPaket,
        tanggalDistribusi: data.tanggalDistribusi,
        statusDistribusi: data.statusDistribusi,
        keterangan: data.keterangan,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["distribusi"] });
    },
  });
}
