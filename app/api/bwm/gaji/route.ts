/**
 * API Route untuk Gaji Teknisi
 * 
 * Manager-only: Manage gaji teknisi per project
 * 
 * @module app/api/bwm/gaji
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Check authentication and return user info
 */
async function requireAuth(): Promise<{ user: { id: string }; role: string }> {
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
  
  return { user, role: data.peran };
}

/**
 * GET - List gaji dengan filter
 * Query params: penugasan_id, teknisi_id, status
 */
export async function GET(request: NextRequest) {
  try {
    const { user, role } = await requireAuth();
    
    const { searchParams } = new URL(request.url);
    const penugasanId = searchParams.get('penugasan_id');
    const status = searchParams.get('status');
    // Jika Manager, bisa filter teknisi_id dari query. Jika Teknisi, paksa pakai ID mereka.
    const teknisiId = role === 'Manager' ? searchParams.get('teknisi_id') : user.id;
    
    const supabase = await createClient();
    let query = supabase
      .from('gaji_teknisi')
      .select(`
        *,
        teknisi:teknisi_id (id, nama, lisensi_teknisi),
        penugasan:penugasan_id (id, judul, kategori, end_date)
      `);
    
    if (penugasanId) {
      query = query.eq('penugasan_id', parseInt(penugasanId));
    }
    
    if (teknisiId) {
      query = query.eq('teknisi_id', teknisiId);
    }
    
    if (status) {
      query = query.eq('status', status);
    }
    
    const { data: gajiData, error } = await query.order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching gaji:', error);
      return NextResponse.json(
        { error: 'Gagal mengambil data gaji' },
        { status: 500 }
      );
    }

    if (!gajiData || gajiData.length === 0) {
      return NextResponse.json({ data: [] });
    }

    // Ambil detail perhitungan BWM untuk setiap gaji (untuk skor C1-C5)
    const penugasanIds = gajiData.map(g => g.penugasan_id);
    const teknisiIds = gajiData.map(g => g.teknisi_id);

    const { data: perhitunganData } = await supabase
      .from('perhitungan_bwm')
      .select('penugasan_id, teknisi_id, c1_kecepatan, c2_kualitas, c3_kepatuhan, c4_proaktivitas, c5_kompetensi, skor_akhir')
      .in('penugasan_id', penugasanIds)
      .in('teknisi_id', teknisiIds);

    // Gabungkan data
    const combinedData = gajiData.map(gaji => {
      const perhitungan = perhitunganData?.find(
        p => p.penugasan_id === gaji.penugasan_id && p.teknisi_id === gaji.teknisi_id
      );
      
      return {
        ...gaji,
        c1_kecepatan: perhitungan?.c1_kecepatan || 0,
        c2_kualitas: perhitungan?.c2_kualitas || 0,
        c3_kepatuhan: perhitungan?.c3_kepatuhan || 0,
        c4_proaktivitas: perhitungan?.c4_proaktivitas || 0,
        c5_kompetensi: perhitungan?.c5_kompetensi || 0,
        skor_akhir: perhitungan?.skor_akhir || 0,
      };
    });
    
    return NextResponse.json({ data: combinedData });
    
  } catch (err) {
    if (err instanceof Error) {
      const status = err.message === 'Unauthorized' ? 401 : 403;
      return NextResponse.json({ error: err.message }, { status });
    }
    console.error('Unexpected error in GET gaji:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST - Create/update gaji dari perhitungan BWM
 * Body: { perhitungan_id: string, bonus_lain?: number, potongan?: number, keterangan?: string }
 */
export async function POST(request: NextRequest) {
  try {
    const { role } = await requireAuth();
    if (role !== 'Manager') {
      throw new Error('Hanya Manager yang dapat melakukan aksi ini');
    }
    
    const body = await request.json();
    const { perhitungan_id, keterangan = null } = body;
    
    if (!perhitungan_id) {
      return NextResponse.json(
        { error: 'perhitungan_id harus diisi' },
        { status: 400 }
      );
    }
    
    const supabase = await createClient();
    
    // 1. Get perhitungan BWM
    const { data: perhitungan, error: perhitunganError } = await supabase
      .from('perhitungan_bwm')
      .select(`
        *,
        teknisi:teknisi_id (id, nama, lisensi_teknisi)
      `)
      .eq('id', perhitungan_id)
      .single();
    
    if (perhitunganError || !perhitungan) {
      return NextResponse.json(
        { error: 'Perhitungan BWM tidak ditemukan' },
        { status: 404 }
      );
    }
    
    // 2. Get tunjangan lisensi untuk teknisi ini
    const teknisi = perhitungan.teknisi as unknown as { lisensi_teknisi: string };
    const { data: tunjanganData } = await supabase
      .from('tunjangan_lisensi')
      .select('tunjangan_jabatan')
      .eq('level', teknisi.lisensi_teknisi)
      .single();
    
    const tunjanganJabatan = tunjanganData?.tunjangan_jabatan || 500000;
    
    // 3. Hitung total gaji
    const bonusBWM = perhitungan.tunjangan_didapat || 0;
    const totalGaji = tunjanganJabatan + bonusBWM;
    
    // 4. Get penugasan untuk periode
    const { data: penugasan } = await supabase
      .from('penugasan')
      .select('start_date, end_date')
      .eq('id', perhitungan.penugasan_id)
      .single();
    
    // 5. Upsert gaji
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
        status: 'draft',
        keterangan: keterangan,
      }, {
        onConflict: 'teknisi_id,penugasan_id',
        ignoreDuplicates: false,
      })
      .select()
      .single();
    
    if (gajiError) {
      console.error('Error creating gaji:', gajiError);
      return NextResponse.json(
        { error: `Gagal membuat gaji: ${gajiError.message}` },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: gaji,
      breakdown: {
        tunjangan_jabatan: tunjanganJabatan,
        bonus_bwm: bonusBWM,
        total_gaji: totalGaji,
      },
    });
    
  } catch (err) {
    if (err instanceof Error) {
      const status = err.message === 'Unauthorized' ? 401 : 403;
      return NextResponse.json({ error: err.message }, { status });
    }
    console.error('Unexpected error in POST gaji:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
