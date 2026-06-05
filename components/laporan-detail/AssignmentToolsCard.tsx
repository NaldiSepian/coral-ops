import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Wrench } from "lucide-react";
import Image from "next/image";
import { AssignmentDetail } from "./types";

interface AssignmentToolsCardProps {
  assignment: AssignmentDetail;
  onPhotoClick: (url: string) => void;
}

export default function AssignmentToolsCard({ assignment, onPhotoClick }: AssignmentToolsCardProps) {
  if (!assignment.alat || assignment.alat.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wrench className="h-5 w-5" />
          Alat yang Digunakan
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {assignment.alat.map((alatItem) => (
            <div key={alatItem.id} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                {alatItem.alat?.foto_url && (
                  <div className="relative w-10 h-10 rounded overflow-hidden bg-muted cursor-pointer" onClick={() => onPhotoClick(alatItem.alat!.foto_url!)}>
                    <Image
                      src={alatItem.alat.foto_url!}
                      alt={alatItem.alat.nama}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <div>
                  <p className="font-medium">{alatItem.alat?.nama || `Alat ${alatItem.alat_id}`}</p>
                  <p className="text-sm text-muted-foreground">
                    {alatItem.alat?.tipe_alat || "Tipe tidak diketahui"}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <Badge variant={alatItem.is_returned ? "secondary" : "default"}>
                  {alatItem.is_returned ? "Sudah Dikembalikan" : "Masih Digunakan"}
                </Badge>
                <p className="text-sm text-muted-foreground mt-1">
                  Jumlah: {alatItem.jumlah}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}