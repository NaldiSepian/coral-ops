'use client';

import { useState, type FocusEvent } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface Step3AlatProps {
  availableAlat: any[];
  selectedAlat: Array<{ alat_id: number; jumlah: number }>;
  onAlatChange: (selected: Array<{ alat_id: number; jumlah: number }>) => void;
  errors: Record<string, string>;
}

export function Step3Alat({ availableAlat, selectedAlat, onAlatChange, errors }: Step3AlatProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredAlat = availableAlat.filter(alat =>
    alat.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
    alat.kategori?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAlatQuantityChange = (alatId: number, jumlah: number) => {
    if (jumlah <= 0) {
      // Remove alat if quantity is 0 or negative
      onAlatChange(selectedAlat.filter(item => item.alat_id !== alatId));
    } else {
      const existing = selectedAlat.find(item => item.alat_id === alatId);
      if (existing) {
        // Update quantity
        onAlatChange(selectedAlat.map(item =>
          item.alat_id === alatId ? { ...item, jumlah } : item
        ));
      } else {
        // Add new alat
        onAlatChange([...selectedAlat, { alat_id: alatId, jumlah }]);
      }
    }
  };

  const handleRemoveAlat = (alatId: number) => {
    onAlatChange(selectedAlat.filter(item => item.alat_id !== alatId));
  };

  const handleQuantityFocus = (event: FocusEvent<HTMLInputElement>) => {
    event.target.select();
  };

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">
        Pilih alat yang diperlukan untuk penugasan ini.
      </div>

      {/* Search */}
      <Input
        placeholder="Cari alat..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="max-w-sm"
      />

      {/* Alat List */}
      <div className="space-y-2 max-h-96 overflow-y-auto border rounded-lg p-4">
        {filteredAlat.length > 0 ? (
          filteredAlat.map((alat) => {
            const selectedItem = selectedAlat.find(item => item.alat_id === alat.id);
            const currentQuantity = selectedItem?.jumlah || 0;

            return (
              <div key={alat.id} className="p-3 rounded-lg border">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center text-sm font-medium">
                        {alat.nama.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium">{alat.nama}</p>
                        <p className="text-sm text-muted-foreground">
                          Kategori: {alat.kategori || 'Umum'} • Stok tersedia: {alat.stok_tersedia}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min="0"
                      max={alat.stok_tersedia}
                      value={currentQuantity}
                      onChange={(e) => {
                        const jumlah = parseInt(e.target.value) || 0;
                        handleAlatQuantityChange(alat.id, jumlah);
                      }}
                      onFocus={handleQuantityFocus}
                      inputMode="numeric"
                      placeholder="Jumlah"
                      className="w-20"
                    />
                  </div>
                </div>

                {/* Quantity validation */}
                {currentQuantity > alat.stok_tersedia && (
                  <p className="text-xs text-destructive">
                    Jumlah melebihi stok tersedia ({alat.stok_tersedia})
                  </p>
                )}
              </div>
            );
          })
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            {searchQuery ? 'Tidak ada alat yang cocok dengan pencarian' : 'Tidak ada alat yang tersedia'}
          </div>
        )}
      </div>

      {/* Selected Alat Preview */}
      {selectedAlat.length > 0 && (
        <div className="p-3 bg-muted rounded-lg">
          <p className="text-sm font-medium mb-2">Alat Terpilih ({selectedAlat.length})</p>
          <div className="space-y-2">
            {selectedAlat.map((item) => {
              const alat = availableAlat.find(a => a.id === item.alat_id);
              return alat ? (
                <div key={item.alat_id} className="flex items-center justify-between">
                  <span className="text-sm">{alat.nama} (x{item.jumlah})</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRemoveAlat(item.alat_id)}
                  >
                    Hapus
                  </Button>
                </div>
              ) : null;
            })}
          </div>
        </div>
      )}

      {/* Error */}
      {errors.alat && (
        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
          <p className="text-sm text-destructive">{errors.alat}</p>
        </div>
      )}
    </div>
  );
}