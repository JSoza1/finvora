'use client';

import React from 'react';

interface SeguimientoKpisProps {
  stats: {
    totalClientes: number;
    noVerificablesCount: number;
    alDiaCount: number;
    porVencerCount: number;
    vencidosCount: number;
    enRevisionCount: number;
  };
}

export function SeguimientoKpis({ stats }: SeguimientoKpisProps) {
  return (
    <div className="space-y-2.5">
      {/* Total Clientes y No Verificables */}
      <div className="flex items-center gap-4 md:gap-6 flex-wrap px-1">
        <div className="flex items-center gap-2 md:gap-2.5 text-xs md:text-sm font-semibold text-slate-400">
          <span className="material-symbols-outlined text-base md:text-lg text-secondary select-none">group</span>
          <span>Total clientes:</span>
          <span className="text-white font-extrabold font-mono text-sm md:text-base">{stats.totalClientes}</span>
        </div>

        <div className="flex items-center gap-2 md:gap-2.5 text-xs md:text-sm font-semibold text-slate-400">
          <span className="material-symbols-outlined text-base md:text-lg text-purple-400 select-none">group</span>
          <span>No verificables:</span>
          <span className="text-purple-400 font-extrabold font-mono text-sm md:text-base">{stats.noVerificablesCount}</span>
        </div>
      </div>

      {/* 4 Tarjetas KPI de Estado */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Pagos al día */}
        <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800 p-4 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Pagos al día</p>
            <p className="text-xl md:text-2xl font-extrabold text-emerald-400 mt-0.5">{stats.alDiaCount}</p>
          </div>
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-emerald-400 shrink-0">
            <span className="material-symbols-outlined text-xl md:text-2xl select-none translate-x-[1px]">check_circle</span>
          </div>
        </div>

        {/* Pagos por vencer */}
        <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800 p-4 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Por Vencer</p>
            <p className="text-xl md:text-2xl font-extrabold text-amber-400 mt-0.5">{stats.porVencerCount}</p>
          </div>
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-amber-400 shrink-0">
            <span className="material-symbols-outlined text-xl md:text-2xl select-none translate-x-[1px]">schedule</span>
          </div>
        </div>

        {/* Pagos Vencidos */}
        <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800 p-4 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <span className="sm:hidden">P. Vencidos</span>
              <span className="hidden sm:inline">Pagos Vencidos</span>
            </p>
            <p className="text-xl md:text-2xl font-extrabold text-red-500 mt-0.5">{stats.vencidosCount}</p>
          </div>
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-red-500 shrink-0">
            <span className="material-symbols-outlined text-xl md:text-2xl select-none translate-x-[1px]">cancel</span>
          </div>
        </div>

        {/* En Revisión */}
        <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800 p-4 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">En Revisión</p>
            <p className="text-xl md:text-2xl font-extrabold text-slate-300 mt-0.5">{stats.enRevisionCount}</p>
          </div>
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-indigo-400 shrink-0">
            <span className="material-symbols-outlined text-xl md:text-2xl select-none translate-x-[1px]">search</span>
          </div>
        </div>
      </div>
    </div>
  );
}
