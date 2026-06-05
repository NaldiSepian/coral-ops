import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AlertCircle, CheckCircle, XCircle } from "lucide-react";

export const getStatusBadge = (status: string) => {
  switch (status) {
    case "Menunggu":
      return (
        <Badge variant="outline" className="bg-accent text-accent-foreground border-border">
          <AlertCircle className="w-3 h-3 mr-1" />
          Menunggu Validasi
        </Badge>
      );
    case "Disetujui":
      return (
        <Badge variant="secondary" className="bg-secondary text-secondary-foreground">
          <CheckCircle className="w-3 h-3 mr-1" />
          Disetujui
        </Badge>
      );
    case "Ditolak":
      return (
        <Badge variant="destructive">
          <XCircle className="w-3 h-3 mr-1" />
          Ditolak
        </Badge>
      );
    default:
      return <Badge>{status}</Badge>;
  }
};

export const getProgressStatusColor = (status: string) => {
  switch (status) {
    case "Sedang Dikerjakan":
      return "bg-muted/50";
    case "Hampir Selesai":
      return "bg-secondary/20";
    case "Selesai":
      return "bg-secondary/30";
    default:
      return "";
  }
};

interface SearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export function SearchBar({ searchQuery, onSearchChange }: SearchBarProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
      <div className="flex-1 min-w-0">
        <Input
          placeholder="Cari penugasan atau teknisi..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full"
        />
      </div>
    </div>
  );
}

export function EmptyState() {
  return (
    <Card className="p-8 text-center">
      <div className="text-muted-foreground space-y-2">
        <CheckCircle className="w-12 h-12 mx-auto opacity-50 mb-4" />
        <p className="font-medium">Semua laporan sudah divalidasi!</p>
        <p className="text-sm">Tidak ada laporan yang menunggu validasi Anda</p>
      </div>
    </Card>
  );
}