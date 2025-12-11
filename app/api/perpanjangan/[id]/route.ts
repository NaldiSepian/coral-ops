import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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

    const { id } = await params;
    const requestId = Number(id);
    if (Number.isNaN(requestId)) {
      return NextResponse.json({ error: "Invalid request id" }, { status: 400 });
    }

    const body = await request.json();
    const { status, catatan_validasi } = body;

    if (!['Disetujui', 'Ditolak'].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const { data: extensionRequest, error: requestError } = await supabase
      .from('perpanjangan_penugasan')
      .select(`
        *,
        penugasan:penugasan_id (
          id,
          supervisor_id,
          end_date,
          is_extended
        )
      `)
      .eq('id', requestId)
      .single();

    if (requestError || !extensionRequest) {
      return NextResponse.json({ error: "Extension request not found" }, { status: 404 });
    }

    if (extensionRequest.penugasan?.supervisor_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    let newEndDate = extensionRequest.penugasan?.end_date || null;

    if (status === 'Disetujui') {
      const minutes = extensionRequest.durasi_menit || 0;
      if (!minutes) {
        return NextResponse.json({ error: "Durasi belum ditentukan" }, { status: 400 });
      }
      
      // Validasi maksimal 7 hari (10080 menit)
      const maxMinutes = 7 * 24 * 60; // 7 hari dalam menit
      if (minutes > maxMinutes) {
        return NextResponse.json({ error: "Durasi perpanjangan maksimal 7 hari" }, { status: 400 });
      }
      
      const hari = Math.round(minutes / (24 * 60));
      const base = new Date(extensionRequest.penugasan.end_date + 'T00:00:00.000Z'); // Treat as UTC
      base.setUTCDate(base.getUTCDate() + hari);
      newEndDate = base.toISOString().slice(0, 10);

      const { error: updatePenugasanError } = await supabase
        .from('penugasan')
        .update({
          end_date: newEndDate,
          is_extended: true
        })
        .eq('id', extensionRequest.penugasan?.id || 0);

      if (updatePenugasanError) {
        console.error('Failed to update penugasan deadline:', updatePenugasanError);
        return NextResponse.json({ error: "Failed to update assignment" }, { status: 500 });
      }
    }

    const updatePayload: Record<string, any> = {
      status,
      catatan_validasi: catatan_validasi || null,
      disetujui_oleh: status === 'Disetujui' ? user.id : null,
      disetujui_pada: status === 'Disetujui' ? new Date().toISOString() : null,
    };

    const { data: updatedRequest, error: updateError } = await supabase
      .from('perpanjangan_penugasan')
      .update(updatePayload)
      .eq('id', requestId)
      .select('*')
      .single();

    if (updateError || !updatedRequest) {
      console.error('Failed to update request:', updateError);
      return NextResponse.json({ error: "Failed to update request" }, { status: 500 });
    }

    await supabase.from('notifikasi').insert({
      penerima_id: extensionRequest.pemohon_id,
      pesan: `Kendala untuk penugasan #${extensionRequest.penugasan?.id} ${status === 'Disetujui' ? 'disetujui' : 'ditolak'}`
    });

    return NextResponse.json({ message: "Request updated", request: updatedRequest, end_date: newEndDate });
  } catch (err) {
    console.error('Unexpected error in PATCH /api/perpanjangan/[id]:', err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
