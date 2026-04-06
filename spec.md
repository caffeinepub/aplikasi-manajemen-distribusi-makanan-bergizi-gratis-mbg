# Aplikasi Manajemen Distribusi Makanan Bergizi Gratis (MBG)

## Current State
- Halaman DistribusiPage memiliki filter bulan dengan toggle "Semua Bulan"
- Default state: `showAllMonths = true` (tampil semua data)
- Navigasi bulan tersedia (prev/next) tapi hanya aktif saat showAllMonths = false
- Data tersimpan di localStorage, filter hanya untuk tampilan

## Requested Changes (Diff)

### Add
- Tidak ada penambahan fitur baru

### Modify
- Ubah default `showAllMonths` dari `true` menjadi `false`
- Ubah default `selectedMonth` dan `selectedYear` agar menunjuk ke bulan lalu (bukan bulan berjalan)
- Sehingga saat halaman pertama dibuka, langsung tampil data bulan lalu
- Tombol "Semua Bulan" tetap tersedia untuk melihat semua data
- Navigasi bulan (prev/next) tetap berfungsi

### Remove
- Tidak ada

## Implementation Plan
1. Di DistribusiPage.tsx, hitung bulan lalu dari tanggal sekarang
2. Set initial state `selectedMonth` = bulan lalu
3. Set initial state `selectedYear` = tahun yang sesuai (handle kasus Januari -> Desember tahun lalu)
4. Set initial state `showAllMonths = false`
