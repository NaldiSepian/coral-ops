/**
 * API Route untuk Preferensi BWM
 * 
 * Manager-only: CRUD preferensi BWM (BO/OW vectors)
 * 
 * @module app/api/bwm/preferensi
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { CreatePreferensiRequest } from '@/lib/bwm';

// Constants
const VALID_CRITERIA = ['c1', 'c2', 'c3', 'c4', 'c5'] as const;
const VALID_SCALE = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const;

/**
 * Check if user is manager
 */
async function requireManager(): Promise<{ user: { id: string }; role: string }> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    throw new Error('Unauthorized');
  }
  
  // Query profil untuk dapat role
  const { data, error } = await supabase
    .from('profil')
    .select('peran')
    .eq('id', user.id)
    .single();
  
  if (error || !data) {
    throw new Error('Gagal mengambil data user');
  }
  
  if (data.peran !== "Manager") {
    throw new Error("Hanya Manager yang dapat mengakses");
  }
  
  return { user, role: data.peran };
}

/**
 * GET - List semua preferensi
 */
export async function GET(request: NextRequest) {
  try {
    await requireManager();
    
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('preferensi_bwm')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching preferensi:', error);
      return NextResponse.json(
        { error: 'Gagal mengambil data preferensi' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ data: data || [] });
    
  } catch (err) {
    if (err instanceof Error) {
      const status = err.message === 'Unauthorized' ? 401 : 403;
      return NextResponse.json({ error: err.message }, { status });
    }
    console.error('Unexpected error in GET preferensi:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST - Create preferensi baru
 */
export async function POST(request: NextRequest) {
  try {
    const { user } = await requireManager();
    
    const body: CreatePreferensiRequest = await request.json();
    
    // Validasi input
    const validationErrors = validatePreferensiInput(body);
    if (validationErrors.length > 0) {
      return NextResponse.json(
        { error: 'Validasi gagal', details: validationErrors },
        { status: 400 }
      );
    }
    
    const supabase = await createClient();
    
    // Insert ke database
    const { data, error } = await supabase
      .from('preferensi_bwm')
      .insert({
        nama: body.nama,
        best_criteria: body.best_criteria,
        worst_criteria: body.worst_criteria,
        bo_c1: body.bo_c1,
        bo_c2: body.bo_c2,
        bo_c3: body.bo_c3,
        bo_c4: body.bo_c4,
        bo_c5: body.bo_c5,
        ow_c1: body.ow_c1,
        ow_c2: body.ow_c2,
        ow_c3: body.ow_c3,
        ow_c4: body.ow_c4,
        ow_c5: body.ow_c5,
        created_by: user.id,
        is_active: false, // Default tidak aktif
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating preferensi:', error);
      return NextResponse.json(
        { error: 'Gagal membuat preferensi' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ data, message: 'Preferensi berhasil dibuat' }, { status: 201 });
    
  } catch (err) {
    if (err instanceof Error) {
      const status = err.message === 'Unauthorized' ? 401 : 403;
      return NextResponse.json({ error: err.message }, { status });
    }
    console.error('Unexpected error in POST preferensi:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Validasi input preferensi
 */
function validatePreferensiInput(input: CreatePreferensiRequest): string[] {
  const errors: string[] = [];
  
  // Validasi nama
  if (!input.nama || input.nama.trim().length === 0) {
    errors.push('Nama preferensi harus diisi');
  }
  
  // Validasi best dan worst criteria
  if (!VALID_CRITERIA.includes(input.best_criteria as typeof VALID_CRITERIA[number])) {
    errors.push('Best criteria tidak valid (harus c1-c5)');
  }
  
  if (!VALID_CRITERIA.includes(input.worst_criteria as typeof VALID_CRITERIA[number])) {
    errors.push('Worst criteria tidak valid (harus c1-c5)');
  }
  
  if (input.best_criteria === input.worst_criteria) {
    errors.push('Best dan worst criteria tidak boleh sama');
  }
  
  // Validasi BO values
  const boValues = [input.bo_c1, input.bo_c2, input.bo_c3, input.bo_c4, input.bo_c5];
  boValues.forEach((val, idx) => {
    if (!VALID_SCALE.includes(val as typeof VALID_SCALE[number])) {
      errors.push(`BO c${idx + 1} harus antara 1-9`);
    }
  });
  
  // Validasi OW values
  const owValues = [input.ow_c1, input.ow_c2, input.ow_c3, input.ow_c4, input.ow_c5];
  owValues.forEach((val, idx) => {
    if (!VALID_SCALE.includes(val as typeof VALID_SCALE[number])) {
      errors.push(`OW c${idx + 1} harus antara 1-9`);
    }
  });
  
  // Validasi: aBB harus = 1
  const bestIndex = parseInt(input.best_criteria.replace('c', '')) - 1;
  if (boValues[bestIndex] !== 1) {
    errors.push(`BO untuk best criteria (aB${input.best_criteria}) harus = 1`);
  }
  
  // Validasi: aWW harus = 1
  const worstIndex = parseInt(input.worst_criteria.replace('c', '')) - 1;
  if (owValues[worstIndex] !== 1) {
    errors.push(`OW untuk worst criteria (a${input.worst_criteria}W) harus = 1`);
  }
  
  return errors;
}

/**
 * PATCH - Update preferensi (aktivasi/deaktivasi)
 * Body: { id: string, is_active: boolean }
 */
export async function PATCH(request: NextRequest) {
  try {
    const { user, role } = await requireManager();
    const body = await request.json();
    
    const { id, is_active } = body;
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID preferensi wajib diisi' },
        { status: 400 }
      );
    }
    
    const supabase = await createClient();
    
    // Jika mengaktifkan preferensi ini, deactivate yang lain dulu
    if (is_active) {
      await supabase
        .from('preferensi_bwm')
        .update({ is_active: false })
        .neq('id', id);
    }
    
    // Update preferensi ini
    const { data, error } = await supabase
      .from('preferensi_bwm')
      .update({ 
        is_active: is_active,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating preferensi:', error);
      return NextResponse.json(
        { error: 'Gagal mengupdate preferensi' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ 
      data, 
      message: is_active ? 'Preferensi berhasil diaktifkan' : 'Preferensi berhasil dinonaktifkan'
    }, { status: 200 });
    
  } catch (err) {
    if (err instanceof Error) {
      const status = err.message === 'Unauthorized' ? 401 : 403;
      return NextResponse.json({ error: err.message }, { status });
    }
    console.error('Unexpected error in PATCH preferensi:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT - Update preferensi secara penuh
 */
export async function PUT(request: NextRequest) {
  try {
    const { user } = await requireManager();
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID preferensi wajib diisi' }, { status: 400 });
    }

    // Validasi input
    const validationErrors = validatePreferensiInput(updateData);
    if (validationErrors.length > 0) {
      return NextResponse.json(
        { error: 'Validasi gagal', details: validationErrors },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from('preferensi_bwm')
      .update({
        nama: updateData.nama,
        best_criteria: updateData.best_criteria,
        worst_criteria: updateData.worst_criteria,
        bo_c1: updateData.bo_c1,
        bo_c2: updateData.bo_c2,
        bo_c3: updateData.bo_c3,
        bo_c4: updateData.bo_c4,
        bo_c5: updateData.bo_c5,
        ow_c1: updateData.ow_c1,
        ow_c2: updateData.ow_c2,
        ow_c3: updateData.ow_c3,
        ow_c4: updateData.ow_c4,
        ow_c5: updateData.ow_c5,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating preferensi:', error);
      return NextResponse.json({ error: 'Gagal memperbarui preferensi' }, { status: 500 });
    }

    return NextResponse.json({ data, message: 'Preferensi berhasil diperbarui' });
  } catch (err) {
    if (err instanceof Error) {
      const status = err.message === 'Unauthorized' ? 401 : 403;
      return NextResponse.json({ error: err.message }, { status });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE - Hapus preferensi
 */
export async function DELETE(request: NextRequest) {
  try {
    await requireManager();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID preferensi wajib diisi' }, { status: 400 });
    }

    const supabase = await createClient();
    const { error } = await supabase
      .from('preferensi_bwm')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting preferensi:', error);
      return NextResponse.json({ error: 'Gagal menghapus preferensi' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Preferensi berhasil dihapus' });
  } catch (err) {
    if (err instanceof Error) {
      const status = err.message === 'Unauthorized' ? 401 : 403;
      return NextResponse.json({ error: err.message }, { status });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
