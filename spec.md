# Aplikasi Manajemen Distribusi Makanan Bergizi Gratis (MBG)

## Current State
Aplikasi sudah memiliki fitur catat distribusi batched dengan checklist penerima per desa. Tabel distribusi menampilkan data yang sudah dicatat. Belum ada fitur edit data distribusi yang sudah tersimpan.

## Requested Changes (Diff)

### Add
- Fungsi backend `editDistribusi` untuk mengubah data distribusi yang sudah ada (tanggal, paket, jumlah, status, keterangan)
- Tombol Edit di setiap baris tabel distribusi
- Dialog edit distribusi dengan form pre-filled data yang ada
- Hook `useEditDistribusi` untuk memanggil API edit

### Modify
- `DistribusiPage.tsx`: tambah kolom Aksi di tabel, tambah dialog edit
- `main.mo`: tambah fungsi `editDistribusi`

### Remove
- Tidak ada yang dihapus

## Implementation Plan
1. Tambah fungsi `editDistribusi` di `main.mo` yang menerima id dan field-field yang dapat diubah
2. Tambah hook `useEditDistribusi` di `useQueries.ts`
3. Update `DistribusiPage.tsx` dengan tombol edit, state edit, dan dialog edit
