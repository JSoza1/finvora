'use client';

import React, { useState, useMemo, useEffect } from 'react';
import type { BlacklistRecord } from '@/types/blacklist';
import { BlacklistKpis } from './BlacklistKpis';
import { BlacklistFilters } from './BlacklistFilters';
import { BlacklistTable } from './BlacklistTable';
import { BlacklistDetailModal } from './BlacklistDetailModal';
import { BlacklistCreateModal } from './BlacklistCreateModal';
import { BlacklistEditModal } from './BlacklistEditModal';
import { DeleteBlacklistModal } from './DeleteBlacklistModal';

interface BlacklistClientPageProps {
  initialData: BlacklistRecord[];
  zonasDisponibles: string[];
}

const ITEMS_PER_PAGE = 15;

export default function BlacklistClientPage({
  initialData,
  zonasDisponibles,
}: BlacklistClientPageProps) {
  const [records, setRecords] = useState<BlacklistRecord[]>(initialData);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedZona, setSelectedZona] = useState('todas');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Estados de Modales
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [detailRecord, setDetailRecord] = useState<BlacklistRecord | null>(null);
  const [editRecord, setEditRecord] = useState<BlacklistRecord | null>(null);
  const [deleteRecord, setDeleteRecord] = useState<BlacklistRecord | null>(null);

  // Notificación tipo toast ligera
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  /**
   * Bloqueo de scroll en página de fondo cuando cualquier modal está visible.
   * Se utiliza un listener 'touchmove' con `{ passive: false }` para interceptar
   * el rebote (rubber-banding) en iOS Safari/WebViews, permitiendo scroll exclusivamente
   * dentro de contenedores internos marcados con '.overflow-y-auto' o 'textarea'.
   */
  const isAnyModalOpen = isCreateOpen || Boolean(detailRecord) || Boolean(editRecord) || Boolean(deleteRecord);

  useEffect(() => {
    if (!isAnyModalOpen) {
      document.body.style.overflow = '';
      return;
    }

    // 1. Bloqueo de overflow para navegadores de escritorio
    document.body.style.overflow = 'hidden';

    // 2. Interceptor de gestos táctiles en dispositivos móviles
    const handleTouchMove = (touchEvent: TouchEvent) => {
      const target = touchEvent.target as HTMLElement | null;
      const isScrollable = target?.closest('.overflow-y-auto, textarea');
      if (!isScrollable) {
        if (touchEvent.cancelable) {
          touchEvent.preventDefault();
        }
      }
    };

    document.addEventListener('touchmove', handleTouchMove, { passive: false });

    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('touchmove', handleTouchMove);
    };
  }, [isAnyModalOpen]);

  // Restablecer a la primera página cuando cambie cualquier criterio de filtro
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedZona, dateFrom, dateTo]);

  /**
   * Opciones de zonas unificadas:
   * Combina las zonas activas del catálogo de base de datos con cualquier zona histórica
   * presente en los registros cargados, asegurando que ningún registro quede huérfano de filtro.
   */
  const zonasOptions = useMemo(() => {
    const set = new Set<string>(zonasDisponibles);
    records.forEach((record) => {
      if (record.zona) set.add(record.zona);
    });
    return Array.from(set).sort();
  }, [zonasDisponibles, records]);

  /**
   * Filtrado reactivo en memoria:
   * Aplica 3 filtros combinados: texto libre (Nombre, CURP, Motivo), selección de zona, y rango de fechas.
   */
  const filteredRecords = useMemo(() => {
    return records.filter((record) => {
      // 1. Buscador global (Nombre, CURP, Motivo)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchNombre = record.nombre?.toLowerCase().includes(query);
        const matchCurp = record.curp?.toLowerCase().includes(query);
        const matchMotivo = record.motivo?.toLowerCase().includes(query);
        if (!matchNombre && !matchCurp && !matchMotivo) return false;
      }

      // 2. Filtro por Zona
      if (selectedZona !== 'todas') {
        if (record.zona !== selectedZona) return false;
      }

      // 3. Rango de Fechas (comparación lexicográfica YYYY-MM-DD)
      if (dateFrom) {
        const recordDate = record.created_at?.split('T')[0];
        if (recordDate && recordDate < dateFrom) return false;
      }
      if (dateTo) {
        const recordDate = record.created_at?.split('T')[0];
        if (recordDate && recordDate > dateTo) return false;
      }

      return true;
    });
  }, [records, searchQuery, selectedZona, dateFrom, dateTo]);

  /**
   * Agregación de métricas para los 4 KPIs superiores:
   * - Total histórico de bloqueados.
   * - Zona de reparto con mayor incidencia de bloqueos.
   * - Total de clientes bloqueados dentro del mes calendario en curso.
   */
  const stats = useMemo(() => {
    const total = records.length;

    // Calcular zona con mayor frecuencia de bloqueos
    const zonaCounts: Record<string, number> = {};
    records.forEach((record) => {
      if (record.zona) {
        zonaCounts[record.zona] = (zonaCounts[record.zona] || 0) + 1;
      }
    });

    let topZona = 'Sin datos';
    let topZonaCount = 0;
    Object.entries(zonaCounts).forEach(([zonaName, count]) => {
      if (count > topZonaCount) {
        topZona = zonaName;
        topZonaCount = count;
      }
    });

    // Comparar contra el mes y año en curso (calendario local)
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0 a 11

    const bloqueadosEsteMes = records.filter((record) => {
      if (!record.created_at) return false;
      const recordDate = new Date(record.created_at);
      return recordDate.getFullYear() === currentYear && recordDate.getMonth() === currentMonth;
    }).length;

    return {
      total,
      topZona,
      topZonaCount,
      bloqueadosEsteMes,
    };
  }, [records]);

  // Cálculo de paginación
  const totalPages = Math.ceil(filteredRecords.length / ITEMS_PER_PAGE) || 1;
  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredRecords.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredRecords, currentPage]);

  // Manejadores optimistas de actualización de estado local
  const handleCreated = (newRecord: BlacklistRecord) => {
    setRecords((previousRecords) => [newRecord, ...previousRecords]);
    showToast('Cliente agregado a la Black List.');
  };

  const handleUpdated = (updatedRecord: BlacklistRecord) => {
    setRecords((previousRecords) =>
      previousRecords.map((existingRecord) =>
        existingRecord.id === updatedRecord.id ? updatedRecord : existingRecord
      )
    );
    showToast('Expediente actualizado correctamente.');
  };

  const handleDeleted = (id: string) => {
    setRecords((previousRecords) =>
      previousRecords.filter((existingRecord) => existingRecord.id !== id)
    );
    showToast('Cliente eliminado de la Black List.');
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedZona('todas');
    setDateFrom('');
    setDateTo('');
  };

  return (
    <div className="space-y-6">
      {/* Toast flotante */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-slate-700 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 animate-in slide-in-from-bottom duration-200 text-xs sm:text-sm">
          <span className="material-symbols-outlined text-emerald-400 text-lg">check_circle</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. KPIs Superiores (3 métricas + 1 botón de Agregar con el mismo tamaño) */}
      <BlacklistKpis
        stats={stats}
        onOpenCreate={() => setIsCreateOpen(true)}
      />

      {/* 2. Barra de Filtros */}
      <BlacklistFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedZona={selectedZona}
        onZonaChange={setSelectedZona}
        zonasOptions={zonasOptions}
        dateFrom={dateFrom}
        onDateFromChange={setDateFrom}
        dateTo={dateTo}
        onDateToChange={setDateTo}
        onResetFilters={handleResetFilters}
        filteredData={filteredRecords}
      />

      {/* 3. Tabla Principal con motivo truncado y acciones */}
      <BlacklistTable
        records={paginatedRecords}
        onView={(record) => setDetailRecord(record)}
        onEdit={(record) => setEditRecord(record)}
        onDelete={(record) => setDeleteRecord(record)}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />

      {/* 4. Modales */}
      <BlacklistCreateModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        zonasOptions={zonasOptions}
        onCreated={handleCreated}
      />

      <BlacklistDetailModal
        record={detailRecord}
        isOpen={Boolean(detailRecord)}
        onClose={() => setDetailRecord(null)}
      />

      <BlacklistEditModal
        record={editRecord}
        isOpen={Boolean(editRecord)}
        onClose={() => setEditRecord(null)}
        zonasOptions={zonasOptions}
        onUpdated={handleUpdated}
      />

      <DeleteBlacklistModal
        record={deleteRecord}
        isOpen={Boolean(deleteRecord)}
        onClose={() => setDeleteRecord(null)}
        onDeleted={handleDeleted}
      />
    </div>
  );
}
