/**
 * Payslip PDF Generator Helper
 * 
 * Generates slip gaji for CV. Coral Palembang using client-side jsPDF.
 */


// Fetch local image helper
const fetchLocalImageAsDataUrl = async (path: string): Promise<string | null> => {
  if (typeof window === "undefined") return null;
  try {
    const res = await fetch(path);
    if (!res.ok) throw new Error("Failed to fetch image");
    const blob = await res.blob();
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (e) {
    console.warn("Failed to load local image:", path, e);
    return null;
  }
};

export async function generateSlipGajiPdf(gaji: any) {
  console.log("[Payslip PDF] Generating PDF for gaji:", gaji.id);

  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4" });

  const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
  const pageHeight = doc.internal.pageSize.getHeight(); // 297mm
  const margin = 20;
  const contentWidth = pageWidth - margin * 2; // 170mm

  // Helper function to draw borders
  const drawSectionBorder = (x: number, y: number, w: number, h: number) => {
    doc.setDrawColor(180, 180, 180);
    doc.setLineWidth(0.3);
    doc.rect(x, y, w, h, "S");
  };

  // ============================================
  // 1. SECTION HEADER (Dengan Border)
  // ============================================
  let currentY = margin;
  const headerHeight = 26;
  drawSectionBorder(margin, currentY, contentWidth, headerHeight);

  // Load Logo
  const logoDataUrl = await fetchLocalImageAsDataUrl("/icon.png");
  if (logoDataUrl) {
    try {
      doc.addImage(logoDataUrl, "PNG", margin + 6, currentY + 3, 20, 20);
    } catch (e) {
      console.warn("Could not render logo in PDF", e);
    }
  } else {
    // Draw logo placeholder box
    doc.setDrawColor(200, 200, 200);
    doc.rect(margin + 6, currentY + 3, 20, 20);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text("LOGO", margin + 16, currentY + 14, { align: "center" });
  }

  // Company Information
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text("CV. CORAL PALEMBANG", margin + 30, currentY + 10);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  doc.text("AKBP. H. Umar No.106 Palembang", margin + 30, currentY + 16);
  doc.text("Telepon: +62 711-XXXX-XXX | Email: info@coralpalembang.co.id", margin + 30, currentY + 21);

  currentY += headerHeight + 8;

  // ============================================
  // 2. JUDUL DOKUMEN
  // ============================================
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text("SLIP GAJI TEKNISI", pageWidth / 2, currentY, { align: "center" });

  // Center line under title
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.5);
  doc.line(pageWidth / 2 - 25, currentY + 2, pageWidth / 2 + 25, currentY + 2);

  currentY += 8;

  // ============================================
  // 3. SECTION DETAIL KARYAWAN & PERIODE (Dengan Border)
  // ============================================
  const detailHeight = 28;
  drawSectionBorder(margin, currentY, contentWidth, detailHeight);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(60, 60, 60);

  // Labels stacked vertically
  doc.text("Nama Karyawan", margin + 6, currentY + 8);
  doc.text("Nomor Induk Karyawan (NIK)", margin + 6, currentY + 14);
  doc.text("Proyek / Tugas", margin + 6, currentY + 20);
  doc.text("Periode Kerja", margin + 6, currentY + 26);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(0, 0, 0);

  const formattedName = gaji.teknisi?.nama || "Tidak Diketahui";
  const formattedNik = gaji.teknisi?.nik || "";
  const formattedProyek = gaji.penugasan?.judul || "Penugasan";
  const formattedPeriode = `${new Date(gaji.periode_mulai).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })} s/d ${new Date(gaji.periode_selesai).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}`;

  doc.text(`:   ${formattedName}`, margin + 55, currentY + 8);
  doc.text(`:   ${formattedNik}`, margin + 55, currentY + 14);
  doc.text(`:   ${formattedProyek}`, margin + 55, currentY + 20);
  doc.text(`:   ${formattedPeriode}`, margin + 55, currentY + 26);

  currentY += detailHeight + 6;

  // ============================================
  // 4. SECTION KOMPONEN PENERIMAAN GAJI (List Format, Dengan Border)
  // ============================================
  const componentsHeight = 38;
  drawSectionBorder(margin, currentY, contentWidth, componentsHeight);

  // Title for component section (inside the border box)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text("RINCIAN PENERIMAAN KOMPENSASI", margin + 6, currentY + 8);

  // Divider line after title
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(margin + 4, currentY + 12, margin + contentWidth - 4, currentY + 12);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);

  // List of components (No Potongan)
  const labelX = margin + 6;
  const valueX = margin + 120;

  const tunjanganJabatanVal = gaji.tunjangan_jabatan || 0;
  const bonusBwmVal = gaji.bonus_bwm || 0;
  const totalGajiVal = gaji.total_gaji || 0;

  // Tunjangan Kompetensi
  doc.text("Tunjangan Kompetensi (Tunjangan Jabatan)", labelX, currentY + 18);
  doc.text(`Rp ${tunjanganJabatanVal.toLocaleString("id-ID")}`, valueX, currentY + 18);

  // Tunjangan Kinerja
  doc.text("Tunjangan Kinerja (Bonus Kinerja)", labelX, currentY + 24);
  doc.setTextColor(0, 120, 0); // Green for bonus
  doc.text(`+ Rp ${bonusBwmVal.toLocaleString("id-ID")}`, valueX, currentY + 24);
  doc.setTextColor(0, 0, 0);

  // Divider line before total
  doc.setDrawColor(200, 200, 200);
  doc.line(margin + 4, currentY + 28, margin + contentWidth - 4, currentY + 28);

  // Total (Take Home Pay)
  doc.setFont("helvetica", "bold");
  doc.text("Total Diterima (Take Home Pay)", labelX, currentY + 33);
  doc.setTextColor(0, 120, 0);
  doc.text(`Rp ${totalGajiVal.toLocaleString("id-ID")}`, valueX, currentY + 33);

  currentY += componentsHeight + 10;

  // ============================================
  // 5. SECTION TANDA TANGAN (SIGNATURE)
  // ============================================
  const dateStr = new Date().toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric"
  });

  const teknisiName = gaji.teknisi?.nama || "Teknisi";
  const managerName = gaji.disetujui_oleh?.nama || "Manager";

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);

  // Left Column (Receiver / Teknisi)
  doc.text("Penerima,", margin + 10, currentY + 5);
  doc.setDrawColor(180, 180, 180);
  doc.line(margin + 10, currentY + 28, margin + 65, currentY + 28);
  doc.setFont("helvetica", "bold");
  doc.text(teknisiName, margin + 10, currentY + 33);

  // Right Column (Authorized / Manager)
  doc.setFont("helvetica", "normal");
  doc.text(`Palembang, ${dateStr}`, margin + 105, currentY);
  doc.text("Mengetahui,", margin + 105, currentY + 5);
  doc.text("HR & Payroll", margin + 105, currentY + 10);
  doc.line(margin + 105, currentY + 28, margin + 160, currentY + 28);
  doc.setFont("helvetica", "bold");
  doc.text(managerName, margin + 105, currentY + 33);

  // Footer page number / generation note
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text(`Dicetak pada: ${new Date().toLocaleString("id-ID")}`, margin, pageHeight - 10);

  return doc;
}

export async function downloadSlipGajiPdf(gaji: any, filename?: string): Promise<boolean> {
  if (typeof window === "undefined") {
    throw new Error("downloadSlipGajiPdf can only be used in the browser");
  }

  console.log("[Payslip PDF] Starting download for slip gaji:", gaji.id);

  try {
    const doc = await generateSlipGajiPdf(gaji);
    const dateFormatted = new Date().toISOString().slice(0, 10);
    const rawName = filename || `SlipGaji-${gaji.teknisi?.nama || "Teknisi"}-${dateFormatted}.pdf`;
    const safeName = rawName.replace(/[^a-zA-Z0-9._-]/g, "-");

    try {
      const blob = doc.output("blob");
      if (blob instanceof Blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = safeName;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        console.log("[Payslip PDF] Download successful via blob");
        return true;
      }
    } catch (e) {
      console.warn("[Payslip PDF] Blob method failed, using fallback", e);
    }

    doc.save(safeName);
    console.log("[Payslip PDF] Fallback download successful");
    return true;
  } catch (e) {
    console.error("[Payslip PDF] Download failed", e);
    return false;
  }
}
