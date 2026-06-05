"use client";

import { Suspense, useState } from "react";
import { AlatList } from "@/components/alat/alat-list";

export default function PeminjamanAlatPage() {
  return (
    <PeminjamanAlatPageContent />
  );
}

function PeminjamanAlatPageContent() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Peminjaman Alat</h1>
          <p className="text-muted-foreground">
            Lihat inventaris alat yang tersedia untuk peminjaman
          </p>
        </div>
      </div>

      <Suspense fallback={<div>Loading...</div>}>
        <AlatList refreshTrigger={refreshTrigger} isReadOnly={true} />
      </Suspense>
    </div>
  );
}