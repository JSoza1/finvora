'use client';

import React, { useState } from 'react';
import type { BlacklistRecord } from '@/types/blacklist';
import { formatFechaDDMMYYYY } from '@/utils/date-tijuana';

interface BlacklistTableProps {
  records: BlacklistRecord[];
  onView: (record: BlacklistRecord) => void;
  onEdit: (record: BlacklistRecord) => void;
  onDelete: (record: BlacklistRecord) => void;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const styles = {
  container: 'space-y-4',
  tableCard: 'bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-2xl overflow-hidden shadow-sm',
  scrollContainer: 'overflow-x-auto scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent',
  table: 'w-full text-left border-collapse min-w-[760px]',
  thRow: 'border-b border-slate-800 bg-slate-950/50 text-[11px] font-bold text-slate-400 uppercase tracking-wider',
  th: 'py-3.5 px-4',
  tr: 'hover:bg-slate-800/25 transition-colors group',
  td: 'py-3.5 px-4',
  emptyCard: 'bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-2xl p-10 text-center flex flex-col items-center justify-center space-y-3 shadow-sm',
  emptyIconBox: 'w-14 h-14 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-500',
  copiedTooltip: 'absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-900 text-emerald-400 border border-slate-700 text-[11px] font-bold px-2 py-0.5 rounded-lg shadow-xl whitespace-nowrap z-50 pointer-events-none animate-in fade-in zoom-in-95 duration-150',
  curpButton: 'inline-block font-mono bg-slate-950 px-2.5 py-1 rounded-md border border-slate-800 text-secondary text-xs font-bold cursor-pointer hover:border-secondary/40 active:scale-95 transition-all select-none tracking-wider',
  zonaBadge: 'inline-block px-2.5 py-1 rounded-md text-[11px] font-bold uppercase bg-blue-500/10 text-blue-400 border border-blue-500/20 whitespace-nowrap',
  actionButton: 'p-1.5 rounded-lg transition-colors cursor-pointer',
  pageButton: 'px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 text-slate-200 rounded-lg transition-colors font-medium cursor-pointer disabled:cursor-not-allowed',
};

export function BlacklistTable({
  records,
  onView,
  onEdit,
  onDelete,
  currentPage,
  totalPages,
  onPageChange,
}: BlacklistTableProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyCurp = (curp: string, id: string) => {
    navigator.clipboard.writeText(curp);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  if (records.length === 0) {
    return (
      <div className={styles.emptyCard}>
        <div className={styles.emptyIconBox}>
          <span className="material-symbols-outlined text-3xl">person_search</span>
        </div>
        <p className="text-base font-semibold text-slate-300">
          No se encontraron clientes en la Black List
        </p>
        <p className="text-xs text-slate-500 max-w-sm">
          No hay registros que coincidan con los filtros aplicados o aún no se ha agregado ningún cliente bloqueado.
        </p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Contenedor con scroll horizontal optimizado para móviles */}
      <div className={styles.tableCard}>
        <div className={styles.scrollContainer}>
          <table className={styles.table}>
            <thead>
              <tr className={styles.thRow}>
                <th className={`${styles.th} w-[24%]`}>Nombre</th>
                <th className={`${styles.th} w-[16%] text-center`}>CURP</th>
                <th className={`${styles.th} w-[14%] text-center`}>Zona</th>
                <th className={`${styles.th} w-[17%]`}>Motivo</th>
                <th className={`${styles.th} w-[15%] text-center`}>Registro</th>
                <th className={`${styles.th} w-[14%] text-center`}>Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs sm:text-sm">
              {records.map((record) => {
                const isCopied = copiedId === record.id;

                return (
                  <tr
                    key={record.id}
                    className={styles.tr}
                  >
                    {/* Nombre con icono rojo de usuario */}
                    <td className={`${styles.td} font-medium text-slate-100`}>
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center shrink-0 select-none">
                          <span className="material-symbols-outlined text-base">person</span>
                        </div>
                        <span className="truncate max-w-[180px] sm:max-w-xs block font-semibold text-slate-100" title={record.nombre}>
                          {record.nombre}
                        </span>
                      </div>
                    </td>

                    {/* CURP con estilo interactivo de copiado tipo IMEI de Detalle Equipos */}
                    <td className={`${styles.td} font-mono text-xs text-center`}>
                      <div className="relative inline-flex items-center justify-center">
                        {isCopied && (
                          <div className={styles.copiedTooltip}>
                            ¡Copiado!
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => handleCopyCurp(record.curp, record.id)}
                          className={styles.curpButton}
                          title="Haz clic para copiar CURP"
                        >
                          {record.curp}
                        </button>
                      </div>
                    </td>

                    {/* Zona con estilo Ubicación de Detalle Equipos */}
                    <td className={`${styles.td} text-center`}>
                      <span className={styles.zonaBadge}>
                        {record.zona}
                      </span>
                    </td>

                    {/* Motivo truncado con '...' */}
                    <td className={styles.td}>
                      <p
                        className="text-slate-300 line-clamp-1 max-w-[180px] md:max-w-[210px] text-xs sm:text-sm select-text"
                        title={record.motivo}
                      >
                        {record.motivo}
                      </p>
                    </td>

                    {/* Fecha de registro con estilo y alineación de Seguimiento de Pagos */}
                    <td className={`${styles.td} whitespace-nowrap text-center`}>
                      <span className="text-xs sm:text-sm font-semibold text-slate-300">
                        {formatFechaDDMMYYYY(record.created_at)}
                      </span>
                    </td>

                    {/* Columna de Acciones: Visualizar, Editar, Eliminar */}
                    <td className={`${styles.td} text-center`}>
                      <div className="flex items-center justify-center gap-1">
                        {/* 1. Visualizar */}
                        <button
                          onClick={() => onView(record)}
                          type="button"
                          className={`${styles.actionButton} text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10`}
                          title="Visualizar expediente completo"
                        >
                          <span className="material-symbols-outlined text-lg select-none">
                            visibility
                          </span>
                        </button>

                        {/* 2. Editar */}
                        <button
                          onClick={() => onEdit(record)}
                          type="button"
                          className={`${styles.actionButton} text-slate-400 hover:text-amber-400 hover:bg-amber-500/10`}
                          title="Editar registro"
                        >
                          <span className="material-symbols-outlined text-lg select-none">
                            edit
                          </span>
                        </button>

                        {/* 3. Eliminar */}
                        <button
                          onClick={() => onDelete(record)}
                          type="button"
                          className={`${styles.actionButton} text-slate-400 hover:text-rose-400 hover:bg-rose-500/10`}
                          title="Eliminar de la Black List"
                        >
                          <span className="material-symbols-outlined text-lg select-none">
                            delete
                          </span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Paginador */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2 pt-1 text-xs text-slate-400">
          <span>
            Página <strong className="text-white font-mono">{currentPage}</strong> de{' '}
            <strong className="text-white font-mono">{totalPages}</strong>
          </span>

          <div className="flex items-center gap-1">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage <= 1}
              type="button"
              className={styles.pageButton}
            >
              Anterior
            </button>
            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
              type="button"
              className={styles.pageButton}
            >
              Siguiente
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
