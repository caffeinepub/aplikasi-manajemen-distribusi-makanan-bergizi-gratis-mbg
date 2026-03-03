import { useState } from 'react';
import {
  useGetSemuaDistribusi,
  useGetSemuaSasaran,
  useGetSemuaPaket,
  useCatatDistribusiBatched,
} from '../hooks/useQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Search, Loader2, Calendar, CheckCircle2, XCircle } from 'lucide-react';
import { DistribusiStatus } from '../backend';
import type { Jenis, BatchedDistribusiResult } from '../backend';
import BeneficiaryChecklistSelector from './BeneficiaryChecklistSelector';

export default function DistribusiPage() {
  const { data: distribusiList = [], isLoading } = useGetSemuaDistribusi();
  const { data: sasaranList = [] } = useGetSemuaSasaran();
  const { data: paketList = [] } = useGetSemuaPaket();
  const { mutate: catatBatched, isPending: isAdding } = useCatatDistribusiBatched();

  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [batchResult, setBatchResult] = useState<BatchedDistribusiResult | null>(null);

  const [formData, setFormData] = useState({
    selectedSasaranIds: [] as bigint[],
    idPaket: '',
    jumlahPaket: '',
    tanggalDistribusi: new Date().toISOString().split('T')[0],
    statusDistribusi: DistribusiStatus.terdistribusi,
    keterangan: '',
  });

  const getJenisLabel = (jenis: Jenis): string => {
    switch (jenis.__kind__) {
      case 'paketSembako':
        return 'Paket Sembako';
      case 'makananSiapSaji':
        return 'Makanan Siap Saji';
      case 'susuTambahan':
        return 'Susu Tambahan';
      case 'multivitamin':
        return 'Multivitamin';
      case 'lainnya':
        return jenis.lainnya;
      default:
        return 'Tidak Diketahui';
    }
  };

  const getStatusLabel = (status: DistribusiStatus): string => {
    switch (status) {
      case DistribusiStatus.terdistribusi:
        return 'Terdistribusi';
      case DistribusiStatus.pending:
        return 'Pending';
      case DistribusiStatus.dalamProses:
        return 'Dalam Proses';
      case DistribusiStatus.tidakTerkirim:
        return 'Tidak Terkirim';
      default:
        return 'Tidak Diketahui';
    }
  };

  const getStatusVariant = (status: DistribusiStatus): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (status) {
      case DistribusiStatus.terdistribusi:
        return 'default';
      case DistribusiStatus.pending:
        return 'secondary';
      case DistribusiStatus.dalamProses:
        return 'outline';
      case DistribusiStatus.tidakTerkirim:
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const formatDate = (timestamp: bigint): string => {
    const date = new Date(Number(timestamp) / 1000000);
    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  const filteredDistribusi = distribusiList.filter((d) => {
    const sasaran = sasaranList.find((s) => s.id === d.idSasaran);
    const paket = paketList.find((p) => p.id === d.idPaket);
    return (
      sasaran?.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      paket?.nama.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const resetForm = () => {
    setFormData({
      selectedSasaranIds: [],
      idPaket: '',
      jumlahPaket: '',
      tanggalDistribusi: new Date().toISOString().split('T')[0],
      statusDistribusi: DistribusiStatus.terdistribusi,
      keterangan: '',
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
          // Reset form fields but keep dialog open to show result
          setFormData((prev) => ({
            ...prev,
            selectedSasaranIds: [],
            keterangan: '',
          }));
        },
      }
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-emerald-900">Data Distribusi</h2>
          <p className="text-muted-foreground">Catat dan pantau distribusi paket MBG</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="mr-2 h-4 w-4" />
              Catat Distribusi
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Catat Distribusi Baru</DialogTitle>
              <DialogDescription>
                Pilih penerima manfaat per desa, lalu isi detail distribusi paket MBG
              </DialogDescription>
            </DialogHeader>

            <ScrollArea className="max-h-[75vh] pr-1">
              {/* Batch result feedback */}
              {batchResult && (
                <div className="mb-4 space-y-2">
                  {batchResult.sukses.length > 0 && (
                    <Alert className="border-emerald-200 bg-emerald-50">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      <AlertTitle className="text-emerald-800">
                        {batchResult.sukses.length} distribusi berhasil dicatat
                      </AlertTitle>
                      <AlertDescription className="text-emerald-700">
                        Data distribusi telah tersimpan untuk {batchResult.sukses.length} penerima manfaat.
                      </AlertDescription>
                    </Alert>
                  )}
                  {batchResult.gagal.length > 0 && (
                    <Alert variant="destructive">
                      <XCircle className="h-4 w-4" />
                      <AlertTitle>{batchResult.gagal.length} distribusi gagal</AlertTitle>
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
                  {/* Beneficiary checklist selector */}
                  <div className="space-y-2">
                    <Label>
                      Penerima Manfaat *{' '}
                      <span className="text-xs font-normal text-muted-foreground">
                        (pilih satu atau lebih per desa)
                      </span>
                    </Label>
                    <BeneficiaryChecklistSelector
                      sasaranList={sasaranList}
                      selectedIds={formData.selectedSasaranIds}
                      onChange={(ids) => setFormData({ ...formData, selectedSasaranIds: ids })}
                      disabled={isAdding}
                    />
                    {formData.selectedSasaranIds.length === 0 && (
                      <p className="text-xs text-destructive">
                        Pilih minimal satu penerima manfaat
                      </p>
                    )}
                  </div>

                  {/* Package selection */}
                  <div className="space-y-2">
                    <Label htmlFor="idPaket">Paket MBG *</Label>
                    <Select
                      value={formData.idPaket}
                      onValueChange={(value) => setFormData({ ...formData, idPaket: value })}
                      disabled={isAdding}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih paket" />
                      </SelectTrigger>
                      <SelectContent>
                        {paketList.map((paket) => (
                          <SelectItem key={paket.id.toString()} value={paket.id.toString()}>
                            {paket.nama} ({getJenisLabel(paket.jenis)})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Quantity */}
                  <div className="space-y-2">
                    <Label htmlFor="jumlahPaket">Jumlah Paket *</Label>
                    <Input
                      id="jumlahPaket"
                      type="number"
                      min="1"
                      value={formData.jumlahPaket}
                      onChange={(e) => setFormData({ ...formData, jumlahPaket: e.target.value })}
                      required
                      disabled={isAdding}
                    />
                  </div>

                  {/* Date */}
                  <div className="space-y-2">
                    <Label htmlFor="tanggalDistribusi">Tanggal Distribusi *</Label>
                    <Input
                      id="tanggalDistribusi"
                      type="date"
                      value={formData.tanggalDistribusi}
                      onChange={(e) => setFormData({ ...formData, tanggalDistribusi: e.target.value })}
                      required
                      disabled={isAdding}
                    />
                  </div>

                  {/* Status */}
                  <div className="space-y-2">
                    <Label htmlFor="statusDistribusi">Status Distribusi *</Label>
                    <Select
                      value={formData.statusDistribusi}
                      onValueChange={(value) =>
                        setFormData({ ...formData, statusDistribusi: value as DistribusiStatus })
                      }
                      disabled={isAdding}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={DistribusiStatus.terdistribusi}>Terdistribusi</SelectItem>
                        <SelectItem value={DistribusiStatus.pending}>Pending</SelectItem>
                        <SelectItem value={DistribusiStatus.dalamProses}>Dalam Proses</SelectItem>
                        <SelectItem value={DistribusiStatus.tidakTerkirim}>Tidak Terkirim</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Notes */}
                  <div className="space-y-2">
                    <Label htmlFor="keterangan">Keterangan (Opsional)</Label>
                    <Textarea
                      id="keterangan"
                      value={formData.keterangan}
                      onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
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
                        Simpan {formData.selectedSasaranIds.length > 0
                          ? `(${formData.selectedSasaranIds.length} penerima)`
                          : 'Data'}
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
          <CardDescription>Total: {distribusiList.length} distribusi tercatat</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Cari berdasarkan nama penerima atau paket..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
            </div>
          ) : filteredDistribusi.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              {searchTerm ? 'Tidak ada data yang sesuai dengan pencarian' : 'Belum ada data distribusi'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
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
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDistribusi.map((distribusi) => {
                    const sasaran = sasaranList.find((s) => s.id === distribusi.idSasaran);
                    const paket = paketList.find((p) => p.id === distribusi.idPaket);
                    return (
                      <TableRow key={distribusi.id.toString()}>
                        <TableCell className="font-medium">{distribusi.id.toString()}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            {formatDate(distribusi.tanggalDistribusi)}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{sasaran?.nama || 'N/A'}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {sasaran?.alamat || '-'}
                        </TableCell>
                        <TableCell>{paket?.nama || 'N/A'}</TableCell>
                        <TableCell>{distribusi.jumlahPaket.toString()} paket</TableCell>
                        <TableCell>
                          <Badge variant={getStatusVariant(distribusi.statusDistribusi)}>
                            {getStatusLabel(distribusi.statusDistribusi)}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">{distribusi.keterangan || '-'}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
