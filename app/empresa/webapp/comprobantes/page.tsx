// ─── React y Next.js ───────────────────────────────────────────────────────
import React from "react";
import Link from "next/link";

// ─── Utilidades locales y globales ─────────────────────────────────────────
import { createClient } from "@/utils/supabase/server";
import { getUserProfile, isAllowed } from "@/utils/auth-check";

// ─── Componentes y Server Actions locales ──────────────────────────────────
import AccessDenied from "@/components/empresa/AccessDenied";
import ComprobantesClientPage from "@/components/empresa/ComprobantesClientPage";
import { getComprobantes } from "./comprobantes-actions";

// ─── Tipos e interfaces ───────────────────────────────────────────────────
import type { ComprobanteRecord } from "./comprobantes-actions";

export const revalidate = 0;

const styles = {
  container: "max-w-6xl mx-auto space-y-8",
  header: "flex items-center justify-between",
  title: "text-xl md:text-3xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent",
  btnHome: "flex items-center justify-center px-4 py-2 bg-slate-800 text-slate-400 border border-slate-700 rounded-xl hover:bg-slate-700 hover:text-white transition-all cursor-pointer",
};

interface PerfilRawItem {
  id: string;
  username: string | null;
  role: string | null;
}

interface ZonaRepartoRawItem {
  id: string;
  repartidores: {
    id: string;
    nombre: string | null;
    activo: boolean | null;
    perfil_id: string | null;
  } | null;
}

const capitalize = (strToCapitalize: string) => strToCapitalize.charAt(0).toUpperCase() + strToCapitalize.slice(1);

export default async function ComprobantesPage() {
  const { role: userRole } = await getUserProfile();

  // 1. Control de acceso a la sección
  if (!isAllowed(userRole, ["Developer", "Admin", "Supervisor", "Repartidor", "Cambaceador", "CambaCloser"])) {
    return <AccessDenied role={userRole} sectionName="Comprobantes" />;
  }

  const supabase = await createClient();

  // 2. Obtener lista de Vendedores (todos los roles registrados)
  const { data: vendedoresRaw } = await supabase
    .from("perfiles")
    .select("id, username, role")
    .order("username", { ascending: true });

  // 3. Obtener catálogo de productos y stock (misma consulta que ventas/cambaceo)
  const { data: productos } = await supabase
    .from("productos")
    .select("id, marca, modelo, color, almacenamiento, ram")
    .order('marca', { ascending: true });

  const { data: stockItems } = await supabase
    .from("stock")
    .select("producto_id, estado, zona, imei");

  // 4. Obtener lista de repartidores/ubicaciones asociados al formulario de cambaceo
  const { data: zonasRepartoRaw } = await supabase
    .from("zonas_reparto")
    .select(`
      id,
      repartidores (
        id,
        nombre,
        activo,
        perfil_id
      )
    `);

  const uniqueRepartidoresMap = new Map<string, string>();
  ((zonasRepartoRaw as unknown as ZonaRepartoRawItem[]) || []).forEach((zonaReparto) => {
    if (zonaReparto.repartidores && zonaReparto.repartidores.activo && zonaReparto.repartidores.nombre) {
      const nombreNorm = zonaReparto.repartidores.nombre.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      if (
        // Filtros para agregar al select repartidores y ubicaciones especificas
        nombreNorm.includes("repartidor") ||   
        nombreNorm.includes("socio") ||
        nombreNorm.includes("local") ||
        nombreNorm.includes("cambaceo") ||
        nombreNorm.split(/\s+/).includes("ct")
      ) {
        uniqueRepartidoresMap.set(zonaReparto.repartidores.id, zonaReparto.repartidores.nombre);
      }
    }
  });

  // 4. Obtener registros históricos si corresponde a roles superiores
  const showTable = isAllowed(userRole, ["Admin", "Supervisor", "Developer"]);
  let comprobantesList: ComprobanteRecord[] = [];

  if (showTable) {
    const comprobantesResponse = await getComprobantes();
    if (comprobantesResponse.success && comprobantesResponse.data) {
      comprobantesList = comprobantesResponse.data;
    }
  }

  const vendedoresMap = new Map<string, { id: string; display: string }>();

  ((vendedoresRaw as unknown as PerfilRawItem[]) || []).forEach((vendedorPerfil) => {
    vendedoresMap.set(vendedorPerfil.id, {
      id: vendedorPerfil.id,
      display: `${vendedorPerfil.role || "Sin rol"}: ${vendedorPerfil.username ? capitalize(vendedorPerfil.username) : "Sin nombre"}`
    });
  });

  // Agregar vendedores históricos que ya no tienen cuenta activa en perfiles
  comprobantesList.forEach((c) => {
    if (!c.vendedor && c.vendedor_nombre) {
      const key = `hist_${c.vendedor_nombre.toLowerCase()}`;
      if (!vendedoresMap.has(key)) {
        vendedoresMap.set(key, {
          id: key,
          display: `Ex-Empleado: ${capitalize(c.vendedor_nombre)}`
        });
      }
    }
  });

  const vendedores = Array.from(vendedoresMap.values());

  // Agregar repartidores históricos que ya no están activos
  comprobantesList.forEach((c) => {
    if (!c.repartidor && c.repartidor_nombre) {
      const key = `hist_${c.repartidor_nombre.toLowerCase()}`;
      if (!uniqueRepartidoresMap.has(key)) {
        uniqueRepartidoresMap.set(key, c.repartidor_nombre);
      }
    }
  });

  const repartidores = Array.from(uniqueRepartidoresMap.entries())
    .map(([repId, nombre]) => ({
      id: repId, // Usamos directamente el ID original o clave histórica
      repartidorId: repId,
      display: nombre
    }))
    .sort((repartidorA, repartidorB) => repartidorA.display.localeCompare(repartidorB.display));

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h2 className={styles.title}>Comprobantes</h2>
        <Link href="/empresa/webapp" className={styles.btnHome} title="Volver al Inicio">
          <span className="material-symbols-outlined text-xl">home</span>
        </Link>
      </header>

      <ComprobantesClientPage
        vendedores={vendedores}
        repartidores={repartidores}
        productos={productos || []}
        stockItems={stockItems || []}
        comprobantesList={comprobantesList}
        showTable={showTable}
      />
    </div>
  );
}
