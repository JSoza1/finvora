'use server';

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { getUserProfile, isAllowed } from "@/utils/auth-check";
import { getDriverRestDayInfo } from "@/utils/driver-schedule";
import { fetchAllFromTable } from "@/utils/supabase/pagination";

/**
 * Obtiene todos los repartos programados para un mes y año específicos.
 * Incluye información relacionada de repartidores, zonas, vendedores y productos.
 * 
 * @security Permisos requeridos: Admin, Supervisor, Closer, Developer
 * @param year Año de consulta (ej. 2026)
 * @param month Mes de consulta (0-indexed, 0 = Enero, 11 = Diciembre)
 * @returns Objeto con estado de éxito y los datos de los repartos o mensaje de error
 */
export async function getRepartosMes(year: number, month: number) {
  const { role } = await getUserProfile();
  if (!isAllowed(role, ["Admin", "Supervisor", "Closer", "Cambaceador", "Repartidor", "Developer", "CambaCloser"])) {
    return { success: false, error: "No autorizado" };
  }

  const supabase = await createClient();

  // Primer y último día del mes
  const startDate = new Date(year, month, 1).toISOString().split('T')[0];
  const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0];

  const data = await fetchAllFromTable(
    supabase,
    'repartos',
    `
      id,
      fecha_reparto,
      horario,
      notas,
      imei,
      repartidores (
        id,
        nombre,
        zona_horaria
      ),
      zonas_reparto (
        id,
        nombre_zona,
        descripcion
      ),
      vendedor:perfiles (
        id,
        username,
        email
      ),
      productos (
        id,
        marca,
        modelo,
        color,
        almacenamiento,
        ram
      )
    `,
    {
      filterFn: (q) => q.gte('fecha_reparto', startDate).lte('fecha_reparto', endDate),
      orderColumn: 'fecha_reparto',
      ascending: true
    }
  );

  return { success: true, data: data || [] };
}


/**
 * Obtiene toda la información de catálogo necesaria para poblar los formularios de logística.
 * Trae repartidores activos, zonas de reparto, vendedores registrados y equipos disponibles en stock.
 * 
 * @security Permisos requeridos: Admin, Supervisor, Closer, Developer
 * @returns Objeto con catálogos de apoyo para la programación de repartos
 */
export async function getLogisticsFormData() {
  const { role } = await getUserProfile();
  if (!isAllowed(role, ["Admin", "Supervisor", "Closer", "Cambaceador", "Repartidor", "Developer", "CambaCloser"])) {
    return { success: false, error: "No autorizado" };
  }

  const supabase = await createClient();

  // 1. Obtener repartidores activos
  const { data: repartidores, error: repError } = await supabase
    .from('repartidores')
    .select('id, nombre, zona_horaria')
    .eq('activo', true)
    .order('nombre');

  if (repError) {
    console.error("Error al obtener repartidores:", repError);
    return { success: false, error: repError.message };
  }

  // 2. Obtener todas las zonas de reparto
  const { data: zonas, error: zonaError } = await supabase
    .from('zonas_reparto')
    .select('id, repartidor_id, nombre_zona, descripcion')
    .order('nombre_zona');

  if (zonaError) {
    console.error("Error al obtener zonas:", zonaError);
    return { success: false, error: zonaError.message };
  }

  // 3. Obtener vendedores (perfiles con rol asignado distinto de 'Sin rol')
  const { data: vendedores, error: vendError } = await supabase
    .from('perfiles')
    .select('id, username, email, role')
    .neq('role', 'Sin rol')
    .order('username');

  if (vendError) {
    console.error("Error al obtener vendedores:", vendError);
    return { success: false, error: vendError.message };
  }

  // 4. Obtener stock disponible o a consultar (ocultar 'A consultar' para el rol Closer)
  const stock = await fetchAllFromTable(
    supabase,
    'stock',
    `
      imei,
      producto_id,
      zona,
      productos (
        marca,
        modelo,
        color,
        almacenamiento,
        ram
      )
    `,
    {
      filterFn: (q) => (role === "Repartidor" ? q.eq('estado', 'Disponible') : q.in('estado', ['Disponible', 'A consultar'])),
      orderColumn: 'fecha_ingreso',
      ascending: false
    }
  );

  return {
    success: true,
    data: {
      repartidores: repartidores || [],
      zonas: zonas || [],
      vendedores: vendedores || [],
      stock: stock || []
    }
  };
}


/**
 * Registra un nuevo reparto programado en la base de datos.
 * 
 * @security Permisos requeridos: Admin, Supervisor, Developer
 * @param formData Datos completos del reparto (fecha, horario, repartidor, zona, vendedor, imei, producto y notas)
 * @returns Estado de éxito o error al insertar el registro
 */
export async function crearReparto(formData: {
  fecha_reparto: string;
  horario: string;
  repartidor_id: string;
  zona_id: string;
  vendedor_id: string;
  imei: string;
  producto_id: string;
  notas?: string;
}) {
  const { role } = await getUserProfile();
  if (!isAllowed(role, ["Admin", "Supervisor", "Developer", "Repartidor", "Closer", "Cambaceador", "CambaCloser"])) {
    return { success: false, error: "No autorizado" };
  }

  const supabase = await createClient();

  if (formData.repartidor_id && formData.fecha_reparto) {
    const { data: repartidorRow } = await supabase
      .from('repartidores')
      .select('nombre')
      .eq('id', formData.repartidor_id)
      .maybeSingle();

    if (repartidorRow?.nombre) {
      const restDayInfo = getDriverRestDayInfo(repartidorRow.nombre, formData.fecha_reparto);
      if (restDayInfo.isRestDay) {
        return {
          success: false,
          error: `El repartidor ${repartidorRow.nombre} no realiza entregas los días ${restDayInfo.restDayNames.join(", ")} (Día de descanso).`
        };
      }
    }
  }

  const { error } = await supabase
    .from('repartos')
    .insert({
      fecha_reparto: formData.fecha_reparto,
      horario: formData.horario,
      repartidor_id: formData.repartidor_id || null,
      zona_id: formData.zona_id || null,
      vendedor_id: formData.vendedor_id || null,
      imei: formData.imei || null,
      producto_id: formData.producto_id || null,
      notas: formData.notas || ''
    });

  if (error) {
    console.error("Error al crear reparto:", error);
    return { success: false, error: error.message };
  }

  revalidatePath('/empresa/webapp/repartos');
  return { success: true };
}


/**
 * Elimina permanentemente un reparto programado de la base de datos.
 * 
 * @security Permisos requeridos: Admin, Supervisor, Developer
 * @param repartoId ID único del reparto a eliminar
 * @returns Estado de éxito o error de la operación
 */
export async function eliminarReparto(repartoId: string) {
  const { role } = await getUserProfile();
  if (!isAllowed(role, ["Admin", "Supervisor", "Developer", "Repartidor", "Closer", "Cambaceador", "CambaCloser"])) {
    return { success: false, error: "No autorizado" };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from('repartos')
    .delete()
    .eq('id', repartoId);

  if (error) {
    console.error("Error al eliminar reparto:", error);
    return { success: false, error: error.message };
  }

  revalidatePath('/empresa/webapp/repartos');
  return { success: true };
}

// ==========================================
// ACCIONES DE REPARTIDORES
// ==========================================


/**
 * Obtiene la lista completa de repartidores registrados ordenados alfabéticamente.
 * 
 * @security Permisos requeridos: Admin, Supervisor, Closer, Developer
 * @returns Listado completo de repartidores
 */
export async function getRepartidoresList() {
  const { role } = await getUserProfile();
  if (!isAllowed(role, ["Admin", "Supervisor", "Closer", "Cambaceador", "Repartidor", "Developer", "CambaCloser"])) {
    return { success: false, error: "No autorizado" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('repartidores')
    .select('*')
    .order('nombre', { ascending: true });

  if (error) {
    console.error("Error al obtener repartidores:", error);
    return { success: false, error: error.message };
  }
  return { success: true, data: data || [] };
}


/**
 * Registra un nuevo repartidor en el sistema con estado activo.
 * 
 * @security Permisos requeridos: Admin, Supervisor, Developer
 * @param nombre Nombre completo del repartidor
 * @param zonaHoraria Zona horaria para control de entregas (default: America/Mexico_City)
 * @returns Estado de éxito o error de la creación
 */
export async function crearRepartidor(nombre: string, zonaHoraria?: string) {
  const { role } = await getUserProfile();
  if (!isAllowed(role, ["Admin", "Supervisor", "Developer"])) {
    return { success: false, error: "No autorizado" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from('repartidores')
    .insert({ nombre, activo: true, zona_horaria: zonaHoraria || 'America/Mexico_City' });

  if (error) {
    console.error("Error al crear repartidor:", error);
    return { success: false, error: error.message };
  }

  revalidatePath('/empresa/webapp/repartos/repartidores');
  return { success: true };
}


/**
 * Activa o desactiva a un repartidor para habilitar/deshabilitar su asignación en nuevos repartos.
 * Revalida las rutas afectadas para refrescar el estado en el calendario y listados.
 * 
 * @security Permisos requeridos: Admin, Supervisor, Developer
 * @param repartidorId ID único del repartidor
 * @param activo Nuevo estado de activación
 * @returns Estado de éxito o error de la actualización
 */
export async function toggleRepartidorActivo(repartidorId: string, activo: boolean) {
  const { role } = await getUserProfile();
  if (!isAllowed(role, ["Admin", "Supervisor", "Developer"])) {
    return { success: false, error: "No autorizado" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from('repartidores')
    .update({ activo })
    .eq('id', repartidorId);

  if (error) {
    console.error("Error al cambiar estado de repartidor:", error);
    return { success: false, error: error.message };
  }

  revalidatePath('/empresa/webapp/repartos/repartidores');
  revalidatePath('/empresa/webapp/repartos');
  return { success: true };
}


/**
 * Elimina un repartidor del sistema de la base de datos.
 * 
 * @security Permisos requeridos: Admin, Supervisor, Developer
 * @param repartidorId ID único del repartidor a eliminar
 * @returns Estado de éxito o error de la eliminación
 */
export async function eliminarRepartidor(repartidorId: string) {
  const { role } = await getUserProfile();
  if (!isAllowed(role, ["Admin", "Supervisor", "Developer"])) {
    return { success: false, error: "No autorizado" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from('repartidores')
    .delete()
    .eq('id', repartidorId);

  if (error) {
    console.error("Error al eliminar repartidor:", error);
    return { success: false, error: error.message };
  }

  revalidatePath('/empresa/webapp/repartos/repartidores');
  revalidatePath('/empresa/webapp/repartos');
  return { success: true };
}

// ==========================================
// ACCIONES DE ZONAS
// ==========================================


/**
 * Obtiene el listado completo de zonas de reparto, incluyendo el repartidor asignado a cada una.
 * 
 * @security Permisos requeridos: Admin, Supervisor, Closer, Developer
 * @returns Listado de zonas con relaciones cargadas
 */
export async function getZonasList() {
  const { role } = await getUserProfile();
  if (!isAllowed(role, ["Admin", "Supervisor", "Closer", "Cambaceador", "Repartidor", "Developer", "CambaCloser"])) {
    return { success: false, error: "No autorizado" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('zonas_reparto')
    .select(`
      id,
      repartidor_id,
      nombre_zona,
      sigla,
      descripcion,
      created_at,
      repartidores (
        id,
        nombre
      )
    `)
    .order('nombre_zona', { ascending: true });

  if (error) {
    console.error("Error al obtener zonas:", error);
    return { success: false, error: error.message };
  }
  return { success: true, data: data || [] };
}


/**
 * Crea una nueva zona geográfica de reparto y la asocia a un repartidor encargado.
 * 
 * @security Permisos requeridos: Admin, Supervisor, Developer
 * @param formData Datos de la zona (nombre, descripción opcional y repartidor asignado)
 * @returns Estado de éxito o error de la creación
 */
export async function crearZona(formData: {
  repartidor_id: string;
  nombre_zona: string;
  sigla?: string;
  descripcion?: string;
}) {
  const { role } = await getUserProfile();
  if (!isAllowed(role, ["Admin", "Supervisor", "Developer"])) {
    return { success: false, error: "No autorizado" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from('zonas_reparto')
    .insert({
      repartidor_id: formData.repartidor_id,
      nombre_zona: formData.nombre_zona,
      sigla: formData.sigla || '',
      descripcion: formData.descripcion || ''
    });

  if (error) {
    console.error("Error al crear zona:", error);
    return { success: false, error: error.message };
  }

  revalidatePath('/empresa/webapp/repartos/zonas');
  return { success: true };
}


/**
 * Modifica una zona geográfica de reparto existente.
 * 
 * @security Permisos requeridos: Admin, Supervisor, Developer
 * @param zonaId ID de la zona a actualizar
 * @param formData Datos actualizados de la zona (nombre, descripción opcional y repartidor asignado)
 * @returns Estado de éxito o error de la actualización
 */
export async function editarZona(
  zonaId: string,
  formData: {
    repartidor_id: string;
    nombre_zona: string;
    sigla?: string;
    descripcion?: string;
  }
) {
  const { role } = await getUserProfile();
  if (!isAllowed(role, ["Admin", "Supervisor", "Developer"])) {
    return { success: false, error: "No autorizado" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from('zonas_reparto')
    .update({
      repartidor_id: formData.repartidor_id,
      nombre_zona: formData.nombre_zona,
      sigla: formData.sigla || '',
      descripcion: formData.descripcion || ''
    })
    .eq('id', zonaId);

  if (error) {
    console.error("Error al editar zona:", error);
    return { success: false, error: error.message };
  }

  revalidatePath('/empresa/webapp/repartos/zonas');
  revalidatePath('/empresa/webapp/repartos');
  return { success: true };
}


/**
 * Elimina una zona de reparto de la base de datos.
 * 
 * @security Permisos requeridos: Admin, Supervisor, Developer
 * @param zonaId ID único de la zona a borrar
 * @returns Estado de éxito o error de la operación
 */
export async function eliminarZona(zonaId: string) {
  const { role } = await getUserProfile();
  if (!isAllowed(role, ["Admin", "Supervisor", "Developer"])) {
    return { success: false, error: "No autorizado" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from('zonas_reparto')
    .delete()
    .eq('id', zonaId);

  if (error) {
    console.error("Error al eliminar zona:", error);
    return { success: false, error: error.message };
  }

  revalidatePath('/empresa/webapp/repartos/zonas');
  revalidatePath('/empresa/webapp/repartos');
  return { success: true };
}
