import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PenugasanWithRelations } from "@/lib/penugasan/types";
import { PENUGASAN_STATUS, PENUGASAN_KATEGORI } from "@/lib/penugasan/constants";
import { RefreshCw } from "lucide-react";

interface PenugasanDetailHeaderManagerProps {
  penugasan: PenugasanWithRelations;
  onRefresh: () => void;
}

export function PenugasanDetailHeaderManager({
  penugasan,
  onRefresh,
}: PenugasanDetailHeaderManagerProps) {
  return (
    <div className="flex flex-col space-y-4 lg:flex-row lg:items-start lg:justify-between lg:space-y-0">
      <div className="space-y-1">
        <nav className="text-sm text-muted-foreground">
          › <span>Penugasan</span> › <span className="text-foreground">{penugasan.judul}</span>
        </nav>
        <h1 className="text-xl font-bold sm:text-2xl">{penugasan.judul}</h1>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={
            penugasan.status === 'Aktif' ? 'default' :
            penugasan.status === 'Selesai' ? 'secondary' :
            penugasan.status === 'Dibatalkan' ? 'destructive' :
            'outline'
          }>
            {PENUGASAN_STATUS[penugasan.status as keyof typeof PENUGASAN_STATUS] || penugasan.status}
          </Badge>
          <Badge variant="outline">
            {PENUGASAN_KATEGORI[penugasan.kategori as keyof typeof PENUGASAN_KATEGORI] || penugasan.kategori}
          </Badge>
          <span className="text-xs text-muted-foreground">
            Dibuat: {new Date(penugasan.created_at).toLocaleDateString('id-ID')}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          onClick={onRefresh}
          variant="outline"
          size="icon"
          title="Refresh"
          aria-label="Refresh"
        >
          <RefreshCw className="h-4 w-4" />
          <span className="sr-only">Refresh</span>
        </Button>
      </div>
    </div>
  );
}