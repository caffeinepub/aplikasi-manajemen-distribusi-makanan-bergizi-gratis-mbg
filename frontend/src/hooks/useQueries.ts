import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type {
  SasaranRecord,
  PaketMBGRecord,
  DistribusiRecord,
  BatchedDistribusiResult,
  PendingBatchedDistribusi,
  Jenis,
  DistribusiStatus,
  Kategori,
} from '../backend';

// ===================== Statistics Queries =====================
export function useGetStatistikDistribusi() {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: ['statistik'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getStatistikDistribusi();
    },
    enabled: !!actor && !isFetching,
  });
}

// ===================== Sasaran (Beneficiary) Queries =====================
export function useGetSemuaSasaran() {
  const { actor, isFetching } = useActor();

  return useQuery<SasaranRecord[]>({
    queryKey: ['sasaran'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getSemuaSasaran();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useFilterSasaranByStatus(aktif: boolean) {
  const { actor, isFetching } = useActor();

  return useQuery<SasaranRecord[]>({
    queryKey: ['sasaran', 'status', aktif],
    queryFn: async () => {
      if (!actor) return [];
      return actor.filterSasaranByStatus(aktif);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useFilterSasaranByKategori(kategori: Kategori) {
  const { actor, isFetching } = useActor();

  return useQuery<SasaranRecord[]>({
    queryKey: ['sasaran', 'kategori', kategori],
    queryFn: async () => {
      if (!actor) return [];
      return actor.filterSasaranByKategori(kategori);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useTambahSasaran() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      nama: string;
      alamat: string;
      nomorIdentitas: string;
      catatan: string | null;
      kategori: Kategori;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.tambahSasaran(data.nama, data.alamat, data.nomorIdentitas, data.catatan, data.kategori);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sasaran'] });
      queryClient.invalidateQueries({ queryKey: ['statistik'] });
    },
  });
}

export function useUbahStatusSasaran() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { id: bigint; aktif: boolean }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.ubahStatusSasaran(data.id, data.aktif);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sasaran'] });
    },
  });
}

// ===================== Paket (Package) Queries =====================
export function useGetSemuaPaket() {
  const { actor, isFetching } = useActor();

  return useQuery<PaketMBGRecord[]>({
    queryKey: ['paket'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getSemuaPaket();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useTambahPaket() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { jenis: Jenis; nama: string; keterangan: string | null }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.tambahPaket(data.jenis, data.nama, data.keterangan);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paket'] });
      queryClient.invalidateQueries({ queryKey: ['statistik'] });
    },
  });
}

// ===================== Distribusi Queries =====================
export function useGetSemuaDistribusi() {
  const { actor, isFetching } = useActor();

  return useQuery<DistribusiRecord[]>({
    queryKey: ['distribusi'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getSemuaDistribusi();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCatatDistribusiBatched() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation<BatchedDistribusiResult, Error, PendingBatchedDistribusi>({
    mutationFn: async (pending: PendingBatchedDistribusi) => {
      if (!actor) throw new Error('Actor not available');
      return actor.catatDistribusiBatched(pending);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['distribusi'] });
      queryClient.invalidateQueries({ queryKey: ['statistik'] });
    },
  });
}
