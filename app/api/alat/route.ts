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

    // Check if user is Supervisor
    const { data: profile, error: profileError } = await supabase
      .from("profil")
      .select("peran")
      .eq("id", user.id)
      .single();

    if (profileError || profile?.peran !== "Supervisor") {
      return NextResponse.json(
        { error: "Only Supervisors can access inventory" },
        { status: 403 }
      );
    }

    // Get query parameters for filtering and pagination
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = supabase
      .from("alat")
      .select("*")
      .eq("is_deleted", false)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    // Add search filter if provided
    if (search) {
      query = query.ilike("nama", `%${search}%`);
    }

    const { data: alat, error: alatError } = await query;

    if (alatError) {
      console.error("Error fetching alat:", alatError);
      return NextResponse.json(
        { error: "Failed to fetch inventory" },
        { status: 500 }
      );
    }

    // Get total count for pagination
    let countQuery = supabase
      .from("alat")
      .select("*", { count: "exact", head: true })
      .eq("is_deleted", false);

    if (search) {
      countQuery = countQuery.ilike("nama", `%${search}%`);
    }

    const { count, error: countError } = await countQuery;

    if (countError) {
      console.error("Error counting alat:", countError);
    }

    return NextResponse.json({
      data: alat || [],
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: (offset + limit) < (count || 0)
      }
    });

  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if user is Supervisor
    const { data: profile, error: profileError } = await supabase
      .from("profil")
      .select("peran")
      .eq("id", user.id)
      .single();

    if (profileError || profile?.peran !== "Supervisor") {
      return NextResponse.json(
        { error: "Only Supervisors can add inventory" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { nama, stok_total, tipe_alat, deskripsi, foto_url } = body;

    // Validation
    if (!nama || typeof nama !== 'string' || !nama.trim()) {
      return NextResponse.json(
        { error: "Nama alat harus diisi" },
        { status: 400 }
      );
    }

    if (!stok_total || typeof stok_total !== 'number' || stok_total < 0) {
      return NextResponse.json(
        { error: "Stok total harus berupa angka positif" },
        { status: 400 }
      );
    }

    // Insert new alat
    const { data: newAlat, error: insertError } = await supabase
      .from("alat")
      .insert({
        nama: nama.trim(),
        stok_total: stok_total,
        stok_tersedia: stok_total,
        tipe_alat: tipe_alat || null,
        deskripsi: deskripsi || null,
        foto_url: foto_url || null,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error inserting alat:", insertError);
      return NextResponse.json(
        { error: "Failed to add alat" },
        { status: 500 }
      );
    }

    return NextResponse.json(newAlat);

  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}