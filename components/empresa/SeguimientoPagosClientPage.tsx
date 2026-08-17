'use client';

import React, { useState, useMemo, useEffect } from 'react';
import type {
  SeguimientoPagoRecord,
  EstadoCuota
} from '@/app/empresa/webapp/seguimiento-pagos/seguimiento-actions';
import { updateEstadoSemana } from '@/app/empresa/webapp/seguimiento-pagos/seguimiento-actions';
import { calculateSemanasTranscurridas, isFechaEnSemanaActual, addWeeksToDate } from '@/utils/date-tijuana';
import type { OptionItem } from '@/components/empresa/comprobantes-types';
import { DetalleSeguimientoModal } from './DetalleSeguimientoModal';
import { EditSeguimientoModal } from './EditSeguimientoModal';
import { SeguimientoFilters } from './seguimiento/SeguimientoFilters';
import { SeguimientoKpis } from './seguimiento/SeguimientoKpis';
import { SeguimientoTable } from './seguimiento/SeguimientoTable';
import DownloadExcelButton from './DownloadExcelButton';

interface SeguimientoPagosClientPageProps {
  initialData: SeguimientoPagoRecord[];
  vendedores?: OptionItem[];
  repartidores?: OptionItem[];
  userRole?: string;
}

const ITEMS_PER_PAGE = 20;

export default function SeguimientoPagosClientPage({
  initialData,
  userRole
}: SeguimientoPagosClientPageProps) {
  const [registrosSeguimiento, setRegistrosSeguimiento] = useState<SeguimientoPagoRecord[]>(initialData);
  const [searchQuery, setSearchQuery] = useState('');
  const [filtroUltimaSemana, setFiltroUltimaSemana] = useState(false);
  const [estadoFilter, setEstadoFilter] = useState<string>('todos');

  // Filtros adicionales: Fechas
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);

  // Modales
  const [selectedForDetail, setSelectedForDetail] = useState<SeguimientoPagoRecord | null>(null);
  const [selectedForEdit, setSelectedForEdit] = useState<SeguimientoPagoRecord | null>(null);
  const [isUpdatingState, setIsUpdatingState] = useState<string | null>(null);

  const handleRefresh = async () => {
    window.location.reload();
  };

  const isSuperiorRole = ['Admin', 'Supervisor', 'Developer'].includes(userRole || '');

  // Resetear a página 1 cuando cambia algún filtro
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filtroUltimaSemana, estadoFilter, dateFrom, dateTo]);

  // Filtrado exhaustivo que combina todos los controles
  const filteredData = useMemo(() => {
    return registrosSeguimiento.filter((item) => {
      // 1. Buscador global (Cliente, IMEI, Tag, Vendedor)
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        item.nombre_cliente.toLowerCase().includes(query) ||
        (item.imei && item.imei.toLowerCase().includes(query)) ||
        (item.tag && item.tag.toLowerCase().includes(query)) ||
        (item.vendedor?.username && item.vendedor.username.toLowerCase().includes(query));

      if (!matchesSearch) return false;

      const totalSemanas = item.plazos || 0;
      const semanaActualIndice = calculateSemanasTranscurridas(item.fecha_proximo_pago, totalSemanas);
      const fechaProximoPagoDinamica = item.fecha_proximo_pago
        ? addWeeksToDate(item.fecha_proximo_pago, Math.max(0, (semanaActualIndice || 1) - 1))
        : null;
      const semanaKey = `semana_${semanaActualIndice || 1}`;
      const estadoActual = item.estados_semanales?.[semanaKey] || 'En revisión';

      // 2. Filtro ÚLTIMA SEMANA (Pagos agendados para esta semana)
      if (filtroUltimaSemana) {
        if (!isFechaEnSemanaActual(fechaProximoPagoDinamica)) return false;
      }

      // 3. Filtro de ESTADO
      if (estadoFilter !== 'todos') {
        if (estadoActual !== estadoFilter) return false;
      }

      // 4. Filtro de FECHAS (evalúa la fecha del próximo pago de la semana vigente)
      if (dateFrom || dateTo) {
        if (!fechaProximoPagoDinamica) return false;
        if (dateFrom && fechaProximoPagoDinamica < dateFrom) return false;
        if (dateTo && fechaProximoPagoDinamica > dateTo) return false;
      }

      return true;
    });
  }, [registrosSeguimiento, searchQuery, filtroUltimaSemana, estadoFilter, dateFrom, dateTo]);

  // Paginación
  const totalPages = Math.max(1, Math.ceil(filteredData.length / ITEMS_PER_PAGE));
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredData.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredData, currentPage]);

  // Estadísticas globales dinámicas
  const stats = useMemo(() => {
    let alDiaCount = 0;
    let porVencerCount = 0;
    let vencidosCount = 0;
    let enRevisionCount = 0;
    let noVerificablesCount = 0;

    filteredData.forEach((item) => {
      const totalSemanas = item.plazos || 0;
      const semanaActualIndice = calculateSemanasTranscurridas(item.fecha_proximo_pago, totalSemanas);
      const semanaKey = `semana_${semanaActualIndice || 1}`;
      const estadoActual = item.estados_semanales?.[semanaKey] || 'En revisión';

      if (estadoActual === 'Pagado') alDiaCount++;
      else if (estadoActual === 'Por vencer') porVencerCount++;
      else if (estadoActual === 'Vencido') vencidosCount++;
      else if (estadoActual === 'En revisión') enRevisionCount++;
      else if (estadoActual === 'No Verificable') noVerificablesCount++;
    });

    return {
      totalClientes: filteredData.length,
      noVerificablesCount,
      alDiaCount,
      porVencerCount,
      vencidosCount,
      enRevisionCount
    };
  }, [filteredData]);

  const handleShowHistorico = () => {
    setFiltroUltimaSemana(false);
    setEstadoFilter('todos');
    setSearchQuery('');
    setDateFrom('');
    setDateTo('');
  };

  const handleClearFilters = () => {
    setFiltroUltimaSemana(false);
    setEstadoFilter('todos');
    setSearchQuery('');
    setDateFrom('');
    setDateTo('');
  };

  const isDefaultState = filtroUltimaSemana === false && estadoFilter === 'todos' && !searchQuery && !dateFrom && !dateTo;
  const hasAnyActiveFilter = !isDefaultState;
  const isHistoricoActive = !filtroUltimaSemana;

  const handleStateChangeSemanaActual = async (item: SeguimientoPagoRecord, nuevoEstado: EstadoCuota) => {
    const totalSemanas = item.plazos || 0;
    const semanaActualIndice = calculateSemanasTranscurridas(item.fecha_proximo_pago, totalSemanas) || 1;
    const semanaKey = `semana_${semanaActualIndice}`;

    setIsUpdatingState(item.id);
    const result = await updateEstadoSemana(item.id, semanaKey, nuevoEstado);
    setIsUpdatingState(null);

    if (result.success) {
      setRegistrosSeguimiento(prev => prev.map(row => {
        if (row.id === item.id) {
          let nuevosEstados: Record<string, EstadoCuota> = { ...(row.estados_semanales || {}) };
          if (nuevoEstado === 'No Verificable') {
            const plazosCount = Math.max(row.plazos || 0, Object.keys(nuevosEstados).length, 1);
            for (let i = 1; i <= plazosCount; i++) {
              nuevosEstados[`semana_${i}`] = 'No Verificable';
            }
            Object.keys(nuevosEstados).forEach(k => {
              nuevosEstados[k] = 'No Verificable';
            });
          } else {
            nuevosEstados[semanaKey] = nuevoEstado;
          }

          return {
            ...row,
            estados_semanales: nuevosEstados
          };
        }
        return row;
      }));
    } else {
      alert(result.error || 'Error al actualizar el estado.');
    }
  };

  return (
    <div className="space-y-6 pb-12 text-slate-100" suppressHydrationWarning>
      {/* 1. Barra de Filtros */}
      <SeguimientoFilters
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        filtroUltimaSemana={filtroUltimaSemana}
        setFiltroUltimaSemana={setFiltroUltimaSemana}
        estadoFilter={estadoFilter}
        setEstadoFilter={setEstadoFilter}
        dateFrom={dateFrom}
        setDateFrom={setDateFrom}
        dateTo={dateTo}
        setDateTo={setDateTo}
        handleShowHistorico={handleShowHistorico}
        handleClearFilters={handleClearFilters}
        isHistoricoActive={isHistoricoActive}
        hasAnyActiveFilter={hasAnyActiveFilter}
      />

      {/* 2. Sección de KPIs */}
      <SeguimientoKpis stats={stats} />

      {/* 3. Acciones (Enlace PayJoy a la izquierda, Descarga Excel a la derecha) */}
      <div className="flex items-center justify-end gap-2">
        <a
          href="https://app.payjoy.com/store/merchant-login"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center px-3 md:px-4 py-2 md:py-2.5 bg-slate-800 text-slate-400 border border-slate-700 rounded-xl hover:bg-slate-700 hover:text-white transition-all cursor-pointer"
          title="Abrir PayJoy Merchant Login"
        >
          <span className="material-symbols-outlined text-base md:text-xl">language</span>
        </a>
        <DownloadExcelButton
          data={filteredData}
          type="seguimiento_pagos"
        />
      </div>

      {/* 4. Tabla Principal */}
      <SeguimientoTable
        paginatedData={paginatedData}
        totalPages={totalPages}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        isUpdatingState={isUpdatingState}
        setSelectedForDetail={setSelectedForDetail}
        setSelectedForEdit={setSelectedForEdit}
        handleStateChangeSemanaActual={handleStateChangeSemanaActual}
        isSuperiorRole={isSuperiorRole}
      />

      {/* Modales */}
      <DetalleSeguimientoModal
        registro={selectedForDetail}
        isOpen={!!selectedForDetail}
        onClose={() => setSelectedForDetail(null)}
        onRefresh={(semanaKey, nuevoEstado) => {
          if (!selectedForDetail) return;

          setRegistrosSeguimiento((prev: SeguimientoPagoRecord[]) => prev.map((row: SeguimientoPagoRecord) => {
            if (row.id === selectedForDetail.id) {
              let nuevosEstados: Record<string, EstadoCuota> = { ...(row.estados_semanales || {}) };
              if (nuevoEstado === 'No Verificable') {
                const plazosCount = Math.max(row.plazos || 0, Object.keys(nuevosEstados).length, 1);
                for (let i = 1; i <= plazosCount; i++) {
                  nuevosEstados[`semana_${i}`] = 'No Verificable';
                }
                Object.keys(nuevosEstados).forEach(k => {
                  nuevosEstados[k] = 'No Verificable';
                });
              } else {
                nuevosEstados[semanaKey] = nuevoEstado;
              }

              const updated = {
                ...row,
                estados_semanales: nuevosEstados
              };
              setSelectedForDetail(updated);
              return updated;
            }
            return row;
          }));
        }}
      />

      <EditSeguimientoModal
        registro={selectedForEdit}
        isOpen={!!selectedForEdit}
        onClose={() => setSelectedForEdit(null)}
        onRefresh={handleRefresh}
      />
    </div>
  );
}
