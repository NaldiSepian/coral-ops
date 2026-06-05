"use client";

import { Suspense, useState } from "react";
import { AlatList } from "@/components/alat/alat-list";

export default function ManagerInventarisPage() {
  return (
    <ManagerInventarisPageContent />
  );
}

function ManagerInventarisPageContent() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Inventaris Alat</h1>
          <p className="text-muted-foreground">
            Lihat inventaris alat dan stok untuk proyek CV. Coral
          </p>
        </div>
      </div>

      <Suspense fallback={<div>Loading...</div>}>
        <AlatList refreshTrigger={refreshTrigger} isReadOnly={true} />
      </Suspense>
    </div>
  );
}