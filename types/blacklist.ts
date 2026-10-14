/**
 * Representa un registro de cliente bloqueado en la Black List del sistema Finvora.
 */
export interface BlacklistRecord {
  /** Identificador único UUID del registro */
  id: string;
  /** Nombre completo del cliente bloqueado */
  nombre: string;
  /** Clave Única de Registro de Población (CURP) del cliente en mayúsculas (18 caracteres) */
  curp: string;
  /** Zona de reparto donde fue detectado o registrado el bloqueo (ej. Tijuana Este, Playas, etc.) */
  zona: string;
  /** Motivo detallado del bloqueo (fraude, morosidad severa, equipo empeñado o no devuelto, etc.) */
  motivo: string;
  /** UUID del usuario que registró el bloqueo en el sistema */
  registrado_por: string | null;
  /** Nombre o alias de usuario que registró el bloqueo para auditoría visual */
  registrado_por_nombre: string | null;
  /** Fecha y hora ISO de creación del expediente en base de datos */
  created_at: string;
  /** Fecha y hora ISO de última modificación del expediente */
  updated_at: string;
}

/**
 * Datos requeridos para dar de alta un nuevo cliente en la Black List.
 */
export interface CreateBlacklistDTO {
  /** Nombre completo del cliente */
  nombre: string;
  /** CURP oficial del cliente (18 caracteres) */
  curp: string;
  /** Zona de reparto asociada */
  zona: string;
  /** Explicación detallada de la causal de bloqueo */
  motivo: string;
}

/**
 * Datos requeridos para modificar un expediente existente en la Black List.
 */
export interface UpdateBlacklistDTO {
  /** Identificador UUID del expediente a modificar */
  id: string;
  /** Nombre completo actualizado */
  nombre: string;
  /** CURP oficial actualizada */
  curp: string;
  /** Zona de reparto asignada */
  zona: string;
  /** Motivo de bloqueo actualizado */
  motivo: string;
}
