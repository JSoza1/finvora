import React from "react";
import Link from "next/link";

export const revalidate = 10;

const styles = {
  grid: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6",
  card: "group relative bg-slate-900/40 backdrop-blur-xl border border-slate-800 p-8 rounded-3xl hover:border-secondary/50 transition-all duration-300 flex flex-col items-center text-center gap-6 overflow-hidden",
  cardGlow: "absolute -bottom-12 -right-12 w-32 h-32 bg-secondary/5 rounded-full blur-3xl group-hover:bg-secondary/10 transition-colors",
  iconWrapper: "w-16 h-16 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-center group-hover:scale-110 group-hover:border-secondary/30 transition-all",
  icon: "material-symbols-outlined text-3xl text-secondary",
  cardTitle: "text-xl font-bold text-slate-200",
  cardDesc: "text-sm text-slate-400 leading-relaxed",
  cardButton: "mt-auto w-full py-3 bg-slate-950 border border-slate-800 rounded-xl group-hover:bg-secondary group-hover:text-slate-950 group-hover:border-secondary font-semibold transition-all",
  
  // Estilos para próximas secciones
  cardUpcoming: "group relative bg-slate-900/20 backdrop-blur-xl border border-slate-800/30 p-8 rounded-3xl transition-all duration-300 flex flex-col items-center text-center gap-6 overflow-hidden opacity-50 hover:opacity-85 cursor-not-allowed",
  cardButtonUpcoming: "mt-auto w-full py-3 bg-slate-950/40 border border-slate-900 text-slate-500 rounded-xl font-semibold transition-all cursor-not-allowed",
};

export default function WebAppPage() {
  return (
    <div className={styles.grid}>

      {/* Taskboard */}
      <Link href="/empresa/webapp/taskboard" className={styles.card}>
        <div className={styles.cardGlow} />
        <div className={styles.iconWrapper}>
          <span className={styles.icon}>dashboard_customize</span>
        </div>
        <div>
          <h2 className={styles.cardTitle}>Taskboard</h2>
          <p className={styles.cardDesc}>Tablero de tareas. Gestiona y asigna flujos de trabajo.</p>
        </div>
        <div className={styles.cardButton}>Acceder</div>
      </Link>

      {/* Mis Operaciones - Acceso para todos */}
      <Link href="/empresa/webapp/mis-operaciones" className={styles.card}>
        <div className={styles.cardGlow} />
        <div className={styles.iconWrapper}>
          <span className={styles.icon}>history</span>
        </div>
        <div>
          <h2 className={styles.cardTitle}>Mis Operaciones</h2>
          <p className={styles.cardDesc}>Consulta tu historial de ventas y entregas.</p>
        </div>
        <div className={styles.cardButton}>Acceder</div>
      </Link>

      {/* Guías - Acceso para todos los roles excepto Sin rol */}
      <Link href="/empresa/webapp/guias" className={styles.card}>
        <div className={styles.cardGlow} />
        <div className={styles.iconWrapper}>
          <span className={styles.icon}>auto_stories</span>
        </div>
        <div>
          <h2 className={styles.cardTitle}>Guías</h2>
          <p className={styles.cardDesc}>Manuales, procesos y documentación interna de la empresa.</p>
        </div>
        <div className={styles.cardButton}>Acceder</div>
      </Link>

      {/* Orden de Entrega - Acceso para todos */}
      <Link href="/empresa/webapp/ordenes-entrega" className={styles.card}>
        <div className={styles.cardGlow} />
        <div className={styles.iconWrapper}>
          <span className="material-symbols-outlined text-secondary" style={{ fontSize: '34px' }}>campaign</span>
        </div>
        <div>
          <h2 className={styles.cardTitle}>Orden de Entrega</h2>
          <p className={styles.cardDesc}>Registro de nuevas órdenes y notificaciones a repartidores</p>
        </div>
        <div className={styles.cardButton}>Acceder</div>
      </Link>

      {/* Orden de Garantía - Acceso para todos */}
      <Link href="/empresa/webapp/ordenes-garantia" className={styles.card}>
        <div className={styles.cardGlow} />
        <div className={styles.iconWrapper}>
          <span className="material-symbols-outlined text-secondary" style={{ fontSize: '34px' }}>phonelink_setup</span>
        </div>
        <div>
          <h2 className={styles.cardTitle}>Orden de Garantía</h2>
          <p className={styles.cardDesc}>Registro de equipos reportados por clientes por fallas en garantía.</p>
        </div>
        <div className={styles.cardButton}>Acceder</div>
      </Link>

      {/* Cotizaciones de crédito */}
      <Link href="/empresa/webapp/cotizaciones-credito" className={styles.card}>
        <div className={styles.cardGlow} />
        <div className={styles.iconWrapper}>
          <span className={styles.icon}>credit_score</span>
        </div>
        <div>
          <h2 className={styles.cardTitle}>Cotizaciones de crédito</h2>
          <p className={styles.cardDesc}>Cotizador rápido de enganches por zona y modelo.</p>
        </div>
        <div className={styles.cardButton}>Acceder</div>
      </Link>

      {/* Inventario */}
      <Link href="/empresa/webapp/inventario" className={styles.card}>
        <div className={styles.cardGlow} />
        <div className={styles.iconWrapper}>
          <span className={styles.icon}>inventory_2</span>
        </div>
        <div>
          <h2 className={styles.cardTitle}>Inventario</h2>
          <p className={styles.cardDesc}>Gestión de stock disponible y recepción de equipos.</p>
        </div>
        <div className={styles.cardButton}>Acceder</div>
      </Link>

      {/* Repartos */}
      <Link href="/empresa/webapp/repartos" className={styles.card}>
        <div className={styles.cardGlow} />
        <div className={styles.iconWrapper}>
          <span className={styles.icon}>local_shipping</span>
        </div>
        <div>
          <h2 className={styles.cardTitle}>Repartos</h2>
          <p className={styles.cardDesc}>Calendario de repartos y logística.</p>
        </div>
        <div className={styles.cardButton}>Acceder</div>
      </Link>

      {/* Comprobantes de Enganche */}
      <Link href="/empresa/webapp/comprobantes" className={styles.card}>
        <div className={styles.cardGlow} />
        <div className={styles.iconWrapper}>
          <span className={styles.icon}>receipt_long</span>
        </div>
        <div>
          <h2 className={styles.cardTitle}>Comprobantes</h2>
          <p className={styles.cardDesc}>Registra y descarga los comprobantes de los clientes.</p>
        </div>
        <div className={styles.cardButton}>Acceder</div>
      </Link>

      {/* Seguimiento de Pagos */}
      <Link href="/empresa/webapp/seguimiento-pagos" className={styles.card}>
        <div className={styles.cardGlow} />
        <div className={styles.iconWrapper}>
          <span className={styles.icon}>search</span>
        </div>
        <div>
          <h2 className={styles.cardTitle}>Seguimiento de Pagos</h2>
          <p className={styles.cardDesc}>Control de saldos restantes y cuotas semanales de los clientes.</p>
        </div>
        <div className={styles.cardButton}>Acceder</div>
      </Link>

      {/* Catálogo Web */}
      <Link href="/empresa/webapp/catalogo-web" className={styles.card}>
        <div className={styles.cardGlow} />
        <div className={styles.iconWrapper}>
          <span className={styles.icon}>menu_book</span>
        </div>
        <div>
          <h2 className={styles.cardTitle}>Catálogo Web</h2>
          <p className={styles.cardDesc}>Gestiona los modelos y variantes de celulares visibles en la web pública.</p>
        </div>
        <div className={styles.cardButton}>Acceder</div>
      </Link>

      {/* Registros */}
      <Link href="/empresa/webapp/registros" className={styles.card}>
        <div className={styles.cardGlow} />
        <div className={styles.iconWrapper}>
          <span className={styles.icon}>description</span>
        </div>
        <div>
          <h2 className={styles.cardTitle}>Registros</h2>
          <p className={styles.cardDesc}>Historial y auditoría de ventas y órdenes de entrega.</p>
        </div>
        <div className={styles.cardButton}>Acceder</div>
      </Link>

      {/* Gestión de Usuarios */}
      <Link href="/empresa/webapp/usuarios" className={styles.card}>
        <div className={styles.cardGlow} />
        <div className={styles.iconWrapper}>
          <span className={styles.icon}>group</span>
        </div>
        <div>
          <h2 className={styles.cardTitle}>Gestión de usuarios</h2>
          <p className={styles.cardDesc}>Administra roles y permisos de acceso para todo el personal.</p>
        </div>
        <div className={styles.cardButton}>Acceder</div>
      </Link>

      {/* Calculadora de sueldos */}
      <Link href="/empresa/webapp/sueldos" className={styles.card}>
        <div className={styles.cardGlow} />
        <div className={styles.iconWrapper}>
          <span className={styles.icon}>calculate</span>
        </div>
        <div>
          <h2 className={styles.cardTitle}>Calculadora de sueldos</h2>
          <p className={styles.cardDesc}>Consulta y filtra las operaciones recientes por empleado.</p>
        </div>
        <div className={styles.cardButton}>Acceder</div>
      </Link>

      {/* Dashboard - Bloqueado para Closer en la subpágina */}
      <Link href="/empresa/webapp/dashboard" className={styles.card}>
        <div className={styles.cardGlow} />
        <div className={styles.iconWrapper}>
          <span className={styles.icon}>monitoring</span>
        </div>
        <div>
          <h2 className={styles.cardTitle}>Dashboard</h2>
          <p className={styles.cardDesc}>Visualiza métricas, reportes y el rendimiento de la empresa.</p>
        </div>
        <div className={styles.cardButton}>Acceder</div>
      </Link>

      {/* Black List */}
      <Link href="/empresa/webapp/blacklist" className={styles.card}>
        <div className={styles.cardGlow} />
        <div className={styles.iconWrapper}>
          <span className={styles.icon}>person_off</span>
        </div>
        <div>
          <h2 className={styles.cardTitle}>Black List</h2>
          <p className={styles.cardDesc}>Expediente de clientes bloqueados por fraude o morosidad.</p>
        </div>
        <div className={styles.cardButton}>Acceder</div>
      </Link>

      {/* Próximamente */}
      <div className={styles.cardUpcoming}>
        <div className={styles.cardGlow} />
        <div className={styles.iconWrapper}>
          <span className={styles.icon}>more_horiz</span>
        </div>
        <div>
          <h2 className={styles.cardTitle}>Próximamente</h2>
          <p className={styles.cardDesc}>Nueva sección en desarrollo.</p>
        </div>
        <div className={styles.cardButtonUpcoming}>Próximamente</div>
      </div>
    </div>    
  );
}