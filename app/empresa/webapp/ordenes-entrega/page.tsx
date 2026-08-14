import React from "react";
import Link from "next/link";
import { getUserProfile, isAllowed } from "@/utils/auth-check";
import AccessDenied from "@/components/empresa/AccessDenied";
import OrdenesEntregaForm from "@/components/empresa/OrdenesEntregaForm";
import { createClient } from "@/utils/supabase/server";

import { fetchAllFromTable } from "@/utils/supabase/pagination";

export const revalidate = 0;

const styles = {
  container: "max-w-4xl mx-auto space-y-8",
  header: "flex items-center justify-between",
  title: "text-xl md:text-3xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent",
  btnHome: "flex items-center justify-center px-4 py-2 bg-slate-800 text-slate-400 border border-slate-700 rounded-xl hover:bg-slate-700 hover:text-white transition-all cursor-pointer",
};

export default async function OrdenesEntregaPage() {
  const { role: userRole } = await getUserProfile();

  if (!isAllowed(userRole, ["Admin", "Closer", "Cambaceador", "Supervisor", "Developer", "CambaCloser"])) {
    return <AccessDenied role={userRole} sectionName="Orden de Entrega" />;
  }

  const supabase = await createClient();

  // 1. Obtenemos todos los productos del catálogo
  const { data: productos } = await supabase
    .from("productos")
    .select("id, marca, modelo, color, almacenamiento, ram")
    .order('marca', { ascending: true });

  // 2. Obtenemos el stock actual para contar disponibilidades, ubicación e IMEI
  const queryStock = supabase
    .from("stock")
    .select("producto_id, estado, zona, imei");

  if (userRole === "Closer" || userRole === "Cambaceador" || userRole === "CambaCloser") {
    queryStock.neq("estado", "En envío");
  }

  const { data: stockItems } = await queryStock;

  // 3. Obtenemos los costos de productos por proveedor
  const { data: costos } = await supabase
    .from("producto_costos_proveedores")
    .select("producto_id, costo");

  // 4. Obtenemos las configuraciones de enganche
  const { data: configEnganches } = await supabase
    .from("configuracion_enganche")
    .select("cliente_historial, porcentajes");

  // 5. Obtenemos las zonas de reparto con sus repartidores asociados
  const { data: zonasRepartoRaw } = await supabase
    .from("zonas_reparto")
    .select(`
      id,
      nombre_zona,
      repartidor_id,
      repartidores (
        id,
        nombre,
        activo,
        zona_horaria
      )
    `)
    .order("nombre_zona", { ascending: true });

  interface ZonaRepartoRaw {
    id: string;
    nombre_zona: string;
    repartidor_id: string;
    repartidores: {
      id: string;
      nombre: string;
      activo: boolean;
      zona_horaria?: string;
    } | null;
  }

  // Filtramos para conservar solo zonas con repartidores activos
  const zonasReparto = ((zonasRepartoRaw as unknown as ZonaRepartoRaw[]) || [])
    .filter((zonaInfo) => zonaInfo.repartidores && zonaInfo.repartidores.activo)
    .map((zonaInfo) => ({
      id: zonaInfo.id,
      nombre_zona: zonaInfo.nombre_zona,
      repartidor_id: zonaInfo.repartidor_id,
      repartidor_nombre: zonaInfo.repartidores!.nombre,
      repartidor_activo: zonaInfo.repartidores!.activo,
      repartidor_zona_horaria: zonaInfo.repartidores!.zona_horaria || "America/Mexico_City"
    }));

  // 6. Obtenemos repartos existentes desde la fecha actual para bloquear horarios ocupados
  const todayStr = new Date().toISOString().split("T")[0];
  const repartosExistentesRaw = await fetchAllFromTable<RepartoRow>(
    supabase,
    "repartos",
    "id, repartidor_id, fecha_reparto, horario",
    {
      filterFn: (q) => q.gte("fecha_reparto", todayStr),
      orderColumn: "fecha_reparto",
      ascending: true
    }
  );

  interface RepartoRow {
    id: string;
    repartidor_id: string;
    fecha_reparto: string;
    horario: string;
  }

  const repartosExistentes = (repartosExistentesRaw || []).map((r) => ({
    id: r.id,
    repartidor_id: r.repartidor_id,
    fecha_reparto: r.fecha_reparto,
    horario: r.horario
  }));

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h2 className={styles.title}>Orden de Entrega</h2>
        <Link href="/empresa/webapp" className={styles.btnHome} title="Volver al Inicio">
          <span className="material-symbols-outlined text-xl">home</span>
        </Link>
      </header>

      {/* Pasamos los datos al formulario */}
      <OrdenesEntregaForm
        productos={productos || []}
        zonasReparto={zonasReparto}
        stockItems={stockItems || []}
        costos={costos || []}
        configEnganches={configEnganches || []}
        repartosExistentes={repartosExistentes}
      />
    </div>
  );
}
