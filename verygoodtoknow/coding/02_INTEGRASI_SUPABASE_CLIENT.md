# 02 — Integrasi Supabase Client
> Menghubungkan aplikasi Next.js dengan database dan sistem autentikasi.

Next.js 15 App Router membutuhkan cara khusus untuk mengelola sesi user antara server dan browser. Kita menggunakan `@supabase/ssr`.

---

## 1. Instalasi Dependency
```bash
npm install @supabase/ssr @supabase/supabase-js
```

---

## 2. Setup Client Helper
Buat folder `lib/supabase/` dan tambahkan file berikut untuk mempermudah akses database:

### Server Client (`lib/supabase/server.ts`)
Digunakan di Server Components dan API Routes.
```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )
}
```

---

## 3. Middleware Autentikasi
Buat file `middleware.ts` di root folder. Middleware ini bertugas memastikan sesi user tetap aktif dan melindungi folder `/views`.

```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(...)
  
  // Refresh session
  const { data: { user } } = await supabase.auth.getUser()
  
  // Redirect jika belum login
  if (!user && request.nextUrl.pathname.startsWith('/views')) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  return response
}
```

---

## 💡 Tips Coding
- Pastikan variabel lingkungan (`NEXT_PUBLIC_...`) sudah didaftarkan di file `.env.local`.
- Jangan pernah membocorkan `SERVICE_ROLE_KEY` ke sisi client (browser).

---

**Langkah Selanjutnya:**
[03 — Pembuatan API Routes](./03_PEMBUATAN_API_ROUTES.md)
