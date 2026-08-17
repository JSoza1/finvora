'use client';

import React, { useState, useEffect } from 'react';
import { 
  SeguimientoPagoRecord, 
  updateSeguimientoPago 
} from '@/app/empresa/webapp/seguimiento-pagos/seguimiento-actions';
import { formatFechaDDMMYYYY } from '@/utils/date-tijuana';

interface EditSeguimientoModalProps {
  registro: SeguimientoPagoRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
}

export function EditSeguimientoModal({
  registro,
  isOpen,
  onClose,
  onRefresh
}: EditSeguimientoModalProps) {
  const [nombreCliente, setNombreCliente] = useState('');
  const [numeroTelefono, setNumeroTelefono] = useState('');
  const [tag, setTag] = useState('');
  const [celular, setCelular] = useState('');
  const [imei, setImei] = useState('');
  const [precioTotal, setPrecioTotal] = useState<number | ''>('');
  const [pagoInicial, setPagoInicial] = useState<number | ''>('');
  const [pagoSemanal, setPagoSemanal] = useState<number | ''>('');
  const [plazos, setPlazos] = useState<number | ''>('');
  const [fechaProximoPago, setFechaProximoPago] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (registro) {
      setNombreCliente(registro.nombre_cliente || '');
      setNumeroTelefono(registro.numero_telefono || '');
      setTag(registro.tag || '');
      setCelular(registro.celular || '');
      setImei(registro.imei || '');
      setPrecioTotal(registro.precio_total || '');
      setPagoInicial(registro.pago_inicial || 0);
      setPagoSemanal(registro.pago_semanal || '');
      setPlazos(registro.plazos || '');
      setFechaProximoPago(registro.fecha_proximo_pago || '');
      setErrorMsg(null);
    }
  }, [registro]);

  if (!isOpen || !registro) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!nombreCliente.trim()) {
      setErrorMsg('El nombre del cliente es obligatorio.');
      return;
    }

    setIsSubmitting(true);

    const result = await updateSeguimientoPago(registro.id, {
      tag: tag.trim() || undefined,
      nombre_cliente: nombreCliente.trim(),
      numero_telefono: numeroTelefono.trim() || undefined,
      celular: celular.trim() || undefined,
      imei: imei.trim() || undefined,
      precio_total: Number(precioTotal) || 0,
      pago_inicial: Number(pagoInicial) || 0,
      pago_semanal: Number(pagoSemanal) || 0,
      plazos: plazos !== '' ? Number(plazos) : null,
      fecha_proximo_pago: fechaProximoPago ? fechaProximoPago : null,
    });

    setIsSubmitting(false);

    if (result.success) {
      onRefresh();
      onClose();
    } else {
      setErrorMsg(result.error || 'Error al guardar los cambios.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200 font-[family-name:var(--font-outfit)]">
      <div 
        className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/50 relative">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            Editar seguimiento
          </h2>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-950/50 text-slate-400 hover:bg-slate-800 hover:text-white border border-slate-800 hover:border-slate-700 transition-all cursor-pointer shrink-0"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-hidden font-[family-name:var(--font-outfit)]">
          {errorMsg && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm rounded-xl">
              {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-300">Número de Teléfono</label>
              <input
                type="tel"
                value={numeroTelefono}
                onChange={(e) => setNumeroTelefono(e.target.value)}
                placeholder="Ej: 5212345678900"
                className="w-full h-10 px-3.5 rounded-xl bg-slate-950 border border-slate-800 text-base sm:text-sm text-slate-100 focus:border-indigo-500 outline-none transition-colors font-[family-name:var(--font-outfit)]"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-300">Tag</label>
              <input
                type="text"
                value={tag}
                onChange={(e) => setTag(e.target.value)}
                placeholder="Ej: T-1234"
                className="w-full h-10 px-3.5 rounded-xl bg-slate-950 border border-slate-800 text-base sm:text-sm text-slate-100 focus:border-indigo-500 outline-none transition-colors font-[family-name:var(--font-outfit)]"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-300">Precio Total</label>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-slate-400 text-sm pointer-events-none">$</span>
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  value={precioTotal}
                  onChange={(e) => setPrecioTotal(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full h-10 pl-8 pr-3.5 rounded-xl bg-slate-950 border border-slate-800 text-base sm:text-sm text-slate-100 focus:border-indigo-500 outline-none transition-colors font-[family-name:var(--font-outfit)]"
                  required
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-300">Pago Inicial</label>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-slate-400 text-sm pointer-events-none">$</span>
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  value={pagoInicial}
                  onChange={(e) => setPagoInicial(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full h-10 pl-8 pr-3.5 rounded-xl bg-slate-950 border border-slate-800 text-base sm:text-sm text-slate-100 focus:border-indigo-500 outline-none transition-colors font-[family-name:var(--font-outfit)]"
                  required
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-300">Pago Semanal</label>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-slate-400 text-sm pointer-events-none">$</span>
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  value={pagoSemanal}
                  onChange={(e) => setPagoSemanal(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full h-10 pl-8 pr-3.5 rounded-xl bg-slate-950 border border-slate-800 text-base sm:text-sm text-slate-100 focus:border-indigo-500 outline-none transition-colors font-[family-name:var(--font-outfit)]"
                  required
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-300">Plazos</label>
              <select
                value={plazos}
                onChange={(e) => setPlazos(e.target.value === '' ? '' : Number(e.target.value))}
                className="appearance-none w-full h-10 px-3.5 rounded-xl bg-slate-950 border border-slate-800 text-base sm:text-sm text-slate-100 text-center focus:border-indigo-500 outline-none transition-colors cursor-pointer font-[family-name:var(--font-outfit)]"
                style={{ colorScheme: 'dark', textAlignLast: 'center' }}
              >
                <option value="">Sin plazo</option>
                {[13, 26, 39, 52].map(val => (
                  <option key={val} value={val}>{val} semanas</option>
                ))}
                {plazos && ![13, 26, 39, 52].includes(Number(plazos)) && (
                  <option value={plazos}>{plazos} semanas</option>
                )}
              </select>
            </div>
            <div className="space-y-1 min-w-0">
              <label className="block text-xs font-semibold text-slate-300">Fecha Próximo Pago</label>
              <div className="relative flex items-center justify-center overflow-hidden rounded-xl bg-slate-950 border border-slate-800 focus-within:border-indigo-500 transition-colors h-10 cursor-pointer">
                <span className={`pointer-events-none select-none text-base sm:text-sm font-[family-name:var(--font-outfit)] ${
                  fechaProximoPago ? "text-slate-100" : "text-slate-500"
                }`}>
                  {fechaProximoPago ? formatFechaDDMMYYYY(fechaProximoPago) : "dd/mm/aaaa"}
                </span>
                <input
                  type="date"
                  value={fechaProximoPago}
                  onChange={(e) => setFechaProximoPago(e.target.value)}
                  onClick={(e) => {
                    try {
                      e.currentTarget.showPicker();
                    } catch {}
                  }}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer text-base"
                  style={{ colorScheme: 'dark' }}
                />
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="pt-4 flex justify-end border-t border-slate-800">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-secondary text-slate-950 rounded-xl font-semibold text-sm hover:brightness-110 transition-all cursor-pointer disabled:opacity-50 font-[family-name:var(--font-outfit)]"
            >
              <span>{isSubmitting ? 'Guardando...' : 'Guardar Cambios'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
