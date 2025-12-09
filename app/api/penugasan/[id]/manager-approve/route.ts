import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/penugasan/[id]/manager-approve
 * Manager melakukan final validation (approve/reject penugasan)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Cek role manager
    const { data: profil } = await supabase
      .from('profil')
      .select('peran')
      .eq('id', user.id)
      .single();

    if (!profil || profil.peran !== 'Manager') {
      return NextResponse.json({ error: "Only managers can approve" }, { status: 403 });
    }

    const { id } = await params;
    const penugasanId = Number(id);
    if (Number.isNaN(penugasanId)) {
      return NextResponse.json({ error: "Invalid assignment id" }, { status: 400 });
    }

    const body = await request.json();
    const { status_penugasan, catatan_manager } = body;

    if (!status_penugasan || !['Selesai', 'Ditolak'].includes(status_penugasan)) {
      return NextResponse.json({ error: "Status harus Selesai atau Ditolak" }, { status: 400 });
    }

    // Panggil RPC function manager_validasi_penugasan
    const { data, error } = await supabase
      .rpc('manager_validasi_penugasan', {
        p_penugasan_id: penugasanId,
        p_manager_id: user.id,
        p_status_penugasan: status_penugasan,
        p_catatan: catatan_manager || null
      });

    if (error) {
      console.error('Failed to validate penugasan:', error);
      return NextResponse.json({ error: error.message || "Failed to validate" }, { status: 500 });
    }

    if (data && data.length > 0 && !data[0].success) {
      return NextResponse.json({ error: data[0].message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: data && data[0]?.message || "Penugasan berhasil di-validate"
    });

  } catch (err) {
    console.error('Unexpected error in POST /api/penugasan/[id]/manager-approve:', err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
