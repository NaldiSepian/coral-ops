// API Routes untuk Manager - Detail Penugasan
// =============================================================================
// GET /api/manager/penugasan/[id] - Detail penugasan dengan relations
// - Include: assigned teknisi, assigned alat, progress laporan
// - Manager bisa lihat semua penugasan
// - Return: full penugasan data dengan teknisi[], alat[], laporan[]
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET handler - Detail penugasan untuk manager
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is manager
    const { data: userProfile, error: profileError } = await supabase
      .from('profil')
      .select('peran')
      .eq('id', user.id)
      .single();

    if (profileError || userProfile?.peran !== 'Manager') {
      return NextResponse.json({ error: "Access denied. Manager role required." }, { status: 403 });
    }

    const { id: penugasanIdStr } = await params;
    const penugasanId = parseInt(penugasanIdStr);

    if (isNaN(penugasanId)) {
      return NextResponse.json({ error: "Invalid penugasan ID" }, { status: 400 });
    }

    // Query penugasan dengan relations (manager bisa lihat semua)
    const { data: penugasan, error } = await supabase
      .from('penugasan')
      .select(`
        *,
        lokasi_text: lokasi::varchar,
        supervisor:supervisor_id(nama, peran),
        teknisi:penugasan_teknisi(
          id,
          teknisi_id,
          profil(nama, peran)
        ),
        alat:peminjaman_alat(
          id,
          alat_id,
          jumlah,
          is_returned,
          alat(nama)
        ),
        laporan_progres(
          *,
          bukti_laporan(
            id,
            judul,
            deskripsi,
            before_foto_url,
            after_foto_url,
            taken_at,
            taken_by,
            metadata,
            pair_key
          )
        )
      `)
      .eq('id', penugasanId)
      .eq('is_deleted', false)
      .single();

    if (error || !penugasan) {
      return NextResponse.json({ error: "Penugasan not found" }, { status: 404 });
    }

    // Sort laporan_progres by ID descending (latest first)
    const sortedPenugasan = {
      ...penugasan,
      laporan_progres: (penugasan.laporan_progres || []).sort(
        (a: any, b: any) => b.id - a.id
      )
    };

    return NextResponse.json({ data: sortedPenugasan });
  } catch (error) {
    console.error('Unexpected error in GET /api/manager/penugasan/[id]:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH handler - Update penugasan (plafon_bonus, dll)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is manager
    const { data: userProfile, error: profileError } = await supabase
      .from('profil')
      .select('peran')
      .eq('id', user.id)
      .single();

    if (profileError || userProfile?.peran !== 'Manager') {
      return NextResponse.json({ error: "Access denied. Manager role required." }, { status: 403 });
    }

    const { id: penugasanIdStr } = await params;
    const penugasanId = parseInt(penugasanIdStr);

    if (isNaN(penugasanId)) {
      return NextResponse.json({ error: "Invalid penugasan ID" }, { status: 400 });
    }

    const body = await request.json();
    const { plafon_bonus } = body;

    // Validasi plafon_bonus
    if (plafon_bonus !== undefined) {
      if (typeof plafon_bonus !== 'number' || plafon_bonus < 0) {
        return NextResponse.json(
          { error: "Plafon bonus harus angka positif" },
          { status: 400 }
        );
      }
    }

    // Update penugasan
    const { data, error } = await supabase
      .from('penugasan')
      .update({
        ...(plafon_bonus !== undefined && { plafon_bonus }),
      })
      .eq('id', penugasanId)
      .select()
      .single();

    if (error) {
      console.error('Error updating penugasan:', error);
      return NextResponse.json(
        { error: "Gagal mengupdate penugasan" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data,
      message: "Plafon bonus berhasil diupdate",
    });
  } catch (error) {
    console.error('Unexpected error in PATCH /api/manager/penugasan/[id]:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}