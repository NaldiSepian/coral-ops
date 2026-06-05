'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, ArrowLeft, Users, Wrench, Search, CheckCircle, AlertCircle } from 'lucide-react';
import { PenugasanWithRelations } from '@/lib/penugasan/types';

interface AssignPageProps {
  params: {
    id: string;
  };
}

interface Teknisi {
  id: string;
  nama: string;
  peran: string;
}

interface Alat {
  id: number;
  nama: string;
  kategori: string;
  stock: number;
  available_stock: number;
}

export default function AssignPage({ params }: AssignPageProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Penugasan data
  const [penugasan, setPenugasan] = useState<PenugasanWithRelations | null>(null);

  // Teknisi data
  const [availableTeknisi, setAvailableTeknisi] = useState<Teknisi[]>([]);
  const [selectedTeknisi, setSelectedTeknisi] = useState<string[]>([]);
  const [teknisiSearch, setTeknisiSearch] = useState('');

  // Alat data
  const [availableAlat, setAvailableAlat] = useState<Alat[]>([]);
  const [selectedAlat, setSelectedAlat] = useState<Array<{ alat_id: number; jumlah: number }>>([]);
  const [alatSearch, setAlatSearch] = useState('');

  // Load data
  useEffect(() => {
    loadData();
  }, [params.id]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load penugasan details
      const penugasanResponse = await fetch(`/api/penugasan/${params.id}`);
      if (!penugasanResponse.ok) {
        throw new Error('Failed to load penugasan details');
      }
      const penugasanData = await penugasanResponse.json();
      setPenugasan(penugasanData.data);

      // Load available teknisi
      const teknisiResponse = await fetch('/api/profil?peran=Teknisi&available=true');
      if (teknisiResponse.ok) {
        const teknisiData = await teknisiResponse.json();
        setAvailableTeknisi(teknisiData.data || []);
      }

      // Load available alat
      const alatResponse = await fetch('/api/alat?available=true');
      if (alatResponse.ok) {
        const alatData = await alatResponse.json();
        setAvailableAlat(alatData.data || []);
      }

      // Set current assignments
      if (penugasanData.data.teknisi) {
        setSelectedTeknisi(penugasanData.data.teknisi.map((t: any) => t.id));
      }
      if (penugasanData.data.alat) {
        setSelectedAlat(penugasanData.data.alat.map((a: any) => ({
          alat_id: a.id,
          jumlah: a.jumlah
        })));
      }

    } catch (err) {
      console.error('Failed to load data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  // Filter functions
  const filteredTeknisi = availableTeknisi.filter(teknisi =>
    teknisi.nama.toLowerCase().includes(teknisiSearch.toLowerCase())
  );

  const filteredAlat = availableAlat.filter(alat =>
    alat.nama.toLowerCase().includes(alatSearch.toLowerCase()) ||
    alat.kategori.toLowerCase().includes(alatSearch.toLowerCase())
  );

  // Teknisi handlers
  const handleTeknisiToggle = (teknisiId: string) => {
    setSelectedTeknisi(prev =>
      prev.includes(teknisiId)
        ? prev.filter(id => id !== teknisiId)
        : [...prev, teknisiId]
    );
  };

  const handleAssignTeknisi = async () => {
    if (!penugasan) return;

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const response = await fetch(`/api/penugasan/${params.id}/assign-teknisi`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teknisi_ids: selectedTeknisi }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to assign teknisi');
      }

      setSuccess('Teknisi berhasil ditugaskan');
      // Reload data to get updated assignments
      await loadData();

    } catch (err) {
      console.error('Failed to assign teknisi:', err);
      setError(err instanceof Error ? err.message : 'Failed to assign teknisi');
    } finally {
      setSaving(false);
    }
  };

  // Alat handlers
  const handleAlatQuantityChange = (alatId: number, jumlah: number) => {
    setSelectedAlat(prev => {
      const existing = prev.find(item => item.alat_id === alatId);
      if (existing) {
        if (jumlah <= 0) {
          return prev.filter(item => item.alat_id !== alatId);
        }
        return prev.map(item =>
          item.alat_id === alatId ? { ...item, jumlah } : item
        );
      } else if (jumlah > 0) {
        return [...prev, { alat_id: alatId, jumlah }];
      }
      return prev;
    });
  };

  const handleAssignAlat = async () => {
    if (!penugasan) return;

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      // Assign each alat
      for (const alat of selectedAlat) {
        const response = await fetch(`/api/penugasan/${params.id}/assign-alat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            alat_id: alat.alat_id,
            jumlah: alat.jumlah,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to assign alat');
        }
      }

      setSuccess('Alat berhasil ditugaskan');
      // Reload data to get updated assignments
      await loadData();

    } catch (err) {
      console.error('Failed to assign alat:', err);
      setError(err instanceof Error ? err.message : 'Failed to assign alat');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!penugasan) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Penugasan tidak ditemukan</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push(`/views/spv/penugasan/${params.id}`)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Kembali
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Assign Resources</h1>
          <p className="text-muted-foreground">{penugasan.judul}</p>
        </div>
      </div>

      {/* Status Messages */}
      {error && (
        <Alert className="mb-6" variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="mb-6">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Tabs */}
      <Tabs defaultValue="teknisi" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="teknisi" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Teknisi ({selectedTeknisi.length} assigned)
          </TabsTrigger>
          <TabsTrigger value="alat" className="flex items-center gap-2">
            <Wrench className="h-4 w-4" />
            Alat ({selectedAlat.length} assigned)
          </TabsTrigger>
        </TabsList>

        {/* Teknisi Tab */}
        <TabsContent value="teknisi" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Assign Teknisi
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cari teknisi..."
                  value={teknisiSearch}
                  onChange={(e) => setTeknisiSearch(e.target.value)}
                  className="pl-9"
                />
              </div>

              {/* Teknisi List */}
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredTeknisi.map((teknisi) => {
                  const isAssigned = selectedTeknisi.includes(teknisi.id);
                  const isCurrentlyAssigned = penugasan.teknisi?.some((t: any) => t.id === teknisi.id);

                  return (
                    <div
                      key={teknisi.id}
                      className={`flex items-center space-x-3 p-3 rounded-lg border ${
                        isCurrentlyAssigned ? 'bg-muted' : 'hover:bg-muted/50'
                      }`}
                    >
                      <Checkbox
                        id={`teknisi-${teknisi.id}`}
                        checked={isAssigned}
                        onCheckedChange={() => handleTeknisiToggle(teknisi.id)}
                        disabled={isCurrentlyAssigned}
                      />
                      <Label
                        htmlFor={`teknisi-${teknisi.id}`}
                        className="flex-1 cursor-pointer"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{teknisi.nama}</span>
                          <div className="flex gap-2">
                            {isCurrentlyAssigned && (
                              <Badge variant="secondary">Assigned</Badge>
                            )}
                            <Badge variant="outline">{teknisi.peran}</Badge>
                          </div>
                        </div>
                      </Label>
                    </div>
                  );
                })}
              </div>

              {/* Assign Button */}
              <Button
                onClick={handleAssignTeknisi}
                disabled={saving}
                className="w-full"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  'Assign Teknisi'
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Alat Tab */}
        <TabsContent value="alat" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="h-5 w-5" />
                Assign Alat
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cari alat..."
                  value={alatSearch}
                  onChange={(e) => setAlatSearch(e.target.value)}
                  className="pl-9"
                />
              </div>

              {/* Alat List */}
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredAlat.map((alat) => {
                  const selectedItem = selectedAlat.find(item => item.alat_id === alat.id);
                  const isCurrentlyAssigned = penugasan.alat?.some((a: any) => a.id === alat.id);

                  return (
                    <div
                      key={alat.id}
                      className={`p-3 rounded-lg border ${
                        isCurrentlyAssigned ? 'bg-muted' : 'hover:bg-muted/50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h4 className="font-medium">{alat.nama}</h4>
                          <p className="text-sm text-muted-foreground">{alat.kategori}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm">Stock: {alat.available_stock}/{alat.stock}</p>
                          {isCurrentlyAssigned && (
                            <Badge variant="secondary">Assigned</Badge>
                          )}
                        </div>
                      </div>

                      {!isCurrentlyAssigned && (
                        <div className="flex items-center gap-2">
                          <Label htmlFor={`alat-${alat.id}`} className="text-sm">
                            Jumlah:
                          </Label>
                          <Input
                            id={`alat-${alat.id}`}
                            type="number"
                            min="0"
                            max={alat.available_stock}
                            value={selectedItem?.jumlah || 0}
                            onChange={(e) => handleAlatQuantityChange(alat.id, parseInt(e.target.value) || 0)}
                            className="w-20"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Assign Button */}
              <Button
                onClick={handleAssignAlat}
                disabled={saving || selectedAlat.length === 0}
                className="w-full"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  'Assign Alat'
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
