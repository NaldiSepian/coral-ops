# 04 — Form dan Components
> Membangun antarmuka pengguna yang interaktif dan responsif.

Di Coral-Ops, kita menggunakan **shadcn/ui** untuk komponen dasar dan **React Hook Form** untuk menangani inputan user.

---

## 1. Menyiapkan Komponen UI
Gunakan CLI shadcn untuk menambahkan komponen yang dibutuhkan (jika belum diinstall):
```bash
npx shadcn@latest add button card input label dialog
```
Komponen akan muncul di folder `components/ui/`.

---

## 2. Membuat Form Interaktif
Gunakan `react-hook-form` untuk validasi sisi client.

```tsx
"use client"

import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function CreatePenugasanForm() {
  const { register, handleSubmit } = useForm()

  const onSubmit = async (data: any) => {
    const res = await fetch("/api/penugasan", {
      method: "POST",
      body: JSON.stringify(data)
    })
    if (res.ok) alert("Berhasil!")
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label>Judul Penugasan</label>
        <Input {...register("judul")} placeholder="Masukkan judul..." />
      </div>
      <Button type="submit">Simpan</Button>
    </form>
  )
}
```

---

## 3. Komponen Reusable
Beberapa komponen seperti `StatCard` digunakan berulang kali di berbagai dashboard.

```tsx
// components/dashboard/StatCard.tsx
export function StatCard({ title, value, icon: Icon }: any) {
  return (
    <div className="p-4 border rounded-lg flex items-center gap-4">
      <Icon className="w-8 h-8 text-primary" />
      <div>
        <p className="text-sm text-muted-foreground">{title}</p>
        <h3 className="text-2xl font-bold">{value}</h3>
      </div>
    </div>
  )
}
```

---

## 4. Pola Client & Server Components
- **Server Components**: Gunakan untuk mengambil data dari API/DB (misal: daftar penugasan).
- **Client Components**: Gunakan untuk interaksi (misal: tombol "Mulai Kerja", Form, Modal).

---

## 💡 Tips Coding
- Gunakan library **Lucide React** untuk ikon yang konsisten.
- Manfaatkan **Tailwind CSS** untuk membuat desain yang responsif (mobile-first).

---

**Langkah Selanjutnya:**
[05 — Integrasi Maps Leaflet](./05_INTEGRASI_MAPS_LEAFLET.md)
