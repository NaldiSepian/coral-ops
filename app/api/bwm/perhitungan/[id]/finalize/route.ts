/**
 * API Route untuk Finalisasi Perhitungan BWM
 * 
 * Manager-only: Finalisasi perhitungan dan update status gaji
 * 
 * @module app/api/bwm/perhitungan/[id]/finalize
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Check if user is manager
 */
async function requireManager(): Promise<{ user: { id: string }; role: string }> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    throw new Error('Unauthorized');
  }
  
  const { data, error } = await supabase
    .from('profil')
    .select('peran')
    .eq('id', user.id)
    .single();
  
  if (error || !data) {
    throw new Error('Gagal mengambil data user');
  }
  
  if (data.peran !== "Manager") {
    throw new Error("Hanya Manager yang dapat mengakses");
  }
  
  return { user, role: data.peran };
}

/**
 * PATCH - Finalisasi perhitungan BWM
 * Body: { bonus_lain?: number, potongan?: number, keterangan?: string }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user } = await requireManager();
    const { id } = await params;
    const body = await request.json();
    const { keterangan = null } = body;
    
    const supabase = await createClient();
    
    // 1. Get perhitungan
    const { data: perhitungan, error: perhitunganError } = await supabase
      .from('perhitungan_bwm')
      .select(`
        *,
        teknisi:teknisi_id (id, nama, lisensi_teknisi)
      `)
      .eq('id', id)
      .single();
    
    if (perhitunganError || !perhitungan) {
      return NextResponse.json(
        { error: 'Perhitungan tidak ditemukan' },
        { status: 404 }
      );
    }
    
    if (perhitungan.status === 'final') {
      return NextResponse.json(
        { error: 'Perhitungan sudah final, tidak dapat diubah' },
        { status: 400 }
      );
    }
    
    // 2. Update perhitungan jadi final
    const { data: updatedPerhitungan, error: updateError } = await supabase
      .from('perhitungan_bwm')
      .update({
        status: 'final',
        finalisasi_oleh: user.id,
        finalisasi_pada: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();
    
    if (updateError) {
      console.error('Error finalizing perhitungan:', updateError);
      return NextResponse.json(
        { error: 'Gagal finalisasi perhitungan' },
        { status: 500 }
      );
    }
    
    // 3. Get tunjangan lisensi
    const teknisi = perhitungan.teknisi as unknown as { lisensi_teknisi: string };
    const { data: tunjanganData } = await supabase
      .from('tunjangan_lisensi')
      .select('tunjangan_jabatan')
      .eq('level', teknisi.lisensi_teknisi)
      .single();
    
    const tunjanganJabatan = tunjanganData?.tunjangan_jabatan || 500000;
    const bonusBWM = perhitungan.tunjangan_didapat || 0;
    const totalGaji = tunjanganJabatan + bonusBWM;
    
    // 4. Get penugasan untuk periode
    const { data: penugasan } = await supabase
      .from('penugasan')
      .select('start_date, end_date')
      .eq('id', perhitungan.penugasan_id)
      .single();
    
    // 5. Create/update gaji dengan status disetujui
    const { data: gaji, error: gajiError } = await supabase
      .from('gaji_teknisi')
      .upsert({
        teknisi_id: perhitungan.teknisi_id,
        penugasan_id: perhitungan.penugasan_id,
        periode_mulai: penugasan?.start_date,
        periode_selesai: penugasan?.end_date,
        tunjangan_jabatan: tunjanganJabatan,
        bonus_bwm: bonusBWM,
        total_gaji: totalGaji,
        status: 'disetujui',
        disetujui_oleh: user.id,
        disetujui_pada: new Date().toISOString(),
        keterangan: keterangan,
      }, {
        onConflict: 'teknisi_id,penugasan_id',
        ignoreDuplicates: false,
      })
      .select()
      .single();
    
    if (gajiError) {
      console.error('Error creating gaji:', gajiError);
      // Rollback perhitungan status
      await supabase
        .from('perhitungan_bwm')
        .update({ status: 'draft' })
        .eq('id', id);
      
      return NextResponse.json(
        { error: `Gagal membuat gaji: ${gajiError.message}` },
        { status: 500 }
      );
    }
    
    // 6. Update status penugasan kalau semua teknisi sudah final
    const { count: totalTeknisi } = await supabase
      .from('penugasan_teknisi')
      .select('*', { count: 'exact', head: true })
      .eq('penugasan_id', perhitungan.penugasan_id);
    
    const { count: finalizedTeknisi } = await supabase
      .from('perhitungan_bwm')
      .select('*', { count: 'exact', head: true })
      .eq('penugasan_id', perhitungan.penugasan_id)
      .eq('status', 'final');
    
    if (totalTeknisi === finalizedTeknisi) {
      await supabase
        .from('penugasan')
        .update({ bwm_status: 'final' })
        .eq('id', perhitungan.penugasan_id);
    }
    
    return NextResponse.json({
      success: true,
      message: 'Perhitungan berhasil difinalisasi',
      data: {
        perhitungan: updatedPerhitungan,
        gaji: gaji,
        breakdown: {
          tunjangan_jabatan: tunjanganJabatan,
          bonus_bwm: bonusBWM,
          total_gaji: totalGaji,
        },
      },
    });
    
  } catch (err) {
    if (err instanceof Error) {
      const status = err.message === 'Unauthorized' ? 401 : 403;
      return NextResponse.json({ error: err.message }, { status });
    }
    console.error('Unexpected error in PATCH finalize:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
