// API Routes untuk Assign/Remove Teknisi dari Penugasan
// =============================================================================
// POST /api/penugasan/[id]/assign-teknisi - Assign teknisi ke penugasan
// - Body: { teknisi_ids: string[] }
// - Validasi teknisi exists dan aktif
// - Check duplicates (sudah assigned)
// - Bulk insert dengan duplicate filtering
// - Return: assigned count dan duplicates count
//
// DELETE /api/penugasan/[id]/assign-teknisi - Remove teknisi dari penugasan
// - Body: { teknisi_id: string }
// - Validasi ownership penugasan
// - Delete assignment record
// - Return: success message dan remaining teknisi count
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
               
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

  const { id: penugasan_id } = await params;

    const { data: penugasan, error: penugasanError } = await supabase
      .from("penugasan")
      .select("supervisor_id, status")
      .eq("id", penugasan_id)
      .single();

    if (penugasanError || !penugasan) {
      return NextResponse.json({ error: "Penugasan not found" }, { status: 404 });
    }

    if (penugasan.supervisor_id !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    if (penugasan.status !== "Aktif") {
      return NextResponse.json(
        { error: "Can only assign to active penugasan" },
        { status: 400 }
      );
    }  const body = await request.json();
  const { teknisi_ids } = body;

  if (!teknisi_ids || !Array.isArray(teknisi_ids) || teknisi_ids.length === 0)
    return NextResponse.json(
      { error: "Teknisi Ids required" },
      { status: 400 }
    );

  const { data: teknisiList, error: teknisiError } = await supabase
    .from("profil")
    .select("id, nama")
    .in("id", teknisi_ids)
    .eq("peran", "Teknisi")
    .eq("is_deleted", false);

  if (teknisiList?.length !== teknisi_ids.length) {
    return NextResponse.json({
      error: "Some technicians not found or inactive",
      found: teknisiList?.length || 0,
      requested: teknisi_ids.length
    }, { status: 400 });
  }

  // Check for duplicates (sudah assigned)
  const { data: existingAssignments } = await supabase
    .from('penugasan_teknisi')
    .select('teknisi_id')
    .eq('penugasan_id', penugasan_id)
    .in('teknisi_id', teknisi_ids);

  // Filter out duplicates
  const existingIds = existingAssignments?.map(a => a.teknisi_id) || [];
  const newAssignments = teknisi_ids.filter(id => !existingIds.includes(id));

  // Bulk insert new assignments
  if (newAssignments.length > 0) {
    const assignmentData = newAssignments.map(teknisi_id => ({
      penugasan_id: penugasan_id,
      teknisi_id
    }));

    const { error: insertError } = await supabase
      .from('penugasan_teknisi')
      .insert(assignmentData);

    if (insertError) {
      console.error('Error assigning teknisi:', insertError);
      return NextResponse.json({ error: "Failed to assign teknisi" }, { status: 500 });
    }
  }

  return NextResponse.json({
    message: `Successfully assigned ${newAssignments.length} teknisi`,
    assigned: newAssignments.length,
    duplicates: existingIds.length
  });
  } catch (error) {
    console.error('Unexpected error in POST /api/penugasan/[id]/assign-teknisi:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE handler - Remove teknisi
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get params
    const { id: penugasan_id } = await params;

    // Parse body to get teknisi_id
    const body = await request.json();
    const { teknisi_id } = body;

    if (!teknisi_id) {
      return NextResponse.json({ error: "teknisi_id is required" }, { status: 400 });
    }

    // Validate penugasan ownership
    const { data: penugasan, error: penugasanError } = await supabase
      .from('penugasan')
      .select('supervisor_id')
      .eq('id', penugasan_id)
      .single();

    if (penugasanError || !penugasan) {
      return NextResponse.json({ error: "Penugasan not found" }, { status: 404 });
    }

    // Check ownership
    if (penugasan.supervisor_id !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Delete assignment
    const { error: deleteError } = await supabase
      .from('penugasan_teknisi')
      .delete()
      .eq('penugasan_id', penugasan_id)
      .eq('teknisi_id', teknisi_id);

    if (deleteError) {
      console.error('Error removing teknisi:', deleteError);
      return NextResponse.json({ error: "Failed to remove teknisi" }, { status: 500 });
    }

    // Optional: Check if no teknisi left, maybe update status
    const { count } = await supabase
      .from('penugasan_teknisi')
      .select('*', { count: 'exact', head: true })
      .eq('penugasan_id', penugasan_id);

    // Return success
    return NextResponse.json({ 
      message: "Teknisi removed successfully",
      remaining_teknisi: count || 0
    });
  } catch (error) {
    console.error('Unexpected error in DELETE /api/penugasan/[id]/assign-teknisi:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
