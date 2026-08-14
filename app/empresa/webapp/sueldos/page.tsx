import React from "react";
import { getUserProfile } from "@/utils/auth-check";
import AccessDenied from "@/components/empresa/AccessDenied";
import { createClient } from "@/utils/supabase/server";
import { fetchAllFromTable } from "@/utils/supabase/pagination";
import CalculadoraSueldosClientPage from "@/components/empresa/CalculadoraSueldosClientPage";
import type { ComprobanteRecord } from "@/app/empresa/webapp/comprobantes/comprobantes-actions";

export const revalidate = 0;

export interface MappedUser {
  id: string;
  username: string;
  role: string;
  repartidorId: string | null;
}

interface PerfilRow {
  id: string;
  username: string | null;
  role: string;
}

interface RepartidorRow {
  id: string;
  perfil_id: string;
}

interface StockVentaRow {
  imei: string | null;
  producto_id: string;
}

interface CatalogProductRow {
  id: string;
  marca: string;
  modelo: string;
  color: string;
  almacenamiento: string;
}

interface CostoProveedorRow {
  producto_id: string;
  costo: number | string;
  proveedor: string;
}

interface UserRelation {
  id: string;
  username: string | null;
  role: string;
}

interface RepartidorRelation {
  id: string;
  nombre: string;
  perfil_id: string;
}

interface RawComprobante {
  id: string;
  nombre_cliente: string;
  comentarios: string | null;
  precio_compra: number;
  pago_inicial: number;
  pago_recibido: number;
  celular: string | null;
  color_celular: string | null;
  imei: string | null;
  comprobante_url: string | null;
  created_at: string;
  vendedor: UserRelation | UserRelation[] | null;
  repartidor: RepartidorRelation | RepartidorRelation[] | null;
  creador: UserRelation | UserRelation[] | null;
}

export default async function SueldosPage() {
  const { id: currentUserId, role: userRole } = await getUserProfile();

  // 1. Control de acceso: Solo Admin y Developer
  const isHighPrivilege = userRole === "Admin" || userRole === "Developer";
  if (!currentUserId || !isHighPrivilege) {
    return <AccessDenied role={userRole} sectionName="Calculadora de sueldos" />;
  }

  const supabase = await createClient();

  // 2. Obtener lista de perfiles
  const { data: perfilesData, error: perfilesError } = await supabase
    .from("perfiles")
    .select("id, username, role")
    .neq("role", "Sin rol")
    .order("username", { ascending: true });

  if (perfilesError) {
    console.error("Error al obtener perfiles para calculadora:", perfilesError);
  }

  // 3. Obtener lista de repartidores
  const { data: repartidoresData, error: repartidoresError } = await supabase
    .from("repartidores")
    .select("id, perfil_id");

  if (repartidoresError) {
    console.error("Error al obtener repartidores para calculadora:", repartidoresError);
  }

  // Mapear perfiles con su repartidor correspondiente si existe
  const usersList: MappedUser[] = ((perfilesData || []) as PerfilRow[]).map((profile) => {
    const matchedRep = ((repartidoresData || []) as RepartidorRow[]).find(
      (repartidor) => repartidor.perfil_id === profile.id
    );
    return {
      id: profile.id,
      username: profile.username || "Usuario sin nombre",
      role: profile.role,
      repartidorId: matchedRep?.id || null,
    };
  });

  // 4. Obtener registros históricos de los últimos 2 meses
  const twoMonthsAgo = new Date();
  twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);

  const [
    comprobantesRaw,
    stockItems,
    ventasItems,
    { data: catalogResult },
    { data: costosResult },
  ] = await Promise.all([
    fetchAllFromTable<RawComprobante>(
      supabase,
      "comprobantes",
      `
        id,
        nombre_cliente,
        comentarios,
        precio_compra,
        pago_inicial,
        pago_recibido,
        celular,
        color_celular,
        imei,
        comprobante_url,
        created_at,
        vendedor:perfiles!vendedor_id (id, username, role),
        repartidor:repartidores!repartidor_id (id, nombre, perfil_id),
        creador:perfiles!creado_por (id, username, role)
      `,
      {
        filterFn: (q) => q.gte("created_at", twoMonthsAgo.toISOString()),
        orderColumn: "created_at",
        ascending: false,
      }
    ),
    fetchAllFromTable<StockVentaRow>(supabase, "stock", "imei, producto_id"),
    fetchAllFromTable<StockVentaRow>(supabase, "ventas", "imei, producto_id"),
    supabase.from("productos").select("id, marca, modelo, color, almacenamiento"),
    supabase.from("producto_costos_proveedores").select("producto_id, costo, proveedor"),
  ]);

  const catalogProducts = (catalogResult || []) as CatalogProductRow[];
  const costosProveedores = (costosResult || []) as CostoProveedorRow[];

  // Mapeo IMEI ➔ producto_id
  const imeiToProductMap = new Map<string, string>();
  stockItems.forEach((item) => {
    if (item.imei) imeiToProductMap.set(item.imei.trim(), item.producto_id);
  });
  ventasItems.forEach((item) => {
    if (item.imei) imeiToProductMap.set(item.imei.trim(), item.producto_id);
  });

  // Mapeo producto_id ➔ costo
  const productToCostMap = new Map<string, number>();
  costosProveedores.forEach((item) => {
    productToCostMap.set(item.producto_id, Number(item.costo) || 0);
  });

  // Formatear datos para el cliente resolviendo costos equipo
  const mapUserRelation = (user: UserRelation | UserRelation[] | null) => {
    if (!user) return null;
    const singleUser = Array.isArray(user) ? user[0] : user;
    if (!singleUser) return null;
    return {
      id: singleUser.id,
      username: singleUser.username || "Usuario sin nombre",
      role: singleUser.role,
    };
  };

  const mapRepartidorRelation = (repartidor: RepartidorRelation | RepartidorRelation[] | null) => {
    if (!repartidor) return null;
    const singleRep = Array.isArray(repartidor) ? repartidor[0] : repartidor;
    if (!singleRep) return null;
    return {
      id: singleRep.id,
      nombre: singleRep.nombre || "Sin nombre",
      perfil_id: singleRep.perfil_id,
    };
  };

  const comprobantesList: ComprobanteRecord[] = comprobantesRaw.map((comprobanteRaw) => {
    const imeiTrimmed = comprobanteRaw.imei ? comprobanteRaw.imei.trim() : "";
    let matchedProductId = imeiTrimmed ? imeiToProductMap.get(imeiTrimmed) : undefined;

    // Fallback: Si no hay cruce de IMEI, intentamos por modelo (celular) y color
    if (!matchedProductId && comprobanteRaw.celular) {
      const celLower = comprobanteRaw.celular.toLowerCase().replace(/\s+/g, "");
      const colorLower = comprobanteRaw.color_celular
        ? comprobanteRaw.color_celular.toLowerCase().replace(/\s+/g, "")
        : "";

      const foundProduct = catalogProducts.find((product) => {
        const prodModelLower = product.modelo.toLowerCase().replace(/\s+/g, "");
        const prodColorLower = product.color.toLowerCase().replace(/\s+/g, "");
        return (
          (celLower.includes(prodModelLower) || prodModelLower.includes(celLower)) &&
          (!colorLower || prodColorLower === colorLower)
        );
      });

      if (foundProduct) {
        matchedProductId = foundProduct.id;
      }
    }

    const resolvedCost = matchedProductId ? productToCostMap.get(matchedProductId) : undefined;

    return {
      id: comprobanteRaw.id,
      nombre_cliente: comprobanteRaw.nombre_cliente,
      comentarios: comprobanteRaw.comentarios || null,
      precio_compra: Number(comprobanteRaw.precio_compra),
      pago_inicial: Number(comprobanteRaw.pago_inicial),
      pago_recibido: Number(comprobanteRaw.pago_recibido),
      celular: comprobanteRaw.celular || null,
      color_celular: comprobanteRaw.color_celular || null,
      imei: comprobanteRaw.imei || null,
      comprobante_url: comprobanteRaw.comprobante_url || "",
      created_at: comprobanteRaw.created_at,
      costo_equipo: resolvedCost || 0,
      vendedor: mapUserRelation(comprobanteRaw.vendedor),
      repartidor: mapRepartidorRelation(comprobanteRaw.repartidor),
      creador: mapUserRelation(comprobanteRaw.creador),
    };
  });

  return (
    <CalculadoraSueldosClientPage
      comprobantesList={comprobantesList}
      usersList={usersList}
    />
  );
}
