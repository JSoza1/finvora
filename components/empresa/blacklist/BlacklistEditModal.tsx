'use client';

import React, { useState, useEffect, useMemo } from 'react';
import type { BlacklistRecord, UpdateBlacklistDTO } from '@/types/blacklist';
import { updateBlacklistEntry } from '@/app/empresa/webapp/blacklist/blacklist-actions';

interface BlacklistEditModalProps {
  record: BlacklistRecord | null;
  isOpen: boolean;
  onClose: () => void;
  zonasOptions: string[];
  onUpdated: (record: BlacklistRecord) => void;
}

const styles = {
  backdrop: 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200 overscroll-contain touch-none',
  container: 'relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl space-y-5 overflow-hidden max-h-[95vh] flex flex-col overscroll-contain touch-auto',
  glow: 'absolute -top-16 -right-16 w-36 h-36 bg-amber-500/10 rounded-full blur-3xl pointer-events-none',
  header: 'flex items-start justify-between gap-4 border-b border-slate-800/80 pb-4 select-none',
  headerIcon: 'w-11 h-11 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center font-bold text-lg shrink-0',
  closeButton: 'w-8 h-8 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer shrink-0',
  form: 'space-y-4 overflow-y-auto pr-1 flex-1 custom-scrollbar touch-pan-y overscroll-contain',
  errorAlert: 'p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-400 flex items-center gap-2',
  fieldGroup: 'space-y-1.5',
  label: 'block text-xs font-bold text-slate-300',
  input: 'w-full px-3.5 py-2.5 bg-slate-950/70 border border-slate-800 focus:border-secondary/50 rounded-xl text-white placeholder-slate-500 outline-none transition-all text-[16px] sm:text-sm',
  inputCurp: 'w-full px-3.5 py-2.5 bg-slate-950/70 border border-slate-800 focus:border-secondary/50 rounded-xl text-white placeholder-slate-500 outline-none transition-all font-mono tracking-wider text-[16px] sm:text-sm uppercase',
  select: 'w-full pl-3.5 pr-10 py-2.5 bg-slate-950/70 border border-slate-800 focus:border-secondary/50 rounded-xl text-white outline-none transition-all text-[16px] sm:text-sm cursor-pointer appearance-none',
  textarea: 'w-full px-3.5 py-2.5 bg-slate-950/70 border border-slate-800 focus:border-secondary/50 rounded-xl text-white placeholder-slate-500 outline-none transition-all text-[16px] sm:text-sm resize-none custom-scrollbar',
  footer: 'pt-3 border-t border-slate-800/80 flex items-center justify-end',
  submitButton: 'px-6 py-2.5 bg-secondary hover:bg-secondary/90 text-slate-950 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-lg shadow-secondary/20 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed',
};

export function BlacklistEditModal({
  record,
  isOpen,
  onClose,
  zonasOptions,
  onUpdated,
}: BlacklistEditModalProps) {
  const [nombre, setNombre] = useState('');
  const [curp, setCurp] = useState('');
  const [zona, setZona] = useState('');
  const [motivo, setMotivo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const availableZonas = useMemo(() => {
    if (record?.zona && !zonasOptions.includes(record.zona)) {
      return [record.zona, ...zonasOptions];
    }
    return zonasOptions;
  }, [record?.zona, zonasOptions]);

  useEffect(() => {
    if (record) {
      setNombre(record.nombre || '');
      setCurp(record.curp || '');
      setZona(record.zona || availableZonas[0] || '');
      setMotivo(record.motivo || '');
      setErrorMsg(null);
    }
  }, [record, availableZonas]);

  if (!isOpen || !record) return null;

  const handleSubmit = async (formSubmitEvent: React.FormEvent) => {
    formSubmitEvent.preventDefault();
    setErrorMsg(null);

    const cleanNombre = nombre.trim();
    const cleanCurp = curp.trim().toUpperCase();
    const cleanZona = zona.trim();
    const cleanMotivo = motivo.trim();

    if (!cleanNombre) {
      setErrorMsg('El nombre es obligatorio.');
      return;
    }

    if (!cleanCurp) {
      setErrorMsg('La CURP es obligatoria.');
      return;
    }

    if (!cleanZona) {
      setErrorMsg('Debes especificar la zona.');
      return;
    }

    if (!cleanMotivo) {
      setErrorMsg('El motivo del bloqueo es obligatorio.');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload: UpdateBlacklistDTO = {
        id: record.id,
        nombre: cleanNombre,
        curp: cleanCurp,
        zona: cleanZona,
        motivo: cleanMotivo,
      };

      const result = await updateBlacklistEntry(payload);

      if (!result.success || !result.data) {
        setErrorMsg(result.error || 'Ocurrió un error al actualizar el registro.');
        setIsSubmitting(false);
        return;
      }

      onUpdated(result.data);
      onClose();
    } catch (err: unknown) {
      console.error(err);
      setErrorMsg('Error de conexión al procesar la actualización.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.backdrop}>
      <div
        className={styles.container}
        onClick={(clickEvent) => clickEvent.stopPropagation()}
      >
        {/* Glow decorativo amarillo */}
        <div className={styles.glow} />

        {/* Encabezado */}
        <div className={styles.header}>
          <div className="flex items-center gap-3">
            {/* Logo de editar en color amarillo */}
            <div className={styles.headerIcon}>
              <span className="material-symbols-outlined text-2xl select-none">
                edit_note
              </span>
            </div>
            <div>
              <h3 className="text-lg md:text-xl font-bold text-white">
                Editar Expediente
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

        {/* Formulario */}
        <form onSubmit={handleSubmit} className={styles.form}>
          {errorMsg && (
            <div className={styles.errorAlert}>
              <span className="material-symbols-outlined text-base shrink-0">error</span>
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Nombre completo */}
          <div className={styles.fieldGroup}>
            <label className={styles.label}>
              Nombre Completo
            </label>
            <input
              type="text"
              required
              value={nombre}
              onChange={(changeEvent) => setNombre(changeEvent.target.value)}
              placeholder="Ej. Juan Pérez García"
              className={styles.input}
            />
          </div>

          {/* CURP */}
          <div className={styles.fieldGroup}>
            <label className={styles.label}>
              CURP
            </label>
            <input
              type="text"
              required
              value={curp}
              onChange={(changeEvent) => setCurp(changeEvent.target.value.toUpperCase())}
              placeholder="AAAA000000HXXXXX00"
              className={styles.inputCurp}
            />
          </div>

          {/* Zona */}
          <div className={styles.fieldGroup}>
            <label className={styles.label}>
              Zona
            </label>
            <div className="relative flex items-center w-full">
              <select
                value={zona}
                onChange={(changeEvent) => setZona(changeEvent.target.value)}
                className={styles.select}
              >
                {availableZonas.map((zonaOption) => (
                  <option key={zonaOption} value={zonaOption} className="bg-slate-900 text-white">
                    {zonaOption}
                  </option>
                ))}
              </select>
              <span className="material-symbols-outlined absolute right-3.5 pointer-events-none text-slate-400 text-lg">
                expand_more
              </span>
            </div>
          </div>

          {/* Motivo */}
          <div className={styles.fieldGroup}>
            <label className={styles.label}>
              Motivo del Bloqueo
            </label>
            <textarea
              required
              rows={4}
              value={motivo}
              onChange={(changeEvent) => setMotivo(changeEvent.target.value)}
              className={styles.textarea}
            />
          </div>

          {/* Botón Editar en color celeste oficial (secondary) */}
          <div className={styles.footer}>
            <button
              type="submit"
              disabled={isSubmitting}
              className={styles.submitButton}
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <span className="inline-block w-4 h-4 border-2 border-slate-950/20 border-t-slate-950 rounded-full animate-spin" />
                  <span>Guardando...</span>
                </div>
              ) : (
                'Editar'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
