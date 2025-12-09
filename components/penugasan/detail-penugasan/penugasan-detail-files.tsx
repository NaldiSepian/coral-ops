import { Button } from "@/components/ui/button";

interface PenugasanDetailFilesProps {
  penugasan: any; // TODO: Define proper type when file management is implemented
  onUploadFile: () => void;
}

export function PenugasanDetailFiles({
  penugasan,
  onUploadFile,
}: PenugasanDetailFilesProps) {
  return (
    <div className="rounded-lg border p-4 sm:p-6">
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 mb-4">
        <h2 className="text-base sm:text-lg font-medium">File Dokumen</h2>
        <Button
          size="sm"
          onClick={onUploadFile}
        >
          Upload File
        </Button>
      </div>
      {/* TODO: File management section */}
      <div className="text-center py-8 text-muted-foreground">
        <p className="text-sm sm:text-base">File management akan diimplementasi dalam iterasi berikutnya</p>
        <p className="text-xs sm:text-sm mt-2">Fitur ini akan memungkinkan upload dokumen penugasan, laporan, dan file terkait lainnya</p>
      </div>
    </div>
  );
}