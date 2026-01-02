// API Routes untuk Manager - Laporan
// =============================================================================
// GET /api/manager/laporan - List semua laporan untuk manager
// - Query params: status, search, page, limit
// - Return: { data: [...], pagination: { total, hasMore } }
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Build query
    let query = supabase
      .from('laporan_progres')
      .select(`
        *,
        penugasan:penugasan_id(
          id,
          judul,
          kategori
        ),
        pelapor:pelapor_id(
          id,
          nama
        ),
        validator:divalidasi_oleh(
          id,
          nama
        )
      `, { count: 'exact' });

    // Apply filters
    if (status && status !== 'Semua') {
      query = query.eq('status_validasi', status);
    }
    if (search) {
      query = query.or(`penugasan.judul.ilike.%${search}%,pelapor.nama.ilike.%${search}%,catatan.ilike.%${search}%`);
    }

    // Order by created_at desc
    query = query.order('created_at', { ascending: false });

    // Apply pagination
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    // Execute query
    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching laporan for manager:', error);
      return NextResponse.json({ error: "Failed to fetch laporan" }, { status: 500 });
    }

    // Format response
    const response = {
      data: data || [],
      total: count || 0,
      page,
      limit,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Unexpected error in GET /api/manager/laporan:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}