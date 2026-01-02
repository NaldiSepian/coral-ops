// API Routes untuk Manager - Penugasan
// =============================================================================
// GET /api/manager/penugasan - List semua penugasan untuk manager
// - Query params: status, kategori, search, page, limit
// - Include: count teknisi, count alat, progress summary
// - Return: { data: [...], pagination: { total, hasMore } }
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { PenugasanFilters, PenugasanListResponse } from "@/lib/penugasan";
import { PENUGASAN_LIST_LIMIT, PENUGASAN_LIST_DEFAULT_PAGE } from "@/lib/penugasan";

export async function GET(request: NextRequest) {
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

    // Parse query params
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const kategori = searchParams.get('kategori');
    const priority = searchParams.get('priority');
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const page = parseInt(searchParams.get('page') || PENUGASAN_LIST_DEFAULT_PAGE.toString());
    const limit = parseInt(searchParams.get('limit') || PENUGASAN_LIST_LIMIT.toString());

    // Build query tanpa filter supervisor_id (manager bisa lihat semua)
    let query = supabase
      .from('penugasan')
      .select(`
        *,
        lokasi_text: lokasi::varchar,
        teknisi:penugasan_teknisi(count),
        alat:peminjaman_alat(alat_id, is_returned),
        supervisor:profil!penugasan_supervisor_id_fkey(nama)
      `, { count: 'exact' })
      .eq('is_deleted', false);

    // Apply filters
    if (status) query = query.eq('status', status);
    if (kategori) query = query.eq('kategori', kategori);
    if (priority) query = query.eq('priority', priority);
    if (search) query = query.ilike('judul', `%${search}%`);

    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    // Apply pagination
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    // Execute query
    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching penugasan for manager:', error);
      return NextResponse.json({ error: "Failed to fetch assignments" }, { status: 500 });
    }

    // Format response
    const response: PenugasanListResponse = {
      data: data || [],
      total: count || 0,
      page,
      limit,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Unexpected error in GET /api/manager/penugasan:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}