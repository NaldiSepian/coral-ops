# 05 — Integrasi Maps Leaflet
> Menambahkan fitur lokasi dan peta interaktif ke dalam aplikasi.

Coral-Ops menggunakan **Leaflet** karena ringan dan tidak membutuhkan API Key berbayar seperti Google Maps.

---

## 1. Instalasi Library
```bash
npm install leaflet react-leaflet
npm install -D @types/leaflet
```

---

## 2. Membuat Komponen Map Picker
Komponen ini memungkinkan Supervisor memilih lokasi proyek dengan mengklik peta.

```tsx
"use client"

import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet"
import "leaflet/dist/leaflet.css"

function LocationMarker({ position, setPosition }: any) {
  useMapEvents({
    click(e) {
      setPosition(e.latlng)
    },
  })

  return position === null ? null : <Marker position={position} />
}

export default function MapPicker({ setPosition, position }: any) {
  return (
    <MapContainer center={[-2.97, 104.75]} zoom={13} className="h-64 rounded-md">
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <LocationMarker position={position} setPosition={setPosition} />
    </MapContainer>
  )
}
```

---

## 3. Mengambil Lokasi GPS User (Teknisi)
Gunakan API Geolocation bawaan browser saat teknisi mengirim laporan.

```typescript
const getLocation = () => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition((pos) => {
      const { latitude, longitude } = pos.coords
      // Kirim koordinat ini ke API
      console.log(latitude, longitude)
    })
  }
}
```

---

## 4. Penanganan Dynamic Import
Karena Leaflet mengakses objek `window`, kita harus me-load komponen ini secara dinamis di Next.js agar tidak error saat SSR.

```tsx
import dynamic from "next/dynamic"

const MapPicker = dynamic(() => import("@/components/shared/MapPicker"), { 
  ssr: false,
  loading: () => <div className="h-64 bg-muted animate-pulse rounded-md" />
})
```

---

## 💡 Tips Coding
- Gunakan Tile Layer dari OpenStreetMap.
- Pastikan kamu sudah mengimpor `leaflet/dist/leaflet.css` agar peta tidak berantakan.

---

**Langkah Selanjutnya:**
[06 — Logika BWM Engine](./06_LOGIKA_BWM_ENGINE.md)
