import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RefreshCcw, Check, X } from "lucide-react";

interface ValidationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  validationAction: 'approve' | 'reject' | null;
  validationNote: string;
  onValidationNoteChange: (note: string) => void;
  onValidation: (action: 'approve' | 'reject') => void;
  validating: boolean;
}

export default function ValidationDialog({
  open,
  onOpenChange,
  validationAction,
  validationNote,
  onValidationNoteChange,
  onValidation,
  validating,
}: ValidationDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {validationAction === 'approve' ? 'Setujui Laporan' : 'Tolak Laporan'}
          </DialogTitle>
          <DialogDescription>
            {validationAction === 'approve'
              ? 'Apakah Anda yakin ingin menyetujui laporan ini?'
              : 'Berikan alasan penolakan laporan ini.'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="validation-note" className="mb-2">Catatan Validasi (Opsional)</Label>
            <Textarea
              id="validation-note"
              placeholder={validationAction === 'approve' ? 'Catatan persetujuan...' : 'Alasan penolakan...'}
              value={validationNote}
              onChange={(e) => onValidationNoteChange(e.target.value)}
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={validating}
          >
            Batal
          </Button>
          <Button
            onClick={() => onValidation(validationAction!)}
            disabled={validating}
            variant={validationAction === 'approve' ? 'default' : 'destructive'}
          >
            {validating ? (
              <>
                <RefreshCcw className="w-4 h-4 mr-2 animate-spin" />
                Memproses...
              </>
            ) : validationAction === 'approve' ? (
              <>
                <Check className="w-4 h-4 mr-2" />
                Setujui
              </>
            ) : (
              <>
                <X className="w-4 h-4 mr-2" />
                Tolak
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}