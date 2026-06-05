import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { PenugasanListResponse } from "@/lib/penugasan";
import { PENUGASAN_LIST_LIMIT, PENUGASAN_LIST_DEFAULT_PAGE } from "@/lib/penugasan";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

    // Build query dengan filter
    let query = supabase
      .from('penugasan')
      .select(`
        *,
        lokasi_text: lokasi::varchar,
        teknisi:penugasan_teknisi(count),
        alat:peminjaman_alat(alat_id, is_returned)
      `, { count: 'exact' })
      .eq('supervisor_id', user.id)
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
      console.error('Error fetching penugasan:', error);
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
    console.error('Unexpected error in GET /api/penugasan:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const {
      judul,
      lokasi,
      kategori,
      frekuensi_laporan,
      start_date,
      end_date,
      teknisi_ids,
      alat_assignments // [{ alat_id, jumlah }]
    } = body;

    // Validasi input
    if (!judul || !lokasi || !kategori || !start_date || !Array.isArray(teknisi_ids) || !Array.isArray(alat_assignments)) {
      return NextResponse.json({ error: "Required fields missing" }, { status: 400 });
    }

    // Tentukan frekuensi laporan (menghormati input pengguna jika valid)
    const frekuensiMap: Record<string, 'Harian' | 'Mingguan'> = {
      'Rekonstruksi': 'Mingguan',
      'Instalasi': 'Harian',
      'Perawatan': 'Harian'
    };
    const allowedFrekuensi = ['Harian', 'Mingguan'];
    const resolvedFrekuensi = allowedFrekuensi.includes(frekuensi_laporan)
      ? frekuensi_laporan
      : frekuensiMap[kategori] || 'Harian';

    // Validasi lokasi format (harus ada latitude, longitude)
    if (!lokasi.latitude || !lokasi.longitude) {
      return NextResponse.json({ error: "Invalid location data" }, { status: 400 });
    }

    // Insert penugasan
    const { data: penugasan, error: insertError } = await supabase
      .from('penugasan')
      .insert({
        judul,
        lokasi: `POINT(${lokasi.longitude} ${lokasi.latitude})`,
        kategori,
        frekuensi_laporan: resolvedFrekuensi,
        supervisor_id: user.id,
        start_date,
        end_date: end_date || null,
        status: 'Aktif'
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating penugasan:', insertError);
      return NextResponse.json({ error: "Failed to create assignment" }, { status: 500 });
    }

    // Insert teknisi assignments
    if (teknisi_ids.length > 0) {
      const teknisiData = teknisi_ids.map(teknisiId => ({
        penugasan_id: penugasan.id,
        teknisi_id: teknisiId
      }));

      const { error: teknisiError } = await supabase
        .from('penugasan_teknisi')
        .insert(teknisiData);

      if (teknisiError) {
        console.error('Error assigning teknisi:', teknisiError);
        // Rollback penugasan creation
        await supabase.from('penugasan').delete().eq('id', penugasan.id);
        return NextResponse.json({ error: "Failed to assign technicians" }, { status: 500 });
      }
    }

    // Insert alat assignments dan kurangi stok
    if (alat_assignments.length > 0) {
      for (const assignment of alat_assignments) {
        const { alat_id, jumlah } = assignment;

        if (!alat_id || !jumlah || jumlah <= 0) {
          // Rollback
          await supabase.from('penugasan').delete().eq('id', penugasan.id);
          return NextResponse.json({ error: "Invalid alat assignment data" }, { status: 400 });
        }

        // Check stok cukup
        const { data: alat, error: alatCheckError } = await supabase
          .from('alat')
          .select('stok_tersedia, nama')
          .eq('id', alat_id)
          .eq('is_deleted', false)
          .single();

        if (alatCheckError || !alat) {
          console.error('Error checking alat stock:', alatCheckError);
          // Rollback
          await supabase.from('penugasan').delete().eq('id', penugasan.id);
          return NextResponse.json({ error: `Equipment with id ${alat_id} not found` }, { status: 404 });
        }

        if (alat.stok_tersedia < jumlah) {
          // Rollback
          await supabase.from('penugasan').delete().eq('id', penugasan.id);
          return NextResponse.json({
            error: `Insufficient stock for ${alat.nama}. Available: ${alat.stok_tersedia}, Requested: ${jumlah}`
          }, { status: 400 });
        }

        // Kurangi stok_tersedia
        const { error: updateStockError } = await supabase
          .from('alat')
          .update({ stok_tersedia: alat.stok_tersedia - jumlah })
          .eq('id', alat_id);

        if (updateStockError) {
          console.error('Error updating stock:', updateStockError);
          // Rollback
          await supabase.from('penugasan').delete().eq('id', penugasan.id);
          return NextResponse.json({ error: "Failed to update equipment stock" }, { status: 500 });
        }

        // Insert peminjaman_alat
        const { error: alatAssignError } = await supabase
          .from('peminjaman_alat')
          .insert({
            penugasan_id: penugasan.id,
            alat_id,
            jumlah,
            peminjam_id: user.id,
            is_returned: false
          });

        if (alatAssignError) {
          console.error('Error assigning alat:', alatAssignError);
          // Rollback stock
          await supabase
            .from('alat')
            .update({ stok_tersedia: alat.stok_tersedia })
            .eq('id', alat_id);
          // Rollback penugasan
          await supabase.from('penugasan').delete().eq('id', penugasan.id);
          return NextResponse.json({ error: "Failed to assign equipment" }, { status: 500 });
        }
      }
    }

    // Kirim notifikasi ke teknisi yang ditugaskan
    if (teknisi_ids.length > 0) {
      const notifications = teknisi_ids.map(teknisiId => ({
        penerima_id: teknisiId,
        pesan: `Anda telah ditugaskan untuk penugasan "${judul}" (${kategori}). Tanggal mulai: ${new Date(start_date).toLocaleDateString('id-ID')}.`
      }));

      const { error: notifError } = await supabase
        .from('notifikasi')
        .insert(notifications);

      if (notifError) {
        console.error('Error sending notifications:', notifError);
        // Don't fail the whole operation for notification errors
      }
    }

    // Return success response dengan relations
    const { data: completePenugasan, error: fetchError } = await supabase
      .from('penugasan')
      .select(`
        *,
        lokasi_text: lokasi::varchar,
        teknisi:penugasan_teknisi(
          teknisi_id,
          profil!penugasan_teknisi_teknisi_id_fkey(nama)
        ),
        alat:peminjaman_alat(
          alat_id,
          jumlah,
          alat!peminjaman_alat_alat_id_fkey(nama)
        )
      `)
      .eq('id', penugasan.id)
      .single();

    if (fetchError) {
      console.error('Error fetching complete penugasan:', fetchError);
      return NextResponse.json(penugasan); // Return basic data if fetch fails
    }

    return NextResponse.json(completePenugasan);
  } catch (error) {
    console.error('Unexpected error in POST /api/penugasan:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}