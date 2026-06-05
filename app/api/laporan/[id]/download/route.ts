import { NextResponse } from 'next/server';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { createClient } from '@/lib/supabase/server';

export async function GET(_req: Request, context: any) {
  const params = context?.params || {};
  const laporanId = Number(params?.id);
  if (!laporanId) return NextResponse.json({ error: 'Invalid laporan id' }, { status: 400 });

  const supabase = await createClient();

  // Fetch laporan detail and related bukti_laporan and penugasan
  const { data: laporanData, error: laporanError } = await supabase
    .from('laporan_progres')
    .select('*, penugasan:penugasan_id(id, judul, lokasi, start_date, end_date), bukti:bukti_laporan(*)')
    .eq('id', laporanId)
    .single();

  if (laporanError || !laporanData) {
    return NextResponse.json({ error: 'Laporan not found' }, { status: 404 });
  }

  const laporan = laporanData;
  const penugasan = laporan.penugasan;
  const bukti = laporan.bukti || [];

  // Create PDF using pdf-lib (compatible with Next.js bundler)
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // A4 in points
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const { width, height } = page.getSize();

  const margin = 40;
  let cursorY = height - margin;

  // Header
  page.drawText(`Laporan Progres - ${penugasan.judul}`, { x: margin, y: cursorY, size: 14, font });
  cursorY -= 18;
  page.drawText(`Tanggal: ${new Date(laporan.tanggal_laporan).toLocaleDateString('id-ID')}`, { x: margin, y: cursorY, size: 10, font });
  cursorY -= 14;
  page.drawText(
    `Status Progres: ${laporan.status_progres} ${laporan.persentase_progres ? `• ${laporan.persentase_progres}%` : ''}`,
    { x: margin, y: cursorY, size: 10, font }
  );
  cursorY -= 18;
  if (laporan.catatan) {
    page.drawText(`Catatan: ${laporan.catatan}`, { x: margin, y: cursorY, size: 10, font });
  }

  // Helper to fetch image bytes and detect type
  const fetchImageBytesAndType = async (url?: string) => {
    if (!url) return null;
    try {
      const res = await fetch(url);
      if (!res.ok) return null;
      const arr = new Uint8Array(await res.arrayBuffer());
      // Detect PNG vs JPEG
      const isPng = arr[0] === 0x89 && arr[1] === 0x50 && arr[2] === 0x4e && arr[3] === 0x47;
      const isJpg = arr[0] === 0xff && arr[1] === 0xd8 && arr[2] === 0xff;
      return { bytes: arr, type: isPng ? 'png' : isJpg ? 'jpg' : 'unknown' };
    } catch (e) {
      console.warn('Failed to fetch image', e);
      return null;
    }
  };

  for (const b of bukti) {
    const p = pdfDoc.addPage([595.28, 841.89]);
    let y = 800;
    p.drawText(b.judul || 'Bukti', { x: margin, y, size: 12, font });
    y -= 18;
    if (b.deskripsi) {
      p.drawText(b.deskripsi, { x: margin, y, size: 10, font });
      y -= 36;
    }

    // fetch images
    const before = await fetchImageBytesAndType(b.before_foto_url);
    const after = await fetchImageBytesAndType(b.after_foto_url);

    const maxWidth = (595.28 - margin * 2 - 6) / 2;
    const maxHeight = 400;

    const drawImage = async (img: { bytes: Uint8Array; type: string } | null, x: number, yTop: number) => {
      if (!img) return;
      try {
        let embedded: any;
        if (img.type === 'png') embedded = await pdfDoc.embedPng(img.bytes);
        else if (img.type === 'jpg') embedded = await pdfDoc.embedJpg(img.bytes);
        else {
          // try png first, fallback to jpg
          try { embedded = await pdfDoc.embedPng(img.bytes); } catch { embedded = await pdfDoc.embedJpg(img.bytes); }
        }
        const { width: iw, height: ih } = embedded.scale(1);
        const ratio = iw / ih;
        let w = Math.min(maxWidth, iw);
        let h = w / ratio;
        if (h > maxHeight) {
          h = maxHeight;
          w = h * ratio;
        }
        p.drawImage(embedded, { x, y: yTop - h, width: w, height: h });
      } catch (e) {
        console.warn('Failed to embed image', e);
      }
    };

    const imgYTop = y;
    await drawImage(before, margin, imgYTop);
    await drawImage(after, margin + maxWidth + 6, imgYTop);
  }

  const pdfBytes = await pdfDoc.save();

  return new Response(Buffer.from(pdfBytes), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="laporan-${laporanId}.pdf"`,
    },
  });
}
