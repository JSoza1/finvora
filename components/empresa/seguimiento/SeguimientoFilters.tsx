'use client';

import React from 'react';

interface SeguimientoFiltersProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filtroUltimaSemana: boolean;
  setFiltroUltimaSemana: (val: boolean) => void;
  estadoFilter: string;
  setEstadoFilter: (estado: string) => void;
  dateFrom: string;
  setDateFrom: (date: string) => void;
  dateTo: string;
  setDateTo: (date: string) => void;
  handleShowHistorico: () => void;
  handleClearFilters: () => void;
  isHistoricoActive: boolean;
  hasAnyActiveFilter: boolean;
}

export function SeguimientoFilters({
  searchQuery,
  setSearchQuery,
  filtroUltimaSemana,
  setFiltroUltimaSemana,
  estadoFilter,
  setEstadoFilter,
  dateFrom,
  setDateFrom,
  dateTo,
  setDateTo,
  handleShowHistorico,
  handleClearFilters,
  isHistoricoActive,
  hasAnyActiveFilter
}: SeguimientoFiltersProps) {
  return (
    <div className="bg-slate-900/40 backdrop-blur-xl p-4 md:p-6 rounded-3xl border border-slate-800 space-y-4 text-xs md:text-sm" suppressHydrationWarning>
      {/* Fila 1: Buscador | Histórico | Última semana | Estado */}
      <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
        <div className="relative w-full lg:w-80 flex items-center shrink-0">
          <span className="material-symbols-outlined absolute left-3.5 text-slate-500 text-lg pointer-events-none">search</span>
          <input
            type="text"
            placeholder="Buscar cliente, IMEI, Tag o vendedor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-10 pr-4 bg-slate-950 border border-slate-800 rounded-xl text-base md:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-secondary transition-all"
            suppressHydrationWarning
          />
        </div>

        {/* Botones de Filtro principales */}
        <div className="w-full lg:w-auto space-y-2 sm:space-y-0 sm:flex sm:flex-wrap sm:items-center gap-2">
          <div className="grid grid-cols-2 gap-2 sm:contents">
            <button
              type="button"
              onClick={handleShowHistorico}
              className={`h-10 px-2 sm:px-4 rounded-xl text-[10px] md:text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center text-center w-full sm:w-auto shrink-0 ${isHistoricoActive
                  ? 'bg-secondary text-slate-950 border border-secondary shadow-sm shadow-secondary/15'
                  : 'bg-slate-950 text-slate-400 border border-slate-800 hover:bg-slate-900 hover:text-slate-200'
                }`}
              suppressHydrationWarning
            >
              REGISTRO HISTÓRICO
            </button>

            <button
              type="button"
              onClick={() => setFiltroUltimaSemana(!filtroUltimaSemana)}
              className={`h-10 px-2 sm:px-4 rounded-xl text-[10px] md:text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center text-center w-full sm:w-auto shrink-0 ${filtroUltimaSemana
                  ? 'bg-secondary text-slate-950 border border-secondary shadow-sm shadow-secondary/15'
                  : 'bg-slate-950 text-slate-300 border border-slate-800 hover:bg-slate-900'
                }`}
              suppressHydrationWarning
            >
              ÚLTIMA SEMANA
            </button>
          </div>

          <div className="relative w-full sm:w-auto shrink-0">
            <select
              value={estadoFilter}
              onChange={(e) => setEstadoFilter(e.target.value)}
              className={`h-10 w-full sm:w-auto appearance-none rounded-xl px-5 text-[10px] md:text-xs font-bold uppercase tracking-wider focus:outline-none transition-all cursor-pointer text-center ${
                estadoFilter !== 'todos'
                  ? 'bg-secondary text-slate-950 border border-secondary shadow-sm shadow-secondary/15'
                  : 'bg-slate-950 text-slate-300 border border-slate-800 hover:bg-slate-900'
              }`}
              style={{ colorScheme: 'dark', textAlignLast: 'center' }}
              suppressHydrationWarning
            >
              <option value="todos" className="bg-slate-950 text-white text-xs text-left" style={{ textAlign: 'left' }}>TODOS LOS ESTADOS</option>
              <option value="En revisión" className="bg-slate-950 text-white text-xs text-left" style={{ textAlign: 'left' }}>EN REVISIÓN</option>
              <option value="Por vencer" className="bg-slate-950 text-white text-xs text-left" style={{ textAlign: 'left' }}>POR VENCER</option>
              <option value="Vencido" className="bg-slate-950 text-white text-xs text-left" style={{ textAlign: 'left' }}>VENCIDO</option>
              <option value="Pagado" className="bg-slate-950 text-white text-xs text-left" style={{ textAlign: 'left' }}>PAGADO</option>
              <option value="No Verificable" className="bg-slate-950 text-white text-xs text-left" style={{ textAlign: 'left' }}>NO VERIFICABLE</option>
            </select>
          </div>
        </div>
      </div>

      {/* Separador e Filtros Secundarios */}
      <div className="border-t border-slate-800/60 pt-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-3 w-full sm:w-auto">
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="material-symbols-outlined text-slate-400 text-base">calendar_month</span>
              <span className="text-slate-300 font-semibold text-xs md:text-sm">Fechas:</span>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <label className="text-slate-400 font-semibold shrink-0 text-xs md:text-sm">Desde:</label>
              <div className="relative flex items-center flex-1 sm:flex-initial w-full sm:w-auto">
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  onKeyDown={(e) => e.preventDefault()}
                  onClick={(e) => {
                    try {
                      e.currentTarget.showPicker();
                    } catch {}
                  }}
                  className="h-10 px-4 w-full sm:w-44 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-secondary transition-all cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer text-transparent text-center text-base md:text-sm font-semibold"
                  style={{ colorScheme: 'dark' }}
                  suppressHydrationWarning
                />
                <span className={`absolute inset-0 flex items-center justify-center text-xs md:text-sm font-semibold pointer-events-none select-none ${dateFrom ? 'text-slate-200' : 'text-slate-400'}`}>
                  {dateFrom ? dateFrom.split('-').reverse().join('/') : 'dd/mm/aaaa'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <label className="text-slate-400 font-semibold shrink-0 text-xs md:text-sm">Hasta:</label>
              <div className="relative flex items-center flex-1 sm:flex-initial w-full sm:w-auto">
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  onKeyDown={(e) => e.preventDefault()}
                  onClick={(e) => {
                    try {
                      e.currentTarget.showPicker();
                    } catch {}
                  }}
                  className="h-10 px-4 w-full sm:w-44 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-secondary transition-all cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer text-transparent text-center text-base md:text-sm font-semibold"
                  style={{ colorScheme: 'dark' }}
                  suppressHydrationWarning
                />
                <span className={`absolute inset-0 flex items-center justify-center text-xs md:text-sm font-semibold pointer-events-none select-none ${dateTo ? 'text-slate-200' : 'text-slate-400'}`}>
                  {dateTo ? dateTo.split('-').reverse().join('/') : 'dd/mm/aaaa'}
                </span>
              </div>
            </div>
          </div>

          {hasAnyActiveFilter && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="flex items-center justify-center gap-1.5 h-10 px-3.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl text-xs md:text-sm font-bold transition-all cursor-pointer shadow-sm shadow-red-500/5 w-full sm:w-auto sm:ml-auto shrink-0"
              title="Limpiar Filtros"
              suppressHydrationWarning
            >
              <span className="material-symbols-outlined text-base md:text-lg">filter_alt_off</span>
              <span>Limpiar Filtros</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
