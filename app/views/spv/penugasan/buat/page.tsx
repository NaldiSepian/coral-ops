'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { CreatePenugasanWizard } from '@/components/penugasan/create-penugasan/create-penugasan-wizard';

export default function BuatPenugasanPage() {
  const router = useRouter();
  const [showWizard, setShowWizard] = useState(true);

  const handleWizardSuccess = (penugasan: any) => {
    router.push(`/views/spv/penugasan/${penugasan.id}?success=Penugasan berhasil dibuat`);
  };

  const handleCancel = () => {
    router.push('/views/spv/penugasan');
  };

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <div className="mx-auto max-w-4xl px-4 py-10">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold">Buat Penugasan Baru</h1>
          <p className="text-muted-foreground mt-2">
            Lengkapi informasi untuk membuat penugasan teknisi baru
          </p>
        </div>

        <div className="flex justify-center">
          <Button
            onClick={() => setShowWizard(true)}
            size="lg"
          >
            Mulai Buat Penugasan
          </Button>
        </div>

        <CreatePenugasanWizard
          open={showWizard}
          onOpenChange={setShowWizard}
          onSuccess={handleWizardSuccess}
        />

        {/* Alternative: Back button */}
        <div className="text-center mt-6">
          <Button
            variant="outline"
            onClick={handleCancel}
          >
            Kembali ke List Penugasan
          </Button>
        </div>
      </div>
    </div>
  );
}
