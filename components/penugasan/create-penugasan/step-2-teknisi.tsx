'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';

interface Step2TeknisiProps {
  availableTeknisi: any[];
  selectedTeknisi: string[];
  onTeknisiChange: (selected: string[]) => void;
  errors: Record<string, string>;
}

export function Step2Teknisi({ availableTeknisi, selectedTeknisi, onTeknisiChange, errors }: Step2TeknisiProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTeknisi = availableTeknisi.filter(teknisi =>
    teknisi.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
    teknisi.peran?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    teknisi.lisensi_teknisi?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const availableFilteredTeknisi = filteredTeknisi.filter(t => t.current_assignments === 0);
  const totalFiltered = filteredTeknisi.length;
  const selectedCount = selectedTeknisi.length;
  const isAllAvailableSelected = availableFilteredTeknisi.length > 0 && selectedCount === availableFilteredTeknisi.length;

  const handleTeknisiToggle = (teknisiId: string) => {
    const newSelected = selectedTeknisi.includes(teknisiId)
      ? selectedTeknisi.filter(id => id !== teknisiId)
      : [...selectedTeknisi, teknisiId];
    onTeknisiChange(newSelected);
  };

  const handleSelectAll = () => {
    if (isAllAvailableSelected) {
      onTeknisiChange([]);
    } else {
      onTeknisiChange(availableFilteredTeknisi.map(t => t.id));
    }
  };

  return (
    <div className="space-y-2 w-full text-[12px]">
      <div className="text-[11px] text-muted-foreground">
        Pilih teknisi yang akan ditugaskan. Tekan checkbox untuk memilih.
      </div>

      {/* Search - responsive */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between w-full">
        <Input
          placeholder="Cari teknisi berdasarkan nama, peran, atau lisensi..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 min-w-0 max-w-sm sm:max-w-none text-sm h-9"
        />

        {/* Select All Button - responsive */}
        {availableFilteredTeknisi.length > 0 && (
          <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-2.5 w-full sm:w-auto text-[11px]">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSelectAll}
              className="h-8 px-3 text-xs"
            >
              {isAllAvailableSelected ? 'Batal Pilih Semua' : 'Pilih Semua Available'}
            </Button>
            <span className="text-xs text-muted-foreground text-center sm:text-right">
              {selectedCount} dari {availableFilteredTeknisi.length} available dipilih
            </span>
          </div>
        )}
      </div>

      {/* Teknisi List - responsive */}
      <div className="max-h-[20rem] overflow-y-auto border rounded-lg p-2 w-full bg-background/70">
        {filteredTeknisi.length > 0 ? (
          <div className="space-y-2">
            {filteredTeknisi.map((teknisi) => {
              const isSelected = selectedTeknisi.includes(teknisi.id);
              const isAvailable = teknisi.current_assignments === 0;
              const additionalInfo = teknisi.keahlian?.length
                ? `Keahlian: ${teknisi.keahlian.join(', ')}`
                : teknisi.email || teknisi.phone || '';

              return (
                <div
                  key={teknisi.id}
                  className={`rounded-md border p-2 transition-colors text-[12px] ${
                    isSelected
                      ? 'border-primary bg-primary/5 shadow-sm'
                      : isAvailable
                      ? 'hover:border-primary/40'
                      : 'opacity-60 hover:border-muted-foreground/40'
                  }`}
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between w-full">
                    <div className="flex items-start gap-2 flex-1 min-w-0">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => isAvailable && handleTeknisiToggle(teknisi.id)}
                        disabled={!isAvailable}
                        aria-label={`Pilih ${teknisi.nama}`}
                      />
                      <div className="space-y-2 min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 bg-muted rounded-full flex items-center justify-center text-[11px] font-medium flex-shrink-0">
                            {teknisi.nama.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium truncate">{teknisi.nama}</p>
                            <div className="flex flex-wrap items-center gap-1 text-[10px]">
                              <Badge variant="secondary" className="px-1.5 py-0.5 text-[10px]">
                                {teknisi.peran || 'Teknisi'}
                              </Badge>
                              {teknisi.lisensi_teknisi && (
                                <Badge variant="outline" className="px-1.5 py-0.5 text-[10px]">
                                  Lisensi {teknisi.lisensi_teknisi}
                                </Badge>
                              )}
                              <Badge 
                                variant={isAvailable ? "default" : "destructive"} 
                                className="px-1.5 py-0.5 text-[10px]"
                              >
                                {isAvailable ? 'Available' : 'Sedang Bertugas'}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        {additionalInfo && (
                          <p className="text-[10px] text-muted-foreground break-words leading-snug">
                            {additionalInfo}
                          </p>
                        )}
                      </div>
                    </div>

                    <span className="text-[10px] text-muted-foreground sm:text-right">
                      {isSelected ? 'Sudah dipilih' : isAvailable ? 'Belum dipilih' : 'Tidak tersedia'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            {searchQuery ? 'Tidak ada teknisi yang cocok dengan pencarian' : 'Tidak ada teknisi yang tersedia'}
          </div>
        )}
      </div>

      {/* Selected Teknisi Preview - responsive */}
      {selectedTeknisi.length > 0 && (
        <div className="p-3 bg-muted rounded-lg">
          <p className="text-xs font-medium mb-2">Teknisi Terpilih ({selectedTeknisi.length})</p>
          <div className="flex flex-wrap gap-1.5 text-xs">
            {selectedTeknisi.map((id) => {
              const teknisi = availableTeknisi.find(t => t.id === id);
              return teknisi ? (
                <span key={id} className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary text-primary-foreground rounded">
                  {teknisi.nama}
                  <button
                    onClick={() => handleTeknisiToggle(id)}
                    className="ml-1 hover:text-destructive"
                  >
                    ×
                  </button>
                </span>
              ) : null;
            })}
          </div>
        </div>
      )}

      {/* Error */}
      {errors.teknisi && (
        <div className="p-2.5 bg-destructive/10 border border-destructive/20 rounded-md">
          <p className="text-xs text-destructive">{errors.teknisi}</p>
        </div>
      )}
    </div>
  );
}