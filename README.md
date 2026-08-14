# 📱 Finvora - Aplicación Web ERP + CRM & Catálogo Comercial

Este repositorio contiene la aplicación web de **Finvora**, un proyecto unificado que integra tanto la **landing page y catálogo comercial público** (para captación y cotización de clientes finales) como el **portal corporativo privado** que actúa como **ERP** (para la gestión y auditoría del inventario físico por IMEI, logística de repartos por zonas y cálculo de sueldos/comisiones) y como **CRM** (para el registro de clientes, expedientes de crédito a plazos, auditoría de pagos semanales y seguimiento de cobranza). Al estar consolidados en un mismo desarrollo, ambos módulos comparten la misma base de datos e infraestructura en tiempo real. El sistema utiliza una arquitectura moderna basada en Next.js (App Router), Supabase para la infraestructura de datos y autenticación, y Resend para la mensajería transaccional.

---

## 🛠 Tecnologías Utilizadas

- **Frontend**: Next.js (App Router) con React y Tailwind CSS.
- **Base de Datos y Auth**: Supabase (PostgreSQL + GoTrue).
- **Almacenamiento Multimedia**: Supabase Storage (Bucket público para activos de celulares y comprobantes).
- **Procesamiento de Imágenes**: Canvas HTML5 local (Normalizador de márgenes y conversor WebP).
- **Email Service**: Resend (vía SMTP personalizado).
- **Notificaciones**: Discord Webhooks (Notificaciones de ventas, comprobantes y órdenes de garantía en tiempo real con canales dedicados).
- **Hosting y DNS**: Vercel.
- **Librerías Extra**: XLSX (Generación de reportes Excel) y jsPDF + jsPDF-AutoTable (Generación dinámica de recibos en PDF en el cliente).
- **Arquitectura de Datos**: Capa de paginación por lotes (*Chunks*) para escalabilidad infinita y superación de límites de API.

---

## ⚙️ Configuración de Entorno

La aplicación depende de un conjunto de variables de entorno para su correcto funcionamiento en los distintos niveles de la infraestructura (cliente y servidor). Estas deben definirse en el archivo `.env.local` para entornos de desarrollo o en la consola de administración de Vercel para entornos de producción.

### Diccionario de Variables de Entorno

| Variable | Ámbito | Descripción Técnica | Propósito Operativo |
| :--- | :--- | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | Cliente/Servidor | Punto de enlace (Endpoint) de la API de Supabase. | Establecer la conexión con el clúster de base de datos y servicios de infraestructura. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Cliente/Servidor | Clave pública de acceso anónimo. | Validar peticiones mediante políticas de seguridad a nivel de fila (RLS). |
| `NEXT_PUBLIC_SITE_URL` | Cliente/Servidor | URL absoluta del sitio (ej: `https://finvora.mx` o `http://localhost:3000`). | Punto de retorno para redireccionamientos de autenticación (emails de confirmación/recuperación). |
| `NEXT_PUBLIC_WHATSAPP_PHONE` | Cliente | Identificador telefónico (E.164, sin prefijo +). | Configuración del destino para los servicios de mensajería instantánea y cotizaciones directas. |
| `DISCORD_WEBHOOK_URL` | Servidor | Webhook principal de Discord. | Reporte atómico de ventas generales y zona Tijuana. |
| `DISCORD_WEBHOOK_URL_2` | Servidor | Webhook secundario de Discord. | Reporte de ventas para la zona Monterrey (MTY). |
| `DISCORD_WEBHOOK_URL_3` | Servidor | Webhook de garantías. | Notificaciones automáticas de órdenes de garantía con evidencias fotográficas. |
| `DISCORD_WEBHOOK_URL_4` | Servidor | Webhook Guadalajara. | Reporte de ventas y órdenes para la plaza Guadalajara. |
| `DISCORD_WEBHOOK_URL_5` | Servidor | Webhook Cambaceo Ángel. | Notificaciones de órdenes asignadas al equipo de Cambaceo Ángel. |
| `DISCORD_WEBHOOK_URL_6` | Servidor | Webhook de CT. | Notificaciones de entregas coordinadas con el equipo CT. |
| `DISCORD_WEBHOOK_URL_7` | Servidor | Webhook Cambaceo Brenda. | Notificaciones de órdenes asignadas al equipo de Cambaceo Brenda. |
| `DISCORD_WEBHOOK_URL_8` | Servidor | Webhook de Comprobantes. | Notificaciones de carga de comprobantes de pago/enganche. |
| `DISCORD_WEBHOOK_URL_9` | Servidor | Webhook Mexicali. | Reporte de ventas y órdenes para la plaza Mexicali. |
| `DISCORD_ROLE_ID` | Servidor | ID de rol de Discord primario. | Mención en canales al equipo de choferes/reparto. |
| `DISCORD_ROLE_ID_2` | Servidor | ID de rol de Discord secundario. | Mención en canales al rol de supervisión. |
| `NEXT_PUBLIC_APP_ENV` | Servidor/Cliente | Identificador de entorno de despliegue. | Habilita la indexación en buscadores (SEO) a través de `robots.txt` / `sitemap.ts` únicamente cuando está definido en `"production"`. |

---

## 📂 Estructura de Navegación

La aplicación utiliza un sistema de rutas anidadas, layouts compartidos y rutas públicas comerciales para optimizar la seguridad y la experiencia de usuario:

### Experiencia Pública de E-commerce y Catálogo
- `/catalogo`: Escaparate comercial público. Muestra los modelos de celulares activos mediante una grilla responsiva compacta, con filtros de marcas reactivos y transiciones fluidas.
- `/catalogo/[id]`: Ficha de detalles del smartphone. Incluye un visualizador de imagen interactivo y el selector inteligente de variantes para cotización a WhatsApp.

### Portal Administrativo (`/empresa`)
- `/empresa/login`: Acceso de empleados de Finvora.
- `/empresa/register`: Registro de nuevas cuentas (Asigna rol `Closer` por defecto).
- `/empresa/forgot-password`: Solicitud de recuperación de cuenta.
- `/empresa/webapp`: Panel de control principal (Menú de herramientas).
- `/empresa/webapp/catalogo-web`: Panel de control CRUD del catálogo web. Permite dar de alta modelos, gestionar variantes y subir imágenes con procesamiento automático.
- `/empresa/webapp/ordenes-entrega`: Formulario interactivo para registrar órdenes de entrega físicas a crédito con agendamiento automático y transición de inventario.
- `/empresa/webapp/comprobantes`: Carga y subida de comprobantes digitales de pago/enganche (archivos de imagen/PDF) a Supabase Storage con notificaciones automáticas en Discord.
- `/empresa/webapp/seguimiento-pagos`: Panel de control de cobranza semanal, seguimiento de cuotas, saldos restantes, mora y tags con exportación a Excel y enlace directo a PayJoy.
- `/empresa/webapp/ordenes-garantia`: Formulario y registro de órdenes de garantía de equipos con carga de imágenes de evidencia y despacho automatizado a Discord.
- `/empresa/webapp/taskboard`: Tablero Kanban interactivo para tareas del equipo (Pendientes, En proceso, Terminado) e historial paginado con opción de restauración.
- `/empresa/webapp/stock`: Consulta, altas y exportación del inventario físico individualizado por IMEI.
- `/empresa/webapp/repartos`: Calendario interactivo mensual para agendamiento de despachos logísticos con bloqueo de slots ocupados.
- `/empresa/webapp/repartos/repartidores`: Catálogo de repartidores y perfiles logísticos.
- `/empresa/webapp/repartos/zonas`: Configuración de zonas asignadas a los repartidores.
- `/empresa/webapp/sueldos`: Calculadora de sueldos, bonos y liquidación para Admins/Developers, con descarga del recibo oficial en PDF.
- `/empresa/webapp/sueldos/proveedores`: Gestión de costos asignados a equipos y edición por proveedor de compra.
- `/empresa/webapp/registros`: Historial y auditoría de ventas totales y órdenes registradas en el sistema sin límite de 1.000 filas.
- `/empresa/webapp/mis-operaciones`: Panel personal de consulta rápida para operaciones cargadas y asignadas al usuario logueado en los últimos 2 meses.
- `/empresa/webapp/usuarios`: Gestión global de perfiles y administración de roles y correos electrónicos.
- `/empresa/webapp/dashboard`: Estadísticas, métricas en tiempo real y gráficos de rendimiento del negocio (Admin/Dev/Supervisor).
- `/empresa/webapp/perfil`: Ajustes del usuario (Username y Rol).

---

## 🔐 Gestión de Roles y Seguridad (RBAC)

El sistema implementa un estricto control de accesos basado en roles (**Role-Based Access Control**) orquestado en base de datos:

1. **Roles de la Plataforma**:
   - `Admin / Developer`: Acceso absoluto. Control total de stock, ventas, catálogos, configuraciones logísticas, seguimiento de pagos, administración de perfiles y métricas corporativas.
   - `Supervisor`: Supervisión general. Acceso total a inventario, catálogo de repartidores/zonas, calendario de despachos, seguimiento de pagos y dashboard de rendimiento.
   - `Closer`: Fuerza de ventas. Registro de pedidos, órdenes de entrega y carga de comprobantes de venta. Consulta de stock en tiempo real (solo lectura).
   - `Cambaceador`: Personal de ventas de calle. Mismos permisos que `Closer` adaptados para el cambaceo móvil.
   - `CambaCloser`: Rol híbrido con permisos avanzados de preventa y cierre comercial.
   - `Repartidor`: Personal logístico. Consulta de su agenda personal de repartos asignados (solo lectura).
2. **Sincronización Automática**: Al registrarse un usuario en `auth.users`, se dispara un Trigger en Supabase que inyecta su registro correspondiente en `public.perfiles` con rol `'Sin rol'`.
3. **Bypass de Logística para Administradores**: Para flexibilizar el control operacional, los perfiles de `Admin`, `Developer` y `Supervisor` tienen permitido **omitir la regla de 1 hora de anticipación** al agendar o modificar horas de entrega en el calendario interactivo de repartos.
4. **Validación de Calculadora de Sueldos**: El acceso al módulo `/sueldos` se restringe estrictamente en servidor y cliente a los roles `Admin` y `Developer`.
5. **Validación Server-Side**: La autenticación de sesiones y validaciones de rol se ejecutan bajo entornos seguros a través de Server Components y Server Actions mediante los helpers robustos `getUserProfile` e `isAllowed`.

---

## 🚚 Lógica de Horarios, Repartidores y Logística

El módulo de programación de entregas y el calendario de logística operan bajo un motor centralizado en `utils/driver-schedule.ts`:

- **Rangos de Horario por Repartidor**:
  - **Repartidor Ángel (Tijuana)**: Horario especial de **10:00 hs a 17:30 hs** (en intervalos de 30 minutos).
  - **Repartidor CT**: Horario de **10:00 hs a 17:00 hs**.
  - **Demás Repartidores (Estándar)**: Horario general de **09:00 hs a 19:00 hs**.
- **Zonas Horarias Dinámicas**: El sistema detecta automáticamente la zona horaria del chofer (`America/Tijuana` para Tijuana/Mexicali y `America/Mexico_City` para Monterrey, Guadalajara y centro) asegurando concordancia de hora real.
- **Regla de 1 Hora de Anticipación**: Si una entrega se agenda para el **día de hoy**, el sistema calcula la hora local del repartidor + 60 minutos y oculta los turnos previos.
- **Bloqueo de Horarios Ocupados (Anti-Colisión)**: Consulta en tiempo real la tabla `repartos` y bloquea como `(Ocupado)` cualquier turno previamente reservado para ese chofer en la fecha seleccionada.
- **Días de Descanso Programados**: Diccionario de días libres por chofer (ej. Félix los miércoles) que deshabilita el selector y emite un banner de advertencia visual.

---

## 📝 Automatización en Órdenes de Entrega (`/empresa/webapp/ordenes-entrega`)

Al confirmar una orden de entrega desde el formulario administrativo, el sistema dispara en cascada:

1. **Persistencia de la Orden**: Inserción en `public.ordenes_entrega` con generación de folio único consecutivo.
2. **Agendamiento en Calendario**: Inserta automáticamente la cita en la tabla `public.repartos` vinculando chofer, zona, vendedor, cliente, notas y el equipo asignado.
3. **Transición Atómica de Inventario**: Busca el celular por IMEI y conmuta su estado a **`"En envío"`**, congelando la `fecha_en_envio` en hora UTC/local del chofer para evitar duplicidad de ventas en otras órdenes.
4. **Despacho a Discord**: Envío de alerta con Embed estructurado al canal y rol correspondiente según la plaza o equipo de cambaceo.

---

## ⚡ Arquitectura de Paginación por Chunks (Zero Row-Limit)

Para solucionar el límite por defecto de 1.000 filas de PostgREST y garantizar que la plataforma soporte decenas de miles de ventas sin saturar la memoria de Vercel ni la base de datos:

- **Utilidad `fetchAllFromTable` (`utils/supabase/pagination.ts`)**: Helper reutilizable que divide las consultas en lotes automáticos (`range(from, to)`) de 1.000 registros con orden descendente hasta descargar el 100% de la tabla.
- **Dashboard Optimizado (`/empresa/webapp/dashboard`)**:
  - Filtro por rango de fechas (`startDate` a `endDate`) directamente en Postgres.
  - KPIs de Hoy/Ayer/Semana/Mes consultan únicamente el período vigente en milisegundos.
  - Detección ultraligera de años disponibles mediante consultas indexadas con `limit(1)`.
- **Módulos con Carga Completa Garantizada**: `/registros`, `/seguimiento-pagos`, `/sueldos`, `/comprobantes`, `/stock` y `/repartos`.

---

## 💳 Módulo de Seguimiento de Pagos y Cobranza (`/empresa/webapp/seguimiento-pagos`)

Módulo avanzado para el control de cobranza semanal y administración del estado de cuentas de clientes:

- **Indicadores Clave (KPIs)**: Tarjetas de resumen en tiempo real con total de clientes, saldo restante acumulado, recaudación proyectada semanal y conteo de cuentas al día, pagadas o en mora.
- **Buscador Global Inteligente**: Filtro reactivo en tiempo real por Nombre del Cliente, IMEI, Tag o Vendedor.
- **Filtro de Fecha estricto en Zona Horaria Tijuana**: Cálculo estricto de la semana actual (Lunes 00:00 a Domingo 23:59) en `America/Tijuana` para evitar desfasajes en evaluaciones de cuotas.
- **Copia de Tag interactiva**: Insignias de Tag cliqueables con aviso flotante animado de confirmación ("¡Copiado!") compatible con dispositivos móviles (soporte universal con fallback `execCommand`).
- **Exportación Excel y Enlace PayJoy**: Botón de exportación rápida `.xlsx` con mapeo completo de cliente, modelo, IMEI, pagos, plazos y vendedor, acompañado de un acceso directo a la plataforma Merchant Login de PayJoy.
- **Paginación y Modales de Edición**: Paginador inferior optimizado (20 ítems por página) y modales para editar estados semanales y ver el historial detallado de cuotas.

---

## 🛠️ Módulo de Órdenes de Garantía (`/empresa/webapp/ordenes-garantia`)

Formulario especializado para la gestión y recepción de equipos bajo reclamo de garantía:

- **Captura Integral de Datos**: Registro de cliente, contacto, zona de recepción, enlace de Google Maps, catálogo de equipo (marca, modelo, IMEI, tag), fechas y costos (equipo, enganche registrado y enganche recibido).
- **Detalle Físico y de Fallas**: Descripción del motivo de garantía, accesorios entregados, condición estética del teléfono y observaciones adicionales.
- **Evidencias Multimedia a Discord**: Carga de múltiples fotografías de evidencia despachadas en tiempo real mediante Webhook dedicado a Discord.

---

## 📋 Tablero de Tareas y Auditoría (Taskboard)

Sistema interactivo de gestión de pendientes internas del equipo (`/empresa/webapp/taskboard`):

- **Kanban Táctil**: Organización visual de tareas divididas en *Pendientes*, *En proceso* y *Terminado*.
- **Historial y Restauración (`/historial`)**: Auditoría paginada de tareas completadas con buscador, filtro por responsable asignado y botón "Rehacer" para reactivar tareas al flujo de trabajo con notas actualizadas.

---

## 🎨 Módulo de Catálogo Comercial & E-commerce

Este módulo desacoplado permite promocionar los celulares disponibles para crédito sin alterar el inventario físico diario del stock:

### 1. Escaparate & Variantes Rápidas (`/catalogo`)
* Grid denso ultra-compacto optimizado para móviles (2 columnas en celular, 4 en desktop).
* Muestra minicírculos descriptivos con la gama de colores y las capacidades de gigabytes del equipo directamente en la tarjeta de presentación (`CatalogoCardCompacta.tsx`).
* Barra de filtros de marca con scroll lateral horizontal responsivo en pantallas táctiles y filtrado instantáneo reactivo.

### 2. Normalizador de Imágenes Transparentes Canvas-to-WebP
Para que el catálogo se vea homogéneo y premium, el panel administrativo procesa localmente en navegador cada imagen seleccionada antes de subirla a Supabase Storage:
* **Auto-Trim de Transparencias**: Analiza los canales alfa de los píxeles para **recortar todo el espacio vacío transparente sobrante** del archivo original.
* **Alineación Simétrica**: Centra el cuerpo físico del celular en un lienzo cuadrado uniforme de **800x800 píxeles**.
* **Padding Uniforme del 12%**: Escala proporcionalmente el dispositivo inyectándole exactamente un 12% de márgenes de seguridad en los cuatro costados, logrando que todos los smartphones se expongan al mismo tamaño relativo.
* **Compresión a WebP (Ahorro del 70%)**: Exporta la imagen en formato **WebP al 85% de calidad**, manteniendo la transparencia pero encogiéndola hasta en un 70% de peso para acelerar la carga en celulares con datos móviles y reducir costos en la nube.

### 3. Ficha Técnica Táctil & Cotizador Cyber-Naranja
* **Visualizador Imagen con Zoom Táctil Seguro**: Renderiza el smartphone en un contenedor responsivo (`h-72 sm:h-96 md:h-auto`) y posee un visualizador de Lightbox a pantalla completa con desenfoque de fondo. Incorpora un **detector táctil de arrastre (touch delta)**: si el usuario mueve el dedo más de 8px para scrollear la página, el zoom ignora el toque y no bloquea el scroll de fondo de forma accidental.
* **Botón Cotizar WhatsApp Cyber-Naranja**: Botón de alta conversión que evoca la estética corporativa de Finvora. Usa un fondo con degradado naranja neón vibrante (`from-[#FF9933] via-[#FFAE59] to-[#FF7700]`), una sombra de neón naranja difusa interactiva, tipografía nativa robusta (`font-black tracking-wide`), efecto shimmer animado en hover y compresión física al hacer clic. Compone un mensaje personalizado con el color, almacenamiento y RAM elegidos por el usuario de forma dinámica.

---

## 📧 Configuración de Mensajería (Resend + SMTP)

Para garantizar que los correos lleguen a la bandeja de entrada y no a Spam, se utiliza **Resend** como proveedor SMTP personalizado en Supabase.

### Paso 1: API Key en Resend
1. Ingresa a tu cuenta de **Resend**.
2. Ve a **API Keys > Create API Key**. Asigna permisos de **"Sending Access"**.
3. Copia la clave generada (`re_...`).

### Paso 2: Validación de Dominio (DNS en Vercel)
Se recomienda utilizar un subdominio (ej: `app.finvora.mx`) para aislar la reputación de los correos transaccionales del sitio corporativo principal.
1. Obtén los registros MX, TXT y CNAME proporcionados por Resend.
2. En la consola de Vercel: `Settings > Domains > [Tu Dominio] > DNS Records` y añade los registros uno a uno.

### Paso 3: Activación de SMTP en Supabase
1. Navega a **Project Settings > Authentication > SMTP Settings**.
2. Activa **Enable Custom SMTP**.
3. Ingresa los parámetros de conexión:
   - **Sender email**: `no-reply@app.tudominio.com` (Debe coincidir con tu subdominio verificado).
   - **Sender name**: `Finvora`
   - **SMTP Host**: `smtp.resend.com`
   - **SMTP Port**: `465`
   - **SMTP Username**: `resend`
   - **SMTP Password**: `[TU_API_KEY_DE_RESEND]`
4. Guarda los cambios.

---

## 📦 Gestión de Inventario y Stock

El módulo de stock administra individualmente el inventario real disponible vinculando terminales físicas (IMEIs) al catálogo maestro:

- **Estados Operativos**:
  - `Disponible`: Equipo físico en stock listo para su entrega.
  - `A consultar`: Unidades con precios o estados bajo revisión especial.
  - `En envío`: Equipos logísticamente asignados a un reparto en tránsito.
  - `Vendido`: Terminal validada y registrada en el historial histórico.
- **Exportación de Auditoría Excel**: Incorpora un exportador ágil con la librería `XLSX` que genera un documento `.xlsx` con todo el inventario activo clasificado (Modelo, Color, Capacidad, Ubicación, IMEI y Estado) listo para conciliación de almacén.

---

## 🤖 Integración con Discord

El módulo de pedidos reporta inmediatamente cada venta a los canales de comunicación interna corporativa para alertar a los equipos comerciales y de reparto.

- **Formato Rich Embed**: Las alertas se envían formateadas con los colores oficiales de Finvora, dividiendo campos legibles: Cliente, Enganche, Equipos, IMEI asignado, Vendedor, Zona de despacho y Comentarios operacionales.
- **Tiempo de Gracia de Confirmación**: Al cambiar el estado de un equipo a "Vendido", el frontend dispara una ventana de **20 segundos de gracia interactiva y cancelable** antes de disparar la Server Action atómica `registrarVenta` para permitir corregir errores.
- **Canales Dedicados**: Webhooks específicos para ventas por zona/equipo, carga de comprobantes digitales de pago y recepción de solicitudes de garantía con imágenes.

---

## 🛡️ Seguridad y Blindaje del Sistema

La plataforma se despliega con altos niveles de protección a lo largo de toda su arquitectura:

- **Validación de Sesión y Roles Activos**: Todas las Server Actions (como `crearCelular`, `submitVenta` o `editarCelular`) realizan validaciones de sesión criptográficas en el servidor e inspeccionan los privilegios del perfil antes de ejecutar transacciones.
- **Anti-Spam & Limitador Serverless (Rate Limiting)**: El sistema cuenta con un limitador de solicitudes (`checkRateLimit`) optimizado para Edge y Serverless. Si los parámetros de Upstash están configurados, emplea **Upstash Redis** mediante peticiones HTTP asíncronas para operaciones atómicas de conteo rápidas; en desarrollo local, cuenta con un fallback inteligente que almacena temporizadores en la memoria RAM local.
- **Content-Security-Policy (CSP) & Cabeceras HTTP**: Next.js inyecta cabeceras de seguridad strictly configuradas en `next.config.ts` mitigando ataques XSS, Clickjacking y de inyección MIME. La CSP autoriza exclusivamente recursos de Supabase, Discord, Google Fonts y Cloudflare.
- **Middleware de Sesión Dinámica**: Orquestado por `proxy.ts` para gestionar de forma transparente los ciclos de las cookies de autenticación de Supabase y enrutar las zonas privadas corporativas de forma segura.

---

## 💵 Módulo de Calculadora de Sueldos y Recibos PDF

Este módulo centraliza la liquidación financiera de los empleados del negocio:

- **Reglas de Liquidación Dinámicas**:
  - `Supervisor`: Sueldo Fijo + Comisión de Ventas fija al 50%.
  - `Developer / Admin`: Sueldo Fijo neto.
  - `Vendedor (Closer, Cambaceador, CambaCloser)`: Comisión variable calculada del subtotal de venta (según porcentaje asignado) + Sueldo Fijo + Bonos - Descuento por Publicidad.
  - `Repartidor`: Comisión fija por cada entrega concretada + Sueldo Fijo + Bonos.
- **Generación de Reportes PDF A4**: Integración con `jsPDF` y `jsPDF-AutoTable` para compilar la liquidación. Permite renderizar el logotipo corporativo `/brands/logorecibo.png`, cuadro de datos del empleado, período de fechas filtrado literalmente, grilla de transacciones desglosada y el cálculo del **Neto a Cobrar** destacado. Cuenta con maquetación compacta unificada de `7pt` de fuente para asegurar que todo quepa prolijamente en una sola hoja.

---

## 📱 Desarrollo y Pruebas Móviles

Para desplegar y testear el e-commerce táctil y el panel de administración localmente en smartphones o tablets dentro de la misma red local:

1. **Conexión Local**: Conéctate a la IP de la máquina de desarrollo (ej: `http://192.168.1.5:3000`).
2. **Configuración de Orígenes Permitidos**: Asegúrate de tener actualizada la constante `allowedDevOrigins` en el archivo `next.config.ts` con tu dirección IP local actual para evitar bloqueos del servidor y habilitar el funcionamiento correcto de todos los endpoints interactivos de Turbopack.

---
*Desarrollado por Jsoza para Finvora 2026*
