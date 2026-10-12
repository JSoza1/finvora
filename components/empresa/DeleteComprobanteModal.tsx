'use client';

import React, { useState } from "react";
import { eliminarComprobante } from "@/app/empresa/webapp/comprobantes/comprobantes-actions";
import type { ComprobanteRecord } from "@/app/empresa/webapp/comprobantes/comprobantes-actions";
import { formatCurrency } from "./comprobantes-types";

interface DeleteComprobanteModalProps {
  comprobante: ComprobanteRecord;
  onClose: () => void;
  onDeleted: (deletedId: string) => void;
  onStatusChange: (operationStatus: { type: 'success' | 'error'; message: string }) => void;
}

export default function DeleteComprobanteModal({
  comprobante,
  onClose,
  onDeleted,
  onStatusChange
}: DeleteComprobanteModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);

    const deleteResult = await eliminarComprobante(comprobante.id);
    if (deleteResult.success) {
      onStatusChange({ type: 'success', message: '¡Comprobante eliminado exitosamente!' });
      onDeleted(comprobante.id);
    } else {
      onStatusChange({ type: 'error', message: deleteResult.error || 'Error al eliminar el comprobante.' });
    }

    setIsDeleting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop con Blur y oscurecimiento suave */}
      <div
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity animate-in fade-in duration-300"
        onClick={onClose}
      />
      {/* Modal Content */}
      <div className="relative bg-slate-900 border border-slate-800 p-6 md:p-8 rounded-3xl max-w-md w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200 text-center space-y-6">
        <div className="mx-auto w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
          <span className="material-symbols-outlined text-2xl">warning</span>
        </div>

        <div className="space-y-2">
          <h3 className="text-lg font-bold text-white">¿Eliminar Comprobante?</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            ¿Estás seguro de que deseas eliminar este comprobante?<br />
            Cliente: <strong className="text-white">{comprobante.nombre_cliente}</strong><br />
            {comprobante.comentarios && <>Comentarios: <span className="text-slate-300 italic">&quot;{comprobante.comentarios}&quot;</span><br /></>}
            Precio Compra: <strong className="text-slate-300">{formatCurrency(comprobante.precio_compra)}</strong> |
            Pago Inicial: <strong className="text-slate-300">{formatCurrency(comprobante.pago_inicial)}</strong> |
            Pago Recibido: <strong className="text-secondary">{formatCurrency(comprobante.pago_recibido)}</strong><br />
            Vendedor: <strong className="text-white">{comprobante.vendedor?.username || comprobante.vendedor_nombre || "Desconocido"}</strong><br />
            Repartidor/Ubicación: <strong className="text-white">{comprobante.repartidor?.nombre || comprobante.repartidor_nombre || "Desconocido"}</strong><br />
            {comprobante.celular && <>Equipo: <strong className="text-white">{comprobante.celular}</strong> {comprobante.color_celular && <span className="text-slate-500">({comprobante.color_celular})</span>}<br /></>}
            {comprobante.imei && <>IMEI: <strong className="text-secondary">{comprobante.imei}</strong><br /></>}
            Esta acción es irreversible, eliminará el registro de la base de datos y el archivo correspondiente de storage.
          </p>
        </div>

        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="flex-1 py-3 bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold rounded-xl transition-all text-xs cursor-pointer border border-slate-700 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl transition-all text-xs cursor-pointer shadow-[0_0_15px_rgba(239,68,68,0.2)] disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isDeleting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Eliminando...
              </>
            ) : (
              "Eliminar"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
