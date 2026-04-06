import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Pencil,
  Plus,
  Search,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { DistribusiStatus } from "../backend";
import type {
  BatchedDistribusiResult,
  DistribusiRecord,
  Jenis,
} from "../backend";
import {
  useCatatDistribusiBatched,
  useEditDistribusi,
  useGetSemuaDistribusi,
  useGetSemuaPaket,
  useGetSemuaSasaran,
} from "../hooks/useQueries";
import BeneficiaryChecklistSelector from "./BeneficiaryChecklistSelector";

function getJenisLabel(jenis: Jenis): string {
  switch (jenis.__kind__) {
    case "paketSembako":
      return "Paket Sembako";
    case "makananSiapSaji":
      return "Makanan Siap Saji";
    case "susuTambahan":
      return "Susu Tambahan";
    case "multivitamin":
      return "Multivitamin";
    case "lainnya":
      return (jenis as any).lainnya;
    default:
      return "Tidak Diketahui";
  }
}

function getStatusLabel(status: DistribusiStatus): string {
  switch (status) {
    case DistribusiStatus.terdistribusi:
      return "Terdistribusi";
    case DistribusiStatus.pending:
      return "Pending";
    case DistribusiStatus.dalamProses:
      return "Dalam Proses";
    case DistribusiStatus.tidakTerkirim:
      return "Tidak Terkirim";
    default:
      return "Tidak Diketahui";
  }
}

function getStatusVariant(
  status: DistribusiStatus,
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case DistribusiStatus.terdistribusi:
      return "default";
    case DistribusiStatus.pending:
      return "secondary";
    case DistribusiStatus.dalamProses:
      return "outline";
    case DistribusiStatus.tidakTerkirim:
      return "destructive";
    default:
      return "secondary";
  }
}

function formatDate(timestamp: bigint): string {
  const date = new Date(Number(timestamp) / 1000000);
  return date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function tsToDateInput(timestamp: bigint): string {
  const date = new Date(Number(timestamp) / 1000000);
  return date.toISOString().split("T")[0];
}

// ── Edit Dialog ──────────────────────────────────────────────────────────────
interface EditDialogProps {
  distribusi: DistribusiRecord;
  sasaranNama: string;
  paketList: { id: bigint; nama: string; jenis: Jenis }[];
  onClose: () => void;
}

function EditDistribusiDialog({
  distribusi,
  sasaranNama,
  paketList,
  onClose,
}: EditDialogProps) {
  const { mutate: editDistribusi, isPending } = useEditDistribusi();

  const [form, setForm] = useState({
    idPaket: distribusi.idPaket.toString(),
    jumlahPaket: distribusi.jumlahPaket.toString(),
    tanggal: tsToDateInput(distribusi.tanggalDistribusi),
    status: distribusi.statusDistribusi as DistribusiStatus,
    keterangan: distribusi.keterangan ?? "",
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const tanggalMs = new Date(form.tanggal).getTime() * 1000000;
    editDistribusi(
      {
        id: distribusi.id,
        idPaket: BigInt(form.idPaket),
        jumlahPaket: BigInt(form.jumlahPaket),
        tanggalDistribusi: BigInt(tanggalMs),
        statusDistribusi: form.status,
        keterangan: form.keterangan || undefined,
      },
      {
        onSuccess: () => {
          toast.success("Data distribusi berhasil diperbarui");
          onClose();
        },
        onError: (err) => {
          toast.error(`Gagal memperbarui: ${err.message}`);
        },
      },
    );
  };

  return (
    <DialogContent className="sm:max-w-lg" data-ocid="distribusi.edit.dialog">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Pencil className="h-4 w-4 text-emerald-600" />
          Edit Data Distribusi
        </DialogTitle>
        <DialogDescription>
          Perbarui informasi distribusi untuk{" "}
          <span className="font-medium text-foreground">{sasaranNama}</span>
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSave} className="space-y-4 py-2">
        {/* Penerima — read-only */}
        <div className="space-y-1">
          <Label>Penerima Manfaat</Label>
          <Input value={sasaranNama} disabled className="bg-muted" />
        </div>

        {/* Tanggal */}
        <div className="space-y-1">
          <Label htmlFor="edit-tanggal">Tanggal Distribusi *</Label>
          <Input
            id="edit-tanggal"
            type="date"
            value={form.tanggal}
            onChange={(e) => setForm({ ...form, tanggal: e.target.value })}
            required
            disabled={isPending}
            data-ocid="distribusi.edit.tanggal.input"
          />
        </div>

        {/* Paket */}
        <div className="space-y-1">
          <Label>Paket MBG *</Label>
          <Select
            value={form.idPaket}
            onValueChange={(v) => setForm({ ...form, idPaket: v })}
            disabled={isPending}
          >
            <SelectTrigger data-ocid="distribusi.edit.paket.select">
              <SelectValue placeholder="Pilih paket" />
            </SelectTrigger>
            <SelectContent>
              {paketList.map((p) => (
                <SelectItem key={p.id.toString()} value={p.id.toString()}>
                  {p.nama} ({getJenisLabel(p.jenis)})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Jumlah */}
        <div className="space-y-1">
          <Label htmlFor="edit-jumlah">Jumlah Paket *</Label>
          <Input
            id="edit-jumlah"
            type="number"
            min="1"
            value={form.jumlahPaket}
            onChange={(e) => setForm({ ...form, jumlahPaket: e.target.value })}
            required
            disabled={isPending}
            data-ocid="distribusi.edit.jumlah.input"
          />
        </div>

        {/* Status */}
        <div className="space-y-1">
          <Label>Status Distribusi *</Label>
          <Select
            value={form.status}
            onValueChange={(v) =>
              setForm({ ...form, status: v as DistribusiStatus })
            }
            disabled={isPending}
          >
            <SelectTrigger data-ocid="distribusi.edit.status.select">
              <SelectValue placeholder="Pilih status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={DistribusiStatus.terdistribusi}>
                Terdistribusi
              </SelectItem>
              <SelectItem value={DistribusiStatus.pending}>Pending</SelectItem>
              <SelectItem value={DistribusiStatus.dalamProses}>
                Dalam Proses
              </SelectItem>
              <SelectItem value={DistribusiStatus.tidakTerkirim}>
                Tidak Terkirim
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Keterangan */}
        <div className="space-y-1">
          <Label htmlFor="edit-keterangan">Keterangan (Opsional)</Label>
          <Textarea
            id="edit-keterangan"
            value={form.keterangan}
            onChange={(e) => setForm({ ...form, keterangan: e.target.value })}
            disabled={isPending}
            rows={2}
            data-ocid="distribusi.edit.keterangan.textarea"
          />
        </div>

        <DialogFooter className="gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isPending}
            data-ocid="distribusi.edit.cancel_button"
          >
            Batal
          </Button>
          <Button
            type="submit"
            className="bg-emerald-600 hover:bg-emerald-700"
            disabled={isPending || !form.idPaket || !form.jumlahPaket}
            data-ocid="distribusi.edit.save_button"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Menyimpan...
              </>
            ) : (
              "Simpan Perubahan"
            )}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function DistribusiPage() {
  const { data: distribusiList = [], isLoading } = useGetSemuaDistribusi();
  const { data: sasaranList = [] } = useGetSemuaSasaran();
  const { data: paketList = [] } = useGetSemuaPaket();
  const { mutate: catatBatched, isPending: isAdding } =
    useCatatDistribusiBatched();

  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [batchResult, setBatchResult] =
    useState<BatchedDistribusiResult | null>(null);
  const [editTarget, setEditTarget] = useState<DistribusiRecord | null>(null);

  // Month filter state — default to previous month
  const now = new Date();
  const prevMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
  const prevYear =
    now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
  const [selectedMonth, setSelectedMonth] = useState(prevMonth);
  const [selectedYear, setSelectedYear] = useState(prevYear);
  const [showAllMonths, setShowAllMonths] = useState(false);

  const [formData, setFormData] = useState({
    selectedSasaranIds: [] as bigint[],
    idPaket: "",
    jumlahPaket: "",
    tanggalDistribusi: new Date().toISOString().split("T")[0],
    statusDistribusi: DistribusiStatus.terdistribusi,
    keterangan: "",
  });

  // Step 1: filter by month
  const monthFilteredDistribusi = showAllMonths
    ? distribusiList
    : distribusiList.filter((d) => {
        const date = new Date(Number(d.tanggalDistribusi) / 1_000_000);
        return (
          date.getMonth() === selectedMonth &&
          date.getFullYear() === selectedYear
        );
      });

  // Step 2: filter by search term
  const filteredDistribusi = monthFilteredDistribusi.filter((d) => {
    const sasaran = sasaranList.find((s) => s.id === d.idSasaran);
    const paket = paketList.find((p) => p.id === d.idPaket);
    return (
      sasaran?.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      paket?.nama.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // Stats for current filtered set (before search)
  const totalDistribusi = monthFilteredDistribusi.length;
  const uniquePenerima = new Set(
    monthFilteredDistribusi.map((d) => d.idSasaran.toString()),
  ).size;
  const totalPaket = monthFilteredDistribusi.reduce(
    (sum, d) => sum + Number(d.jumlahPaket),
    0,
  );

  // Month navigation helpers
  const selectedDate = new Date(selectedYear, selectedMonth, 1);
  const monthLabel = selectedDate.toLocaleDateString("id-ID", {
    month: "long",
    year: "numeric",
  });

  // isCurrentMonth compares against today's actual month/year
  const isCurrentMonth =
    selectedMonth === now.getMonth() && selectedYear === now.getFullYear();

  const goToPrevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear((y) => y - 1);
    } else {
      setSelectedMonth((m) => m - 1);
    }
  };

  const goToNextMonth = () => {
    if (isCurrentMonth) return;
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear((y) => y + 1);
    } else {
      setSelectedMonth((m) => m + 1);
    }
  };

  // CardDescription text
  const cardDescription = showAllMonths
    ? `Semua data: ${totalDistribusi} distribusi tercatat`
    : `Bulan ${monthLabel}: ${totalDistribusi} distribusi tercatat`;

  const resetForm = () => {
    setFormData({
      selectedSasaranIds: [],
      idPaket: "",
      jumlahPaket: "",
      tanggalDistribusi: new Date().toISOString().split("T")[0],
      statusDistribusi: DistribusiStatus.terdistribusi,
      keterangan: "",
    });
    setBatchResult(null);
  };

  const handleDialogOpenChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) resetForm();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.selectedSasaranIds.length === 0) return;
    const tanggal = new Date(formData.tanggalDistribusi).getTime() * 1000000;
    catatBatched(
      {
        sasaranIds: formData.selectedSasaranIds,
        idPaket: BigInt(formData.idPaket),
        jumlahPaket: BigInt(formData.jumlahPaket),
        statusDistribusi: formData.statusDistribusi,
        keterangan: formData.keterangan || undefined,
        tanggalDistribusi: BigInt(tanggal),
      },
      {
        onSuccess: (result) => {
          setBatchResult(result);
          setFormData((prev) => ({
            ...prev,
            selectedSasaranIds: [],
            keterangan: "",
          }));
        },
      },
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-emerald-900">
            Data Distribusi
          </h2>
          <p className="text-muted-foreground">
            Catat dan pantau distribusi paket MBG
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
          <DialogTrigger asChild>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700"
              data-ocid="distribusi.add_button"
            >
              <Plus className="mr-2 h-4 w-4" />
              Catat Distribusi
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Catat Distribusi Baru</DialogTitle>
              <DialogDescription>
                Pilih penerima manfaat per desa, lalu isi detail distribusi
                paket MBG
              </DialogDescription>
            </DialogHeader>

            <ScrollArea className="max-h-[75vh] pr-1">
              {batchResult && (
                <div className="mb-4 space-y-2">
                  {batchResult.sukses.length > 0 && (
                    <Alert className="border-emerald-200 bg-emerald-50">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      <AlertTitle className="text-emerald-800">
                        {batchResult.sukses.length} distribusi berhasil dicatat
                      </AlertTitle>
                      <AlertDescription className="text-emerald-700">
                        Data distribusi telah tersimpan untuk{" "}
                        {batchResult.sukses.length} penerima manfaat.
                      </AlertDescription>
                    </Alert>
                  )}
                  {batchResult.gagal.length > 0 && (
                    <Alert variant="destructive">
                      <XCircle className="h-4 w-4" />
                      <AlertTitle>
                        {batchResult.gagal.length} distribusi gagal
                      </AlertTitle>
                      <AlertDescription>
                        <ul className="mt-1 list-disc pl-4 text-sm">
                          {batchResult.gagal.map((f) => (
                            <li key={f.sasaranId.toString()}>
                              ID Sasaran {f.sasaranId.toString()}: {f.error}
                            </li>
                          ))}
                        </ul>
                      </AlertDescription>
                    </Alert>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      setBatchResult(null);
                      handleDialogOpenChange(false);
                    }}
                  >
                    Tutup
                  </Button>
                </div>
              )}

              {!batchResult && (
                <form onSubmit={handleSubmit} className="space-y-5 pb-2">
                  <div className="space-y-2">
                    <Label>
                      Penerima Manfaat *{" "}
                      <span className="text-xs font-normal text-muted-foreground">
                        (pilih satu atau lebih per desa)
                      </span>
                    </Label>
                    <BeneficiaryChecklistSelector
                      sasaranList={sasaranList}
                      selectedIds={formData.selectedSasaranIds}
                      onChange={(ids) =>
                        setFormData({ ...formData, selectedSasaranIds: ids })
                      }
                      disabled={isAdding}
                    />
                    {formData.selectedSasaranIds.length === 0 && (
                      <p className="text-xs text-destructive">
                        Pilih minimal satu penerima manfaat
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="idPaket">Paket MBG *</Label>
                    <Select
                      value={formData.idPaket}
                      onValueChange={(value) =>
                        setFormData({ ...formData, idPaket: value })
                      }
                      disabled={isAdding}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih paket" />
                      </SelectTrigger>
                      <SelectContent>
                        {paketList.map((paket) => (
                          <SelectItem
                            key={paket.id.toString()}
                            value={paket.id.toString()}
                          >
                            {paket.nama} ({getJenisLabel(paket.jenis)})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="jumlahPaket">Jumlah Paket *</Label>
                    <Input
                      id="jumlahPaket"
                      type="number"
                      min="1"
                      value={formData.jumlahPaket}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          jumlahPaket: e.target.value,
                        })
                      }
                      required
                      disabled={isAdding}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tanggalDistribusi">
                      Tanggal Distribusi *
                    </Label>
                    <Input
                      id="tanggalDistribusi"
                      type="date"
                      value={formData.tanggalDistribusi}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          tanggalDistribusi: e.target.value,
                        })
                      }
                      required
                      disabled={isAdding}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="statusDistribusi">
                      Status Distribusi *
                    </Label>
                    <Select
                      value={formData.statusDistribusi}
                      onValueChange={(value) =>
                        setFormData({
                          ...formData,
                          statusDistribusi: value as DistribusiStatus,
                        })
                      }
                      disabled={isAdding}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={DistribusiStatus.terdistribusi}>
                          Terdistribusi
                        </SelectItem>
                        <SelectItem value={DistribusiStatus.pending}>
                          Pending
                        </SelectItem>
                        <SelectItem value={DistribusiStatus.dalamProses}>
                          Dalam Proses
                        </SelectItem>
                        <SelectItem value={DistribusiStatus.tidakTerkirim}>
                          Tidak Terkirim
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="keterangan">Keterangan (Opsional)</Label>
                    <Textarea
                      id="keterangan"
                      value={formData.keterangan}
                      onChange={(e) =>
                        setFormData({ ...formData, keterangan: e.target.value })
                      }
                      disabled={isAdding}
                      rows={2}
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-emerald-600 hover:bg-emerald-700"
                    disabled={
                      isAdding ||
                      formData.selectedSasaranIds.length === 0 ||
                      !formData.idPaket ||
                      !formData.jumlahPaket
                    }
                  >
                    {isAdding ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Menyimpan {formData.selectedSasaranIds.length} data...
                      </>
                    ) : (
                      <>
                        Simpan{" "}
                        {formData.selectedSasaranIds.length > 0
                          ? `(${formData.selectedSasaranIds.length} penerima)`
                          : "Data"}
                      </>
                    )}
                  </Button>
                </form>
              )}
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </div>

      {/* Distribution list table */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Distribusi</CardTitle>
          <CardDescription>{cardDescription}</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Month Navigator */}
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-emerald-700 hover:bg-emerald-100"
              onClick={goToPrevMonth}
              disabled={showAllMonths}
              data-ocid="distribusi.pagination_prev"
              title="Bulan sebelumnya"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <div className="flex flex-1 items-center justify-center gap-2">
              <span
                className={
                  showAllMonths
                    ? "text-sm font-medium text-muted-foreground"
                    : "text-sm font-semibold capitalize text-emerald-800"
                }
              >
                {showAllMonths ? "Semua Bulan" : monthLabel}
              </span>
              {!showAllMonths && isCurrentMonth && (
                <span className="rounded-full bg-emerald-200 px-2 py-0.5 text-xs font-medium text-emerald-800">
                  Bulan Ini
                </span>
              )}
            </div>

            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-emerald-700 hover:bg-emerald-100"
              onClick={goToNextMonth}
              disabled={showAllMonths || isCurrentMonth}
              data-ocid="distribusi.pagination_next"
              title="Bulan berikutnya"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>

            <Button
              variant={showAllMonths ? "default" : "outline"}
              size="sm"
              className={
                showAllMonths
                  ? "ml-2 bg-emerald-600 text-white hover:bg-emerald-700"
                  : "ml-2 border-emerald-300 text-emerald-700 hover:bg-emerald-100"
              }
              onClick={() => setShowAllMonths((v) => !v)}
              data-ocid="distribusi.toggle"
            >
              Semua Bulan
            </Button>
          </div>

          {/* Stats Summary */}
          <div className="mb-4 grid grid-cols-3 gap-3">
            <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-3 text-center">
              <p className="text-2xl font-bold text-emerald-700">
                {totalDistribusi}
              </p>
              <p className="mt-0.5 text-xs text-emerald-600">
                Total Distribusi
              </p>
            </div>
            <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-3 text-center">
              <p className="text-2xl font-bold text-emerald-700">
                {uniquePenerima}
              </p>
              <p className="mt-0.5 text-xs text-emerald-600">Penerima Unik</p>
            </div>
            <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-3 text-center">
              <p className="text-2xl font-bold text-emerald-700">
                {totalPaket}
              </p>
              <p className="mt-0.5 text-xs text-emerald-600">Total Paket</p>
            </div>
          </div>

          {/* Search */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Cari berdasarkan nama penerima atau paket..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-ocid="distribusi.search_input"
              />
            </div>
          </div>

          {isLoading ? (
            <div
              className="flex items-center justify-center py-8"
              data-ocid="distribusi.loading_state"
            >
              <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
            </div>
          ) : filteredDistribusi.length === 0 ? (
            <div
              className="py-8 text-center text-muted-foreground"
              data-ocid="distribusi.empty_state"
            >
              {searchTerm
                ? "Tidak ada data yang sesuai dengan pencarian"
                : showAllMonths
                  ? "Belum ada data distribusi"
                  : `Belum ada data distribusi untuk ${monthLabel}`}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table data-ocid="distribusi.table">
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Penerima</TableHead>
                    <TableHead>Desa</TableHead>
                    <TableHead>Paket</TableHead>
                    <TableHead>Jumlah</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Keterangan</TableHead>
                    <TableHead className="text-center">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDistribusi.map((distribusi, idx) => {
                    const sasaran = sasaranList.find(
                      (s) => s.id === distribusi.idSasaran,
                    );
                    const paket = paketList.find(
                      (p) => p.id === distribusi.idPaket,
                    );
                    const rowNum = idx + 1;
                    return (
                      <TableRow
                        key={distribusi.id.toString()}
                        data-ocid={`distribusi.row.${rowNum}`}
                      >
                        <TableCell className="font-medium">
                          {distribusi.id.toString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            {formatDate(distribusi.tanggalDistribusi)}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          {sasaran?.nama || "N/A"}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {sasaran?.alamat || "-"}
                        </TableCell>
                        <TableCell>{paket?.nama || "N/A"}</TableCell>
                        <TableCell>
                          {distribusi.jumlahPaket.toString()} paket
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={getStatusVariant(
                              distribusi.statusDistribusi,
                            )}
                          >
                            {getStatusLabel(distribusi.statusDistribusi)}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {distribusi.keterangan || "-"}
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 w-8 p-0 hover:border-emerald-500 hover:text-emerald-600"
                            onClick={() => setEditTarget(distribusi)}
                            data-ocid={`distribusi.edit_button.${rowNum}`}
                            title="Edit distribusi"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog
        open={!!editTarget}
        onOpenChange={(open) => {
          if (!open) setEditTarget(null);
        }}
      >
        {editTarget && (
          <EditDistribusiDialog
            distribusi={editTarget}
            sasaranNama={
              sasaranList.find((s) => s.id === editTarget.idSasaran)?.nama ||
              "N/A"
            }
            paketList={paketList}
            onClose={() => setEditTarget(null)}
          />
        )}
      </Dialog>
    </div>
  );
}
