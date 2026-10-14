'use client';

import React, { useState, useEffect } from 'react';
import DownloadExcelButton from '@/components/empresa/DownloadExcelButton';
import type { BlacklistRecord } from '@/types/blacklist';

interface BlacklistFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  selectedZona: string;
  onZonaChange: (value: string) => void;
  zonasOptions: string[];
  dateFrom: string;
  onDateFromChange: (value: string) => void;
  dateTo: string;
  onDateToChange: (value: string) => void;
  onResetFilters: () => void;
  filteredData: BlacklistRecord[];
}

export function BlacklistFilters({
  searchQuery,
  onSearchChange,
  selectedZona,
  onZonaChange,
  zonasOptions,
  dateFrom,
  onDateFromChange,
  dateTo,
  onDateToChange,
  onResetFilters,
  filteredData,
}: BlacklistFiltersProps) {
  const hasActiveFilters = Boolean(
    searchQuery.trim() || selectedZona !== 'todas' || dateFrom || dateTo
  );

  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    if (typeof navigator !== "undefined") {
      setIsIOS(/iPhone|iPad|iPod/.test(navigator.userAgent));
    }
  }, []);

  const handleOpenPicker = (event: React.MouseEvent<HTMLInputElement>) => {
    try {
      event.currentTarget.showPicker();
    } catch {
      // Navegadores que no soportan showPicker lo manejan de forma nativa
    }
  };

  const styles = {
    filterGroup: "flex flex-col gap-1.5",
    label: "text-[10px] uppercase tracking-wider text-slate-400 font-bold",
    input: "bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-base md:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-secondary/40 transition-all",
    select: "bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-base md:text-sm text-white focus:outline-none focus:border-secondary/40 transition-all cursor-pointer",
    resetBtn: "flex items-center justify-center gap-2 px-3 md:px-4 py-2.5 bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-semibold rounded-xl hover:bg-red-500/20 transition-all cursor-pointer",
    dateContainer: "relative flex items-center w-full",
    dateIcon: "absolute left-4 text-slate-400 pointer-events-none material-symbols-outlined text-base",
    dateInput: "w-full bg-slate-950 border border-slate-800 rounded-xl pr-4 py-2.5 text-base md:text-sm text-white focus:outline-none focus:border-secondary/40 transition-all [color-scheme:dark] cursor-pointer [&::-webkit-calendar-picker-indicator]:hidden",
  };

  return (
    <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800/80 p-5 rounded-3xl space-y-4">
      {/* Fila Superior: Buscador General (8 cols) y Zona (4 cols) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* 1. Buscador General */}
        <div className={`col-span-1 md:col-span-8 ${styles.filterGroup}`}>
          <label className={styles.label}>Buscador General</label>
          <input
            type="text"
            placeholder="Buscar por nombre, CURP, motivo..."
            value={searchQuery}
            onChange={(changeEvent) => onSearchChange(changeEvent.target.value)}
            className={styles.input}
            suppressHydrationWarning
          />
        </div>

        {/* 2. Zona */}
        <div className={`col-span-1 md:col-span-4 ${styles.filterGroup}`}>
          <label className={styles.label}>Zona</label>
          <div className="relative flex items-center w-full">
            <select
              value={selectedZona}
              onChange={(changeEvent) => onZonaChange(changeEvent.target.value)}
              className={`${styles.select} w-full pr-10 appearance-none`}
              suppressHydrationWarning
            >
              <option value="todas">Todos</option>
              {zonasOptions.map((zona) => (
                <option key={zona} value={zona}>
                  {zona}
                </option>
              ))}
            </select>
            <span className="absolute right-4 text-slate-400 pointer-events-none material-symbols-outlined text-xl select-none">
              expand_more
            </span>
          </div>
        </div>
      </div>

      {/* Fila Inferior: Desde (4 cols), Hasta (4 cols) y Botones de Acción (4 cols) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
        {/* Desde */}
        <div className={`col-span-1 md:col-span-4 ${styles.filterGroup}`}>
          <label className={styles.label}>Desde</label>
          <div className={styles.dateContainer}>
            <span className={styles.dateIcon}>calendar_today</span>
            <input
              type="date"
              value={dateFrom}
              onChange={(changeEvent) => onDateFromChange(changeEvent.target.value)}
              onClick={handleOpenPicker}
              className={styles.dateInput}
              style={{ paddingLeft: "48px" }}
              suppressHydrationWarning
            />
            {!dateFrom && isIOS && (
              <span
                className="absolute text-slate-500 text-base md:text-sm pointer-events-none select-none"
                style={{ left: "48px" }}
              >
                dd/mm/aaaa
              </span>
            )}
          </div>
        </div>

        {/* Hasta */}
        <div className={`col-span-1 md:col-span-4 ${styles.filterGroup}`}>
          <label className={styles.label}>Hasta</label>
          <div className={styles.dateContainer}>
            <span className={styles.dateIcon}>calendar_today</span>
            <input
              type="date"
              value={dateTo}
              onChange={(changeEvent) => onDateToChange(changeEvent.target.value)}
              onClick={handleOpenPicker}
              className={styles.dateInput}
              style={{ paddingLeft: "48px" }}
              suppressHydrationWarning
            />
            {!dateTo && isIOS && (
              <span
                className="absolute text-slate-500 text-base md:text-sm pointer-events-none select-none"
                style={{ left: "48px" }}
              >
                dd/mm/aaaa
              </span>
            )}
          </div>
        </div>

        {/* Botones de Acción: Limpiar Filtros y Descargar Excel */}
        <div className="col-span-1 md:col-span-4 h-[42px] flex items-center justify-end gap-3">
          <button
            onClick={onResetFilters}
            disabled={!hasActiveFilters}
            type="button"
            className={`${styles.resetBtn} flex-initial h-full flex items-center justify-center gap-2 transition-all duration-300 ${
              hasActiveFilters
                ? "opacity-100 cursor-pointer"
                : "opacity-0 pointer-events-none"
            }`}
            title="Limpiar filtros"
          >
            <span className="material-symbols-outlined text-base">filter_alt_off</span>
            <span className="hidden md:inline">Limpiar Filtros</span>
          </button>
          <DownloadExcelButton
            data={filteredData}
            type="blacklist"
          />
        </div>
      </div>
    </div>
  );
}
