'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { formatFechaLegible } from '@/utils/date-tijuana';

export interface BlacklistBlockedRecord {
  nombre: string;
  curp: string;
  zona: string;
  motivo: string;
  created_at?: string;
}

interface BlacklistOrderBlockedModalProps {
  record: BlacklistBlockedRecord | null;
  isOpen: boolean;
  onClose: () => void;
}

const styles = {
  overlay: 'fixed inset-0 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200',
  wrapper: 'fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto overscroll-contain',
  container: 'relative w-full max-w-lg md:max-w-xl bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl space-y-5 overflow-hidden max-h-[90vh] flex flex-col my-auto animate-in zoom-in-95 duration-200',
  glow: 'absolute -top-16 -right-16 w-36 h-36 bg-rose-500/10 rounded-full blur-3xl pointer-events-none',
  closeButton: 'w-8 h-8 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer shrink-0',
  content: 'space-y-4 overflow-y-auto pr-1 text-xs sm:text-sm custom-scrollbar flex-1',
  infoCard: 'bg-slate-950/60 border border-slate-800/80 p-3.5 rounded-xl',
  infoLabel: 'text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1',
  motivoCard: 'bg-rose-500/10 border border-rose-500/30 p-4 rounded-xl space-y-2',
  footer: 'pt-3 border-t border-slate-800/80 flex items-center justify-end',
  closeActionBtn: 'px-6 py-2.5 bg-secondary hover:bg-secondary/90 text-slate-950 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-lg shadow-secondary/20 cursor-pointer',
};

export function BlacklistOrderBlockedModal({
  record,
  isOpen,
  onClose,
}: BlacklistOrderBlockedModalProps) {
  const [mounted, setMounted] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!isOpen || !record || !mounted) return null;

  const handleCopyCurp = () => {
    navigator.clipboard.writeText(record.curp);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return createPortal(
    <div className={styles.wrapper}>
      {/* Backdrop con blur */}
      <div className={styles.overlay} onClick={onClose} />

      <div
        className={styles.container}
        onClick={(clickEvent) => clickEvent.stopPropagation()}
      >
        {/* Glow decorativo de advertencia */}
        <div className={styles.glow} />

        {/* Encabezado con 'X' de cierre */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-800/80 pb-4 select-none">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center font-bold text-lg shrink-0 shadow-lg shadow-rose-500/10">
              <span className="material-symbols-outlined text-2xl select-none">
                person_off
              </span>
            </div>
            <div>
              <h3 className="text-lg md:text-xl font-bold text-white">
                Cliente en Black List
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

        {/* Cuerpo del modal con información del expediente bloqueado */}
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
                Zona Reportada
              </span>
              <p className="text-amber-400 font-semibold text-sm break-words flex items-center gap-1.5">
                <span className="material-symbols-outlined text-base">location_on</span>
                {record.zona}
              </p>
            </div>
          </div>

          {/* CURP con botón interactivo de copiado */}
          <div className="bg-slate-950/60 border border-slate-800/80 p-3.5 rounded-xl flex items-center justify-between gap-3">
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                CURP Bloqueada
              </span>
              <span className="font-mono text-sm md:text-base font-bold text-rose-300 tracking-wider">
                {record.curp}
              </span>
            </div>
            <button
              onClick={handleCopyCurp}
              type="button"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors text-xs font-semibold cursor-pointer shrink-0"
              title="Copiar CURP"
            >
              <span className="material-symbols-outlined text-base">
                {copied ? 'check' : 'content_copy'}
              </span>
              <span>{copied ? 'Copiado' : 'Copiar'}</span>
            </button>
          </div>

          {/* Motivo del Bloqueo Destacado */}
          <div className={styles.motivoCard}>
            <div className="flex items-center gap-2 text-rose-400 font-bold text-xs uppercase tracking-wider">
              <span className="material-symbols-outlined text-base">gavel</span>
              <span>Motivo del Bloqueo</span>
            </div>
            <p className="text-slate-100 leading-relaxed whitespace-pre-wrap break-words text-xs sm:text-sm font-medium">
              {record.motivo}
            </p>
          </div>

          {/* Fecha del reporte (sin mostrar quién lo agregó) */}
          {record.created_at && (
            <div className="flex items-center gap-2 text-xs text-slate-400 pt-1">
              <span className="material-symbols-outlined text-slate-500 text-base">calendar_today</span>
              <span>
                Fecha de registro en Black List:{' '}
                <strong className="text-slate-200 font-semibold">
                  {formatFechaLegible(record.created_at.split('T')[0])}
                </strong>
              </span>
            </div>
          )}
        </div>

        {/* Botón de cierre */}
        <div className={styles.footer}>
          <button
            type="button"
            onClick={onClose}
            className={styles.closeActionBtn}
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
