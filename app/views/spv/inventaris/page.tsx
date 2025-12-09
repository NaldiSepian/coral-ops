"use client";

import { Suspense, useState } from "react";
import { AlatList } from "@/components/alat/alat-list";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { AddAlatDialog } from "@/components/alat/add-alat-dialog";

export default function AlatPage() {
  return (
    <AlatPageContent />
  );
}

function AlatPageContent() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleAlatAdded = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Inventaris Alat</h1>
          <p className="text-muted-foreground">
            Kelola inventaris alat dan stok untuk proyek CV. Coral
          </p>
        </div>
        <AddAlatDialog onAlatAdded={handleAlatAdded}>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Tambah Alat
          </Button>
        </AddAlatDialog>
      </div>

      <Suspense fallback={<div>Loading...</div>}>
        <AlatList refreshTrigger={refreshTrigger} />
      </Suspense>
    </div>
  );
}