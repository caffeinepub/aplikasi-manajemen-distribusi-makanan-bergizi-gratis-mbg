// Domain types for MBG (Makanan Bergizi Gratis) application
// These types represent the local data model used in localStorage

// ===================== Enums =====================

export enum Kategori {
  ibuHamil = "ibuHamil",
  ibuMenyusui = "ibuMenyusui",
  balita = "balita",
  tidakDitentukan = "tidakDitentukan",
}

export enum Status {
  aktif = "aktif",
  nonAktif = "nonAktif",
}

export enum DistribusiStatus {
  terdistribusi = "terdistribusi",
  pending = "pending",
  dalamProses = "dalamProses",
  tidakTerkirim = "tidakTerkirim",
}

// ===================== Jenis Paket =====================

export type Jenis =
  | { __kind__: "paketSembako"; paketSembako?: null }
  | { __kind__: "makananSiapSaji"; makananSiapSaji?: null }
  | { __kind__: "susuTambahan"; susuTambahan?: null }
  | { __kind__: "multivitamin"; multivitamin?: null }
  | { __kind__: "lainnya"; lainnya: string };

// ===================== Records =====================

export interface SasaranRecord {
  id: bigint;
  nama: string;
  alamat: string;
  nomorIdentitas: string;
  catatan?: string;
  kategori: Kategori;
  status: Status;
}

export interface PaketMBGRecord {
  id: bigint;
  nama: string;
  jenis: Jenis;
  keterangan?: string;
}

export interface DistribusiRecord {
  id: bigint;
  idPaket: bigint;
  idSasaran: bigint;
  tanggalDistribusi: bigint;
  jumlahPaket: bigint;
  statusDistribusi: DistribusiStatus;
  keterangan?: string;
}

// ===================== Batched Distribusi =====================

export interface PendingBatchedDistribusi {
  sasaranIds: bigint[];
  idPaket: bigint;
  jumlahPaket: bigint;
  tanggalDistribusi: bigint;
  statusDistribusi: DistribusiStatus;
  keterangan?: string;
}

export interface BatchedDistribusiResult {
  sukses: DistribusiRecord[];
  gagal: Array<{ error: string; sasaranId: bigint }>;
}

// ===================== Laporan =====================

export interface LaporanData {
  sasaran: SasaranRecord[];
  paket: PaketMBGRecord[];
  distribusi: DistribusiRecord[];
}
