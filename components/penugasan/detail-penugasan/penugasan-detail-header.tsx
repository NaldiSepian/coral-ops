import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PenugasanWithRelations } from "@/lib/penugasan/types";
import { PENUGASAN_STATUS, PENUGASAN_KATEGORI } from "@/lib/penugasan/constants";
import { canCancelPenugasan, canCompletePenugasan } from "@/lib/penugasan/utils";
import {
  RefreshCw,
  Ban,
  Trash2,
  CheckCircle2,
} from "lucide-react";

interface PenugasanDetailHeaderProps {
  penugasan: PenugasanWithRelations;
  onRefresh: () => void;
  onCancel: () => void;
  onDelete: () => void;
  onComplete: () => void;
}

export function PenugasanDetailHeader({
  penugasan,
  onRefresh,
  onCancel,
  onDelete,
  onComplete,
}: PenugasanDetailHeaderProps) {
  const baseActions = [
    { key: "refresh", label: "Refresh", icon: RefreshCw, onClick: onRefresh, variant: "outline" as const },
  ];

  const conditionalActions = [
    penugasan.status === 'Dibatalkan'
      ? { key: "delete", label: "Hapus penugasan", icon: Trash2, onClick: onDelete, variant: "destructive" as const }
      : canCancelPenugasan(penugasan.status)
      ? { key: "cancel", label: "Batalkan penugasan", icon: Ban, onClick: onCancel, variant: "destructive" as const }
      : null,
    canCompletePenugasan(penugasan.status)
      ? { key: "complete", label: "Tandai selesai", icon: CheckCircle2, onClick: onComplete, variant: "default" as const }
      : null,
  ].filter(Boolean) as Array<{ key: string; label: string; icon: typeof RefreshCw; onClick: () => void; variant: "outline" | "default" | "destructive" }>;

  const actions = [...baseActions, ...conditionalActions];
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
        {actions.map(({ key, label, icon: Icon, onClick, variant }) => (
          <Button
            key={key}
            onClick={onClick}
            variant={variant}
            size="icon"
            title={label}
            aria-label={label}
          >
            <Icon className="h-4 w-4" />
            <span className="sr-only">{label}</span>
          </Button>
        ))}
      </div>
    </div>
  );
}