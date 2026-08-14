import React from "react";
import Link from "next/link";
import { getUserProfile, isAllowed } from "@/utils/auth-check";
import AccessDenied from "@/components/empresa/AccessDenied";
import { createClient } from "@/utils/supabase/server";
import { getVendedores, getDistinctBrands } from "@/app/empresa/webapp/stock/stock-actions";
import { fetchAllFromTable } from "@/utils/supabase/pagination";
import StockClientView from "@/components/empresa/StockClientView";

export const revalidate = 0;

const styles = {
  container: "max-w-6xl mx-auto space-y-8 animate-in fade-in duration-700",
  header: "flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6",
  titleGroup: "space-y-1",
  title: "text-2xl md:text-3xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent",
  actions: "flex items-center justify-center md:justify-end gap-4 md:gap-3",
  btnPrimary: "flex items-center justify-center gap-1.5 md:gap-2 px-3 md:px-5 py-2.5 bg-secondary text-slate-950 font-bold rounded-xl hover:bg-secondary/90 border border-transparent transition-all text-xs md:text-sm cursor-pointer whitespace-nowrap",
  btnOutline: "flex items-center justify-center gap-1.5 md:gap-2 px-3 md:px-5 py-2.5 bg-slate-800 text-slate-200 border border-slate-700 rounded-xl hover:bg-slate-700 transition-all text-xs md:text-sm cursor-pointer whitespace-nowrap",
  btnHome: "flex items-center justify-center px-3 md:px-4 py-2.5 bg-slate-800 text-slate-400 border border-slate-700 rounded-xl hover:bg-slate-700 hover:text-white transition-all cursor-pointer",
};

export default async function StockPage() {
  const { role: userRole } = await getUserProfile();
  const canEdit = isAllowed(userRole, ["Admin", "Supervisor", "Developer"]);

  if (!isAllowed(userRole, ["Admin", "Supervisor", "Closer", "Cambaceador", "Repartidor", "Developer", "CambaCloser"])) {
    return <AccessDenied role={userRole} sectionName="Stock de Ventas" />;
  }

  const supabase = await createClient();
  const vendedores = await getVendedores();
  const marcas = await getDistinctBrands();

  // Obtenemos los repartidores registrados para el selector de ubicación física (repartidor)
  const { data: repartidoresRaw } = await supabase
    .from("repartidores")
    .select("id, nombre, activo")
    .order("nombre", { ascending: true });

  const repartidores = repartidoresRaw || [];

  // Definir estados disponibles según el rol (excluyendo 'Vendido' ya que las unidades vendidas se mueven al histórico)
  const estados = ["Disponible", "A consultar", "En envío"];

  const unidades = await fetchAllFromTable(
    supabase,
    "stock",
    `
      imei,
      zona,
      estado,
      fecha_ingreso,
      fecha_en_envio,
      productos!inner (
        marca,
        modelo,
        color,
        almacenamiento,
        ram
      )
    `,
    {
      orderColumn: "fecha_ingreso",
      ascending: false
    }
  );

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.titleGroup}>
          <h1 className={styles.title}>Stock Disponible</h1>
          <p className="text-slate-500 text-sm">Listado detallado de unidades disponibles</p>
        </div>

        <div className={styles.actions}>
          {canEdit && (
            <>
              <Link href="/empresa/webapp/stock/productos" className={styles.btnPrimary} title="Catálogo de Productos">
                <span className="material-symbols-outlined text-lg">smartphone</span>
                Productos
              </Link>
              <Link href="/empresa/webapp/stock/cargar" className={styles.btnOutline} title="Cargar nuevo Stock">
                <span className="material-symbols-outlined text-lg">inventory_2</span>
                Stock
              </Link>
            </>
          )}
          <Link href="/empresa/webapp" className={styles.btnHome} title="Volver al Inicio">
            <span className="material-symbols-outlined text-xl">home</span>
          </Link>
        </div>
      </header>

      <StockClientView
        unidades={unidades || []}
        marcas={marcas}
        repartidores={repartidores}
        estados={estados}
        canEdit={canEdit}
        vendedores={vendedores}
      />
    </div>
  );
}
