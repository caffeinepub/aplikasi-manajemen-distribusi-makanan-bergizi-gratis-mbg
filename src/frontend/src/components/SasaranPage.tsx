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
import {
  FileDown,
  Loader2,
  Plus,
  Search,
  UserCheck,
  UserX,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Kategori, Status } from "../backend";
import {
  useGetSemuaSasaran,
  useTambahSasaran,
  useUbahStatusSasaran,
} from "../hooks/useQueries";

export default function SasaranPage() {
  const { data: sasaranList = [], isLoading } = useGetSemuaSasaran();
  const { mutate: tambahSasaran, isPending: isAdding } = useTambahSasaran();
  const { mutate: ubahStatus, isPending: isUpdating } = useUbahStatusSasaran();

  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [formData, setFormData] = useState({
    nama: "",
    alamat: "",
    nomorIdentitas: "",
    catatan: "",
    kategori: Kategori.ibuHamil,
  });

  const filteredSasaran = sasaranList.filter(
    (s) =>
      s.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.alamat.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.nomorIdentitas.includes(searchTerm),
  );

  const getKategoriLabel = (kategori: Kategori): string => {
    switch (kategori) {
      case Kategori.ibuHamil:
        return "Ibu Hamil";
      case Kategori.ibuMenyusui:
        return "Ibu Menyusui";
      case Kategori.balita:
        return "Balita";
      case Kategori.tidakDitentukan:
        return "Tidak Ditentukan";
      default:
        return "Tidak Ditentukan";
    }
  };

  const getKategoriBadgeVariant = (
    kategori: Kategori,
  ): "default" | "secondary" | "outline" => {
    switch (kategori) {
      case Kategori.ibuHamil:
        return "default";
      case Kategori.ibuMenyusui:
        return "secondary";
      case Kategori.balita:
        return "outline";
      default:
        return "outline";
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
            nama: "",
            alamat: "",
            nomorIdentitas: "",
            catatan: "",
            kategori: Kategori.ibuHamil,
          });
        },
      },
    );
  };

  const handleToggleStatus = (id: bigint, currentStatus: Status) => {
    const isAktif = currentStatus === Status.aktif;
    ubahStatus({ id, aktif: !isAktif });
  };

  const downloadRekapanPDF = async () => {
    if (sasaranList.length === 0) {
      toast.error("Tidak ada data sasaran untuk diunduh.");
      return;
    }
    setIsDownloading(true);
    try {
      const jsPDFModule = (window as any).jspdf;
      if (!jsPDFModule || !jsPDFModule.jsPDF) {
        toast.error("Library PDF tidak tersedia. Silakan refresh halaman.");
        return;
      }
      const { jsPDF } = jsPDFModule;
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 14;
      const contentWidth = pageWidth - margin * 2;
      let yPos = 20;

      // Header
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("REKAPAN DATA SASARAN PENERIMA MBG", pageWidth / 2, yPos, {
        align: "center",
      });
      yPos += 7;
      doc.setFontSize(11);
      doc.text(
        "UPTD DALDUK PKK - DP2KBP3A Kecamatan Cisalak",
        pageWidth / 2,
        yPos,
        { align: "center" },
      );
      yPos += 6;
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      const tglCetak = new Date().toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });
      doc.text(`Dicetak: ${tglCetak}`, pageWidth / 2, yPos, {
        align: "center",
      });
      yPos += 10;

      // Divider
      doc.setDrawColor(16, 185, 129);
      doc.setLineWidth(0.5);
      doc.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 8;

      // Summary stats
      const ibuHamilCount = sasaranList.filter(
        (s) => s.kategori === Kategori.ibuHamil,
      ).length;
      const ibuMenyusuiCount = sasaranList.filter(
        (s) => s.kategori === Kategori.ibuMenyusui,
      ).length;
      const balitaCount = sasaranList.filter(
        (s) => s.kategori === Kategori.balita,
      ).length;
      const aktifCount = sasaranList.filter(
        (s) => s.status === Status.aktif,
      ).length;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text("RINGKASAN DATA", margin, yPos);
      yPos += 7;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      const summaryRows: [string, string][] = [
        ["Total Sasaran Terdaftar", `${sasaranList.length} orang`],
        ["Status Aktif", `${aktifCount} orang`],
        ["Status Non-Aktif", `${sasaranList.length - aktifCount} orang`],
        ["Ibu Hamil", `${ibuHamilCount} orang`],
        ["Ibu Menyusui", `${ibuMenyusuiCount} orang`],
        ["Balita", `${balitaCount} orang`],
      ];
      for (const [label, value] of summaryRows) {
        doc.text(`- ${label}:`, margin + 2, yPos);
        doc.text(value, margin + 60, yPos);
        yPos += 5;
      }
      yPos += 8;

      // Separator
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.3);
      doc.line(margin, yPos - 4, pageWidth - margin, yPos - 4);

      // Table title
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text("DAFTAR LENGKAP SASARAN", margin, yPos);
      yPos += 7;

      const colWidths = {
        no: 8,
        nama: 42,
        kategori: 24,
        nik: 32,
        alamat: 45,
        status: 18,
      };

      const drawTableHeader = () => {
        doc.setFillColor(16, 185, 129);
        doc.rect(margin, yPos - 4, contentWidth, 7, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        let x = margin + 1;
        doc.text("No", x, yPos);
        x += colWidths.no;
        doc.text("Nama", x, yPos);
        x += colWidths.nama;
        doc.text("Kategori", x, yPos);
        x += colWidths.kategori;
        doc.text("NIK/No. Identitas", x, yPos);
        x += colWidths.nik;
        doc.text("Alamat", x, yPos);
        x += colWidths.alamat;
        doc.text("Status", x, yPos);
        yPos += 7;
        doc.setTextColor(0, 0, 0);
        doc.setFont("helvetica", "normal");
      };

      drawTableHeader();

      for (let i = 0; i < sasaranList.length; i++) {
        const sasaran = sasaranList[i];
        if (yPos > pageHeight - 25) {
          doc.addPage();
          yPos = 20;
          drawTableHeader();
        }
        if (i % 2 === 0) {
          doc.setFillColor(240, 253, 244);
          doc.rect(margin, yPos - 4, contentWidth, 7, "F");
        }
        doc.setFontSize(8);
        let x = margin + 1;
        doc.text(`${i + 1}`, x, yPos);
        x += colWidths.no;
        const namaText =
          sasaran.nama.length > 26
            ? `${sasaran.nama.substring(0, 23)}...`
            : sasaran.nama;
        doc.text(namaText, x, yPos);
        x += colWidths.nama;
        doc.text(getKategoriLabel(sasaran.kategori), x, yPos);
        x += colWidths.kategori;
        doc.text(sasaran.nomorIdentitas, x, yPos);
        x += colWidths.nik;
        const alamatText =
          sasaran.alamat.length > 28
            ? `${sasaran.alamat.substring(0, 25)}...`
            : sasaran.alamat;
        doc.text(alamatText, x, yPos);
        x += colWidths.alamat;
        doc.text(
          sasaran.status === Status.aktif ? "Aktif" : "Non-Aktif",
          x,
          yPos,
        );
        yPos += 7;
      }

      // Page footers
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(7);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(120, 120, 120);
        doc.text(
          `Halaman ${i} dari ${pageCount} | Rekapan Data Sasaran MBG Kecamatan Cisalak`,
          pageWidth / 2,
          pageHeight - 8,
          { align: "center" },
        );
      }

      const today = new Date();
      const filename = `rekapan_sasaran_MBG_${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}.pdf`;
      doc.save(filename);
      toast.success(
        `Rekapan PDF berhasil diunduh! (${sasaranList.length} data sasaran)`,
      );
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Gagal menghasilkan rekapan. Silakan coba lagi.");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-emerald-900">
            Data Sasaran Penerima
          </h2>
          <p className="text-muted-foreground">
            Kelola data penerima manfaat B3
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={downloadRekapanPDF}
            disabled={isDownloading || isLoading || sasaranList.length === 0}
            className="border-emerald-600 text-emerald-700 hover:bg-emerald-50"
          >
            {isDownloading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Mengunduh...
              </>
            ) : (
              <>
                <FileDown className="mr-2 h-4 w-4" />
                Download Rekapan
              </>
            )}
          </Button>
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
                    onChange={(e) =>
                      setFormData({ ...formData, nama: e.target.value })
                    }
                    required
                    disabled={isAdding}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nomorIdentitas">
                    Nomor Identitas (KTP/NIK) *
                  </Label>
                  <Input
                    id="nomorIdentitas"
                    value={formData.nomorIdentitas}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        nomorIdentitas: e.target.value,
                      })
                    }
                    required
                    disabled={isAdding}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="kategori">Kategori Penerima *</Label>
                  <Select
                    value={formData.kategori}
                    onValueChange={(value) =>
                      setFormData({ ...formData, kategori: value as Kategori })
                    }
                    disabled={isAdding}
                  >
                    <SelectTrigger id="kategori">
                      <SelectValue placeholder="Pilih kategori" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={Kategori.ibuHamil}>
                        Ibu Hamil
                      </SelectItem>
                      <SelectItem value={Kategori.ibuMenyusui}>
                        Ibu Menyusui
                      </SelectItem>
                      <SelectItem value={Kategori.balita}>Balita</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="alamat">Alamat Lengkap *</Label>
                  <Textarea
                    id="alamat"
                    value={formData.alamat}
                    onChange={(e) =>
                      setFormData({ ...formData, alamat: e.target.value })
                    }
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
                    onChange={(e) =>
                      setFormData({ ...formData, catatan: e.target.value })
                    }
                    disabled={isAdding}
                    rows={2}
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
              {searchTerm
                ? "Tidak ada data yang sesuai dengan pencarian"
                : "Belum ada data sasaran"}
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
                      <TableCell className="font-medium">
                        {sasaran.id.toString()}
                      </TableCell>
                      <TableCell className="font-medium">
                        {sasaran.nama}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={getKategoriBadgeVariant(sasaran.kategori)}
                        >
                          {getKategoriLabel(sasaran.kategori)}
                        </Badge>
                      </TableCell>
                      <TableCell>{sasaran.nomorIdentitas}</TableCell>
                      <TableCell className="max-w-xs truncate">
                        {sasaran.alamat}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            sasaran.status === Status.aktif
                              ? "default"
                              : "secondary"
                          }
                        >
                          {sasaran.status === Status.aktif
                            ? "Aktif"
                            : "Non-Aktif"}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {sasaran.catatan || "-"}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleToggleStatus(sasaran.id, sasaran.status)
                          }
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
