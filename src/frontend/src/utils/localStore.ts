import type {
  BatchedDistribusiResult,
  DistribusiRecord,
  DistribusiStatus,
  Jenis,
  Kategori,
  PaketMBGRecord,
  PendingBatchedDistribusi,
  SasaranRecord,
  Status,
} from "../types/mbg";

// ===================== BigInt Serialization =====================
const replacer = (_: string, v: unknown) =>
  typeof v === "bigint" ? `__bigint__${v.toString()}` : v;

const reviver = (_: string, v: unknown) =>
  typeof v === "string" && v.startsWith("__bigint__") ? BigInt(v.slice(10)) : v;

function serialize<T>(data: T): string {
  return JSON.stringify(data, replacer);
}

function deserialize<T>(json: string): T {
  return JSON.parse(json, reviver) as T;
}

// ===================== ID Management =====================
const ID_KEY = "mbg_nextId";

interface IdCounters {
  sasaran: number;
  paket: number;
  distribusi: number;
}

function getCounters(): IdCounters {
  const raw = localStorage.getItem(ID_KEY);
  if (!raw) return { sasaran: 0, paket: 0, distribusi: 0 };
  return JSON.parse(raw) as IdCounters;
}

function nextId(type: keyof IdCounters): bigint {
  const counters = getCounters();
  counters[type] = counters[type] + 1;
  localStorage.setItem(ID_KEY, JSON.stringify(counters));
  return BigInt(counters[type]);
}

// ===================== Sasaran =====================
const SASARAN_KEY = "mbg_sasaran";

export function getSasaranList(): SasaranRecord[] {
  const raw = localStorage.getItem(SASARAN_KEY);
  if (!raw) return [];
  return deserialize<SasaranRecord[]>(raw);
}

function saveSasaranList(list: SasaranRecord[]): void {
  localStorage.setItem(SASARAN_KEY, serialize(list));
}

export function tambahSasaran(data: {
  nama: string;
  alamat: string;
  nomorIdentitas: string;
  catatan: string | null;
  kategori: Kategori;
}): SasaranRecord {
  const list = getSasaranList();
  const record: SasaranRecord = {
    id: nextId("sasaran"),
    nama: data.nama,
    alamat: data.alamat,
    nomorIdentitas: data.nomorIdentitas,
    catatan: data.catatan ?? undefined,
    kategori: data.kategori,
    status: "aktif" as unknown as Status,
  };
  list.push(record);
  saveSasaranList(list);
  return record;
}

export function ubahStatusSasaran(id: bigint, aktif: boolean): void {
  const list = getSasaranList();
  const idx = list.findIndex((s) => s.id === id);
  if (idx !== -1) {
    list[idx] = {
      ...list[idx],
      status: (aktif ? "aktif" : "nonAktif") as unknown as Status,
    };
    saveSasaranList(list);
  }
}

// ===================== Paket =====================
const PAKET_KEY = "mbg_paket";

export function getPaketList(): PaketMBGRecord[] {
  const raw = localStorage.getItem(PAKET_KEY);
  if (!raw) return [];
  return deserialize<PaketMBGRecord[]>(raw);
}

function savePaketList(list: PaketMBGRecord[]): void {
  localStorage.setItem(PAKET_KEY, serialize(list));
}

export function tambahPaket(data: {
  jenis: Jenis;
  nama: string;
  keterangan: string | null;
}): PaketMBGRecord {
  const list = getPaketList();
  const record: PaketMBGRecord = {
    id: nextId("paket"),
    nama: data.nama,
    jenis: data.jenis,
    keterangan: data.keterangan ?? undefined,
  };
  list.push(record);
  savePaketList(list);
  return record;
}

// ===================== Distribusi =====================
const DISTRIBUSI_KEY = "mbg_distribusi";

export function getDistribusiList(): DistribusiRecord[] {
  const raw = localStorage.getItem(DISTRIBUSI_KEY);
  if (!raw) return [];
  return deserialize<DistribusiRecord[]>(raw);
}

function saveDistribusiList(list: DistribusiRecord[]): void {
  localStorage.setItem(DISTRIBUSI_KEY, serialize(list));
}

export function catatDistribusiBatched(
  pending: PendingBatchedDistribusi,
): BatchedDistribusiResult {
  const list = getDistribusiList();
  const sukses: DistribusiRecord[] = [];
  const gagal: Array<{ error: string; sasaranId: bigint }> = [];

  for (const sasaranId of pending.sasaranIds) {
    const record: DistribusiRecord = {
      id: nextId("distribusi"),
      idPaket: pending.idPaket,
      idSasaran: sasaranId,
      keterangan: pending.keterangan ?? undefined,
      statusDistribusi: pending.statusDistribusi,
      jumlahPaket: pending.jumlahPaket,
      tanggalDistribusi: pending.tanggalDistribusi,
    };
    list.push(record);
    sukses.push(record);
  }

  saveDistribusiList(list);
  return { sukses, gagal };
}

export function editDistribusi(
  id: bigint,
  updates: {
    idPaket: bigint;
    jumlahPaket: bigint;
    tanggalDistribusi: bigint;
    statusDistribusi: DistribusiStatus;
    keterangan: string | undefined;
  },
): DistribusiRecord {
  const list = getDistribusiList();
  const idx = list.findIndex((d) => d.id === id);
  if (idx === -1) throw new Error("Distribusi tidak ditemukan");
  const updated: DistribusiRecord = {
    ...list[idx],
    idPaket: updates.idPaket,
    jumlahPaket: updates.jumlahPaket,
    tanggalDistribusi: updates.tanggalDistribusi,
    statusDistribusi: updates.statusDistribusi,
    keterangan: updates.keterangan,
  };
  list[idx] = updated;
  saveDistribusiList(list);
  return updated;
}

// ===================== Statistik =====================
export function getStatistik(): {
  totalSasaran: bigint;
  totalPaket: bigint;
  totalDistribusi: bigint;
} {
  return {
    totalSasaran: BigInt(getSasaranList().length),
    totalPaket: BigInt(getPaketList().length),
    totalDistribusi: BigInt(getDistribusiList().length),
  };
}
