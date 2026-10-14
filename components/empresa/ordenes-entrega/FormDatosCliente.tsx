'use client';

import React, { useState, useEffect, useRef } from 'react';
import { checkCurpInBlacklist } from '@/app/empresa/webapp/ordenes-entrega/actions';
import type { BlacklistBlockedRecord } from './BlacklistOrderBlockedModal';

interface FormDatosClienteProps {
  curpValue?: string;
  onCurpChange?: (value: string) => void;
  onCurpBlocked?: (record: BlacklistBlockedRecord) => void;
}

/**
 * Componente que renderiza los campos iniciales de información del cliente y referencias personales/familiares
 * en el formulario de Orden de Entrega.
 */
export function FormDatosCliente({
  curpValue = '',
  onCurpChange,
  onCurpBlocked,
}: FormDatosClienteProps) {
  const [internalCurp, setInternalCurp] = useState(curpValue);
  const [isChecking, setIsChecking] = useState(false);
  const [checkStatus, setCheckStatus] = useState<'idle' | 'clean'>('idle');
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setInternalCurp(curpValue);
  }, [curpValue]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleCurpChange = (changeEvent: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = changeEvent.target.value.toUpperCase();
    setInternalCurp(formatted);
    onCurpChange?.(formatted);
    if (checkStatus !== 'idle') {
      setCheckStatus('idle');
    }
  };

  const handleVerifyCurp = async () => {
    const cleanCurp = internalCurp.trim().toUpperCase();
    if (!cleanCurp) return;

    setIsChecking(true);
    try {
      const result = await checkCurpInBlacklist(cleanCurp);
      if (result.isBlocked && result.record) {
        onCurpBlocked?.(result.record);
      } else {
        setCheckStatus('clean');
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
          setCheckStatus('idle');
        }, 2500);
      }
    } catch (err) {
      console.error('Error al verificar CURP en Black List:', err);
    } finally {
      setIsChecking(false);
    }
  };

  const styles = {
    formGrid: "grid grid-cols-1 md:grid-cols-2 gap-6",
    inputGroup: "space-y-2",
    inputGroupFull: "space-y-2 md:col-span-2",
    label: "text-sm font-medium text-slate-300 ml-1",
    input: "w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:border-secondary transition-all disabled:opacity-40 disabled:cursor-not-allowed",
    selectInput: "w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:border-secondary transition-all disabled:opacity-40 disabled:cursor-not-allowed appearance-none cursor-pointer",
    sectionTitle: "text-lg font-bold text-secondary border-b border-slate-800 pb-2 mb-4",
  };

  return (
    <div className="space-y-8">
      {/* SECCIÓN 1: DATOS DEL CLIENTE */}
      <div>
        <h3 className={styles.sectionTitle}>Datos del Cliente</h3>
        <div className={styles.formGrid}>
          <div className={styles.inputGroupFull}>
            <label className={styles.label}>Nombre de cliente</label>
            <input type="text" name="nombre_cliente" className={styles.input} required placeholder="Nombre completo" suppressHydrationWarning />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>¿Cuenta con Identificación?</label>
            <select
              name="identificacion_fisica"
              className={styles.selectInput}
              style={{ colorScheme: 'dark' }}
              required
              suppressHydrationWarning
            >
              <option value="Si" className="bg-slate-950 text-white">Sí cuenta con INE/Residencia</option>
              <option value="No" className="bg-slate-950 text-white">No cuenta con INE/Residencia</option>
            </select>
          </div>

          {/* Campo CURP con botón de Lupa (90% input / 10% botón) */}
          <div className={styles.inputGroup}>
            <label className={styles.label}>CURP</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                name="curp"
                value={internalCurp}
                onChange={handleCurpChange}
                className={`${styles.input} flex-1 ${internalCurp ? 'font-mono uppercase tracking-wider' : ''}`}
                required
                maxLength={18}
                placeholder="Ingrese Curp"
                suppressHydrationWarning
              />
              <button
                type="button"
                onClick={handleVerifyCurp}
                disabled={isChecking}
                className={`w-12 h-[50px] shrink-0 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
                  checkStatus === 'clean'
                    ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400 shadow-lg shadow-emerald-500/10'
                    : 'bg-slate-950/70 border-slate-800 text-secondary hover:text-white hover:border-secondary/50 active:scale-95'
                }`}
                title={checkStatus === 'clean' ? 'CURP verificado: No está en Black List' : 'Verificar CURP en Black List'}
              >
                {isChecking ? (
                  <span className="w-4 h-4 border-2 border-secondary/30 border-t-secondary rounded-full animate-spin" />
                ) : checkStatus === 'clean' ? (
                  <span className="material-symbols-outlined text-xl select-none animate-in zoom-in-75 duration-150">
                    check_circle
                  </span>
                ) : (
                  <span className="material-symbols-outlined text-xl select-none">
                    search
                  </span>
                )}
              </button>
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>Número de teléfono</label>
            <input type="tel" name="telefono" className={styles.input} required placeholder="Ej: 5212345678900" suppressHydrationWarning />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>Preferencia de comunicación</label>
            <select
              name="preferencia_comunicacion"
              className={styles.selectInput}
              style={{ colorScheme: 'dark' }}
              required
              defaultValue=""
              suppressHydrationWarning
            >
              <option value="" className="bg-slate-950 text-slate-500 italic">Seleccione preferencia...</option>
              <option value="Llamada WhatsApp" className="bg-slate-950 text-white">Llamada WhatsApp</option>
              <option value="Llamada Telefónica" className="bg-slate-950 text-white">Llamada Telefónica</option>
              <option value="Mensaje WhatsApp" className="bg-slate-950 text-white">Mensaje WhatsApp</option>
              <option value="Mensaje SMS" className="bg-slate-950 text-white">Mensaje SMS</option>
            </select>
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>Dirección</label>
            <input type="text" name="direccion" className={styles.input} required placeholder="Enlace Google Maps" suppressHydrationWarning />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>¿Cuenta activa?</label>
            <select
              name="cuenta_activa"
              className={styles.selectInput}
              style={{ colorScheme: 'dark' }}
              required
              defaultValue="si"
              suppressHydrationWarning
            >
              <option value="si" className="bg-slate-950 text-white">Sí</option>
              <option value="no" className="bg-slate-950 text-white">No</option>
            </select>
          </div>
        </div>
      </div>

      {/* SECCIÓN 2: DATOS DE REFERENCIAS */}
      <div>
        <h3 className={styles.sectionTitle}>Datos de Referencias</h3>
        <div className={styles.formGrid}>
          <div className={styles.inputGroup}>
            <label className={styles.label}>Nombre referencia 1</label>
            <input
              type="text"
              name="nombre_referencia_1"
              className={styles.input}
              placeholder="Solo iPhone"
              suppressHydrationWarning
            />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>Número referencia 1</label>
            <input
              type="tel"
              name="telefono_referencia_1"
              className={styles.input}
              placeholder="Solo iPhone"
              suppressHydrationWarning
            />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>Nombre referencia 2</label>
            <input
              type="text"
              name="nombre_referencia_2"
              className={styles.input}
              placeholder="Solo iPhone"
              suppressHydrationWarning
            />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>Número referencia 2</label>
            <input
              type="tel"
              name="telefono_referencia_2"
              className={styles.input}
              placeholder="Solo iPhone"
              suppressHydrationWarning
            />
          </div>
        </div>
      </div>
    </div>
  );
}
