# 03 — Pembuatan API Routes
> Membangun jembatan komunikasi antara Frontend dan Database.

Di Next.js 15, API dikembangkan menggunakan fungsi asinkron di dalam file `route.ts`.

---

## 1. Struktur Folder API
Folder `app/api/` mengikuti struktur URL. Contoh:
- `app/api/penugasan/route.ts` → `GET/POST /api/penugasan`
- `app/api/penugasan/[id]/route.ts` → `GET/PUT /api/penugasan/123`

---

## 2. Implementasi GET (Fetch Data)
```typescript
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('penugasan')
    .select('*, profil(nama)')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  
  return NextResponse.json(data)
}
```

---

## 3. Implementasi POST (Insert Data)
Saat mengirim data, kita harus melakukan validasi body request.

```typescript
export async function POST(request: Request) {
  const supabase = await createClient()
  const body = await request.json()

  // Simpan ke database
  const { data, error } = await supabase
    .from('penugasan')
    .insert([
      { 
        judul: body.judul, 
        kategori: body.kategori,
        supervisor_id: (await supabase.auth.getUser()).data.user?.id 
      }
    ])
    .select()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  
  return NextResponse.json(data, { status: 201 })
}
```

---

## 4. Penanganan Error & Status Code
Selalu gunakan status code yang tepat:
- **200 OK**: Request berhasil.
- **201 Created**: Berhasil membuat data baru.
- **400 Bad Request**: Input user salah.
- **401 Unauthorized**: User belum login.
- **500 Internal Server Error**: Ada bug di server.

---

## 💡 Tips Coding
- Gunakan `try...catch` untuk menangkap error yang tidak terduga.
- Lakukan validasi input menggunakan library seperti **Zod** untuk keamanan ekstra.

---

**Langkah Selanjutnya:**
[04 — Form dan Components](./04_FORM_DAN_COMPONENTS.md)
