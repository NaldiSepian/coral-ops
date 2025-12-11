# Perubahan Struktur Tabel bukti_laporan

## Masalah Struktur Lama
Struktur lama menggunakan **2 rows per pair** dengan kolom `tipe` enum ('Before'/'After'):
```sql
-- OLD STRUCTURE
id | laporan_id | pair_key | tipe    | foto_url      | judul | deskripsi
1  | 10         | uuid-123 | Before  | /before.jpg   | Panel | Rusak
2  | 10         | uuid-123 | After   | /after.jpg    | Panel | Rusak
```

**Kekurangan:**
- Query lebih kompleks (perlu GROUP BY dan CASE statements)
- Data integrity lebih rentan (bisa ada before tanpa after, atau sebaliknya)
- Perlu 2 INSERT untuk satu pair
- JOIN atau grouping logic diperlukan untuk menampilkan pairs

## Struktur Baru (Robust)
Struktur baru menggunakan **1 row per pair** dengan kolom `before_foto_url` dan `after_foto_url`:
```sql
-- NEW STRUCTURE
id | laporan_id | pair_key | judul | deskripsi | before_foto_url | after_foto_url
1  | 10         | uuid-123 | Panel | Rusak     | /before.jpg     | /after.jpg
```

**Keuntungan:**
- ✅ Query lebih simple (SELECT langsung tanpa grouping)
- ✅ Data integrity terjamin (before dan after selalu ada dalam 1 row)
- ✅ 1 INSERT untuk satu pair
- ✅ Tidak perlu JOIN atau grouping logic
- ✅ Lebih intuitif dan mudah di-maintain

## Migration Steps

### 1. Jalankan Migration SQL
```bash
# Di Supabase SQL Editor
psql < database/migration-bukti-laporan-restructure.sql
```

### 2. Perubahan Kode
- ✅ `app/api/penugasan/[id]/laporan/route.ts` - Insert logic updated
- ✅ `app/api/teknisi/laporan/[id]/route.ts` - Fetch logic simplified
- ✅ `lib/penugasan/types.ts` - BuktiLaporan interface updated
- ✅ `database/database.sql` - Schema updated
- ✅ Frontend (`progress-dialog.tsx`) - No changes needed (API contract remains the same)

### 3. API Contract (Unchanged)
Frontend tetap mengirim format yang sama:
```typescript
{
  pairs: [
    {
      pair_key: "uuid",
      judul: "Panel",
      deskripsi: "Rusak",
      before: { foto_url: "/before.jpg" },
      after: { foto_url: "/after.jpg" }
    }
  ]
}
```

Backend sekarang menyimpan dalam 1 row dengan `before_foto_url` dan `after_foto_url`.

## Rollback (Jika Diperlukan)
Jika perlu rollback ke struktur lama:
```sql
-- Restore from backup
DROP TABLE bukti_laporan;
CREATE TABLE bukti_laporan AS SELECT * FROM bukti_laporan_backup;
```

## Testing Checklist
- [ ] Jalankan migration SQL di database
- [ ] Test create laporan dengan before/after photos
- [ ] Test fetch laporan detail dan verify pairs tampil dengan benar
- [ ] Verify foto before dan after keduanya muncul di UI
- [ ] Check console untuk errors atau warnings
