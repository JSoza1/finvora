'use client';

import React, { useState, useMemo, useEffect } from "react";
import type { ComprobanteRecord } from "@/app/empresa/webapp/comprobantes/comprobantes-actions";
import DownloadExcelButton from "@/components/empresa/DownloadExcelButton";
import JSZip from "jszip";
import FiltrosHistorial from "./FiltrosHistorial";
import { styles, formatTijuanaDate } from "./comprobantes-types";
import type { OptionItem } from "./comprobantes-types";

interface ComprobantesHistorialProps {
  comprobantes: ComprobanteRecord[];
  vendedores: OptionItem[];
  repartidores: OptionItem[];
  onDeleteRequest: (item: ComprobanteRecord) => void;
}

const ITEMS_PER_PAGE = 15;

export default function ComprobantesHistorial({
  comprobantes,
  vendedores,
  repartidores,
  onDeleteRequest
}: ComprobantesHistorialProps) {
  // Estado para los filtros compartidos con el sub-componente modular
  const [filters, setFilters] = useState({
    searchQuery: "",
    dateFrom: "",
    dateTo: "",
    filterVendedores: [] as string[],
    filterRepartidores: [] as string[]
  });

  // Estado de paginación
  const [currentPage, setCurrentPage] = useState(1);

  // Estados para descarga masiva de archivos
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState("");

  // Reset a página 1 si cambian los filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  // Filtrado en memoria por buscador global, rango de fechas, vendedor y repartidor/ubicación
  const filteredList = useMemo(() => {
    return comprobantes.filter((comprobante) => {
      // 1. Buscador global (Cliente, IMEI, TAG, Vendedor, Repartidor)
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase().trim();
        const matchCliente = comprobante.nombre_cliente?.toLowerCase().includes(query);
        const matchImei = comprobante.imei?.toLowerCase().includes(query);
        const matchTag = comprobante.tag?.toLowerCase().includes(query);
        const matchVendedor = (comprobante.vendedor?.username || comprobante.vendedor_nombre)?.toLowerCase().includes(query);
        const matchRepartidor = (comprobante.repartidor?.nombre || comprobante.repartidor_nombre)?.toLowerCase().includes(query);

        if (!matchCliente && !matchImei && !matchTag && !matchVendedor && !matchRepartidor) return false;
      }

      // 2. Filtro de fecha
      const tijuanaDateStr = new Intl.DateTimeFormat('fr-CA', {
        timeZone: 'America/Tijuana',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).format(new Date(comprobante.created_at)); // Retorna "YYYY-MM-DD"

      if (filters.dateFrom && tijuanaDateStr < filters.dateFrom) return false;
      if (filters.dateTo && tijuanaDateStr > filters.dateTo) return false;

      // 3. Filtro de vendedor (soporta selección múltiple y vendedores históricos)
      if (filters.filterVendedores.length > 0) {
        const matchesActive = comprobante.vendedor && filters.filterVendedores.includes(comprobante.vendedor.id);
        const matchesHistorical = comprobante.vendedor_nombre && (
          filters.filterVendedores.includes(`hist_${comprobante.vendedor_nombre.toLowerCase()}`) ||
          filters.filterVendedores.includes(comprobante.vendedor_nombre)
        );
        if (!matchesActive && !matchesHistorical) return false;
      }

      // 4. Filtro de repartidor/ubicación (soporta selección múltiple y repartidores históricos)
      if (filters.filterRepartidores.length > 0) {
        const matchesActive = comprobante.repartidor && filters.filterRepartidores.includes(comprobante.repartidor.id);
        const matchesHistorical = comprobante.repartidor_nombre && (
          filters.filterRepartidores.includes(`hist_${comprobante.repartidor_nombre.toLowerCase()}`) ||
          filters.filterRepartidores.includes(comprobante.repartidor_nombre)
        );
        if (!matchesActive && !matchesHistorical) return false;
      }

      return true;
    });
  }, [comprobantes, filters]);

  // Lógica de Paginación
  const totalPages = Math.max(1, Math.ceil(filteredList.length / ITEMS_PER_PAGE));
  const paginatedList = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredList.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredList, currentPage]);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  /**
   * Descarga masiva de comprobantes filtrados, empaquetados en un archivo ZIP.
   * Procesa cada comprobante de forma secuencial mostrando el progreso en la interfaz.
   */
  const handleDownloadAllFiles = async (): Promise<void> => {
    if (filteredList.length === 0) return;
    setIsDownloading(true);
    const zip = new JSZip();

    for (let index = 0; index < filteredList.length; index++) {
      const comprobante = filteredList[index];
      const comprobanteUrl = comprobante.comprobante_url;
      const fotoClienteUrl = comprobante.foto_cliente_url;
      const fotoPagoAdelantadoUrl = comprobante.foto_pago_adelantado_url;
      setDownloadProgress(`Descargando ${index + 1} de ${filteredList.length}...`);

      const vendorName = comprobante.vendedor?.username || comprobante.vendedor_nombre || 'vendedor';
      const formattedDate = new Intl.DateTimeFormat('es-MX', {
        timeZone: 'America/Tijuana',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      }).format(new Date(comprobante.created_at)).replace(/[/:\s,]/g, '_');

      if (comprobanteUrl) {
        try {
          const response = await fetch(comprobanteUrl);
          const blob = await response.blob();
          const fileExtension = comprobanteUrl.split('.').pop()?.split('?')[0] || 'bin';
          const fileName = `Comprobante_${vendorName}_${formattedDate}.${fileExtension}`;
          zip.file(fileName, blob);
        } catch (error) {
          console.error("Error al agregar archivo al ZIP:", comprobanteUrl, error);
        }
      }

      if (fotoClienteUrl) {
        try {
          const responseFoto = await fetch(fotoClienteUrl);
          const blobFoto = await responseFoto.blob();
          const fileExtensionFoto = fotoClienteUrl.split('.').pop()?.split('?')[0] || 'jpg';
          const fileNameFoto = `FotoCliente_${vendorName}_${formattedDate}.${fileExtensionFoto}`;
          zip.file(fileNameFoto, blobFoto);
        } catch (error) {
          console.error("Error al agregar foto de cliente al ZIP:", fotoClienteUrl, error);
        }
      }

      if (fotoPagoAdelantadoUrl) {
        try {
          const responseFotoAdelantado = await fetch(fotoPagoAdelantadoUrl);
          const blobFotoAdelantado = await responseFotoAdelantado.blob();
          const fileExtensionFoto = fotoPagoAdelantadoUrl.split('.').pop()?.split('?')[0] || 'jpg';
          const fileNameFoto = `PagoAdelantado_${vendorName}_${formattedDate}.${fileExtensionFoto}`;
          zip.file(fileNameFoto, blobFotoAdelantado);
        } catch (error) {
          console.error("Error al agregar foto de pago adelantado al ZIP:", fotoPagoAdelantadoUrl, error);
        }
      }
    }

    setDownloadProgress("Generando archivo ZIP...");
    try {
      const zipContent = await zip.generateAsync({ type: "blob" });
      const blobUrl = URL.createObjectURL(zipContent);

      const downloadAnchor = document.createElement('a');
      downloadAnchor.href = blobUrl;
      downloadAnchor.download = `Comprobantes_Finvora_${new Date().toISOString().split('T')[0]}.zip`;
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      document.body.removeChild(downloadAnchor);
      URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Error al generar o descargar el ZIP:", error);
    }

    setIsDownloading(false);
    setDownloadProgress("");
  };

  return (
    <div className={styles.tableContainer}>
      {/* Header con botón para Excel y descarga masiva */}
      <div className="bg-slate-950 p-6 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6 rounded-t-3xl">
        <div>
          <h3 className="text-lg font-bold text-slate-100">Registro de Comprobantes</h3>
          <p className="text-xs text-slate-400 mt-1">Lista detallada de comprobantes de los últimos 2 meses</p>
        </div>

        <div className="flex flex-wrap justify-center items-center gap-3 self-center">
          <DownloadExcelButton data={filteredList} type="comprobantes" />

          <button
            type="button"
            onClick={handleDownloadAllFiles}
            disabled={isDownloading || filteredList.length === 0}
            className="flex items-center justify-center px-3 md:px-4 py-2 md:py-2.5 bg-secondary text-slate-950 rounded-xl hover:bg-secondary/90 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-secondary/15"
            title={isDownloading ? downloadProgress : `Descargar archivos (${filteredList.length})`}
          >
            {isDownloading ? (
              <span className="animate-spin h-5 w-5 border-2 border-slate-950 border-t-transparent rounded-full" />
            ) : (
              <span className="material-symbols-outlined text-base md:text-xl">download</span>
            )}
          </button>
        </div>
      </div>

      {/* Filtros Modulares */}
      <FiltrosHistorial
        vendedores={vendedores}
        repartidores={repartidores}
        isDownloading={isDownloading}
        downloadProgress={downloadProgress}
        onFilterChange={setFilters}
      />

      <div className={`${styles.tableWrapper} ${totalPages <= 1 ? "rounded-b-3xl" : ""}`}>
        <table className={styles.table}>
          <thead className={styles.thead}>
            <tr>
              <th className={styles.th}>Fecha</th>
              <th className={`${styles.th} min-w-[170px]`}>Cliente</th>
              <th className={`${styles.th} min-w-[190px]`}>Equipo</th>
              <th className="px-4 py-4 text-center text-slate-400 font-semibold uppercase text-xs tracking-wider min-w-[120px]">IMEI</th>
              <th className={styles.th}>Vendedor</th>
              <th className={`${styles.th} min-w-[110px] max-w-[130px] px-2`}>Rep. / Ubi.</th>
              <th className={styles.th}>Comprobante</th>
              <th className={styles.th}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredList.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center text-slate-500 italic">
                  No hay comprobantes que coincidan con los filtros aplicados.
                </td>
              </tr>
            ) : (
              paginatedList.map((comprobante) => (
                <tr key={comprobante.id} className={styles.tr}>
                  <td className={styles.td}>
                    <span className="text-slate-100">{formatTijuanaDate(comprobante.created_at)}</span>
                  </td>
                  <td className={`${styles.td} min-w-[170px]`}>
                    <span className="text-slate-100 font-bold">{comprobante.nombre_cliente}</span>
                  </td>
                  <td className={`${styles.td} min-w-[190px]`}>
                    {comprobante.celular ? (
                      <div className="flex flex-col items-center">
                        <span className="text-slate-100 text-xs font-bold">{comprobante.celular}</span>
                        {comprobante.color_celular && <span className="text-[10px] text-slate-500">{comprobante.color_celular}</span>}
                      </div>
                    ) : (
                      <span className="text-slate-600 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-4 text-center min-w-[120px]">
                    <div className="flex items-center justify-center">
                      {comprobante.imei ? (
                        <span className="font-mono bg-slate-950 px-2.5 py-0.5 rounded-md border border-slate-800 text-secondary text-[11px] font-bold inline-block tracking-tight whitespace-nowrap">
                          {comprobante.imei}
                        </span>
                      ) : (
                        <span className="text-slate-600 text-xs">—</span>
                      )}
                    </div>
                  </td>
                  <td className={styles.td}>
                    {comprobante.vendedor ? (
                      <div className="flex flex-col items-center">
                        <span className="text-slate-100 font-bold">{comprobante.vendedor.username.charAt(0).toUpperCase() + comprobante.vendedor.username.slice(1)}</span>
                        <span className="text-[10px] text-slate-500">{comprobante.vendedor.role}</span>
                      </div>
                    ) : comprobante.vendedor_nombre ? (
                      <div className="flex flex-col items-center">
                        <span className="text-slate-100 font-bold">{comprobante.vendedor_nombre.charAt(0).toUpperCase() + comprobante.vendedor_nombre.slice(1)}</span>
                        <span className="text-[10px] text-slate-500">Ex-Empleado</span>
                      </div>
                    ) : (
                      <span className="text-slate-500">Desconocido</span>
                    )}
                  </td>
                  <td className={`${styles.td} min-w-[110px] max-w-[130px] px-2`}>
                    {comprobante.repartidor ? (
                      <div className="flex flex-col items-center">
                        <span className="text-slate-100 font-bold">{comprobante.repartidor.nombre}</span>
                      </div>
                    ) : comprobante.repartidor_nombre ? (
                      <div className="flex flex-col items-center">
                        <span className="text-slate-100 font-bold">{comprobante.repartidor_nombre}</span>
                      </div>
                    ) : (
                      <span className="text-slate-500">Desconocido</span>
                    )}
                  </td>
                  <td className={styles.td}>
                    <div className="flex items-center justify-center gap-2">
                      <a
                        href={comprobante.comprobante_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.linkBtn}
                        title="Ver comprobante"
                      >
                        <span className="material-symbols-outlined text-lg">open_in_new</span>
                      </a>
                      {comprobante.foto_cliente_url && (
                        <a
                          href={comprobante.foto_cliente_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.linkBtn}
                          title="Ver foto cliente"
                        >
                          <span className="material-symbols-outlined text-lg">open_in_new</span>
                        </a>
                      )}
                      {comprobante.foto_pago_adelantado_url && (
                        <a
                          href={comprobante.foto_pago_adelantado_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.linkBtn}
                          title="Ver pago adelantado"
                        >
                          <span className="material-symbols-outlined text-lg">open_in_new</span>
                        </a>
                      )}
                    </div>
                  </td>
                  <td className={styles.td}>
                    <div className="flex items-center justify-center">
                      <button
                        type="button"
                        onClick={() => onDeleteRequest(comprobante)}
                        className={styles.deleteBtn}
                        title="Eliminar Comprobante"
                      >
                        <span className="material-symbols-outlined text-base">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* PAGINACIÓN */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-slate-800/80 px-6 py-4 bg-slate-950/60 rounded-b-3xl">
          <button
            type="button"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className={`px-3 py-1.5 bg-slate-800 text-slate-200 border border-slate-700 rounded-lg text-xs font-bold transition-all ${
              currentPage === 1
                ? "opacity-30 cursor-not-allowed text-slate-500"
                : "hover:bg-slate-700 hover:text-white cursor-pointer"
            }`}
          >
            Anterior
          </button>
          <span className="text-slate-400 text-xs font-semibold">
            Página {currentPage} de {totalPages}
          </span>
          <button
            type="button"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={`px-3 py-1.5 bg-slate-800 text-slate-200 border border-slate-700 rounded-lg text-xs font-bold transition-all ${
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
