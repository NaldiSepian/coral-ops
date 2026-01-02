# Belajar Konsep Fundamental

File ini dibuat untuk mempelajari konsep-konsep fundamental dalam pengembangan frontend modern.

## React Fundamentals

### Hooks
Hooks adalah fitur di React yang memungkinkan penggunaan state dan lifecycle dalam komponen fungsional. Contoh hooks umum:
- `useState`: Mengelola state lokal dalam komponen.
- `useEffect`: Menjalankan efek samping seperti fetching data atau subscriptions.
- `useContext`: Mengakses context tanpa prop drilling.

### State
State adalah data yang dapat berubah dalam komponen. Di React, state dikelola dengan `useState` hook. State bersifat lokal dan memicu re-render saat berubah.

### Props
Props adalah cara untuk meneruskan data dari komponen induk ke anak. Props bersifat read-only dan digunakan untuk komunikasi antar komponen.

#### Contoh Kode
```tsx
// Komponen dengan useState dan props
import { useState } from 'react';

interface UserCardProps {
  name: string;
  age: number;
}

function UserCard({ name, age }: UserCardProps) {
  const [likes, setLikes] = useState(0);

  return (
    <div>
      <h2>{name}, {age} tahun</h2>
      <p>Likes: {likes}</p>
      <button onClick={() => setLikes(likes + 1)}>Like</button>
    </div>
  );
}

export default UserCard;
```

## Next.js

### App Router vs Pages Router
- **Pages Router**: Struktur berbasis file di folder `pages/`. Setiap file menjadi route.
- **App Router**: Struktur baru di folder `app/` dengan layout dan nested routes. Lebih fleksibel untuk kompleksitas tinggi.

### API Routes
API routes di Next.js memungkinkan pembuatan endpoint server-side di folder `pages/api/` atau `app/api/`. Digunakan untuk handling requests seperti POST, GET, dll.

### SSR/SSG
- **SSR (Server-Side Rendering)**: Halaman dirender di server untuk setiap request, baik untuk SEO dan performa awal.
- **SSG (Static Site Generation)**: Halaman dibangun statis saat build, cocok untuk konten yang jarang berubah.

#### Contoh Kode
```tsx
// app/page.tsx (App Router)
export default function Home() {
  return (
    <main className="min-h-screen flex flex-col bg-background">
      <h1>Selamat Datang di CoralOps</h1>
    </main>
  );
}
```

```ts
// app/api/users/route.ts (API Route)
import { NextResponse } from 'next/server';

export async function GET() {
  const users = [{ id: 1, name: 'John' }];
  return NextResponse.json(users);
}
```

## Tailwind CSS

Tailwind CSS adalah utility-first CSS framework untuk styling cepat dan maintainable. Fokus pada class utility seperti `bg-blue-500`, `text-center`, dll. Menggunakan konfigurasi di `tailwind.config.js` untuk tema dan responsivitas.

#### Contoh Kode
```tsx
// Komponen dengan Tailwind styling
function Button({ children }: { children: React.ReactNode }) {
  return (
    <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
      {children}
    </button>
  );
}
```

## REST API Basics, JSON, and Modern Frontend Workflows

### REST API Basics
REST (Representational State Transfer) adalah arsitektur untuk API web. Menggunakan HTTP methods: GET, POST, PUT, DELETE. Endpoint seperti `/api/users` untuk operasi CRUD.

### JSON
JSON (JavaScript Object Notation) adalah format data ringan untuk pertukaran data. Contoh: `{"name": "John", "age": 30}`. Digunakan dalam API responses.

### Modern Frontend Workflows
Workflow modern melibatkan tools seperti Vite, Webpack untuk bundling, ESLint untuk linting, dan CI/CD untuk deployment. Fokus pada component-based architecture, state management (Redux/Zustand), dan testing (Jest/React Testing Library).

#### Contoh Kode
```tsx
// Fetch data dari API di komponen
import { useEffect, useState } from 'react';

function UsersList() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetch('/api/users')
      .then(res => res.json())
      .then(data => setUsers(data));
  }, []);

  return (
    <ul>
      {users.map(user => <li key={user.id}>{user.name}</li>)}
    </ul>
  );
}
```