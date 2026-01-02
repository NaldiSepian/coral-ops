import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RefreshCcw, Loader2 } from "lucide-react";
import Image from "next/image";

interface DashboardHeaderProps {
  title: string;
  subtitle: string;
  description: string;
  loading: boolean;
  onRefresh: () => void;
}

export function DashboardHeader({ title, subtitle, description, loading, onRefresh }: DashboardHeaderProps) {
  return (
    <header className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex-1">
          <p className="text-xs sm:text-sm font-semibold uppercase tracking-wide text-primary">{title}</p>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold leading-tight">{subtitle}</h1>
            <p className="text-sm sm:text-base text-muted-foreground">{description}</p>
          </div>
        </div>
        <Button onClick={onRefresh} variant="outline" disabled={loading} className="w-full sm:w-auto">
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin sm:mr-2" />
              <span className="sm:inline">Memuat...</span>
            </>
          ) : (
            <>
              <RefreshCcw className="h-4 w-4 sm:mr-2" />
              <span className="sm:inline">Refresh</span>
            </>
          )}
        </Button>
      </div>

      {/* Company Image */}
      <Card className="p-3 sm:p-4">
        <div className="relative w-full h-[120px] sm:h-[265px]">
          <Image
            src="/gambar.png"
            alt="CV. Coral Operations"
            fill
            className="rounded-lg object-cover"
            priority
          />
        </div>
      </Card>
    </header>
  );
}
