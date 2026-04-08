import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface BatchedDistribusiResult {
    gagal: Array<{
        error: string;
        sasaranId: bigint;
    }>;
    sukses: Array<DistribusiRecord>;
}
export type Time = bigint;
export interface DistribusiRecord {
    id: bigint;
    idPaket: bigint;
    idSasaran: bigint;
    keterangan?: string;
    statusDistribusi: DistribusiStatus;
    jumlahPaket: bigint;
    tanggalDistribusi: Time;
}
export type Jenis = {
    __kind__: "susuTambahan";
    susuTambahan: null;
} | {
    __kind__: "lainnya";
    lainnya: string;
} | {
    __kind__: "makananSiapSaji";
    makananSiapSaji: null;
} | {
    __kind__: "multivitamin";
    multivitamin: null;
} | {
    __kind__: "paketSembako";
    paketSembako: null;
};
export interface SasaranRecord {
    id: bigint;
    status: Status;
    alamat: string;
    nama: string;
    nomorIdentitas: string;
    kategori: Kategori;
    catatan?: string;
}
export interface PaketMBGRecord {
    id: bigint;
    nama: string;
    jenis: Jenis;
    keterangan?: string;
}
export interface PendingBatchedDistribusi {
    idPaket: bigint;
    sasaranIds: Array<bigint>;
    keterangan?: string;
    statusDistribusi: DistribusiStatus;
    jumlahPaket: bigint;
    tanggalDistribusi: Time;
}
export interface UserProfile {
    name: string;
    role: string;
    email?: string;
}
export enum DistribusiStatus {
    pending = "pending",
    terdistribusi = "terdistribusi",
    dalamProses = "dalamProses",
    tidakTerkirim = "tidakTerkirim"
}
export enum Kategori {
    balita = "balita",
    tidakDitentukan = "tidakDitentukan",
    ibuMenyusui = "ibuMenyusui",
    ibuHamil = "ibuHamil"
}
export enum Status {
    aktif = "aktif",
    nonAktif = "nonAktif"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    cariSasaranByNama(nama: string): Promise<Array<SasaranRecord>>;
    catatDistribusiBatched(pending: PendingBatchedDistribusi): Promise<BatchedDistribusiResult>;
    editDistribusi(id: bigint, idPaket: bigint, jumlahPaket: bigint, tanggalDistribusi: Time, statusDistribusi: DistribusiStatus, keterangan: string | null): Promise<DistribusiRecord>;
    filterDistribusiByTanggal(start: Time, end: Time): Promise<Array<DistribusiRecord>>;
    filterSasaranByKategori(kategori: Kategori): Promise<Array<SasaranRecord>>;
    filterSasaranByStatus(aktif: boolean): Promise<Array<SasaranRecord>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getDataUntukLaporan(start: Time, end: Time): Promise<{
        distribusi: Array<DistribusiRecord>;
        paket: Array<PaketMBGRecord>;
        sasaran: Array<SasaranRecord>;
    }>;
    getDistribusi(_id: bigint): Promise<DistribusiRecord | null>;
    getDistribusiByPaket(idPaket: bigint): Promise<Array<DistribusiRecord>>;
    getDistribusiBySasaran(idSasaran: bigint): Promise<Array<DistribusiRecord>>;
    getDistribusiByStatus(status: DistribusiStatus): Promise<Array<DistribusiRecord>>;
    getLaporanByKategori(kategori: Kategori, start: Time, end: Time): Promise<{
        distribusi: Array<DistribusiRecord>;
        paket: Array<PaketMBGRecord>;
        sasaran: Array<SasaranRecord>;
    }>;
    getPaket(_id: bigint): Promise<PaketMBGRecord | null>;
    getSasaran(_id: bigint): Promise<SasaranRecord | null>;
    getSemuaDistribusi(): Promise<Array<DistribusiRecord>>;
    getSemuaDistribusiSortedById(): Promise<Array<DistribusiRecord>>;
    getSemuaDistribusiSortedByTanggal(): Promise<Array<DistribusiRecord>>;
    getSemuaPaket(): Promise<Array<PaketMBGRecord>>;
    getSemuaPaketSortedById(): Promise<Array<PaketMBGRecord>>;
    getSemuaPaketSortedByNama(): Promise<Array<PaketMBGRecord>>;
    getSemuaSasaran(): Promise<Array<SasaranRecord>>;
    getSemuaSasaranSortedById(): Promise<Array<SasaranRecord>>;
    getSemuaSasaranSortedByNama(): Promise<Array<SasaranRecord>>;
    getStatistikDistribusi(): Promise<{
        totalDistribusi: bigint;
        totalSasaran: bigint;
        totalPaket: bigint;
    }>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    tambahPaket(jenis: Jenis, nama: string, keterangan: string | null): Promise<PaketMBGRecord>;
    tambahSasaran(nama: string, alamat: string, nomorIdentitas: string, catatan: string | null, kategori: Kategori | null): Promise<SasaranRecord>;
    ubahStatusSasaran(id: bigint, aktif: boolean): Promise<void>;
}
