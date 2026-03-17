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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Loader2, Package, Plus, Search } from "lucide-react";
import { useState } from "react";
import type { Jenis } from "../backend";
import { useGetSemuaPaket, useTambahPaket } from "../hooks/useQueries";

export default function PaketPage() {
  const { data: paketList = [], isLoading } = useGetSemuaPaket();
  const { mutate: tambahPaket, isPending: isAdding } = useTambahPaket();

  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    nama: "",
    jenis: "paketSembako" as string,
    jenisLainnya: "",
    keterangan: "",
  });

  const filteredPaket = paketList.filter((p) =>
    p.nama.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const getJenisLabel = (jenis: Jenis): string => {
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
        return jenis.lainnya;
      default:
        return "Tidak Diketahui";
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let jenis: Jenis;
    switch (formData.jenis) {
      case "paketSembako":
        jenis = { __kind__: "paketSembako", paketSembako: null };
        break;
      case "makananSiapSaji":
        jenis = { __kind__: "makananSiapSaji", makananSiapSaji: null };
        break;
      case "susuTambahan":
        jenis = { __kind__: "susuTambahan", susuTambahan: null };
        break;
      case "multivitamin":
        jenis = { __kind__: "multivitamin", multivitamin: null };
        break;
      case "lainnya":
        jenis = { __kind__: "lainnya", lainnya: formData.jenisLainnya };
        break;
      default:
        jenis = { __kind__: "paketSembako", paketSembako: null };
    }

    tambahPaket(
      {
        jenis,
        nama: formData.nama,
        keterangan: formData.keterangan || null,
      },
      {
        onSuccess: () => {
          setIsDialogOpen(false);
          setFormData({
            nama: "",
            jenis: "paketSembako",
            jenisLainnya: "",
            keterangan: "",
          });
        },
      },
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-emerald-900">
            Data Paket MBG
          </h2>
          <p className="text-muted-foreground">
            Kelola informasi paket makanan bergizi gratis
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="mr-2 h-4 w-4" />
              Tambah Paket
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Tambah Paket Baru</DialogTitle>
              <DialogDescription>
                Masukkan informasi paket MBG baru
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nama">Nama Paket *</Label>
                <Input
                  id="nama"
                  value={formData.nama}
                  onChange={(e) =>
                    setFormData({ ...formData, nama: e.target.value })
                  }
                  required
                  disabled={isAdding}
                  placeholder="Contoh: Paket Sembako Keluarga"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="jenis">Jenis Paket *</Label>
                <Select
                  value={formData.jenis}
                  onValueChange={(value) =>
                    setFormData({ ...formData, jenis: value })
                  }
                  disabled={isAdding}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih jenis paket" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="paketSembako">Paket Sembako</SelectItem>
                    <SelectItem value="makananSiapSaji">
                      Makanan Siap Saji
                    </SelectItem>
                    <SelectItem value="susuTambahan">Susu Tambahan</SelectItem>
                    <SelectItem value="multivitamin">Multivitamin</SelectItem>
                    <SelectItem value="lainnya">Lainnya</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {formData.jenis === "lainnya" && (
                <div className="space-y-2">
                  <Label htmlFor="jenisLainnya">Jenis Lainnya *</Label>
                  <Input
                    id="jenisLainnya"
                    value={formData.jenisLainnya}
                    onChange={(e) =>
                      setFormData({ ...formData, jenisLainnya: e.target.value })
                    }
                    required
                    disabled={isAdding}
                    placeholder="Sebutkan jenis paket"
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="keterangan">Keterangan (Opsional)</Label>
                <Textarea
                  id="keterangan"
                  value={formData.keterangan}
                  onChange={(e) =>
                    setFormData({ ...formData, keterangan: e.target.value })
                  }
                  disabled={isAdding}
                  rows={3}
                  placeholder="Deskripsi atau detail tambahan tentang paket"
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700"
                disabled={isAdding}
              >
                {isAdding ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  "Simpan Data"
                )}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Paket MBG</CardTitle>
          <CardDescription>
            Total: {paketList.length} paket tersedia
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Cari berdasarkan nama paket..."
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
          ) : filteredPaket.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              {searchTerm
                ? "Tidak ada data yang sesuai dengan pencarian"
                : "Belum ada data paket"}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Nama Paket</TableHead>
                    <TableHead>Jenis</TableHead>
                    <TableHead>Keterangan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPaket.map((paket) => (
                    <TableRow key={paket.id.toString()}>
                      <TableCell className="font-medium">
                        {paket.id.toString()}
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-emerald-600" />
                          {paket.nama}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {getJenisLabel(paket.jenis)}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-md truncate">
                        {paket.keterangan || "-"}
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
