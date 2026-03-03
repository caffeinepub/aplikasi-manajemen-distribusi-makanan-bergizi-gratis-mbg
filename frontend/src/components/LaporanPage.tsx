import { useState } from 'react';
import { useGetSemuaSasaran, useGetSemuaPaket } from '../hooks/useQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileDown, Loader2, Calendar, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useActor } from '../hooks/useActor';
import type { Jenis, Kategori } from '../backend';
import { toast } from 'sonner';

export default function LaporanPage() {
  const { actor } = useActor();
  const { data: sasaranList = [] } = useGetSemuaSasaran();
  const { data: paketList = [] } = useGetSemuaPaket();

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [filterKategori, setFilterKategori] = useState<string>('semua');
  const [isGenerating, setIsGenerating] = useState(false);

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

  const getKategoriLabel = (kategori: Kategori): string => {
    switch (kategori) {
      case 'ibuHamil':
        return 'Ibu Hamil';
      case 'ibuMenyusui':
        return 'Ibu Menyusui';
      case 'balita':
        return 'Balita';
      case 'tidakDitentukan':
        return 'Tidak Ditentukan';
      default:
        return 'Tidak Ditentukan';
    }
  };

  const getStatusLabel = (status: string): string => {
    switch (status) {
      case 'terdistribusi':
        return 'Terdistribusi';
      case 'pending':
        return 'Pending';
      case 'dalamProses':
        return 'Dalam Proses';
      case 'tidakTerkirim':
        return 'Tidak Terkirim';
      default:
        return status;
    }
  };

  const formatDate = (timestamp: bigint): string => {
    const date = new Date(Number(timestamp) / 1000000);
    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatDateForFilename = (dateString: string): string => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const truncateText = (text: string, maxLength: number): string => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
  };

  const generatePDF = async () => {
    if (!startDate || !endDate || !actor) {
      toast.error('Silakan pilih tanggal mulai dan tanggal akhir.');
      return;
    }

    // Validate date range
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (start > end) {
      toast.error('Tanggal mulai harus lebih awal dari tanggal akhir.');
      return;
    }

    setIsGenerating(true);

    try {
      const startTime = BigInt(start.getTime() * 1000000);
      const endTime = BigInt(end.getTime() * 1000000);

      // Fetch data based on filter
      let data;
      if (filterKategori === 'semua') {
        data = await actor.getDataUntukLaporan(startTime, endTime);
      } else {
        data = await actor.getLaporanByKategori(filterKategori as Kategori, startTime, endTime);
      }

      // Validate data
      if (!data.distribusi || data.distribusi.length === 0) {
        toast.error('Tidak ada data distribusi dalam rentang tanggal yang dipilih.');
        setIsGenerating(false);
        return;
      }

      // Access jsPDF from window
      const jsPDFModule = (window as any).jspdf;
      if (!jsPDFModule || !jsPDFModule.jsPDF) {
        toast.error('Library PDF tidak tersedia. Silakan refresh halaman.');
        setIsGenerating(false);
        return;
      }

      const { jsPDF } = jsPDFModule;
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 14;
      const contentWidth = pageWidth - (margin * 2);
      let yPos = 20;

      // Header
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('LAPORAN DISTRIBUSI MAKANAN BERGIZI GRATIS', pageWidth / 2, yPos, { align: 'center' });
      yPos += 7;
      doc.setFontSize(12);
      doc.text('Kecamatan Cisalak', pageWidth / 2, yPos, { align: 'center' });
      yPos += 10;

      // Period and filter info
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const periodText = `Periode: ${start.toLocaleDateString('id-ID')} - ${end.toLocaleDateString('id-ID')}`;
      doc.text(periodText, margin, yPos);
      yPos += 5;
      if (filterKategori !== 'semua') {
        const kategoriText = `Kategori: ${getKategoriLabel(filterKategori as Kategori)}`;
        doc.text(kategoriText, margin, yPos);
        yPos += 5;
      }
      yPos += 5;

      // Summary
      doc.setFont('helvetica', 'bold');
      doc.text('RINGKASAN', margin, yPos);
      yPos += 6;
      doc.setFont('helvetica', 'normal');
      doc.text(`Total Distribusi: ${data.distribusi.length}`, margin, yPos);
      yPos += 5;
      doc.text(`Total Sasaran Terlibat: ${new Set(data.distribusi.map(d => d.idSasaran.toString())).size}`, margin, yPos);
      yPos += 5;
      doc.text(`Total Paket Terdistribusi: ${data.distribusi.reduce((sum, d) => sum + Number(d.jumlahPaket), 0)}`, margin, yPos);
      yPos += 12;

      // Table header
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text('DETAIL DISTRIBUSI', margin, yPos);
      yPos += 6;

      // Table column headers
      const colWidths = {
        no: 8,
        nama: 32,
        kategori: 22,
        paket: 28,
        jumlah: 15,
        tanggal: 22,
        status: 20,
        keterangan: 25,
      };

      // Draw table header background
      doc.setFillColor(16, 185, 129); // emerald-500
      doc.rect(margin, yPos - 4, contentWidth, 7, 'F');
      
      doc.setTextColor(255, 255, 255);
      let xPos = margin + 1;
      doc.text('No', xPos, yPos);
      xPos += colWidths.no;
      doc.text('Nama', xPos, yPos);
      xPos += colWidths.nama;
      doc.text('Kategori', xPos, yPos);
      xPos += colWidths.kategori;
      doc.text('Paket', xPos, yPos);
      xPos += colWidths.paket;
      doc.text('Jml', xPos, yPos);
      xPos += colWidths.jumlah;
      doc.text('Tanggal', xPos, yPos);
      xPos += colWidths.tanggal;
      doc.text('Status', xPos, yPos);
      xPos += colWidths.status;
      doc.text('Keterangan', xPos, yPos);
      
      yPos += 7;
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'normal');

      // Table rows
      data.distribusi.forEach((dist, index) => {
        // Check if we need a new page
        if (yPos > pageHeight - 30) {
          doc.addPage();
          yPos = 20;
          
          // Redraw table header on new page
          doc.setFont('helvetica', 'bold');
          doc.setFillColor(16, 185, 129);
          doc.rect(margin, yPos - 4, contentWidth, 7, 'F');
          doc.setTextColor(255, 255, 255);
          
          xPos = margin + 1;
          doc.text('No', xPos, yPos);
          xPos += colWidths.no;
          doc.text('Nama', xPos, yPos);
          xPos += colWidths.nama;
          doc.text('Kategori', xPos, yPos);
          xPos += colWidths.kategori;
          doc.text('Paket', xPos, yPos);
          xPos += colWidths.paket;
          doc.text('Jml', xPos, yPos);
          xPos += colWidths.jumlah;
          doc.text('Tanggal', xPos, yPos);
          xPos += colWidths.tanggal;
          doc.text('Status', xPos, yPos);
          xPos += colWidths.status;
          doc.text('Keterangan', xPos, yPos);
          
          yPos += 7;
          doc.setTextColor(0, 0, 0);
          doc.setFont('helvetica', 'normal');
        }

        const sasaran = data.sasaran.find((s) => s.id === dist.idSasaran);
        const paket = data.paket.find((p) => p.id === dist.idPaket);

        // Alternate row background
        if (index % 2 === 0) {
          doc.setFillColor(240, 253, 244); // emerald-50
          doc.rect(margin, yPos - 4, contentWidth, 7, 'F');
        }

        xPos = margin + 1;
        doc.text(`${index + 1}`, xPos, yPos);
        xPos += colWidths.no;
        doc.text(truncateText(sasaran?.nama || 'N/A', 20), xPos, yPos);
        xPos += colWidths.nama;
        doc.text(truncateText(getKategoriLabel(sasaran?.kategori || 'tidakDitentukan'), 15), xPos, yPos);
        xPos += colWidths.kategori;
        doc.text(truncateText(paket?.nama || 'N/A', 18), xPos, yPos);
        xPos += colWidths.paket;
        doc.text(dist.jumlahPaket.toString(), xPos, yPos);
        xPos += colWidths.jumlah;
        doc.text(formatDate(dist.tanggalDistribusi), xPos, yPos);
        xPos += colWidths.tanggal;
        doc.text(truncateText(getStatusLabel(dist.statusDistribusi), 15), xPos, yPos);
        xPos += colWidths.status;
        doc.text(truncateText(dist.keterangan || '-', 18), xPos, yPos);

        yPos += 7;
      });

      // Footer on all pages
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 100, 100);
        const footerText = `Halaman ${i} dari ${pageCount} | Dicetak: ${new Date().toLocaleDateString('id-ID')}`;
        doc.text(footerText, pageWidth / 2, pageHeight - 10, { align: 'center' });
      }

      // Generate filename
      const kategoriSuffix = filterKategori !== 'semua' ? `_${filterKategori}` : '';
      const filename = `laporan_MBG_${formatDateForFilename(startDate)}_${formatDateForFilename(endDate)}${kategoriSuffix}.pdf`;
      
      // Save PDF
      doc.save(filename);
      
      toast.success(`Laporan PDF berhasil diunduh! (${data.distribusi.length} data)`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Gagal menghasilkan laporan. Silakan coba lagi.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-emerald-900">Laporan Distribusi</h2>
        <p className="text-muted-foreground">Generate laporan PDF distribusi MBG</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Generate Laporan PDF</CardTitle>
          <CardDescription>
            Pilih periode tanggal dan kategori untuk menghasilkan laporan distribusi
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="startDate">Tanggal Mulai</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                disabled={isGenerating}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">Tanggal Akhir</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                disabled={isGenerating}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="kategori">Filter Kategori Penerima</Label>
            <Select
              value={filterKategori}
              onValueChange={setFilterKategori}
              disabled={isGenerating}
            >
              <SelectTrigger id="kategori">
                <SelectValue placeholder="Pilih kategori" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="semua">Semua Kategori</SelectItem>
                <SelectItem value="ibuHamil">Ibu Hamil</SelectItem>
                <SelectItem value="ibuMenyusui">Ibu Menyusui</SelectItem>
                <SelectItem value="balita">Balita</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={generatePDF}
            disabled={!startDate || !endDate || isGenerating}
            className="w-full bg-emerald-600 hover:bg-emerald-700"
            size="lg"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Menghasilkan Laporan...
              </>
            ) : (
              <>
                <FileDown className="mr-2 h-5 w-5" />
                Download Laporan PDF
              </>
            )}
          </Button>

          <Alert>
            <Calendar className="h-4 w-4" />
            <AlertDescription>
              Laporan akan mencakup semua data distribusi dalam periode yang dipilih.
              Pastikan tanggal mulai lebih awal dari tanggal akhir.
            </AlertDescription>
          </Alert>

          {startDate && endDate && new Date(startDate) > new Date(endDate) && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Tanggal mulai harus lebih awal dari tanggal akhir.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Informasi Laporan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">Total Sasaran Terdaftar</p>
              <p className="text-2xl font-bold text-emerald-900">{sasaranList.length}</p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">Total Paket Tersedia</p>
              <p className="text-2xl font-bold text-emerald-900">{paketList.length}</p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">Format Laporan</p>
              <p className="text-2xl font-bold text-emerald-900">PDF</p>
            </div>
          </div>
          <div className="rounded-lg bg-emerald-50 p-4">
            <p className="text-sm text-emerald-800">
              <strong>Catatan:</strong> Laporan PDF akan mencakup tabel terstruktur dengan kolom: 
              No, Nama Sasaran, Kategori, Paket, Jumlah, Tanggal, Status, dan Keterangan. 
              File akan otomatis diberi nama berdasarkan rentang tanggal dan kategori yang dipilih.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
