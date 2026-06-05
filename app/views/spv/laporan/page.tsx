import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ValidasiLaporanPage from "./validasi/page";
import RiwayatLaporanPage from "./riwayat/page";

export default function LaporanTeknisiPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Laporan Progres Teknisi</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Validasi dan monitor laporan dari teknisi lapangan
        </p>
      </header>

      <Tabs defaultValue="validasi" className="w-full">
        <TabsList>
          <TabsTrigger value="validasi">
            Validasi Laporan
          </TabsTrigger>
          <TabsTrigger value="riwayat">Riwayat Laporan</TabsTrigger>
        </TabsList>

        <TabsContent value="validasi" className="mt-6">
          <ValidasiLaporanPage />
        </TabsContent>

        <TabsContent value="riwayat" className="mt-6">
          <RiwayatLaporanPage />
        </TabsContent>
      </Tabs>
    </div>
  );
}