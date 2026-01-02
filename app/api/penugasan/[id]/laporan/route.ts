import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { createClient } from "@/lib/supabase/server";
import { createWKTPoint } from "@/lib/penugasan/utils";
import type { BuktiLaporanPairPayload, StatusLaporanProgres } from "@/lib/penugasan/types";

const VALID_STATUS: StatusLaporanProgres[] = [
  'Menunggu',
  'Sedang Dikerjakan',
  'Hampir Selesai',
  'Selesai',
];
const MAX_PAIR_COUNT = 5;

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

    const { id } = await params;
    const penugasanId = Number(id);
    if (Number.isNaN(penugasanId)) {
      return NextResponse.json({ error: "Invalid assignment id" }, { status: 400 });
    }

    const body = await request.json();
    const {
      tanggal_laporan,
      status_progres,
      persentase_progres,
      foto_url,
      catatan,
      latitude,
      longitude,
      return_tools,
      pairs,
      tool_photos,
      return_tool_photos
    } = body;

    if (!status_progres || !VALID_STATUS.includes(status_progres)) {
      return NextResponse.json({ error: "Status progres tidak valid" }, { status: 400 });
    }

    if (!foto_url || typeof foto_url !== 'string') {
      return NextResponse.json({ error: "Foto bukti wajib diunggah" }, { status: 400 });
    }

    // Validasi persentase berdasarkan status
    if (persentase_progres !== undefined && persentase_progres !== null) {
      const persentaseNum = Number(persentase_progres);
      if (Number.isNaN(persentaseNum)) {
        return NextResponse.json({ error: "Persentase harus berupa angka" }, { status: 400 });
      }

      let validRange = false;
      switch (status_progres) {
        case 'Menunggu':
          validRange = persentaseNum >= 0 && persentaseNum <= 10;
          break;
        case 'Sedang Dikerjakan':
          validRange = persentaseNum >= 11 && persentaseNum <= 75;
          break;
        case 'Hampir Selesai':
          validRange = persentaseNum >= 76 && persentaseNum <= 99;
          break;
        case 'Selesai':
          validRange = persentaseNum === 100;
          break;
      }

      if (!validRange) {
        return NextResponse.json({ 
          error: `Persentase tidak sesuai dengan status "${status_progres}"` 
        }, { status: 400 });
      }
    }

    const reportDate = tanggal_laporan || new Date().toISOString().slice(0, 10);

    const { data: assignmentLink, error: assignmentError } = await supabase
      .from('penugasan_teknisi')
      .select('penugasan_id')
      .eq('penugasan_id', penugasanId)
      .eq('teknisi_id', user.id)
      .single();

    if (assignmentError || !assignmentLink) {
      return NextResponse.json({ error: "Assignment not found or not assigned" }, { status: 404 });
    }

    const { data: penugasan, error: penugasanError } = await supabase
      .from('penugasan')
      .select('frekuensi_laporan, start_date, end_date, status')
      .eq('id', penugasanId)
      .single();

    if (penugasanError || !penugasan) {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
    }

    const lokasiPoint = (typeof latitude === 'number' && typeof longitude === 'number')
      ? createWKTPoint(latitude, longitude)
      : null;

    const { data: lastReport } = await supabase
      .from('laporan_progres')
      .select('*')
      .eq('penugasan_id', penugasanId)
      .order('tanggal_laporan', { ascending: false })
      .limit(1)
      .maybeSingle();

    const { data: report, error: insertError } = await supabase
      .from('laporan_progres')
      .insert({
        penugasan_id: penugasanId,
        pelapor_id: user.id,
        tanggal_laporan: reportDate,
        persentase_progres: persentase_progres ?? null,
        status_progres,
        foto_url,
        catatan,
        titik_gps: lokasiPoint
      })
      .select('*')
      .single();

    if (insertError || !report) {
      console.error('Failed to create progress report:', insertError);
      return NextResponse.json({ error: "Failed to submit report" }, { status: 500 });
    }

    const nowIso = new Date().toISOString();
    const frequencyDays = penugasan.frekuensi_laporan === 'Harian' ? 1 : 7;
    let warning: string | null = null;

    if (lastReport) {
      const lastDate = new Date(lastReport.tanggal_laporan);
      const newDate = new Date(reportDate);
      const diffDays = Math.ceil((newDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays > frequencyDays) {
        warning = `Laporan sebelumnya melewati ${diffDays - frequencyDays} hari dari jadwal.`;
      }
    }

    let autoReturnedTools = 0;
    let savedPairs = 0;

    const shouldFinalize = status_progres === 'Selesai';
    const shouldAutoReturn = shouldFinalize && Boolean(return_tools);
    const isFirstReport = !lastReport; // Cek apakah ini laporan pertama

    // Handle foto pengambilan alat untuk laporan pertama
    if (isFirstReport && tool_photos) {
      if (!Array.isArray(tool_photos)) {
        return NextResponse.json({ error: "Format foto pengambilan alat tidak valid" }, { status: 400 });
      }

      // Validasi dan update foto pengambilan alat
      for (const toolPhoto of tool_photos) {
        if (!toolPhoto.alat_id || !toolPhoto.foto_url) {
          return NextResponse.json({ error: "Foto pengambilan alat tidak lengkap" }, { status: 400 });
        }

        const { error: updateToolError } = await supabase
          .from('peminjaman_alat')
          .update({ foto_ambil_url: toolPhoto.foto_url })
          .eq('penugasan_id', penugasanId)
          .eq('alat_id', toolPhoto.alat_id)
          .eq('is_returned', false);

        if (updateToolError) {
          console.error('Failed to update tool pickup photo:', updateToolError);
          return NextResponse.json({ error: "Gagal menyimpan foto pengambilan alat" }, { status: 500 });
        }
      }
    }

    // Handle foto pengembalian alat jika return_tools dicentang
    if (shouldAutoReturn && return_tool_photos) {
      if (!Array.isArray(return_tool_photos)) {
        return NextResponse.json({ error: "Format foto pengembalian alat tidak valid" }, { status: 400 });
      }

      // Validasi dan update foto pengembalian alat
      for (const returnToolPhoto of return_tool_photos) {
        if (!returnToolPhoto.alat_id || !returnToolPhoto.foto_url) {
          return NextResponse.json({ error: "Foto pengembalian alat tidak lengkap" }, { status: 400 });
        }

        const { error: updateReturnToolError } = await supabase
          .from('peminjaman_alat')
          .update({ foto_kembali_url: returnToolPhoto.foto_url })
          .eq('penugasan_id', penugasanId)
          .eq('alat_id', returnToolPhoto.alat_id)
          .eq('is_returned', false);

        if (updateReturnToolError) {
          console.error('Failed to update tool return photo:', updateReturnToolError);
          return NextResponse.json({ error: "Gagal menyimpan foto pengembalian alat" }, { status: 500 });
        }
      }
    }

    // Validasi pairs - wajib untuk status Selesai
    if (shouldFinalize) {
      if (!Array.isArray(pairs) || pairs.length === 0) {
        return NextResponse.json({ error: "Minimal satu bukti foto before/after wajib untuk status Selesai" }, { status: 400 });
      }
      if (pairs.length > MAX_PAIR_COUNT) {
        return NextResponse.json({ error: `Maksimal ${MAX_PAIR_COUNT} bukti foto per laporan` }, { status: 400 });
      }
    }

    // Sanitize pairs - untuk semua status jika ada pairs yang dikirim
    let sanitizedPairs: BuktiLaporanPairPayload[] = [];
    if (Array.isArray(pairs) && pairs.length > 0) {
      // Validasi jumlah maksimal
      if (pairs.length > MAX_PAIR_COUNT) {
        return NextResponse.json({ error: `Maksimal ${MAX_PAIR_COUNT} bukti foto per laporan` }, { status: 400 });
      }

      try {
        sanitizedPairs = pairs.map((pair: BuktiLaporanPairPayload, index: number) => {
          if (!pair || typeof pair !== 'object') {
            throw new Error(`Format bukti foto ke-${index + 1} tidak valid`);
          }
          const { before, after } = pair;
          if (!before?.foto_url || !after?.foto_url) {
            throw new Error(`Pasangan foto ke-${index + 1} belum lengkap (before & after wajib diisi)`);
          }
          return {
            pair_key: pair.pair_key,
            judul: pair.judul,
            deskripsi: pair.deskripsi,
            before,
            after,
          };
        });
      } catch (pairError) {
        return NextResponse.json({ error: pairError instanceof Error ? pairError.message : 'Bukti before/after tidak valid' }, { status: 400 });
      }
    }

    if (shouldAutoReturn) {
      const { data: activeLoans, error: activeLoansError } = await supabase
        .from('peminjaman_alat')
        .select('id, alat_id, jumlah')
        .eq('penugasan_id', penugasanId)
        .eq('is_returned', false);

      if (!activeLoansError && activeLoans && activeLoans.length > 0) {
        for (const loan of activeLoans) {
          // Cari foto pengembalian untuk alat ini, fallback ke foto laporan jika tidak ada
          const returnPhoto = return_tool_photos?.find((rtp: any) => rtp.alat_id === loan.alat_id);
          const fotoKembaliUrl = returnPhoto?.foto_url || foto_url;

          const { error: updateLoanError } = await supabase
            .from('peminjaman_alat')
            .update({
              is_returned: true,
              returned_at: nowIso,
              foto_kembali_url: fotoKembaliUrl,
            })
            .eq('id', loan.id);

          if (updateLoanError) {
            console.error('Failed to auto-return tool:', updateLoanError);
            continue;
          }

          const { data: alatRow, error: alatFetchError } = await supabase
            .from('alat')
            .select('stok_tersedia')
            .eq('id', loan.alat_id)
            .single();

          if (!alatFetchError && alatRow) {
            const { error: restockError } = await supabase
              .from('alat')
              .update({ stok_tersedia: alatRow.stok_tersedia + loan.jumlah })
              .eq('id', loan.alat_id);

            if (restockError) {
              console.error('Failed to restock auto-returned tool:', restockError);
            }
          }

          autoReturnedTools += loan.jumlah;
        }
      }
    }

    // Simpan bukti_laporan jika ada pairs (untuk semua status)
    if (sanitizedPairs.length > 0) {
      const buktiRows = sanitizedPairs.map((pair) => {
        const pairKey = pair.pair_key || randomUUID();
        return {
          laporan_id: report.id,
          pair_key: pairKey,
          judul: pair.judul || null,
          deskripsi: pair.deskripsi || null,
          before_foto_url: pair.before.foto_url,
          after_foto_url: pair.after.foto_url,
          taken_at: pair.before.taken_at || pair.after.taken_at || nowIso,
          taken_by: user.id,
          metadata: pair.before.metadata || pair.after.metadata || null,
        };
      });

      const { error: buktiError } = await supabase
        .from('bukti_laporan')
        .insert(buktiRows);

      if (buktiError) {
        console.error('Failed to insert bukti before/after:', buktiError);
        return NextResponse.json({ error: "Gagal menyimpan bukti before/after" }, { status: 500 });
      }

      savedPairs = sanitizedPairs.length;
    }

    // UPDATED LOGIC: Tidak langsung ubah status penugasan
    // Status penugasan akan diubah oleh supervisor saat validasi laporan
    // Setiap laporan akan memiliki status_validasi = 'Menunggu' by default (dari database)

    // Kirim notifikasi ke supervisor bahwa ada laporan baru
    const { data: supervisor } = await supabase
      .from('penugasan')
      .select('supervisor_id, judul')
      .eq('id', penugasanId)
      .single();

    if (supervisor) {
      await supabase.from('notifikasi').insert({
        penerima_id: supervisor.supervisor_id,
        pesan: shouldFinalize
          ? `Laporan FINAL baru untuk "${supervisor.judul}" telah dibuat`
          : `Laporan progres baru untuk "${supervisor.judul}" telah dibuat`
      });
    }

    await supabase.from('log_aktivitas').insert({
      pengguna_id: user.id,
      aksi: 'Laporan Progres',
      deskripsi: shouldFinalize
        ? `Penugasan ${penugasanId} - Laporan final dibuat`
        : `Penugasan ${penugasanId} tanggal ${reportDate} - Laporan progres dibuat`
    });

    const { count: totalReports } = await supabase
      .from('laporan_progres')
      .select('*', { count: 'exact', head: true })
      .eq('penugasan_id', penugasanId);

    return NextResponse.json({
      message: "Laporan disimpan",
      report,
      warning,
      total_reports: totalReports || 1,
      locked: shouldFinalize,
      auto_returned_tools: autoReturnedTools,
      saved_pair_count: savedPairs,
    });
  } catch (err) {
    console.error('Unexpected error in POST /api/penugasan/[id]/laporan:', err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
