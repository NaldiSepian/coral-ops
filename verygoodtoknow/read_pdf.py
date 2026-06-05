#!/usr/bin/env python3
"""
Script untuk membaca dan mengekstrak teks dari PDF
Usage: python read_pdf.py
"""

import os
import sys

# Cek apakah PyPDF2 sudah terinstall
try:
    from PyPDF2 import PdfReader
except ImportError:
    print("❌ PyPDF2 belum terinstall.")
    print("👉 Install dengan: pip install PyPDF2")
    sys.exit(1)


def read_pdf(file_path: str) -> dict:
    """
    Baca PDF dan ekstrak teks per halaman
    
    Args:
        file_path: Path ke file PDF
        
    Returns:
        dict: {'total_pages': int, 'pages': [{num, text}], 'full_text': str}
    """
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"File tidak ditemukan: {file_path}")
    
    reader = PdfReader(file_path)
    total_pages = len(reader.pages)
    
    pages_data = []
    full_text_parts = []
    
    for i, page in enumerate(reader.pages, 1):
        text = page.extract_text()
        pages_data.append({
            'page_number': i,
            'text': text if text else "[Halaman kosong atau gambar]"
        })
        if text:
            full_text_parts.append(f"=== HALAMAN {i} ===\n{text}\n")
    
    return {
        'total_pages': total_pages,
        'pages': pages_data,
        'full_text': '\n'.join(full_text_parts)
    }


def save_to_markdown(data: dict, output_path: str):
    """Simpan hasil ekstraksi ke file Markdown"""
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write("# Hasil Ekstraksi PDF\n\n")
        f.write(f"**Total Halaman:** {data['total_pages']}\n\n")
        f.write("---\n\n")
        f.write(data['full_text'])
    print(f"✅ Hasil disimpan ke: {output_path}")


def main():
    # Path ke PDF
    pdf_path = r"d:\Job Besak\coral-ops\TA NALDI SEPTIAN - SEMPRO BAB I, II, III.pdf"
    output_md = r"d:\Job Besak\coral-ops\verygoodtoknow\pdf_extracted.md"
    
    print(f"📖 Membaca PDF: {pdf_path}")
    print("-" * 50)
    
    try:
        data = read_pdf(pdf_path)
        
        print(f"✅ Berhasil membaca {data['total_pages']} halaman")
        print("\n" + "=" * 50)
        print("PREVIEW (Halaman 1-3):")
        print("=" * 50 + "\n")
        
        # Tampilkan preview 3 halaman pertama
        for page in data['pages'][:3]:
            preview = page['text'][:500] + "..." if len(page['text']) > 500 else page['text']
            print(f"\n📄 HALAMAN {page['page_number']}:")
            print(preview)
            print("-" * 40)
        
        # Simpan ke markdown
        save_to_markdown(data, output_md)
        
        print(f"\n📁 Semua teks disimpan di: {output_md}")
        print("📝 Silakan baca file tersebut untuk detail lengkap")
        
    except FileNotFoundError as e:
        print(f"❌ Error: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Error membaca PDF: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
