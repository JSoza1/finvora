'use server';

// ─── Next.js y utilidades externas ─────────────────────────────────────────
import { revalidatePath } from "next/cache";

// ─── Utilidades locales ─────────────────────────────────────────────────────
import { createClient } from "@/utils/supabase/server";
import { getUserProfile, isAllowed } from "@/utils/auth-check";
import { registrarVenta } from "@/app/empresa/webapp/stock/stock-actions";
import { fetchAllFromTable } from "@/utils/supabase/pagination";

export interface ComprobanteRecord {
  id: string;
  nombre_cliente: string;
  numero_telefono?: string | null;
  comentarios: string | null;
  precio_compra: number;
  pago_inicial: number;
  pago_recibido: number;
  pago_semanal?: number | null;
  plazos?: string | number | null;
  precio_total?: number | null;
  tag?: string | null;
  celular: string | null;
  color_celular: string | null;
  imei: string | null;
  fecha_proximo_pago?: string | null;
  comprobante_url: string;
  foto_cliente_url?: string | null;
  pago_adelantado?: string | null;
  foto_pago_adelantado_url?: string | null;
  created_at: string;
  costo_equipo?: number;
  vendedor_nombre?: string | null;
  repartidor_nombre?: string | null;
  vendedor: {
    id: string;
    username: string;
    role: string;
  } | null;
  repartidor: {
    id: string;
    nombre: string;
  } | null;
  creador: {
    id: string;
    username: string;
    role: string;
  } | null;
}

interface PerfilSubQuery {
  id: string;
  username: string;
  role: string;
}

interface RepartidorSubQuery {
  id: string;
  nombre: string;
}

interface ComprobanteRawResponse {
  id: string;
  nombre_cliente: string;
  numero_telefono?: string | null;
  comentarios: string | null;
  precio_compra: string | number;
  pago_inicial: string | number;
  pago_recibido: string | number;
  pago_semanal?: string | number | null;
  plazos?: string | number | null;
  precio_total?: string | number | null;
  tag?: string | null;
  celular: string | null;
  color_celular: string | null;
  imei: string | null;
  fecha_proximo_pago?: string | null;
  comprobante_url: string;
  foto_cliente_url?: string | null;
  pago_adelantado?: string | null;
  foto_pago_adelantado_url?: string | null;
  created_at: string;
  vendedor_nombre?: string | null;
  repartidor_nombre?: string | null;
  vendedor: PerfilSubQuery | PerfilSubQuery[] | null;
  repartidor: RepartidorSubQuery | RepartidorSubQuery[] | null;
  creador: PerfilSubQuery | PerfilSubQuery[] | null;
}

/**
 * Server Action para subir un comprobante de enganche y registrarlo en la base de datos.
 * Accesible por: Admin, Supervisor, Developer, Repartidor.
 */
/**
 * Sube un archivo (comprobante o foto del cliente) al storage de Supabase en el bucket 'comprobantes'.
 */
async function uploadFileToStorage(
  file: File,
  supabase: any,
  subfolder: string = 'comprobantes',
  allowedMimeTypes: string[] = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
  fileTypeName: string = 'archivo'
): Promise<{ success: boolean; publicUrl?: string; error?: string }> {
  try {
    // 1. Validar tipo MIME (lista blanca estricta)
    if (!allowedMimeTypes.includes(file.type)) {
      const allowedMsg = allowedMimeTypes.includes('application/pdf')
        ? "Solo se aceptan imágenes (JPG, PNG, WEBP) o archivos PDF."
        : "Solo se aceptan imágenes (JPG, PNG, WEBP).";
      return {
        success: false,
        error: `Formato no permitido para ${fileTypeName}. ${allowedMsg}`
      };
    }

    // 2. Validar tamaño máximo (5MB)
    const maxSizeBytes = 5 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return {
        success: false,
        error: `El ${fileTypeName} excede el tamaño máximo permitido de 5MB.`
      };
    }

    // 3. Sanitizar extensión
    const rawExt = file.name.split('.').pop()?.toLowerCase() || 'png';
    const safeExt = ['jpg', 'jpeg', 'png', 'webp', 'pdf'].includes(rawExt) ? rawExt : 'png';
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${safeExt}`;
    const filePath = `${subfolder}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('comprobantes')
      .upload(filePath, file, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error(`Error al subir ${fileTypeName} a storage:`, uploadError);
      return { success: false, error: `Error al subir el ${fileTypeName} a almacenamiento.` };
    }

    const { data: { publicUrl } } = supabase.storage
      .from('comprobantes')
      .getPublicUrl(filePath);

    return { success: true, publicUrl };
  } catch (error) {
    console.error(`Excepción en la carga de ${fileTypeName}:`, error);
    return { success: false, error: `Ocurrió un error inesperado al subir el ${fileTypeName}.` };
  }
}

/**
 * Función compatible para subir comprobantes.
 */
async function uploadComprobanteFile(
  file: File,
  supabase: any
): Promise<{ success: boolean; publicUrl?: string; error?: string }> {
  return uploadFileToStorage(file, supabase, 'comprobantes', ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'], 'comprobante');
}

interface DiscordNotificationParams {
  nombreCliente: string;
  vendedorId: string;
  repartidorId: string;
  precioCompra: number;
  pagoInicial: number;
  pagoRecibido: number;
  pagoSemanal?: number | null;
  plazos?: string | null;
  precioTotal?: number | null;
  tag?: string | null;
  celular: string | null;
  colorCelular: string | null;
  imei: string | null;
  fechaProximoPago?: string | null;
  comentarios: string | null;
  comprobanteUrl: string;
  fotoClienteUrl: string;
  pagoAdelantado: string;
  fotoPagoAdelantadoUrl?: string | null;
  userRole: string;
  currentUsername: string;
  supabase: any;
}

/**
 * Envía una notificación formateada a Discord con los detalles del comprobante registrado.
 */
async function sendDiscordNotification(params: DiscordNotificationParams) {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL_8;
  const roleId = process.env.DISCORD_ROLE_ID_2;

  if (!webhookUrl) return;

  try {
    const { data: vendedorPerfil } = await params.supabase
      .from("perfiles")
      .select("username, role")
      .eq("id", params.vendedorId)
      .single();

    let repartidorName = "Desconocido";
    const { data: repartidorLogistics } = await params.supabase
      .from("repartidores")
      .select("nombre")
      .eq("id", params.repartidorId)
      .maybeSingle();

    if (repartidorLogistics) {
      repartidorName = repartidorLogistics.nombre;
    }

    const vendedorName = vendedorPerfil?.username
      ? `${vendedorPerfil.role}: ${vendedorPerfil.username.charAt(0).toUpperCase() + vendedorPerfil.username.slice(1)}`
      : "Desconocido";

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://finvora.mx';
    const cleanCelular = params.celular ? params.celular.replace(/ - \d+GB.*$/, "") : "";

    const fields = [
      { name: "👤 Cliente", value: `**${params.nombreCliente.trim()}**`, inline: false },
      { name: "👤 Vendedor", value: `**${vendedorName}**`, inline: false },
      { name: "👤 Repartidor/Cambaceador", value: `**${repartidorName}**`, inline: false },
      { name: "📅 Fecha Próximo Pago", value: `**${params.fechaProximoPago}**`, inline: false },
      { name: "💵 Pago Recibido", value: `**$${params.pagoRecibido.toFixed(2)}**`, inline: false },
      { name: "💵 Pago Semanal", value: `**$${(params.pagoSemanal ?? 0).toFixed(2)}**`, inline: false },
      { name: "📅 Plazos", value: `**${params.plazos}**`, inline: false },
      { name: "💰 Precio Total", value: `**$${(params.precioTotal ?? 0).toFixed(2)}**`, inline: false },
      { name: "📱 Equipo", value: `**${cleanCelular}** ${params.colorCelular ? `(${params.colorCelular})` : ""}`, inline: false },
      { name: "🏷️ Tag", value: `**${params.tag ? params.tag.trim() : ""}**`, inline: false },
      { name: "🆔 IMEI", value: `\`${params.imei}\``, inline: false },
      { name: "⚡ Pago Adelantado", value: `**${params.pagoAdelantado}**`, inline: false },
    ];

    if (params.comentarios && params.comentarios.trim()) {
      fields.push({ name: "📝 Comentarios", value: params.comentarios.trim(), inline: false });
    }

    fields.push(
      { name: "📸 Foto Cliente", value: `[Visualizar](${params.fotoClienteUrl})`, inline: false },
      { name: "📄 Archivo Comprobante", value: `[Visualizar](${params.comprobanteUrl})`, inline: false }
    );

    if (params.fotoPagoAdelantadoUrl) {
      fields.push(
        { name: "📑 Archivo Pago Adelantado", value: `[Visualizar](${params.fotoPagoAdelantadoUrl})`, inline: false }
      );
    }

    const embed = {
      title: "NUEVA VENTA REGISTRADA 🧾",
      description: `Se ha registrado en Finvora un nuevo comprobante.`,
      color: 0x10b981,
      fields: fields,
      timestamp: new Date().toISOString(),
    };

    const discordResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: "Finvora Comprobantes",
        avatar_url: `${siteUrl}/brands/finvoralogo.webp`,
        content: roleId ? `🛎️ <@&${roleId}>` : undefined,
        embeds: [embed]
      }),
    });

    if (!discordResponse.ok) {
      console.error(`Error de Discord API al notificar comprobante: status ${discordResponse.status}`);
    }
  } catch (discordError) {
    console.error("Error enviando notificación de comprobante a Discord:", discordError);
  }
}

/**
 * Server Action para subir un comprobante de enganche y registrarlo en la base de datos.
 * Accesible por: Admin, Supervisor, Developer, Repartidor.
 */
export async function submitComprobante(formData: FormData) {
  const { id: currentUserId, role: userRole, username: currentUsername } = await getUserProfile();

  if (!currentUserId || !isAllowed(userRole, ["Developer", "Admin", "Supervisor", "Repartidor", "Cambaceador", "CambaCloser"])) {
    return { success: false, error: "No autorizado. No tienes los permisos necesarios." };
  }

  const nombreCliente = formData.get("nombre_cliente") as string;
  const numeroTelefono = formData.get("numero_telefono") as string;
  const comentarios = formData.get("comentarios") as string;
  const vendedorId = formData.get("vendedor_id") as string;
  const repartidorId = formData.get("repartidor_id") as string;
  const precioCompraRaw = formData.get("precio_compra") as string;
  const pagoInicialRaw = formData.get("pago_inicial") as string;
  const pagoRecibidoRaw = formData.get("pago_recibido") as string;
  const pagoSemanalRaw = formData.get("pago_semanal") as string | null;
  const plazosRaw = formData.get("plazos") as string | null;
  const precioTotalRaw = formData.get("precio_total") as string | null;
  const tagRaw = formData.get("tag") as string | null;
  const celular = formData.get("celular") as string;
  const colorCelular = formData.get("color_celular") as string;
  const imei = formData.get("imei") as string;
  const fechaProximoPagoRaw = formData.get("fecha_proximo_pago") as string | null;
  const pagoAdelantadoRaw = formData.get("pago_adelantado") as string | null;
  const file = formData.get("comprobante") as File | null;
  const fotoClienteFile = formData.get("foto_cliente") as File | null;
  const fotoPagoAdelantadoFile = formData.get("foto_pago_adelantado") as File | null;

  if (
    !nombreCliente || !nombreCliente.trim() ||
    !numeroTelefono || !numeroTelefono.trim() ||
    !vendedorId ||
    !repartidorId ||
    !precioCompraRaw ||
    !pagoInicialRaw ||
    !pagoRecibidoRaw ||
    !pagoSemanalRaw || !pagoSemanalRaw.trim() ||
    !plazosRaw || !plazosRaw.trim() ||
    !precioTotalRaw || !precioTotalRaw.trim() ||
    !tagRaw || !tagRaw.trim() ||
    !fechaProximoPagoRaw || !fechaProximoPagoRaw.trim() ||
    !file || file.size === 0 ||
    !fotoClienteFile || fotoClienteFile.size === 0
  ) {
    return { success: false, error: "Todos los campos son obligatorios, incluyendo el comprobante y la foto del cliente." };
  }

  if (!pagoAdelantadoRaw || !['Si', 'No'].includes(pagoAdelantadoRaw)) {
    return { success: false, error: "Por favor, selecciona si cuenta con Pago adelantado (Si o No)." };
  }

  if (pagoAdelantadoRaw === 'Si' && (!fotoPagoAdelantadoFile || fotoPagoAdelantadoFile.size === 0)) {
    return { success: false, error: "El archivo de Pago Adelantado es obligatorio al seleccionar 'Si'." };
  }

  const precioCompra = parseFloat(precioCompraRaw.replace(',', '.'));
  const pagoInicial = parseFloat(pagoInicialRaw.replace(',', '.'));
  const pagoRecibido = parseFloat(pagoRecibidoRaw.replace(',', '.'));
  const pagoSemanal = parseFloat(pagoSemanalRaw.replace(',', '.'));
  const precioTotal = parseFloat(precioTotalRaw.replace(',', '.'));
  const plazos = plazosRaw.trim();
  const tag = tagRaw.trim();
  const fechaProximoPago = fechaProximoPagoRaw.trim();

  if (isNaN(precioCompra) || precioCompra < 0) {
    return { success: false, error: "El precio de compra debe ser un número válido mayor o igual a cero." };
  }
  if (isNaN(pagoInicial) || pagoInicial < 0) {
    return { success: false, error: "El pago inicial debe ser un número válido mayor o igual a cero." };
  }
  if (isNaN(pagoRecibido) || pagoRecibido < 0) {
    return { success: false, error: "El pago recibido debe ser un número válido mayor o igual a cero." };
  }
  if (isNaN(pagoSemanal) || pagoSemanal < 0) {
    return { success: false, error: "El pago semanal debe ser un número válido mayor o igual a cero." };
  }
  if (isNaN(precioTotal) || precioTotal < 0) {
    return { success: false, error: "El precio total debe ser un número válido mayor o igual a cero." };
  }

  const supabase = await createClient();

  // 1. Subir el comprobante a Supabase Storage
  const uploadResult = await uploadComprobanteFile(file, supabase);
  if (!uploadResult.success || !uploadResult.publicUrl) {
    return { success: false, error: uploadResult.error || "Error al subir el comprobante." };
  }

  const comprobanteUrl = uploadResult.publicUrl;

  // 1.1 Subir la foto del cliente a Supabase Storage
  const uploadFotoResult = await uploadFileToStorage(
    fotoClienteFile,
    supabase,
    'foto-cliente',
    ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
    'foto del cliente'
  );

  if (!uploadFotoResult.success || !uploadFotoResult.publicUrl) {
    // Revertir: Limpiar comprobante previamente subido
    try {
      const searchString = "/storage/v1/object/public/comprobantes/";
      const index = comprobanteUrl.indexOf(searchString);
      if (index !== -1) {
        const filePath = comprobanteUrl.substring(index + searchString.length);
        await supabase.storage.from('comprobantes').remove([filePath]);
      }
    } catch (cleanupError) {
      console.error("Error al limpiar comprobante tras fallo en foto del cliente:", cleanupError);
    }
    return { success: false, error: uploadFotoResult.error || "Error al subir la foto del cliente." };
  }

  const fotoClienteUrl = uploadFotoResult.publicUrl;

  // 1.2 Subir archivo de Pago Adelantado si corresponde
  let fotoPagoAdelantadoUrl: string | null = null;
  if (pagoAdelantadoRaw === 'Si' && fotoPagoAdelantadoFile && fotoPagoAdelantadoFile.size > 0) {
    const uploadAdelantadoResult = await uploadFileToStorage(
      fotoPagoAdelantadoFile,
      supabase,
      'pago-adelantado',
      ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
      'pago adelantado'
    );

    if (!uploadAdelantadoResult.success || !uploadAdelantadoResult.publicUrl) {
      // Revertir: Limpiar comprobante y foto del cliente
      try {
        const searchString = "/storage/v1/object/public/comprobantes/";
        const filesToRemove: string[] = [];

        const indexComp = comprobanteUrl.indexOf(searchString);
        if (indexComp !== -1) filesToRemove.push(comprobanteUrl.substring(indexComp + searchString.length));

        const indexFoto = fotoClienteUrl.indexOf(searchString);
        if (indexFoto !== -1) filesToRemove.push(fotoClienteUrl.substring(indexFoto + searchString.length));

        if (filesToRemove.length > 0) {
          await supabase.storage.from('comprobantes').remove(filesToRemove);
        }
      } catch (cleanupError) {
        console.error("Error al limpiar archivos tras fallo en pago adelantado:", cleanupError);
      }
      return { success: false, error: uploadAdelantadoResult.error || "Error al subir el archivo de pago adelantado." };
    }

    fotoPagoAdelantadoUrl = uploadAdelantadoResult.publicUrl;
  }

  // 2. Registrar en la base de datos comprobantes
  const { data: newComprobante, error } = await supabase
    .from('comprobantes')
    .insert([{
      nombre_cliente: nombreCliente.trim(),
      numero_telefono: numeroTelefono.trim(),
      comentarios: comentarios ? comentarios.trim() : null,
      vendedor_id: vendedorId,
      repartidor_id: repartidorId,
      precio_compra: precioCompra,
      pago_inicial: pagoInicial,
      pago_recibido: pagoRecibido,
      pago_semanal: pagoSemanal,
      plazos: plazos,
      precio_total: precioTotal,
      tag: tag,
      celular: celular || null,
      color_celular: colorCelular || null,
      imei: imei || null,
      fecha_proximo_pago: fechaProximoPago,
      comprobante_url: comprobanteUrl,
      foto_cliente_url: fotoClienteUrl,
      pago_adelantado: pagoAdelantadoRaw,
      foto_pago_adelantado_url: fotoPagoAdelantadoUrl,
      creado_por: currentUserId
    }])
    .select('id')
    .single();

  if (error) {
    console.error("Error al registrar comprobante en DB:", error);
    // Limpieza: intentar borrar archivos de storage si falló la base de datos
    try {
      const searchString = "/storage/v1/object/public/comprobantes/";
      const filesToRemove: string[] = [];

      const indexComp = comprobanteUrl.indexOf(searchString);
      if (indexComp !== -1) {
        filesToRemove.push(comprobanteUrl.substring(indexComp + searchString.length));
      }

      const indexFoto = fotoClienteUrl.indexOf(searchString);
      if (indexFoto !== -1) {
        filesToRemove.push(fotoClienteUrl.substring(indexFoto + searchString.length));
      }

      if (fotoPagoAdelantadoUrl) {
        const indexAdelantado = fotoPagoAdelantadoUrl.indexOf(searchString);
        if (indexAdelantado !== -1) {
          filesToRemove.push(fotoPagoAdelantadoUrl.substring(indexAdelantado + searchString.length));
        }
      }

      if (filesToRemove.length > 0) {
        await supabase.storage.from('comprobantes').remove(filesToRemove);
      }
    } catch (cleanupError) {
      console.error("Error al limpiar archivos de storage tras fallo en DB:", cleanupError);
    }
    return { success: false, error: "Ocurrió un error al guardar el registro en la base de datos." };
  }

  // 2.1 Crear automáticamente el registro en seguimiento_pagos
  try {
    const plazosMatch = plazos.match(/\d+/);
    const plazosInt = plazosMatch ? parseInt(plazosMatch[0], 10) : null;

    const { error: seguimientoErr } = await supabase.from('seguimiento_pagos').insert([{
      comprobante_origen_id: newComprobante?.id || null,
      tag: tag,
      nombre_cliente: nombreCliente.trim(),
      numero_telefono: numeroTelefono.trim(),
      celular: celular || null,
      color_celular: colorCelular || null,
      imei: imei || null,
      precio_total: precioTotal,
      pago_inicial: pagoInicial,
      pago_semanal: pagoSemanal,
      plazos: plazosInt,
      fecha_proximo_pago: fechaProximoPago,
      vendedor_id: vendedorId,
      repartidor_id: repartidorId,
      creado_por: currentUserId
    }]);

    if (seguimientoErr) {
      console.error("Error al insertar registro automático en seguimiento_pagos:", seguimientoErr);
    } else {
      revalidatePath('/empresa/webapp/seguimiento-pagos');
    }
  } catch (seguimientoErr) {
    console.error("Excepción al insertar registro en seguimiento_pagos:", seguimientoErr);
  }

  // 3. Si se seleccionó un IMEI, registrar la venta y dar de baja en la tabla de stock
  if (imei && imei.trim()) {
    const ventaResult = await registrarVenta(imei.trim(), vendedorId);
    if (ventaResult.error) {
      console.error("Error al registrar la venta de IMEI desde comprobantes:", ventaResult.error);
    }
  }

  // 4. Enviar notificación a Discord (asíncrona)
  sendDiscordNotification({
    nombreCliente,
    vendedorId,
    repartidorId,
    precioCompra,
    pagoInicial,
    pagoRecibido,
    pagoSemanal,
    plazos,
    precioTotal,
    tag,
    celular,
    colorCelular,
    imei,
    fechaProximoPago,
    pagoAdelantado: pagoAdelantadoRaw,
    fotoPagoAdelantadoUrl,
    comentarios,
    comprobanteUrl,
    fotoClienteUrl,
    userRole,
    currentUsername: currentUsername || "",
    supabase
  });

  revalidatePath('/empresa/webapp/comprobantes');
  return { success: true };
}

/**
 * Server Action para obtener los comprobantes cargados en los últimos 2 meses.
 * Accesible únicamente por roles superiores: Admin, Supervisor, Developer.
 */
export async function getComprobantes(): Promise<{ success: boolean; data?: ComprobanteRecord[]; error?: string }> {
  const { role: userRole } = await getUserProfile();

  if (!isAllowed(userRole, ["Admin", "Supervisor", "Developer"])) {
    return { success: false, error: "No autorizado. No tienes permisos para ver estos registros." };
  }

  const supabase = await createClient();

  // Calcular la fecha límite de hace 2 meses
  const twoMonthsAgo = new Date();
  twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);

  const rawComprobantes = await fetchAllFromTable<ComprobanteRawResponse>(
    supabase,
    'comprobantes',
    `
      id,
      nombre_cliente,
      numero_telefono,
      comentarios,
      precio_compra,
      pago_inicial,
      pago_recibido,
      pago_semanal,
      plazos,
      precio_total,
      tag,
      celular,
      color_celular,
      imei,
      fecha_proximo_pago,
      comprobante_url,
      foto_cliente_url,
      pago_adelantado,
      foto_pago_adelantado_url,
      created_at,
      vendedor_nombre,
      repartidor_nombre,
      vendedor:perfiles!vendedor_id (id, username, role),
      repartidor:repartidores!repartidor_id (id, nombre),
      creador:perfiles!creado_por (id, username, role)
    `,
    {
      filterFn: (q) => q.gte('created_at', twoMonthsAgo.toISOString()),
      orderColumn: 'created_at',
      ascending: false
    }
  );

  const formattedData: ComprobanteRecord[] = (rawComprobantes || []).map((comprobanteRaw: ComprobanteRawResponse) => ({
    id: comprobanteRaw.id,
    nombre_cliente: comprobanteRaw.nombre_cliente,
    numero_telefono: comprobanteRaw.numero_telefono || null,
    comentarios: comprobanteRaw.comentarios || null,
    precio_compra: Number(comprobanteRaw.precio_compra),
    pago_inicial: Number(comprobanteRaw.pago_inicial),
    pago_recibido: Number(comprobanteRaw.pago_recibido),
    pago_semanal: comprobanteRaw.pago_semanal != null ? Number(comprobanteRaw.pago_semanal) : null,
    plazos: comprobanteRaw.plazos || null,
    precio_total: comprobanteRaw.precio_total != null ? Number(comprobanteRaw.precio_total) : null,
    tag: comprobanteRaw.tag || null,
    celular: comprobanteRaw.celular || null,
    color_celular: comprobanteRaw.color_celular || null,
    imei: comprobanteRaw.imei || null,
    fecha_proximo_pago: comprobanteRaw.fecha_proximo_pago || null,
    comprobante_url: comprobanteRaw.comprobante_url,
    foto_cliente_url: comprobanteRaw.foto_cliente_url || null,
    pago_adelantado: comprobanteRaw.pago_adelantado || "No",
    foto_pago_adelantado_url: comprobanteRaw.foto_pago_adelantado_url || null,
    created_at: comprobanteRaw.created_at,
    vendedor_nombre: comprobanteRaw.vendedor_nombre || null,
    repartidor_nombre: comprobanteRaw.repartidor_nombre || null,
    vendedor: Array.isArray(comprobanteRaw.vendedor) ? comprobanteRaw.vendedor[0] : (comprobanteRaw.vendedor as PerfilSubQuery | null),
    repartidor: Array.isArray(comprobanteRaw.repartidor) ? comprobanteRaw.repartidor[0] : (comprobanteRaw.repartidor as RepartidorSubQuery | null),
    creador: Array.isArray(comprobanteRaw.creador) ? comprobanteRaw.creador[0] : (comprobanteRaw.creador as PerfilSubQuery | null),
  }));

  return { success: true, data: formattedData };
}

/**
 * Server Action para eliminar un comprobante de la base de datos y su archivo de storage.
 * Accesible únicamente por roles superiores: Admin, Supervisor, Developer.
 */
export async function eliminarComprobante(id: string): Promise<{ success: boolean; error?: string }> {
  const { role: userRole } = await getUserProfile();

  if (!isAllowed(userRole, ["Admin", "Supervisor", "Developer"])) {
    return { success: false, error: "No autorizado. No tienes permisos para eliminar registros." };
  }

  const supabase = await createClient();

  // 1. Obtener las URLs de los archivos para poder borrarlos de storage
  const { data: comprobanteItem, error: fetchError } = await supabase
    .from('comprobantes')
    .select('comprobante_url, foto_cliente_url, foto_pago_adelantado_url')
    .eq('id', id)
    .single();

  if (fetchError || !comprobanteItem) {
    console.error("Error al buscar el comprobante:", fetchError);
    return { success: false, error: "No se encontró el registro a eliminar." };
  }

  const comprobanteUrl = comprobanteItem.comprobante_url;
  const fotoClienteUrl = comprobanteItem.foto_cliente_url;
  const fotoPagoAdelantadoUrl = comprobanteItem.foto_pago_adelantado_url;

  // 2. Eliminar el registro de la base de datos
  const { data: deletedRows, error: deleteError } = await supabase
    .from('comprobantes')
    .delete()
    .eq('id', id)
    .select();

  if (deleteError) {
    console.error("Error al eliminar el comprobante de la DB:", deleteError);
    return { success: false, error: `Error en la base de datos: ${deleteError.message}` };
  }

  if (!deletedRows || deletedRows.length === 0) {
    console.warn("No se eliminó ninguna fila. RLS podría estar bloqueando el DELETE.");
    return {
      success: false,
      error: "No se pudo eliminar el registro. Row Level Security (RLS) bloqueó la operación o no tienes permisos de eliminación en Supabase para la tabla 'comprobantes'."
    };
  }

  // 3. Eliminar los archivos de Supabase Storage
  try {
    const searchString = "/storage/v1/object/public/comprobantes/";
    const filesToDelete: string[] = [];

    if (comprobanteUrl) {
      const index = comprobanteUrl.indexOf(searchString);
      if (index !== -1) {
        filesToDelete.push(comprobanteUrl.substring(index + searchString.length));
      }
    }

    if (fotoClienteUrl) {
      const indexFoto = fotoClienteUrl.indexOf(searchString);
      if (indexFoto !== -1) {
        filesToDelete.push(fotoClienteUrl.substring(indexFoto + searchString.length));
      }
    }

    if (fotoPagoAdelantadoUrl) {
      const indexAdelantado = fotoPagoAdelantadoUrl.indexOf(searchString);
      if (indexAdelantado !== -1) {
        filesToDelete.push(fotoPagoAdelantadoUrl.substring(indexAdelantado + searchString.length));
      }
    }

    if (filesToDelete.length > 0) {
      await supabase.storage.from('comprobantes').remove(filesToDelete);
    }
  } catch (cleanupError) {
    console.error("Error al limpiar archivos de storage tras eliminación:", cleanupError);
  }

  revalidatePath('/empresa/webapp/comprobantes');
  return { success: true };
}
