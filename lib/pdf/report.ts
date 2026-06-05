import type { PenugasanWithRelations, LaporanDetail } from "@/lib/penugasan/types";

export const fetchImageAsDataUrl = async (url: string, timeoutMs = 15000): Promise<string | null> => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    let fetchUrl = url;
    if (typeof window !== 'undefined') {
      fetchUrl = `/api/images/proxy?url=${encodeURIComponent(url)}`;
    }
    const res = await fetch(fetchUrl, { signal: controller.signal });
    if (!res.ok) throw new Error('Failed to fetch image');
    const blob = await res.blob();

    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      console.warn('Image fetch timed out', url);
    } else {
      console.warn('Failed to fetch image', url, err);
    }
    return null;
  } finally {
    clearTimeout(timeout);
  }
};

// Helper untuk stretch gambar ke container dengan quality tinggi
const stretchImageToContainer = async (dataUrl: string, targetW: number, targetH: number): Promise<string> => {
  if (typeof window === 'undefined') return dataUrl;
  
  try {
    return await new Promise<string>((resolve) => {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.onload = () => {
        // Use higher resolution for better quality
        const pxPerMm = 96 / 25.4;
        const scaleFactor = 4; // Increased from 2.5 to 4 for better quality
        const canvasW = Math.round(targetW * pxPerMm * scaleFactor);
        const canvasH = Math.round(targetH * pxPerMm * scaleFactor);
        
        const canvas = document.createElement('canvas');
        canvas.width = canvasW;
        canvas.height = canvasH;
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(dataUrl);

        // Enable image smoothing for better quality
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // White background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvasW, canvasH);
        
        // Stretch to fill entire container
        ctx.drawImage(img, 0, 0, canvasW, canvasH);

        try {
          // Increase JPEG quality from 0.92 to 0.95
          resolve(canvas.toDataURL('image/jpeg', 0.95));
        } catch (e) {
          console.warn('Canvas export failed', e);
          resolve(dataUrl);
        }
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    });
  } catch (e) {
    console.warn('Image stretch failed', e);
    return dataUrl;
  }
};

export async function generateLaporanPdf(penugasan: PenugasanWithRelations, laporan: LaporanDetail) {
  console.log('[PDF] Generating PDF for laporan:', laporan.id);
  
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  let contentCount = 0;

  // ============================================
  // COVER PAGE - Professional & Formal
  // ============================================
  
  let y = margin + 4;
  
  // Title - centered and bold
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(0, 0, 0);
  doc.text('LAPORAN PROGRES PEKERJAAN', pageWidth / 2, y, { align: 'center' as any, maxWidth: pageWidth - margin * 2 });
  y += 5;
  
  // Subtitle - project title
  doc.setFontSize(14);
  const projectTitle = penugasan.judul || 'Tanpa Judul';
  const titleLines = doc.splitTextToSize(projectTitle, pageWidth - margin * 2);
  doc.text(titleLines, pageWidth / 2, y, { align: 'center' as any });
  y += titleLines.length * 2 + 4;
  
  // Horizontal line separator
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  y += 10;
  
  // Information section - left aligned with labels
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Tanggal Laporan:', margin, y);
  doc.setFont('helvetica', 'normal');
  const tanggalText = new Date(laporan.tanggal_laporan).toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  const tanggalLines = doc.splitTextToSize(tanggalText, pageWidth - margin * 2 - 45);
  doc.text(tanggalLines, margin + 45, y);
  y += Math.max(6, tanggalLines.length * 6) + 4;
  
  // Teknisi
  const teknisiArray = (penugasan.teknisi || [])
    .map((t: any) => t.profil?.nama)
    .filter(Boolean);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Teknisi:', margin, y);
  y += 6;
  
  if (teknisiArray.length > 0) {
    doc.setFont('helvetica', 'normal');
    teknisiArray.forEach((nama) => {
      const namaLines = doc.splitTextToSize(nama, pageWidth - margin * 2 - 15);
      namaLines.forEach((line: string, idx: number) => {
        if (idx === 0) {
          doc.text(`${teknisiArray.indexOf(nama) + 1}. ${line}`, margin + 5, y);
        } else {
          doc.text(line, margin + 10, y);
        }
        y += 6;
      });
    });
  } else {
    doc.setFont('helvetica', 'italic');
    doc.text('Tidak ada teknisi', margin + 5, y);
    y += 6;
  }
  y += 4;
  
  // Alat
  const alatArray = (penugasan.alat || [])
    .map((a: any) => ({
      nama: a.alat?.nama || 'Alat',
      jumlah: a.jumlah
    }))
    .filter(a => a.nama);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Alat:', margin, y);
  y += 6;
  
  if (alatArray.length > 0) {
    doc.setFont('helvetica', 'normal');
    alatArray.forEach((alat, idx) => {
      const text = `${alat.nama}${alat.jumlah ? ` (${alat.jumlah} unit)` : ''}`;
      const alatLines = doc.splitTextToSize(text, pageWidth - margin * 2 - 15);
      alatLines.forEach((line: string, lineIdx: number) => {
        if (lineIdx === 0) {
          doc.text(`${idx + 1}. ${line}`, margin + 5, y);
        } else {
          doc.text(line, margin + 10, y);
        }
        y += 6;
      });
    });
  } else {
    doc.setFont('helvetica', 'italic');
    doc.text('Tidak ada alat', margin + 5, y);
    y += 6;
  }
  y += 4;
  
  // Catatan section (if exists)
  if (laporan.catatan) {
    // Check if we need new page
    if (y > pageHeight - margin - 30) {
      doc.addPage();
      y = margin;
    }
    
    doc.setFont('helvetica', 'bold');
    doc.text('Catatan:', margin, y);
    y += 8;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    const catatanLines = doc.splitTextToSize(laporan.catatan, pageWidth - margin * 2);
    doc.text(catatanLines, margin, y);
    y += catatanLines.length * 6 + 10;
  }
  
  // Main photo section (if exists)
  if (laporan.foto_url) {
    // Check if we need new page
    if (y > pageHeight - margin - 80) {
      doc.addPage();
      y = margin;
    }
    
    y += 5;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('Dokumentasi:', margin, y);
    y += 8;
    
    const dataUrl = await fetchImageAsDataUrl(laporan.foto_url);
    if (dataUrl) {
      try {
        const availableHeight = pageHeight - y - margin - 20;
        const imgW = pageWidth - margin * 2;
        const imgH = Math.min(availableHeight, 120);
        
        // Check margin safety
        if (y + imgH > pageHeight - margin) {
          doc.addPage();
          y = margin;
        }
        
        const stretched = await stretchImageToContainer(dataUrl, imgW, imgH);
        
        // Border around image
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.3);
        doc.rect(margin, y, imgW, imgH, 'S');
        
        doc.addImage(stretched, 'JPEG', margin, y, imgW, imgH);
        y += imgH + 5;
        
        contentCount += 1;
      } catch (e) {
        console.warn('Cannot add main photo', e);
      }
    }
  }

  // ============================================
  // EVIDENCE PAGES - MULTIPLE PAIRS PER PAGE
  // ============================================
  
  const rawPairs = ((laporan as any).pairs || (laporan as any).bukti_laporan || (laporan as any).bukti || []);
  const pairs = rawPairs.map((p: any) => ({
    judul: p.judul || p.pair_key || undefined,
    deskripsi: p.deskripsi || undefined,
    before: p.before_foto_url || p.before || p.before?.foto_url || undefined,
    after: p.after_foto_url || p.after || p.after?.foto_url || undefined,
    beforeTakenAt: p.before?.taken_at || p.taken_at || undefined,
    afterTakenAt: p.after?.taken_at || p.taken_at || undefined,
  }));

  console.log('[PDF] Processing', pairs.length, 'evidence pairs');
  
  // Fetch all images
  const fetchedPairs = await Promise.all(
    pairs.map(async (p: any) => {
      const beforeData = p.before ? await fetchImageAsDataUrl(p.before) : null;
      const afterData = p.after ? await fetchImageAsDataUrl(p.after) : null;
      return { ...p, beforeData, afterData };
    })
  );

  // Fixed dimensions for consistency
  const gutter = 8;
  const FIXED_IMG_WIDTH = (pageWidth - margin * 2 - gutter) / 2;
  const FIXED_IMG_HEIGHT = 80; // Fixed height in mm
  const LABEL_HEIGHT = 6;
  const TITLE_HEIGHT = 8;
  const DESC_HEIGHT_PER_LINE = 5;
  const SPACING = 6;
  
  // Start rendering pairs
  let currentY = margin;
  let isFirstPair = true;
  
  for (let i = 0; i < fetchedPairs.length; i++) {
    const pair = fetchedPairs[i];
    
    // Calculate height needed for this pair
    const hasBeforeAndAfter = pair.beforeData && pair.afterData;
    
    doc.setFontSize(10);
    const descLines = pair.deskripsi ? doc.splitTextToSize(pair.deskripsi, pageWidth - margin * 2) : [];
    const descHeight = descLines.length * DESC_HEIGHT_PER_LINE;
    
    const pairHeight = TITLE_HEIGHT + descHeight + SPACING + LABEL_HEIGHT + FIXED_IMG_HEIGHT + SPACING;
    
    // Check if we need a new page (or if this is the first pair, add new page)
    if (isFirstPair || currentY + pairHeight > pageHeight - margin) {
      doc.addPage();
      currentY = margin;
    }
    
    isFirstPair = false;
    
    // Render title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    const pairTitle = pair.judul || `Dokumentasi #${i + 1}`;
    const titleLines = doc.splitTextToSize(pairTitle, pageWidth - margin * 2);
    doc.text(titleLines, margin, currentY);
    currentY += titleLines.length * 5 + 3;
    
    // Description
    if (pair.deskripsi) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(60, 60, 60);
      doc.text(descLines, margin, currentY);
      currentY += descHeight + SPACING;
    } else {
      currentY += SPACING;
    }
    
    // Images section
    if (hasBeforeAndAfter) {
      const tableY = currentY;
      const tableHeight = LABEL_HEIGHT + FIXED_IMG_HEIGHT;
      const tableWidth = FIXED_IMG_WIDTH * 2 + gutter;
      
      // Draw outer table border
      doc.setDrawColor(180, 180, 180);
      doc.setLineWidth(0.5);
      doc.rect(margin, tableY, tableWidth, tableHeight, 'S');
      
      // Draw middle divider line
      doc.setDrawColor(180, 180, 180);
      doc.setLineWidth(0.5);
      doc.line(margin + FIXED_IMG_WIDTH + gutter/2, tableY, margin + FIXED_IMG_WIDTH + gutter/2, tableY + tableHeight);
      
      // Before image
      if (pair.beforeData) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(0, 0, 0);
        doc.text('Before', margin + FIXED_IMG_WIDTH / 2, currentY + 4, { align: 'center' as any });
        
        const stretched = await stretchImageToContainer(pair.beforeData, FIXED_IMG_WIDTH, FIXED_IMG_HEIGHT);
        doc.addImage(stretched, 'JPEG', margin, currentY + LABEL_HEIGHT, FIXED_IMG_WIDTH, FIXED_IMG_HEIGHT);
        

        
        contentCount += 1;
      }
      
      // After image
      if (pair.afterData) {
        const xAfter = margin + FIXED_IMG_WIDTH + gutter;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(0, 0, 0);
        doc.text('After', xAfter + FIXED_IMG_WIDTH / 2, currentY + 4, { align: 'center' as any });
        
        const stretched = await stretchImageToContainer(pair.afterData, FIXED_IMG_WIDTH, FIXED_IMG_HEIGHT);
        doc.addImage(stretched, 'JPEG', xAfter, currentY + LABEL_HEIGHT, FIXED_IMG_WIDTH, FIXED_IMG_HEIGHT);
        

        
        contentCount += 1;
      }
      
      currentY += tableHeight + SPACING * 2;
      
    } else {
      // Single image - centered with border
      const imgW = Math.min(FIXED_IMG_WIDTH * 1.5, pageWidth - margin * 2);
      const xCenter = (pageWidth - imgW) / 2;
      const imgData = pair.beforeData || pair.afterData;
      const label = pair.beforeData ? 'Before' : 'After';
      
      if (imgData) {
        const tableY = currentY;
        const tableHeight = LABEL_HEIGHT + FIXED_IMG_HEIGHT;
        
        // Draw border around single image
        doc.setDrawColor(180, 180, 180);
        doc.setLineWidth(0.5);
        doc.rect(xCenter, tableY, imgW, tableHeight, 'S');
        
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(0, 0, 0);
        doc.text(label, pageWidth / 2, currentY + 4, { align: 'center' as any });
        
        const stretched = await stretchImageToContainer(imgData, imgW, FIXED_IMG_HEIGHT);
        doc.addImage(stretched, 'JPEG', xCenter, currentY + LABEL_HEIGHT, imgW, FIXED_IMG_HEIGHT);
        
        contentCount += 1;
      }
      
      currentY += LABEL_HEIGHT + FIXED_IMG_HEIGHT + SPACING * 2;
    }
    
    // Separator line (except for last pair)
    if (i < fetchedPairs.length - 1) {
      doc.setDrawColor(220, 220, 220);
      doc.setLineWidth(0.2);
      doc.line(margin, currentY, pageWidth - margin, currentY);
      currentY += SPACING;
    }
  }

  // ============================================
  // PAGE NUMBERS & FOOTER
  // ============================================
  
  const totalPages = (doc as any).getNumberOfPages();
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(120, 120, 120);
  
  for (let i = 1; i <= totalPages; i++) {
    (doc as any).setPage(i);
    
    // Footer line
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);
    
    // Page number
    doc.text(`Halaman ${i} dari ${totalPages}`, pageWidth / 2, pageHeight - 10, { align: 'center' as any });
    
    // Date generated
    doc.setFontSize(8);
    doc.text(`Dibuat: ${new Date().toLocaleDateString('id-ID')}`, pageWidth - margin, pageHeight - 10, { align: 'right' as any });
  }

  // Empty content note
  if (contentCount === 0) {
    (doc as any).setPage(1);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(11);
    doc.setTextColor(100, 100, 100);
    const emptyY = pageHeight / 2;
    doc.text('Tidak ada dokumentasi foto pada laporan ini.', pageWidth / 2, emptyY, { align: 'center' as any, maxWidth: pageWidth - margin * 2 });
  }

  console.log('[PDF] Generation complete. Content count:', contentCount);
  return { doc, contentCount };
}

export async function downloadLaporanPdf(penugasan: PenugasanWithRelations, laporan: LaporanDetail, filename?: string): Promise<boolean> {
  if (typeof window === 'undefined') {
    throw new Error('downloadLaporanPdf can only be used in the browser');
  }

  console.log('[PDF] Starting download for laporan:', laporan.id);
  
  try {
    const { doc } = await generateLaporanPdf(penugasan, laporan);
    const rawName = filename || `Laporan-${penugasan.judul?.substring(0, 20) || 'Progres'}-${new Date(laporan.tanggal_laporan).toISOString().slice(0, 10)}.pdf`;
    const safeName = rawName.replace(/[^a-zA-Z0-9._-]/g, '-');

    try {
      const blob = (doc as any).output('blob');
      if (blob instanceof Blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = safeName;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        console.log('[PDF] Download successful');
        return true;
      }
    } catch (e) {
      console.warn('[PDF] Blob method failed, using fallback', e);
    }

    (doc as any).save(safeName);
    console.log('[PDF] Fallback download successful');
    return true;
  } catch (e) {
    console.error('[PDF] Download failed', e);
    return false;
  }
}