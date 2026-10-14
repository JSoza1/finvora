'use client';

import React from 'react';

interface BlacklistKpisProps {
  stats: {
    total: number;
    topZona: string;
    topZonaCount: number;
    bloqueadosEsteMes: number;
  };
  onOpenCreate: () => void;
}

const styles = {
  grid: 'grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4',
  addButton: 'group relative bg-gradient-to-br from-rose-500/10 via-slate-900/50 to-slate-900/80 border border-rose-500/30 hover:border-rose-500/60 p-3.5 sm:p-4 md:p-5 rounded-2xl flex items-center justify-between transition-colors shadow-sm cursor-pointer text-left',
  addLabel: 'text-[11px] md:text-xs font-bold text-rose-300 uppercase tracking-wider truncate',
  addIconBox: 'w-10 h-10 md:w-12 md:h-12 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-300 group-hover:bg-rose-500 group-hover:text-white transition-colors shrink-0',
  statCard: 'bg-slate-900/40 backdrop-blur-xl border border-slate-800 p-3.5 sm:p-4 md:p-5 rounded-2xl flex items-center justify-between hover:border-slate-700/80 transition-all shadow-sm',
  statLabel: 'text-[11px] md:text-xs font-bold text-slate-400 uppercase tracking-wider truncate',
  statIconBox: 'w-10 h-10 md:w-12 md:h-12 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center shrink-0',
  statValue: 'text-xl md:text-2xl font-extrabold mt-1 font-mono',
};

export function BlacklistKpis({ stats, onOpenCreate }: BlacklistKpisProps) {
  return (
    <div className={styles.grid}>
      {/* 1. Botón / Tarjeta interactiva: Agregar */}
      <button
        onClick={onOpenCreate}
        type="button"
        className={styles.addButton}
      >
        <div className="min-w-0 pr-2">
          <p className={styles.addLabel}>
            <span className="sm:hidden">Agregar</span>
            <span className="hidden sm:inline">Agregar a la Black List</span>
          </p>
        </div>
        <div className={styles.addIconBox}>
          <span className="material-symbols-outlined text-xl md:text-2xl select-none">
            add
          </span>
        </div>
      </button>

      {/* 2. Total Bloqueados */}
      <div className={styles.statCard}>
        <div className="min-w-0 pr-2">
          <p className={styles.statLabel}>
            <span className="sm:hidden">Total Bloq.</span>
            <span className="hidden sm:inline">Total Bloqueados</span>
          </p>
          <p className={`${styles.statValue} text-rose-400`}>
            {stats.total}
          </p>
        </div>
        <div className={`${styles.statIconBox} text-rose-400`}>
          <span className="material-symbols-outlined text-xl md:text-2xl select-none">
            person_off
          </span>
        </div>
      </div>

      {/* 3. Zona con Más Bloqueos */}
      <div className={styles.statCard}>
        <div className="min-w-0 pr-2">
          <p className={styles.statLabel}>
            Zona Principal
          </p>
          <p className="text-base sm:text-lg md:text-xl font-extrabold text-amber-400 mt-1 truncate" title={stats.topZona}>
            {stats.topZona}
          </p>
        </div>
        <div className={`${styles.statIconBox} text-amber-400`}>
          <span className="material-symbols-outlined text-xl md:text-2xl select-none">
            location_on
          </span>
        </div>
      </div>

      {/* 4. Bloqueados este Mes */}
      <div className={styles.statCard}>
        <div className="min-w-0 pr-2">
          <p className={styles.statLabel}>
            <span className="sm:hidden">Bloq. Mes</span>
            <span className="hidden sm:inline">Bloqueados este Mes</span>
          </p>
          <p className={`${styles.statValue} text-purple-400`}>
            {stats.bloqueadosEsteMes}
          </p>
        </div>
        <div className={`${styles.statIconBox} text-purple-400`}>
          <span className="material-symbols-outlined text-xl md:text-2xl select-none">
            calendar_month
          </span>
        </div>
      </div>
    </div>
  );
}
