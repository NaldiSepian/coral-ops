import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get kendala requests for assignments supervised by this supervisor
    const { data: kendala, error: kendalaError } = await supabase
      .from('perpanjangan_penugasan')
      .select(`
        *,
        penugasan:penugasan_id (
          id,
          judul,
          kategori,
          end_date
        ),
        pemohon:pemohon_id (
          id,
          nama,
          peran
        )
      `)
      .eq('penugasan.supervisor_id', user.id)
      .order('tanggal_permintaan', { ascending: false });

    if (kendalaError) {
      console.error('Failed to fetch kendala:', kendalaError);
      return NextResponse.json({ error: "Failed to fetch kendala data" }, { status: 500 });
    }

    return NextResponse.json({
      data: kendala || [],
      message: "Kendala data retrieved successfully"
    });

  } catch (err) {
    console.error('Unexpected error in GET /api/supervisor/kendala:', err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}