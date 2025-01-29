# WhatsApp Sender

Aplikasi untuk mengirim pesan WhatsApp secara otomatis dengan fitur delay random dan template pesan.

## Fitur

- 🚀 Pengiriman pesan otomatis
- 📝 Template pesan random
- ⏱️ Delay random antara pengiriman
- 🔄 Retry otomatis jika gagal
- 📊 Laporan hasil pengiriman

## Scripts

Tersedia beberapa command untuk menjalankan aplikasi:

```bash
# Development mode dengan auto-reload
pnpm dev

# Production mode
pnpm start

# Build aplikasi
pnpm build

# Jalankan hasil build
pnpm serve
```

Penjelasan scripts:
- `dev`: Mode development dengan fitur auto-reload saat ada perubahan kode
- `start`: Menjalankan aplikasi langsung tanpa auto-reload
- `build`: Mengkompilasi TypeScript ke JavaScript di folder `dist`
- `serve`: Menjalankan versi JavaScript yang sudah di-build (lebih cepat)

⚠️ **Penting**: Jika mengubah template pesan atau daftar penerima:
1. Jika menggunakan `pnpm serve`, harus di-build ulang:
   ```bash
   pnpm build && pnpm serve
   ```
2. Atau lebih mudah gunakan mode development:
   ```bash
   pnpm dev
   ```
   Mode ini akan otomatis memuat perubahan tanpa perlu build ulang.

## Konfigurasi

Konfigurasi dapat diubah di `src/config/env.ts`:

```typescript
// WhatsApp client settings
HEADLESS: false,           // true = browser tersembunyi, false = browser terlihat
SESSION_PATH: "./config/session",

// Delay pengiriman per pesan
MIN_DELAY_PER_MESSAGE: 15000,  // minimal 15 detik
MAX_DELAY_PER_MESSAGE: 20000,  // maksimal 20 detik

// Delay tambahan setiap 5 pesan
MIN_DELAY_PER_5_MESSAGES: 20000,  // minimal 20 detik
MAX_DELAY_PER_5_MESSAGES: 30000,  // maksimal 30 detik
```

## Cara Penggunaan

1. Install dependencies:
```bash
pnpm install
```

2. Setup nomor penerima di `src/data/recipients.ts`:
```typescript
export const recipients = [
    "6281234567890",
    "6289876543210",
    // ... tambahkan nomor lainnya
];
```

3. Setup template pesan di `src/data/template.ts`:
```typescript
export const messagesTemplate = [
    {
        id: 1,
        message: "Pesan template 1"
    },
    {
        id: 2,
        message: "Pesan template 2"
    },
    // ... tambahkan template lainnya
];
```

4. Jalankan aplikasi:
```bash
pnpm dev
```

5. Scan QR code yang muncul dengan WhatsApp di HP

## Alur Pengiriman

1. Aplikasi akan mengirim pesan ke setiap nomor secara berurutan
2. Antara setiap pesan akan ada delay random 15-20 detik
3. Setiap 5 pesan, akan ada delay tambahan 20-30 detik
4. Jika pengiriman gagal, akan ada 3x percobaan ulang

## Monitoring

Aplikasi akan menampilkan:
- Status koneksi WhatsApp
- Progress pengiriman pesan
- Durasi delay antar pengiriman
- Laporan hasil pengiriman (sukses/gagal)

## Error Handling

- Validasi format nomor telepon
- Pengecekan nomor terdaftar di WhatsApp
- Retry otomatis jika gagal
- Laporan detail jika ada error

## Tips Penggunaan

1. Pastikan nomor WhatsApp sudah terverifikasi
2. Jangan menggunakan delay terlalu cepat untuk menghindari pemblokiran
3. Gunakan template pesan yang bervariasi
4. Monitor pengiriman untuk memastikan tidak ada masalah

## Troubleshooting

1. Jika QR code tidak muncul:
   - Pastikan tidak ada sesi browser yang tersisa
   - Hapus folder session dan coba lagi

2. Jika pengiriman gagal:
   - Cek format nomor (harus dengan kode negara)
   - Pastikan nomor terdaftar di WhatsApp
   - Cek koneksi internet

3. Jika terjadi error:
   - Cek log error untuk detail
   - Restart aplikasi jika perlu
