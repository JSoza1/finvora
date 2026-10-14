'use client';

import React, { useState } from 'react';
import type { BlacklistRecord } from '@/types/blacklist';
import { formatFechaLegible } from '@/utils/date-tijuana';

interface BlacklistDetailModalProps {
  record: BlacklistRecord | null;
  isOpen: boolean;
  onClose: () => void;
}

const styles = {
  backdrop: 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200 overscroll-contain touch-none',
  container: 'relative w-full max-w-lg md:max-w-xl lg:max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl space-y-5 overflow-hidden md:min-h-[470px] max-h-[95vh] flex flex-col overscroll-contain touch-auto',
  glow: 'absolute -top-16 -right-16 w-36 h-36 bg-rose-500/10 rounded-full blur-3xl pointer-events-none',
  header: 'flex items-start justify-between gap-4 border-b border-slate-800/80 pb-4 select-none',
  headerIcon: 'w-11 h-11 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center font-bold text-lg shrink-0',
  closeButton: 'w-8 h-8 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer shrink-0',
  content: 'space-y-4 overflow-y-auto pr-1 text-xs sm:text-sm custom-scrollbar touch-pan-y overscroll-contain flex-1',
  infoCard: 'bg-slate-950/60 border border-slate-800/80 p-3.5 rounded-xl',
  infoLabel: 'text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1',
};

export function BlacklistDetailModal({
  record,
  isOpen,
  onClose,
}: BlacklistDetailModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !record) return null;

  const handleCopyCurp = () => {
    navigator.clipboard.writeText(record.curp);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className={styles.backdrop}>
      <div
        className={styles.container}
        onClick={(clickEvent) => clickEvent.stopPropagation()}
      >
        {/* Glow decorativo */}
        <div className={styles.glow} />

        {/* Encabezado con 'X' de cierre */}
        <div className={styles.header}>
          <div className="flex items-center gap-3">
            <div className={styles.headerIcon}>
              <span className="material-symbols-outlined text-2xl select-none">
                person_off
              </span>
            </div>
            <div>
              <h3 className="text-lg md:text-xl font-bold text-white">
                Expediente de Black List
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            type="button"
            className={styles.closeButton}
            title="Cerrar modal"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {/* Cuerpo del expediente con scroll si es muy extenso */}
        <div className={styles.content}>
          {/* Nombre y Zona */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className={styles.infoCard}>
              <span className={styles.infoLabel}>
                Nombre del Cliente
              </span>
              <p className="text-white font-bold text-sm md:text-base break-words">
                {record.nombre}
              </p>
            </div>

            <div className={styles.infoCard}>
              <span className={styles.infoLabel}>
                Zona
              </span>
              <p className="text-amber-400 font-semibold text-sm break-words flex items-center gap-1.5">
                <span className="material-symbols-outlined text-base">location_on</span>
                {record.zona}
              </p>
            </div>
          </div>

          {/* CURP con botón para copiar */}
          <div className="bg-slate-950/60 border border-slate-800/80 p-3.5 rounded-xl flex items-center justify-between gap-3">
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                CURP
              </span>
              <span className="font-mono text-sm md:text-base font-bold text-slate-200 tracking-wider">
                {record.curp}
              </span>
            </div>
            <button
              onClick={handleCopyCurp}
              type="button"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors text-xs font-semibold cursor-pointer shrink-0"
            >
              <span className="material-symbols-outlined text-base">
                {copied ? 'check' : 'content_copy'}
              </span>
              <span>{copied ? 'Copiado' : 'Copiar'}</span>
            </button>
          </div>

          {/* Motivo Completo (Lectura detallada sin truncar) */}
          <div className="bg-rose-500/5 border border-rose-500/20 p-4 rounded-xl space-y-1.5">
            <div className="flex items-center gap-1.5 text-rose-400 font-bold text-xs uppercase tracking-wider">
              <span className="material-symbols-outlined text-base">gavel</span>
              <span>Motivo del Bloqueo</span>
            </div>
            <p className="text-slate-200 leading-relaxed whitespace-pre-wrap break-words text-xs sm:text-sm">
              {record.motivo}
            </p>
          </div>

          {/* Metadatos de auditoría */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-400 pt-1">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-slate-500 text-base">badge</span>
              <span>
                Registrado por:{' '}
                <strong className="text-slate-200 font-semibold">
                  {record.registrado_por_nombre || 'Personal Autorizado'}
                </strong>
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-slate-500 text-base">calendar_today</span>
              <span>
                Fecha:{' '}
                <strong className="text-slate-200 font-semibold">
                  {formatFechaLegible(record.created_at?.split('T')[0])}
                </strong>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
