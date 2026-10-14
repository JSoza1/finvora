'use server';

import { createClient } from "@/utils/supabase/server";
import { getDriverRestDayInfo } from "@/utils/driver-schedule";

/**
 * Server Action que procesa el registro y envío de una nueva orden de entrega a un canal de Discord.
 * Realiza verificaciones de sesión del vendedor, formatea un enlace interactivo de WhatsApp
 * para contacto rápido con el cliente, y estructura un Embed estético de Discord para notificaciones
 * de ordenes de entrega de alta prioridad.
 * 
 * @security Valida de forma estricta que exista una sesión de usuario activa para prevenir el spam o inyecciones de órdenes falsas desde clientes no autenticados.
 * @param formData Datos enviados desde el formulario de Orden de Entrega (nombre de cliente, identificación, CURP, enganche, dirección, teléfono, etc.)
 * @returns Objeto de respuesta que indica si el envío fue exitoso o el mensaje de error correspondiente.
 */
export async function submitOrdenEntrega(formData: FormData) {
  const supabase = await createClient();

  // 1. CONTROL DE ACCESO: Validamos activamente que el usuario esté logueado
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "No autorizado. Debes iniciar sesión." };
  }

  // 2. OBTENER INFORMACIÓN DE PERFIL: Recuperamos el nombre de usuario y rol del vendedor
  const { data: profile } = await supabase
    .from("perfiles")
    .select("role, username")
    .eq("id", user.id)
    .single();

  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  const userDisplayName = profile?.username
    ? `${profile.role}: ${capitalize(profile.username)}`
    : user.email;

  // 3. EXTRACCIÓN DE DATOS: Obtenemos los campos clave capturados del formulario
  const data = {
    nombre: formData.get("nombre_cliente") as string,
    identificacion: formData.get("identificacion_fisica") as string,
    curp: formData.get("curp") as string,
    telefono: formData.get("telefono") as string,
    preferencia_comunicacion: formData.get("preferencia_comunicacion") as string,
    direccion: formData.get("direccion") as string,
    nombre_referencia_1: formData.get("nombre_referencia_1") as string,
    telefono_referencia_1: formData.get("telefono_referencia_1") as string,
    nombre_referencia_2: formData.get("nombre_referencia_2") as string,
    telefono_referencia_2: formData.get("telefono_referencia_2") as string,
    enganche: formData.get("enganche") as string,
    celular: formData.get("celular") as string,
    color: formData.get("color_celular") as string,
    imei: formData.get("imei") as string,
    cuenta: formData.get("cuenta_activa") as string,
    cliente_historial: formData.get("cliente_historial") as string,
    zona: formData.get("zona") as string,
    repartidor: formData.get("repartidor") as string,
    repartidor_id: formData.get("repartidor_id") as string,
    especificarLocal: formData.get("especificar_local") as string,
    fecha: formData.get("fecha_entrega") as string,
    hora: formData.get("hora_entrega") as string,
    pago_adelantado: (formData.get("pago_adelantado") as string) === "Si" ? "Si" : "No",
    comentarios: formData.get("comentarios") as string,
  };

  const verificacionFile = formData.get("verificacion_crediticia") as File | null;

  // 3.3. CONTROL DE BLACK LIST: Si la CURP está registrada en la lista negra, rechazamos de inmediato la orden
  const cleanCurp = data.curp?.trim().toUpperCase();
  if (cleanCurp) {
    const { data: blacklistedRecord } = await supabase
      .from('blacklist')
      .select('id, nombre, curp, zona, motivo, created_at')
      .eq('curp', cleanCurp)
      .maybeSingle();

    if (blacklistedRecord) {
      return {
        success: false,
        error: `El cliente con CURP ${cleanCurp} se encuentra bloqueado en la Black List. Motivo: ${blacklistedRecord.motivo}`,
      };
    }
  }

  // 3.35. CONTROL DE DÍA DE DESCANSO Y HORARIOS DEL REPARTIDOR
  let driverRowData: { zona_horaria?: string; dias?: number[]; horario_inicio?: string; horario_fin?: string; nombre?: string } | null = null;
  if (data.repartidor_id) {
    const { data: repRow } = await supabase
      .from("repartidores")
      .select("zona_horaria, dias, horario_inicio, horario_fin, nombre")
      .eq("id", data.repartidor_id)
      .maybeSingle();
    driverRowData = repRow;
  }

  if (data.fecha && (data.repartidor || driverRowData?.nombre)) {
    const restDayInfo = getDriverRestDayInfo(
      {
        nombre: driverRowData?.nombre || data.repartidor,
        dias: driverRowData?.dias
      },
      data.fecha
    );
    if (restDayInfo.isRestDay) {
      return {
        success: false,
        error: `El repartidor ${driverRowData?.nombre || data.repartidor} no realiza entregas los días ${restDayInfo.restDayNames.join(", ")} (Día de descanso).`
      };
    }
  }

  // 3.37. CONTROL DE ANTICIPACIÓN MÍNIMA (1 HORA RESPECTO A LA HORA LOCAL DEL REPARTIDOR)
  if (data.fecha && data.hora && (data.repartidor_id || data.zona || data.repartidor)) {
    let driverTimeZone = "America/Mexico_City";
    if (driverRowData?.zona_horaria) {
      driverTimeZone = driverRowData.zona_horaria;
    } else {
      const normZona = (data.zona || "").toLowerCase();
      const normRep = (data.repartidor || "").toLowerCase();
      if (normZona.includes("tijuana") || normZona.includes("mexicali") || normZona.includes("rosarito") || normRep.includes("ct")) {
        driverTimeZone = "America/Tijuana";
      } else if (normZona.includes("cancun")) {
        driverTimeZone = "America/Cancun";
      } else if (normZona.includes("sonora") || normZona.includes("hermosillo") || normZona.includes("mazatlan")) {
        driverTimeZone = "America/Hermosillo";
      }
    }

    try {
      const formatter = new Intl.DateTimeFormat("en-US", {
        timeZone: driverTimeZone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
      });

      const parts = formatter.formatToParts(new Date());
      const getVal = (type: string) => parts.find((part) => part.type === type)?.value || "";
      const currentYear = getVal("year");
      const currentMonth = getVal("month");
      const currentDay = getVal("day");
      const currentHour = parseInt(getVal("hour") || "0", 10);
      const currentMinute = parseInt(getVal("minute") || "0", 10);
      const currentDateStr = `${currentYear}-${currentMonth}-${currentDay}`;

      if (data.fecha < currentDateStr) {
        return {
          success: false,
          error: "La fecha de entrega no puede ser en el pasado."
        };
      }

      if (data.fecha === currentDateStr) {
        const [hStr, mStr] = data.hora.split(":");
        const deliveryHour = parseInt(hStr, 10);
        const deliveryMinute = parseInt(mStr, 10);
        if (!isNaN(deliveryHour) && !isNaN(deliveryMinute)) {
          const deliveryTotalMinutes = deliveryHour * 60 + deliveryMinute;
          const currentTotalMinutesWithLeadTime = currentHour * 60 + currentMinute + 60; // 1 hora de anticipación obligatoria

          if (deliveryTotalMinutes < currentTotalMinutesWithLeadTime) {
            return {
              success: false,
              error: "Los horarios de entrega deben ser solicitados con al menos 1 hora de anticipación respecto a la hora local del repartidor."
            };
          }
        }
      }
    } catch (tzErr) {
      console.error("Error validando horario de entrega con zona horaria:", tzErr);
    }
  }

  // 3.4. CONTROL DE SOBRECUPO / RACE CONDITION (Verificar disponibilidad inmediata)
  if (data.fecha && data.hora && data.repartidor_id) {
    const { data: repartoOcupado } = await supabase
      .from("repartos")
      .select("id")
      .eq("repartidor_id", data.repartidor_id)
      .eq("fecha_reparto", data.fecha)
      .eq("horario", data.hora)
      .maybeSingle();

    if (repartoOcupado) {
      return {
        success: false,
        error: `El horario de las ${data.hora} hs del día ${data.fecha} acaba de ser reservado por otro vendedor. Por favor seleccione otro horario.`
      };
    }
  }

  // 3.5. PERSISTIR EN BASE DE DATOS Y OBTENER FOLIO ÚNICO
  const { data: dbData, error: insertError } = await supabase
    .from("ordenes_entrega")
    .insert({
      vendedor_id: user.id,
      vendedor_nombre: profile?.username || null,
      nombre_cliente: data.nombre,
      identificacion_fisica: data.identificacion || null,
      curp: data.curp || null,
      telefono: data.telefono,
      preferencia_comunicacion: data.preferencia_comunicacion || null,
      direccion: data.direccion,
      nombre_referencia_1: data.nombre_referencia_1 || null,
      telefono_referencia_1: data.telefono_referencia_1 || null,
      nombre_referencia_2: data.nombre_referencia_2 || null,
      telefono_referencia_2: data.telefono_referencia_2 || null,
      enganche: data.enganche ? parseFloat(data.enganche) : null,
      celular: data.celular,
      color_celular: data.color,
      imei: data.imei || null,
      cuenta_activa: data.cuenta,
      cliente_historial: data.cliente_historial || null,
      zona: data.zona,
      repartidor: data.repartidor || null,
      repartidor_id: data.repartidor_id || null,
      especificar_local: data.especificarLocal || null,
      fecha_entrega: data.fecha || null,
      hora_entrega: data.hora || null,
      comentarios: data.comentarios || null,
      pago_adelantado: data.pago_adelantado
    })
    .select("folio")
    .single();

  if (insertError) {
    console.error("Error al guardar la orden de entrega:", insertError);
    return { success: false, error: "No se pudo guardar la orden de entrega en la base de datos." };
  }

  const generatedFolio = dbData?.folio || "SIN-FOLIO";

  // 3.6. AGENDAMIENTO AUTOMÁTICO EN EL CALENDARIO DE REPARTOS
  // Busca las relaciones relacionales de producto_id (vía IMEI) y zona_id para vincular la entrega automáticamente.
  if (data.fecha && data.hora && data.repartidor_id) {
    try {
      let productoId: string | null = null;
      if (data.imei) {
        const { data: stockRow } = await supabase
          .from("stock")
          .select("producto_id")
          .eq("imei", data.imei)
          .maybeSingle();
        if (stockRow) {
          productoId = stockRow.producto_id;
        }
      }

      let zonaId: string | null = null;
      if (data.zona) {
        const { data: zonaRow } = await supabase
          .from("zonas_reparto")
          .select("id")
          .eq("nombre_zona", data.zona)
          .eq("repartidor_id", data.repartidor_id)
          .maybeSingle();
        
        if (zonaRow) {
          zonaId = zonaRow.id;
        } else {
          const { data: zonaFallback } = await supabase
            .from("zonas_reparto")
            .select("id")
            .eq("nombre_zona", data.zona)
            .maybeSingle();
          if (zonaFallback) zonaId = zonaFallback.id;
        }
      }

      const clienteNotas = `${data.nombre}${data.telefono ? ` - Tel: ${data.telefono}` : ""}`;

      const { error: repartoInsertErr } = await supabase.from("repartos").insert({
        fecha_reparto: data.fecha,
        horario: data.hora,
        repartidor_id: data.repartidor_id,
        zona_id: zonaId,
        vendedor_id: user.id,
        imei: data.imei || null,
        producto_id: productoId,
        notas: clienteNotas
      });

      if (repartoInsertErr) {
        console.error("Error RLS/DB al insertar reparto en calendario:", repartoInsertErr);
      }
    } catch (repartoErr) {
      console.error("Error al registrar reparto automático en el calendario:", repartoErr);
    }
  }

  // 3.7. TRANSICIÓN AUTOMÁTICA DE ESTADO DE STOCK A "En envío"
  // Remueve el IMEI del inventario disponible para evitar selecciones duplicadas en órdenes posteriores.
  if (data.imei) {
    try {
      let fechaEnEnvioIso: string | null = null;

      if (data.fecha && data.hora) {
        // Determinar la zona horaria específica del repartidor
        let driverTimeZone = "America/Mexico_City";
        if (data.repartidor_id) {
          const { data: driverRow } = await supabase
            .from("repartidores")
            .select("zona_horaria")
            .eq("id", data.repartidor_id)
            .maybeSingle();
          if (driverRow?.zona_horaria) {
            driverTimeZone = driverRow.zona_horaria;
          }
        } else if (data.zona?.toLowerCase().includes("tijuana") || data.zona?.toLowerCase().includes("mexicali")) {
          driverTimeZone = "America/Tijuana";
        }

        // Calcular la fecha/hora en UTC correspondiente al horario local pactado
        const cleanHora = data.hora.length === 5 ? data.hora : data.hora.padStart(5, '0');
        const [y, m, d] = data.fecha.split('-').map(Number);
        const [h, min] = cleanHora.split(':').map(Number);

        if (!isNaN(y) && !isNaN(m) && !isNaN(d) && !isNaN(h) && !isNaN(min)) {
          const utcMs = Date.UTC(y, m - 1, d, h, min, 0);
          const fmt = new Intl.DateTimeFormat('en-US', {
            timeZone: driverTimeZone,
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit', second: '2-digit',
            hourCycle: 'h23'
          });
          const parts = fmt.formatToParts(new Date(utcMs));
          const getP = (type: string) => parseInt(parts.find(p => p.type === type)?.value || '0', 10);

          const testYear = getP('year');
          const testMonth = getP('month');
          const testDay = getP('day');
          const testHour = getP('hour');
          const testMin = getP('minute');

          const testUtcMs = Date.UTC(testYear, testMonth - 1, testDay, testHour, testMin, 0);
          const diffMs = utcMs - testUtcMs;
          fechaEnEnvioIso = new Date(utcMs + diffMs).toISOString();
        }
      }

      const updatePayload: { estado: string; fecha_en_envio?: string } = {
        estado: "En envío"
      };
      if (fechaEnEnvioIso) {
        updatePayload.fecha_en_envio = fechaEnEnvioIso;
      }

      const { error: stockUpdateErr } = await supabase
        .from("stock")
        .update(updatePayload)
        .eq("imei", data.imei);

      if (stockUpdateErr) {
        console.error("Error RLS/DB al actualizar estado de stock a 'En envío':", stockUpdateErr);
      } else {
        const { revalidatePath } = await import("next/cache");
        revalidatePath("/empresa/webapp/inventario/stock");
        revalidatePath("/empresa/webapp/ordenes-entrega");
      }
    } catch (stockErr) {
      console.error("Error al actualizar estado de stock:", stockErr);
    }
  }

  // 4. CONFIGURACIÓN DEL WEBHOOK: Cargamos la URL del webhook de Discord según la zona elegida o el repartidor
  const zonaNormalizada = (data.zona || "").trim().toLowerCase();
  const repartidorNormalizado = (data.repartidor || "").trim().toLowerCase();
  let webhookUrl = process.env.DISCORD_WEBHOOK_URL;

  if (repartidorNormalizado.includes("ct") && process.env.DISCORD_WEBHOOK_URL_6) {
    webhookUrl = process.env.DISCORD_WEBHOOK_URL_6;
  } else if (repartidorNormalizado.includes("cambaceo angel") && process.env.DISCORD_WEBHOOK_URL_5) {
    webhookUrl = process.env.DISCORD_WEBHOOK_URL_5;
  } else if (zonaNormalizada === "monterrey") {
    webhookUrl = process.env.DISCORD_WEBHOOK_URL_2 || process.env.DISCORD_WEBHOOK_URL;
  } else if (zonaNormalizada === "mexicali") {
    webhookUrl = process.env.DISCORD_WEBHOOK_URL_9 || process.env.DISCORD_WEBHOOK_URL;
  } else if (zonaNormalizada === "guadalajara") {
    webhookUrl = process.env.DISCORD_WEBHOOK_URL_4 || process.env.DISCORD_WEBHOOK_URL;
  } else if (zonaNormalizada.includes("rosarito")) {
    webhookUrl = process.env.DISCORD_WEBHOOK_URL_7 || process.env.DISCORD_WEBHOOK_URL;
  }

  if (!webhookUrl) {
    console.error("DISCORD_WEBHOOK_URL no está configurada en las variables de entorno.");
    return { success: false, error: "Error de configuración en el servidor." };
  }

  // 5. ENLACE DE WHATSAPP: Limpiamos el teléfono (solo dígitos) para habilitar un chat directo con el cliente
  const cleanPhone = data.telefono.replace(/\D/g, '');
  const whatsappUrl = `https://wa.me/${cleanPhone}`;

  // 6. ESTRUCTURA DEL PAYLOAD: Diseñamos los campos (fields) del Embed para organizar visualmente los datos
  const fields = [
    { name: "📋 Folio de Orden", value: `**${generatedFolio}**`, inline: false },
    { name: "👤 Vendedor", value: `**${userDisplayName}**`, inline: false },
    { name: "👤 Cliente", value: `**${data.nombre}**`, inline: false },
    { name: "🪪 CURP", value: `\`${data.curp}\``, inline: false },
    { name: "📄 Identificación física vigente", value: data.identificacion, inline: false },
    { name: "📞 Teléfono", value: `[${data.telefono}](${whatsappUrl})`, inline: false },
    { name: "💬 Preferencia de comunicación", value: data.preferencia_comunicacion || "No especificada", inline: false },
    { name: "📍 Dirección", value: data.direccion, inline: false },
    { name: "📍 Zona de Reparto", value: data.zona || "No especificada", inline: false },
    { name: "🛵 Repartidor Asignado", value: data.repartidor || "No asignado", inline: false },
  ];

  if (data.repartidor === "Local CT" && data.especificarLocal) {
    fields.push({ name: "🏪 Local Especificado", value: data.especificarLocal, inline: false });
  }

  fields.push(
    { name: "📱 Equipo", value: `**${data.celular}** (${data.color})`, inline: false },
    { name: "🆔 IMEI", value: data.imei ? `\`${data.imei}\`` : "No especificado", inline: false },
    { name: "💰 Enganche", value: `**$${data.enganche}**`, inline: false },
    { name: "⚡ Pago Adelantado", value: data.pago_adelantado === "Si" ? "**SÍ**" : "NO", inline: false },
    { name: "✅ Cuenta Activa", value: data.cuenta.toUpperCase(), inline: false },
    { name: "📜 ¿Cliente con historial?", value: data.cliente_historial ? data.cliente_historial.toUpperCase() : "NO ESPECIFICADO", inline: false },
    { name: "📅 Fecha de Entrega", value: data.fecha, inline: false },
    { name: "⏰ Hora de Entrega", value: data.hora, inline: false }
  );

  // Agregamos el campo de comentarios de forma condicional si no está vacío
  if (data.comentarios && data.comentarios.trim() !== "") {
    fields.push({ name: "💬 Comentarios", value: data.comentarios, inline: false });
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://finvora.mx';

  // 7. DISEÑO ESTÉTICO DEL EMBED: Configuramos un color rojo llamativo y metadatos limpios
  const embed: any = {
    title: `NUEVA ORDEN DE ENTREGA 🚀`,
    description: `Registrado a través de la app web.`,
    color: 0xef4444, // Rojo llamativo para llamar la atención del equipo de operaciones
    fields: fields,
    timestamp: new Date().toISOString(),
  };

  const embeds = [embed];
  const hasFile = verificacionFile && verificacionFile.size > 0;
  const isImage = hasFile && verificacionFile.type.startsWith("image/");

  if (isImage) {
    // Si es imagen, la metemos al final del embed único y le creamos un field de título directamente arriba
    fields.push({
      name: "📄 Verificación Crediticia",
      value: "", // El espacio de ancho cero oculta el valor en Discord, mostrando solo el título
      inline: false
    });
    embed.image = { url: `attachment://${verificacionFile.name}` };
  }

  // Mención opcional a un rol específico de Discord (ej. Coordinadores o Closers) si está configurado
  const isCambaceo = repartidorNormalizado.includes("cambaceo angel");
  const isCT = repartidorNormalizado.includes("ct");
  const roleId = ((isCambaceo || isCT) && process.env.DISCORD_ROLE_ID_2)
    ? process.env.DISCORD_ROLE_ID_2
    : process.env.DISCORD_ROLE_ID;
  const content = roleId ? `🛎️ <@&${roleId}>` : undefined;

  // 8. ENVÍO DEL MENSAJE: Realizamos la llamada HTTP POST al Webhook
  try {
    let response;

    if (isImage) {
      // Caso Imagen: Envío único con el embed y la imagen adjunta
      const discordForm = new FormData();
      
      discordForm.append("payload_json", JSON.stringify({
        username: "Finvora Ventas",
        avatar_url: `${siteUrl}/brands/finvoralogo.webp`,
        content: content,
        embeds: embeds
      }));

      discordForm.append("files[0]", verificacionFile, verificacionFile.name);

      response = await fetch(webhookUrl, {
        method: 'POST',
        body: discordForm
      });
    } else {
      // Caso PDF o Sin Archivo: Enviamos primero el embed como JSON
      response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: "Finvora Ventas",
          avatar_url: `${siteUrl}/brands/finvoralogo.webp`,
          content: content,
          embeds: embeds
        }),
      });

      // Si es un PDF y la primera petición fue exitosa, enviamos el archivo en un segundo mensaje consecutivo
      if (response.ok && hasFile) {
        try {
          const secondForm = new FormData();
          secondForm.append("payload_json", JSON.stringify({
            username: "Finvora Ventas",
            avatar_url: `${siteUrl}/brands/finvoralogo.webp`,
            content: `📄 Verificación crediticia adjunta para la orden **${generatedFolio}**:`
          }));
          secondForm.append("files[0]", verificacionFile, verificacionFile.name);

          await fetch(webhookUrl, {
            method: 'POST',
            body: secondForm
          });
        } catch (secError) {
          console.error("Error enviando el archivo PDF adjunto a Discord:", secError);
          // No bloqueamos el flujo principal si el segundo mensaje falla por red
        }
      }
    }

    if (!response.ok) {
      throw new Error(`Discord API responded with status ${response.status}`);
    }

    return { success: true, folio: generatedFolio };
  } catch (error) {
    console.error("Error enviando a Discord:", error);
    return { success: false, error: "No se pudo enviar la notificación a Discord." };
  }
}

export interface BlacklistCheckResult {
  isBlocked: boolean;
  record?: {
    id: string;
    nombre: string;
    curp: string;
    zona: string;
    motivo: string;
    created_at: string;
  };
  error?: string;
}

/**
 * Consulta si un CURP específico se encuentra registrado en la Black List.
 * Se invoca tanto desde el botón interactivo de lupa como antes de procesar el envío del formulario.
 */
export async function checkCurpInBlacklist(curp: string): Promise<BlacklistCheckResult> {
  const cleanCurp = curp?.trim().toUpperCase();
  if (!cleanCurp) {
    return { isBlocked: false };
  }

  const supabase = await createClient();

  try {
    const { data: blacklistedRecord, error } = await supabase
      .from('blacklist')
      .select('id, nombre, curp, zona, motivo, created_at')
      .eq('curp', cleanCurp)
      .maybeSingle();

    if (error) {
      console.error('Error al consultar blacklist:', error);
      return { isBlocked: false, error: 'Error al verificar la Black List.' };
    }

    if (blacklistedRecord) {
      return {
        isBlocked: true,
        record: blacklistedRecord,
      };
    }

    return { isBlocked: false };
  } catch (err) {
    console.error('Error inesperado al verificar blacklist:', err);
    return { isBlocked: false, error: 'Error de conexión al verificar Black List.' };
  }
}


