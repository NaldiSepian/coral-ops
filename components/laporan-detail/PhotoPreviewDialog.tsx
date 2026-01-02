import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import Image from "next/image";

interface PhotoPreviewDialogProps {
  photoUrl: string | null;
  onClose: () => void;
}

export default function PhotoPreviewDialog({ photoUrl, onClose }: PhotoPreviewDialogProps) {
  if (!photoUrl) return null;

  return (
    <Dialog open={!!photoUrl} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Preview Foto</DialogTitle>
        </DialogHeader>
        <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-muted">
          <Image
            src={photoUrl}
            alt="Preview foto"
            fill
            className="object-contain"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}