'use client';

import React, { useState } from 'react';
import type { BlacklistRecord } from '@/types/blacklist';
import { deleteBlacklistEntry } from '@/app/empresa/webapp/blacklist/blacklist-actions';

interface DeleteBlacklistModalProps {
  record: BlacklistRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onDeleted: (id: string) => void;
}

const styles = {
  backdrop: 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200 overscroll-contain touch-none',
  container: 'relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl space-y-5 overflow-hidden overscroll-contain touch-none',
  glow: 'absolute -top-14 -right-14 w-32 h-32 bg-rose-500/10 rounded-full blur-3xl pointer-events-none',
  closeButton: 'absolute top-5 right-5 w-8 h-8 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer shrink-0 z-10',
  iconWrapper: 'flex justify-center pt-2',
  iconBox: 'w-14 h-14 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center shrink-0 shadow-lg shadow-rose-500/10',
  errorAlert: 'p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-400',
  footer: 'pt-2 border-t border-slate-800/80 flex items-center justify-end',
  deleteButton: 'px-6 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs sm:text-sm font-bold transition-all shadow-lg shadow-rose-600/20 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed',
};

export function DeleteBlacklistModal({
  record,
  isOpen,
  onClose,
  onDeleted,
}: DeleteBlacklistModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen || !record) return null;

  const handleDelete = async () => {
    setIsDeleting(true);
    setErrorMsg(null);

    try {
      const result = await deleteBlacklistEntry(record.id);

      if (!result.success) {
        setErrorMsg(result.error || 'Error al eliminar el registro.');
        setIsDeleting(false);
        return;
      }

      onDeleted(record.id);
      setIsDeleting(false);
      onClose();
    } catch (err: unknown) {
      console.error(err);
      setErrorMsg('Error de red al intentar eliminar.');
      setIsDeleting(false);
    }
  };

  return (
    <div className={styles.backdrop}>
      <div
        className={styles.container}
        onClick={(clickEvent) => clickEvent.stopPropagation()}
      >
        {/* Glow de advertencia */}
        <div className={styles.glow} />

        {/* Botón cerrar 'X' en la esquina */}
        <button
          onClick={onClose}
          type="button"
          className={styles.closeButton}
          title="Cerrar modal"
        >
          <span className="material-symbols-outlined text-lg">close</span>
        </button>

        {/* Logo de advertencia centrado en el medio */}
        <div className={styles.iconWrapper}>
          <div className={styles.iconBox}>
            <span className="material-symbols-outlined text-3xl select-none">
              warning
            </span>
          </div>
        </div>

        {/* Título y advertencia */}
        <div className="space-y-2.5 text-center">
          <h3 className="text-lg md:text-xl font-bold text-white">
            ¿Eliminar de la Black List?
          </h3>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            Estás a punto de remover a <strong className="text-white font-semibold">{record.nombre}</strong> (CURP: <span className="font-mono text-slate-300">{record.curp}</span>) de la Black List.
          </p>
        </div>

        {errorMsg && (
          <div className={styles.errorAlert}>
            {errorMsg}
          </div>
        )}

        {/* Botón de acción */}
        <div className={styles.footer}>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className={styles.deleteButton}
          >
            {isDeleting ? (
              <div className="flex items-center gap-2">
                <span className="inline-block w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                <span>Eliminando...</span>
              </div>
            ) : (
              'Eliminar'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
