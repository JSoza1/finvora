'use client';

import React, { useState } from 'react';
import type { SeguimientoPagoRecord, EstadoCuota } from '@/app/empresa/webapp/seguimiento-pagos/seguimiento-actions';
import { ESTADOS_DISPONIBLES } from '@/constants/seguimiento-estados';
import { calculateSaldoRestante, calculateSemanasTranscurridas, formatFechaDDMMYYYY, addWeeksToDate } from '@/utils/date-tijuana';

interface SeguimientoTableProps {
  paginatedData: SeguimientoPagoRecord[];
  totalPages: number;
  currentPage: number;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  isUpdatingState: string | null;
  setSelectedForDetail: (item: SeguimientoPagoRecord) => void;
  setSelectedForEdit: (item: SeguimientoPagoRecord) => void;
  handleStateChangeSemanaActual: (item: SeguimientoPagoRecord, nuevoEstado: EstadoCuota) => void;
  isSuperiorRole: boolean;
}

export function SeguimientoTable({
  paginatedData,
  totalPages,
  currentPage,
  setCurrentPage,
  isUpdatingState,
  setSelectedForDetail,
  setSelectedForEdit,
  handleStateChangeSemanaActual,
  isSuperiorRole
}: SeguimientoTableProps) {
  const [copiedTagId, setCopiedTagId] = useState<string | null>(null);

  const handleCopyTag = async (id: string, tag: string) => {
    let copied = false;

    // Intento 1: Clipboard API moderna (requiere HTTPS / localhost)
    if (typeof navigator !== 'undefined' && navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(tag);
        copied = true;
      } catch {
        copied = false;
      }
    }

    // Intento 2: Fallback universal execCommand para móviles e IP local (HTTP)
    if (!copied && typeof document !== 'undefined') {
      try {
        const textArea = document.createElement("textarea");
        textArea.value = tag;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        copied = document.execCommand("copy");
        textArea.remove();
      } catch (err) {
        console.error("Error al copiar tag:", err);
      }
    }

    setCopiedTagId(id);
    setTimeout(() => setCopiedTagId(null), 1500);
  };
  return (
    <div className="bg-slate-900/30 backdrop-blur-xl border border-slate-800/80 rounded-3xl overflow-hidden shadow-2xl">
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left text-xs sm:text-sm border-collapse">
          <thead className="bg-slate-950 text-xs text-slate-400 border-b border-slate-800 uppercase tracking-wider font-semibold whitespace-nowrap">
            <tr>
              <th className="px-8 py-4 text-left w-[58%]">Cliente</th>
              <th className="px-4 py-4 text-center">Vendedor</th>
              <th className="px-4 py-4 text-center">TAG / IMEI</th>
              <th className="w-[12%]"></th>
              <th className="px-4 py-4 text-center">Próximo Pago</th>
              <th className="w-[12%]"></th>
              <th className="px-4 py-4 text-center">Saldo Restante</th>
              <th className="w-[12%]"></th>
              <th className="px-4 py-4 text-center">Estado Semana</th>
              <th className="px-6 py-4 text-center whitespace-nowrap">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-6 py-12 text-center text-slate-500">
                  No se encontraron registros de seguimiento de pagos con los filtros aplicados.
                </td>
              </tr>
            ) : (
              paginatedData.map((item) => {
                const saldoRestante = calculateSaldoRestante(
                  item.precio_total,
                  item.pago_inicial,
                  item.pago_semanal,
                  item.fecha_proximo_pago,
                  item.plazos
                );

                const totalSemanas = item.plazos || 0;
                const semanaActualIndice = calculateSemanasTranscurridas(item.fecha_proximo_pago, totalSemanas);
                const fechaProximoPagoDinamica = item.fecha_proximo_pago
                  ? addWeeksToDate(item.fecha_proximo_pago, Math.max(0, (semanaActualIndice || 1) - 1))
                  : null;
                const semanaKey = `semana_${semanaActualIndice || 1}`;
                const estadoActualSemana: EstadoCuota = (item.estados_semanales?.[semanaKey] as EstadoCuota) || 'En revisión';
                const estadoConfig = ESTADOS_DISPONIBLES.find(e => e.value === estadoActualSemana) || ESTADOS_DISPONIBLES[0];
                const isUpdating = isUpdatingState === item.id;
                const cleanPhone = item.numero_telefono ? item.numero_telefono.replace(/\D/g, '') : '';
                const whatsappUrl = cleanPhone ? `https://wa.me/${cleanPhone}` : null;

                return (
                  <tr key={item.id} className="hover:bg-slate-900/20 transition-colors group border-b border-slate-800/50">
                    {/* Cliente */}
                    <td className="px-8 py-4">
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => setSelectedForDetail(item)}
                          title="Ver evolución semanal del cliente"
                          className="relative w-9 h-9 rounded-xl bg-slate-950 border border-slate-800 hover:border-secondary/50 flex items-center justify-center text-secondary transition-all shadow-sm shrink-0"
                        >
                          <span className="material-symbols-outlined text-lg">person</span>
                        </button>
                        <div className="min-w-0">
                          <button
                            onClick={() => setSelectedForDetail(item)}
                            className="text-xs sm:text-sm font-bold text-white hover:text-secondary transition-colors text-left block whitespace-normal"
                          >
                            {item.nombre_cliente}
                          </button>
                        </div>
                      </div>
                    </td>

                    {/* Vendedor */}
                    <td className="px-4 py-4 whitespace-nowrap text-center text-slate-300 font-medium">
                      {item.vendedor?.username || <span className="text-xs text-slate-500">—</span>}
                    </td>

                    {/* Tag / IMEI */}
                    <td className="px-4 py-4 whitespace-nowrap text-center">
                      <div className="flex flex-col items-center justify-center">
                        <div className="relative flex items-center justify-center">
                          {copiedTagId === item.id && (
                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-emerald-400 border border-slate-700 text-[11px] font-bold px-2.5 py-0.5 rounded-lg shadow-xl whitespace-nowrap z-50 pointer-events-none animate-in fade-in zoom-in-95 duration-150">
                              ¡Copiado!
                            </div>
                          )}
                          {item.tag ? (
                            <button
                              type="button"
                              onClick={() => handleCopyTag(item.id, item.tag!)}
                              className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-slate-950 text-slate-300 border border-slate-800 cursor-pointer"
                            >
                              {item.tag}
                            </button>
                          ) : (
                            <span className="text-xs text-slate-500">—</span>
                          )}
                        </div>
                        {item.imei && (
                          <span className="font-mono bg-slate-950 px-2 sm:px-2.5 py-0.5 sm:py-1 mt-1 sm:mt-1.5 rounded-md border border-slate-800 text-secondary text-[10px] sm:text-xs font-bold inline-block">
                            {item.imei}
                          </span>
                        )}
                      </div>
                    </td>

                    <td></td>

                    {/* Próximo Pago */}
                    <td className="px-4 py-4 whitespace-nowrap text-center">
                      {fechaProximoPagoDinamica ? (
                        <span className="text-xs sm:text-sm font-semibold text-slate-300">
                          {formatFechaDDMMYYYY(fechaProximoPagoDinamica)}
                        </span>
                      ) : (
                        <span className="inline-block px-2 py-0.5 rounded-lg text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          Sin fecha
                        </span>
                      )}
                    </td>

                    <td></td>

                    {/* Saldo Restante */}
                    <td className="px-4 py-4 whitespace-nowrap text-center">
                      <span className="text-sm sm:text-base font-extrabold text-emerald-400 block">
                        ${saldoRestante.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </span>
                      {semanaActualIndice > 0 && (
                        <span className="block text-[11px] text-slate-400 mt-0.5 font-medium">
                          Semana {semanaActualIndice} de {totalSemanas || '?'}
                        </span>
                      )}
                    </td>

                    <td></td>

                    {/* Estado Semana */}
                    <td className="px-4 py-4 text-center whitespace-nowrap">
                      <div className="relative inline-flex flex-col items-center">
                        <div className="relative flex items-center justify-center">
                          <select
                            value={estadoActualSemana}
                            disabled={isUpdating}
                            onChange={(e) => handleStateChangeSemanaActual(item, e.target.value as EstadoCuota)}
                            className={`appearance-none cursor-pointer rounded-lg text-[10px] font-semibold uppercase border transition-all outline-none m-0 p-0 h-6 min-w-[110px] text-center ${estadoConfig.bg} ${estadoConfig.text} ${estadoConfig.border} hover:brightness-110 disabled:opacity-50`}
                            style={{
                              colorScheme: 'dark',
                              textAlignLast: 'center',
                              paddingLeft: '0',
                              paddingRight: '0'
                            }}
                            suppressHydrationWarning
                          >
                            {ESTADOS_DISPONIBLES.map(st => (
                              <option key={st.value} value={st.value} className="bg-slate-950 text-white uppercase">
                                {st.label}
                              </option>
                            ))}
                          </select>
                          {isUpdating && (
                            <span className="absolute -left-6 animate-spin h-3 w-3 border-2 border-slate-500 border-t-transparent rounded-full" />
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Acciones */}
                    <td className="px-6 py-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-3">
                        {whatsappUrl ? (
                          <a
                            href={whatsappUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            title={`Enviar WhatsApp (${item.numero_telefono})`}
                            className="p-2 text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-xl transition-all text-xs font-semibold flex items-center justify-center cursor-pointer shrink-0"
                          >
                            <i className="fa-brands fa-whatsapp text-base"></i>
                          </a>
                        ) : (
                          <button
                            type="button"
                            disabled
                            title="Sin número de teléfono registrado"
                            className="p-2 text-slate-600 bg-slate-950 border border-slate-800 rounded-xl opacity-30 cursor-not-allowed text-xs font-semibold flex items-center justify-center shrink-0"
                          >
                            <i className="fa-brands fa-whatsapp text-base"></i>
                          </button>
                        )}
                        <button
                          onClick={() => setSelectedForDetail(item)}
                          title="Ver desglose semanal"
                          className="p-2 text-slate-400 hover:text-secondary hover:bg-slate-800/60 rounded-xl transition-all text-xs font-semibold flex items-center justify-center cursor-pointer shrink-0"
                        >
                          <span className="material-symbols-outlined text-base">visibility</span>
                        </button>
                        {isSuperiorRole && (
                          <button
                            onClick={() => setSelectedForEdit(item)}
                            title="Editar datos"
                            className="p-2 text-slate-400 hover:text-amber-400 hover:bg-slate-800/60 rounded-xl transition-all text-xs font-semibold flex items-center justify-center cursor-pointer shrink-0"
                          >
                            <span className="material-symbols-outlined text-base">edit</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* PAGINACIÓN ABAJO DE LA TABLA */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-slate-800 px-6 py-4 bg-slate-950/40">
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className={`px-3.5 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold transition-all ${
              currentPage === 1
                ? "opacity-30 cursor-not-allowed text-slate-500"
                : "hover:bg-slate-700 hover:text-white cursor-pointer"
            }`}
          >
            Anterior
          </button>
          <span className="text-slate-400 text-xs font-semibold">Página {currentPage} de {totalPages}</span>
          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className={`px-3.5 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold transition-all ${
              currentPage === totalPages
                ? "opacity-30 cursor-not-allowed text-slate-500"
                : "hover:bg-slate-700 hover:text-white cursor-pointer"
            }`}
          >
            Siguiente
          </button>
        </div>
      )}
    </div>
  );
}
