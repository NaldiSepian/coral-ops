import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User } from "lucide-react";
import { AssignmentDetail } from "./types";

interface AssignedTechniciansCardProps {
  assignment: AssignmentDetail;
}

export default function AssignedTechniciansCard({ assignment }: AssignedTechniciansCardProps) {
  if (!assignment.teknisi || assignment.teknisi.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Teknisi yang Ditugaskan
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {assignment.teknisi.map((teknisiItem) => (
            <div key={teknisiItem.id} className="flex items-center gap-3 p-3 border rounded-lg">
              <div className="relative w-10 h-10 rounded-full overflow-hidden bg-muted flex items-center justify-center">
                <User className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium">{teknisiItem.profil?.nama || `Teknisi ${teknisiItem.teknisi_id}`}</p>
                <p className="text-sm text-muted-foreground">
                  {teknisiItem.profil?.peran || "Teknisi"}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}