'use server';

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { getUserProfile, isAllowed } from "@/utils/auth-check";
import { fetchAllFromTable } from "@/utils/supabase/pagination";

export type EstadoCuota = 'En revisión' | 'Pagado' | 'Por vencer' | 'Vencido' | 'No Verificable';

export interface SeguimientoPagoRecord {
  id: string;
  comprobante_origen_id?: string | null;
  tag?: string | null;
  nombre_cliente: string;
  numero_telefono?: string | null;
  celular?: string | null;
  color_celular?: string | null;
  imei?: string | null;
  precio_total: number;
  pago_inicial: number;
  pago_semanal: number;
  plazos?: number | null;
  fecha_proximo_pago?: string | null;
  estados_semanales?: Record<string, EstadoCuota> | null;
  created_at: string;
  updated_at?: string;
  vendedor?: {
    id: string;
    username: string;
  } | null;
  repartidor?: {
    id: string;
    nombre: string;
  } | null;
}

interface PerfilSubQuery {
  id: string;
  username: string;
}

interface RepartidorSubQuery {
  id: string;
  nombre: string;
}

interface ComprobanteSubQuery {
  tag?: string | null;
}

interface SeguimientoRawResponse {
  id: string;
  comprobante_origen_id?: string | null;
  tag?: string | null;
  nombre_cliente: string;
  numero_telefono?: string | null;
  celular?: string | null;
  color_celular?: string | null;
  imei?: string | null;
  precio_total: string | number;
  pago_inicial: string | number;
  pago_semanal: string | number;
  plazos?: string | number | null;
  fecha_proximo_pago?: string | null;
  estados_semanales?: Record<string, EstadoCuota> | null;
  created_at: string;
  updated_at?: string;
  vendedor: PerfilSubQuery | PerfilSubQuery[] | null;
  repartidor: RepartidorSubQuery | RepartidorSubQuery[] | null;
  comprobante: ComprobanteSubQuery | ComprobanteSubQuery[] | null;
}

/**
 * Obtiene el listado de todos los seguimientos de pagos registrados.
 * Accesible por roles autorizados: Admin, Supervisor, Developer, Repartidor.
 */
export async function getSeguimientoPagos(): Promise<{
  success: boolean;
  data?: SeguimientoPagoRecord[];
  error?: string;
}> {
  try {
    const profile = await getUserProfile();
    if (!profile) {
      return { success: false, error: "No se pudo autenticar al usuario." };
    }

    const supabase = await createClient();

    const data = await fetchAllFromTable<SeguimientoRawResponse>(
      supabase,
      'seguimiento_pagos',
      `
        id,
        comprobante_origen_id,
        tag,
        nombre_cliente,
        numero_telefono,
        celular,
        color_celular,
        imei,
        precio_total,
        pago_inicial,
        pago_semanal,
        plazos,
        fecha_proximo_pago,
        estados_semanales,
        created_at,
        updated_at,
        vendedor:vendedor_id ( id, username ),
        repartidor:repartidor_id ( id, nombre ),
        comprobante:comprobante_origen_id ( tag )
      `,
      { orderColumn: 'created_at', ascending: false }
    );

    const formattedData: SeguimientoPagoRecord[] = (data || []).map(row => {
      const vendedorObj = Array.isArray(row.vendedor) ? row.vendedor[0] : row.vendedor;
      const repartidorObj = Array.isArray(row.repartidor) ? row.repartidor[0] : row.repartidor;
      const comprobanteObj = Array.isArray(row.comprobante) ? row.comprobante[0] : row.comprobante;

      return {
        id: row.id,
        comprobante_origen_id: row.comprobante_origen_id || null,
        tag: row.tag || comprobanteObj?.tag || null,
        nombre_cliente: row.nombre_cliente,
        numero_telefono: row.numero_telefono || null,
        celular: row.celular || null,
        color_celular: row.color_celular || null,
        imei: row.imei || null,
        precio_total: Number(row.precio_total) || 0,
        pago_inicial: Number(row.pago_inicial) || 0,
        pago_semanal: Number(row.pago_semanal) || 0,
        plazos: row.plazos != null ? Number(row.plazos) : null,
        fecha_proximo_pago: row.fecha_proximo_pago || null,
        estados_semanales: row.estados_semanales || {},
        created_at: row.created_at,
        updated_at: row.updated_at,
        vendedor: vendedorObj ? { id: vendedorObj.id, username: vendedorObj.username } : null,
        repartidor: repartidorObj ? { id: repartidorObj.id, nombre: repartidorObj.nombre } : null,
      };
    });

    return { success: true, data: formattedData };
  } catch (err: any) {
    console.error("Excepción en getSeguimientoPagos:", err);
    return { success: false, error: err.message || "Error al consultar seguimiento de pagos." };
  }
}

/**
 * Actualiza el estado de una semana específica en el JSONB de estados_semanales.
 * Si el nuevo estado es 'No Verificable', se propaga automáticamente a todas las semanas.
 */
export async function updateEstadoSemana(
  id: string,
  semanaKey: string, // Ej. "semana_1"
  nuevoEstado: EstadoCuota
): Promise<{ success: boolean; error?: string }> {
  try {
    const profile = await getUserProfile();
    if (!profile || !isAllowed(profile.role, ['Admin', 'Supervisor', 'Developer'])) {
      return { success: false, error: "No tienes permisos para modificar el estado de cobro." };
    }

    const supabase = await createClient();

    // 1. Obtener registro actual
    const { data: record, error: fetchErr } = await supabase
      .from('seguimiento_pagos')
      .select('estados_semanales, plazos')
      .eq('id', id)
      .single();

    if (fetchErr || !record) {
      return { success: false, error: "Registro no encontrado." };
    }

    const estadosActuales = record.estados_semanales || {};
    let nuevosEstados: Record<string, EstadoCuota> = { ...estadosActuales };

    if (nuevoEstado === 'No Verificable') {
      const plazosCount = Math.max(Number(record.plazos) || 0, Object.keys(estadosActuales).length, 1);
      for (let i = 1; i <= plazosCount; i++) {
        nuevosEstados[`semana_${i}`] = 'No Verificable';
      }
      Object.keys(estadosActuales).forEach(k => {
        nuevosEstados[k] = 'No Verificable';
      });
    } else {
      nuevosEstados[semanaKey] = nuevoEstado;
    }

    const { error: updateErr } = await supabase
      .from('seguimiento_pagos')
      .update({
        estados_semanales: nuevosEstados,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (updateErr) {
      return { success: false, error: updateErr.message };
    }

    revalidatePath('/empresa/webapp/seguimiento-pagos');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Error al actualizar estado de la semana." };
  }
}

/**
 * Actualiza los datos de un registro de seguimiento (útil para completar fecha_proximo_pago, plazos, tag, etc.).
 */
export async function updateSeguimientoPago(
  id: string,
  datos: {
    tag?: string | null;
    nombre_cliente?: string;
    numero_telefono?: string;
    celular?: string;
    color_celular?: string;
    imei?: string;
    precio_total?: number;
    pago_inicial?: number;
    pago_semanal?: number;
    plazos?: number | null;
    fecha_proximo_pago?: string | null;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const profile = await getUserProfile();
    if (!profile || !isAllowed(profile.role, ['Admin', 'Supervisor', 'Developer'])) {
      return { success: false, error: "No tienes permisos para actualizar este registro." };
    }

    const supabase = await createClient();

    const { error } = await supabase
      .from('seguimiento_pagos')
      .update({
        ...datos,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/empresa/webapp/seguimiento-pagos');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Error al actualizar registro de seguimiento." };
  }
}

