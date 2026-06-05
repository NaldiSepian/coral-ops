import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const peran = searchParams.get('peran');
    const available = searchParams.get('available');

    let query = supabase
      .from("profil")
      .select("id, nama, peran, lisensi_teknisi, created_at")
      .eq("is_deleted", false);

    // Filter by role if specified
    if (peran) {
      query = query.eq("peran", peran);
    }

    const { data: profiles, error } = await query.order("nama");

    if (error) {
      console.error("Error fetching profiles:", error);
      return NextResponse.json(
        { error: "Failed to fetch profiles" },
        { status: 500 }
      );
    }

    let responseData = profiles || [];

    if (peran === 'Teknisi' && responseData.length > 0) {
      const { data: assignmentRows, error: assignmentError } = await supabase
        .from('penugasan_teknisi')
        .select(`
          teknisi_id,
          penugasan:penugasan_id (
            status,
            is_deleted
          )
        `)
        .in('penugasan.status', ['Aktif'])
        .eq('penugasan.is_deleted', false);

      if (assignmentError) {
        console.error('Error fetching teknisi assignment counts:', assignmentError);
      } else if (assignmentRows) {
        const counts = assignmentRows.reduce<Record<string, number>>((acc, row) => {
          const teknisiId = row.teknisi_id;
          const penugasanData = Array.isArray(row.penugasan) ? row.penugasan[0] : row.penugasan;
          const status = penugasanData?.status;
          if (teknisiId && status === 'Aktif') {
            acc[teknisiId] = (acc[teknisiId] || 0) + 1;
          }
          return acc;
        }, {});

        responseData = responseData.map(profile => ({
          ...profile,
          current_assignments: counts[profile.id] || 0,
        }));
      }

      // Filter available teknisi if requested
      if (available === 'true') {
        responseData = responseData.filter((profile: any) => profile.current_assignments === 0);
      }
    }

    return NextResponse.json({
      success: true,
      data: responseData,
    });

  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}