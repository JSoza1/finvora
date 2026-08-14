/**
 * Utilidad para descargar colecciones completas desde Supabase esquivando
 * el límite por defecto de 1.000 filas de PostgREST mediante paginación por lotes (chunks).
 */

export interface FetchAllOptions {
  orderColumn?: string;
  ascending?: boolean;
  filterFn?: (query: any) => any;
  pageSize?: number;
}

/**
 * Consulta y pagina automáticamente una tabla de Supabase en bloques sucesivos
 * hasta recuperar el 100% de las filas existentes.
 * 
 * @param supabase Cliente de Supabase autenticado
 * @param table Nombre de la tabla (ej: 'ventas', 'ordenes_entrega')
 * @param select Campos y relaciones a seleccionar en formato PostgREST
 * @param options Opciones de ordenamiento, filtros adicionales y tamaño de página
 * @returns Promesa con el arreglo completo de registros tipados
 */
export async function fetchAllFromTable<T = any>(
  supabase: any,
  table: string,
  select: string,
  options: FetchAllOptions = {}
): Promise<T[]> {
  const pageSize = options.pageSize || 1000;
  let from = 0;
  let allRows: T[] = [];
  let hasMore = true;

  while (hasMore) {
    let query = supabase.from(table).select(select);

    if (options.orderColumn) {
      query = query.order(options.orderColumn, { ascending: options.ascending ?? false });
    }

    if (options.filterFn) {
      query = options.filterFn(query);
    }

    const { data, error } = await query.range(from, from + pageSize - 1);

    if (error) {
      console.error(`Error al recuperar datos paginados de la tabla '${table}':`, error);
      break;
    }

    if (!data || data.length === 0) {
      hasMore = false;
    } else {
      allRows = allRows.concat(data as T[]);
      if (data.length < pageSize) {
        hasMore = false;
      } else {
        from += pageSize;
      }
    }
  }

  return allRows;
}
