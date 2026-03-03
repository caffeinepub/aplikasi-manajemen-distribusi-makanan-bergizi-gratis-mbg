import { useState } from 'react';
import { useGetSemuaSasaran, useTambahSasaran, useUbahStatusSasaran } from '../hooks/useQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Loader2, UserCheck, UserX } from 'lucide-react';
import { Status, Kategori } from '../backend';

export default function SasaranPage() {
  const { data: sasaranList = [], isLoading } = useGetSemuaSasaran();
  const { mutate: tambahSasaran, isPending: isAdding } = useTambahSasaran();
  const { mutate: ubahStatus, isPending: isUpdating } = useUbahStatusSasaran();

  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    nama: '',
    alamat: '',
    nomorIdentitas: '',
    catatan: '',
    kategori: Kategori.ibuHamil,
  });

  const filteredSasaran = sasaranList.filter((s) =>
    s.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.alamat.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.nomorIdentitas.includes(searchTerm)
  );

  const getKategoriLabel = (kategori: Kategori): string => {
    switch (kategori) {
      case Kategori.ibuHamil:
        return 'Ibu Hamil';
      case Kategori.ibuMenyusui:
        return 'Ibu Menyusui';
      case Kategori.balita:
        return 'Balita';
      case Kategori.tidakDitentukan:
        return 'Tidak Ditentukan';
      default:
        return 'Tidak Ditentukan';
    }
  };

  const getKategoriBadgeVariant = (kategori: Kategori): 'default' | 'secondary' | 'outline' => {
    switch (kategori) {
      case Kategori.ibuHamil:
        return 'default';
      case Kategori.ibuMenyusui:
        return 'secondary';
      case Kategori.balita:
        return 'outline';
      default:
        return 'outline';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    tambahSasaran(
      {
        nama: formData.nama,
        alamat: formData.alamat,
        nomorIdentitas: formData.nomorIdentitas,
        catatan: formData.catatan || null,
        kategori: formData.kategori,
      },
      {
        onSuccess: () => {
          setIsDialogOpen(false);
          setFormData({
            nama: '',
            alamat: '',
            nomorIdentitas: '',
            catatan: '',
            kategori: Kategori.ibuHamil,
          });
        },
      }
    );
  };

  const handleToggleStatus = (id: bigint, currentStatus: Status) => {
    const isAktif = currentStatus === Status.aktif;
    ubahStatus({ id, aktif: !isAktif });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-emerald-900">Data Sasaran Penerima</h2>
          <p className="text-muted-foreground">Kelola data penerima manfaat B3</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="mr-2 h-4 w-4" />
              Tambah Sasaran
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Tambah Sasaran Baru</DialogTitle>
              <DialogDescription>
                Masukkan data penerima manfaat baru
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nama">Nama Lengkap *</Label>
                <Input
                  id="nama"
                  value={formData.nama}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                  required
                  disabled={isAdding}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nomorIdentitas">Nomor Identitas (KTP/NIK) *</Label>
                <Input
                  id="nomorIdentitas"
                  value={formData.nomorIdentitas}
                  onChange={(e) => setFormData({ ...formData, nomorIdentitas: e.target.value })}
                  required
                  disabled={isAdding}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="kategori">Kategori Penerima *</Label>
                <Select
                  value={formData.kategori}
                  onValueChange={(value) => setFormData({ ...formData, kategori: value as Kategori })}
                  disabled={isAdding}
                >
                  <SelectTrigger id="kategori">
                    <SelectValue placeholder="Pilih kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={Kategori.ibuHamil}>Ibu Hamil</SelectItem>
                    <SelectItem value={Kategori.ibuMenyusui}>Ibu Menyusui</SelectItem>
                    <SelectItem value={Kategori.balita}>Balita</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="alamat">Alamat Lengkap *</Label>
                <Textarea
                  id="alamat"
                  value={formData.alamat}
                  onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
                  required
                  disabled={isAdding}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="catatan">Catatan (Opsional)</Label>
                <Textarea
                  id="catatan"
                  value={formData.catatan}
                  onChange={(e) => setFormData({ ...formData, catatan: e.target.value })}
                  disabled={isAdding}
                  rows={2}
                />
              </div>
              <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={isAdding}>
                {isAdding ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  'Simpan Data'
                )}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Sasaran Penerima</CardTitle>
          <CardDescription>
            Total: {sasaranList.length} sasaran terdaftar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Cari berdasarkan nama, alamat, atau nomor identitas..."
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
          ) : filteredSasaran.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              {searchTerm ? 'Tidak ada data yang sesuai dengan pencarian' : 'Belum ada data sasaran'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Nama</TableHead>
                    <TableHead>Kategori</TableHead>
                    <TableHead>Nomor Identitas</TableHead>
                    <TableHead>Alamat</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Catatan</TableHead>
                    <TableHead>Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSasaran.map((sasaran) => (
                    <TableRow key={sasaran.id.toString()}>
                      <TableCell className="font-medium">{sasaran.id.toString()}</TableCell>
                      <TableCell className="font-medium">{sasaran.nama}</TableCell>
                      <TableCell>
                        <Badge variant={getKategoriBadgeVariant(sasaran.kategori)}>
                          {getKategoriLabel(sasaran.kategori)}
                        </Badge>
                      </TableCell>
                      <TableCell>{sasaran.nomorIdentitas}</TableCell>
                      <TableCell className="max-w-xs truncate">{sasaran.alamat}</TableCell>
                      <TableCell>
                        <Badge variant={sasaran.status === Status.aktif ? 'default' : 'secondary'}>
                          {sasaran.status === Status.aktif ? 'Aktif' : 'Non-Aktif'}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">{sasaran.catatan || '-'}</TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleStatus(sasaran.id, sasaran.status)}
                          disabled={isUpdating}
                        >
                          {sasaran.status === Status.aktif ? (
                            <>
                              <UserX className="mr-1 h-3 w-3" />
                              Non-Aktifkan
                            </>
                          ) : (
                            <>
                              <UserCheck className="mr-1 h-3 w-3" />
                              Aktifkan
                            </>
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
