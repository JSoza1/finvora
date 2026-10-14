'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/utils/supabase/server';
import { getUserProfile, isAllowed } from '@/utils/auth-check';
import { fetchAllFromTable } from '@/utils/supabase/pagination';
import type { BlacklistRecord, CreateBlacklistDTO, UpdateBlacklistDTO } from '@/types/blacklist';

const ALLOWED_ROLES = ['Admin', 'Supervisor', 'Developer'];

/**
 * Obtiene todos los registros de la Black List ordenados por fecha de registro descendente.
 * Exclusivo para cargos superiores.
 */
export async function getBlacklistEntries(): Promise<{ data: BlacklistRecord[]; error?: string }> {
  const { role: userRole } = await getUserProfile();

  if (!isAllowed(userRole, ALLOWED_ROLES)) {
    return { data: [], error: 'No tienes permisos para acceder a la Black List.' };
  }

  const supabase = await createClient();

  try {
    const blacklistRecords = await fetchAllFromTable<BlacklistRecord>(
      supabase,
      'blacklist',
      'id, nombre, curp, zona, motivo, registrado_por, registrado_por_nombre, created_at, updated_at',
      { orderColumn: 'created_at', ascending: false }
    );

    return { data: blacklistRecords };
  } catch (err: unknown) {
    console.error('Error al obtener registros de blacklist:', err);
    return { data: [], error: 'Error al consultar la base de datos.' };
  }
}

interface ValidatedBlacklistData {
  nombre: string;
  curp: string;
  zona: string;
  motivo: string;
}

type ValidationResult =
  | { isValid: true; data: ValidatedBlacklistData }
  | { isValid: false; error: string };

/**
 * Valida y limpia los campos requeridos para un expediente de Black List.
 */
function validateBlacklistInput(input: {
  nombre?: string;
  curp?: string;
  zona?: string;
  motivo?: string;
}): ValidationResult {
  const nombre = input.nombre?.trim();
  const curp = input.curp?.trim().toUpperCase();
  const zona = input.zona?.trim();
  const motivo = input.motivo?.trim();

  if (!nombre) {
    return { isValid: false, error: 'El nombre es obligatorio.' };
  }
  if (!curp) {
    return { isValid: false, error: 'La CURP es obligatoria.' };
  }
  if (!zona) {
    return { isValid: false, error: 'La zona es obligatoria.' };
  }
  if (!motivo) {
    return { isValid: false, error: 'El motivo es obligatorio.' };
  }

  return {
    isValid: true,
    data: { nombre, curp, zona, motivo },
  };
}

/**
 * Crea un nuevo registro en la Black List.
 * Exclusivo para cargos superiores.
 */
export async function createBlacklistEntry(
  dto: CreateBlacklistDTO
): Promise<{ success: boolean; data?: BlacklistRecord; error?: string }> {
  const { role: userRole, id: userId, username } = await getUserProfile();

  if (!isAllowed(userRole, ALLOWED_ROLES)) {
    return { success: false, error: 'Acceso denegado: se requieren cargos superiores.' };
  }

  const validation = validateBlacklistInput(dto);
  if (!validation.isValid) {
    return { success: false, error: validation.error };
  }

  const { nombre, curp, zona, motivo } = validation.data;
  const supabase = await createClient();

  const { data: createdRecord, error: insertError } = await supabase
    .from('blacklist')
    .insert([
      {
        nombre,
        curp,
        zona,
        motivo,
        registrado_por: userId,
        registrado_por_nombre: username || 'Personal Autorizado',
      },
    ])
    .select()
    .single();

  if (insertError) {
    console.error('Error al insertar en blacklist:', insertError);
    return { success: false, error: insertError.message || 'Error al guardar el registro.' };
  }

  revalidatePath('/empresa/webapp/blacklist');
  return { success: true, data: createdRecord as BlacklistRecord };
}

/**
 * Actualiza un registro existente en la Black List.
 * Exclusivo para cargos superiores.
 */
export async function updateBlacklistEntry(
  dto: UpdateBlacklistDTO
): Promise<{ success: boolean; data?: BlacklistRecord; error?: string }> {
  const { role: userRole } = await getUserProfile();

  if (!isAllowed(userRole, ALLOWED_ROLES)) {
    return { success: false, error: 'Acceso denegado: se requieren cargos superiores.' };
  }

  if (!dto.id) {
    return { success: false, error: 'ID de registro inválido.' };
  }

  const validation = validateBlacklistInput(dto);
  if (!validation.isValid) {
    return { success: false, error: validation.error };
  }

  const { nombre, curp, zona, motivo } = validation.data;
  const supabase = await createClient();

  const { data: updatedRecord, error: updateError } = await supabase
    .from('blacklist')
    .update({
      nombre,
      curp,
      zona,
      motivo,
      updated_at: new Date().toISOString(),
    })
    .eq('id', dto.id)
    .select()
    .single();

  if (updateError) {
    console.error('Error al actualizar registro en blacklist:', updateError);
    return { success: false, error: updateError.message || 'Error al actualizar el registro.' };
  }

  revalidatePath('/empresa/webapp/blacklist');
  return { success: true, data: updatedRecord as BlacklistRecord };
}

/**
 * Elimina un registro de la Black List.
 * Exclusivo para cargos superiores.
 */
export async function deleteBlacklistEntry(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const { role: userRole } = await getUserProfile();

  if (!isAllowed(userRole, ALLOWED_ROLES)) {
    return { success: false, error: 'Acceso denegado: se requieren cargos superiores.' };
  }

  if (!id) {
    return { success: false, error: 'ID de registro inválido.' };
  }

  const supabase = await createClient();

  const { error: deleteError } = await supabase
    .from('blacklist')
    .delete()
    .eq('id', id);

  if (deleteError) {
    console.error('Error al eliminar registro de blacklist:', deleteError);
    return { success: false, error: deleteError.message || 'Error al eliminar el registro.' };
  }

  revalidatePath('/empresa/webapp/blacklist');
  return { success: true };
}
