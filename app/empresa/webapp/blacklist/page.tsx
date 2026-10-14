import React from 'react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/server';
import { getUserProfile, isAllowed } from '@/utils/auth-check';
import AccessDenied from '@/components/empresa/AccessDenied';
import BlacklistClientPage from '@/components/empresa/blacklist/BlacklistClientPage';
import { getBlacklistEntries } from './blacklist-actions';

export const revalidate = 0;

const styles = {
  container: 'max-w-6xl mx-auto space-y-8',
  header: 'flex items-start justify-between gap-4',
  title: 'text-xl md:text-3xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent',
  desc: 'text-xs sm:text-sm text-slate-400 mt-1',
  btnHome: 'flex items-center justify-center px-4 py-2 bg-slate-800 text-slate-400 border border-slate-700 rounded-xl hover:bg-slate-700 hover:text-white transition-all cursor-pointer shrink-0',
};

export default async function BlacklistPage() {
  const { role: userRole } = await getUserProfile();

  // Control estricto de acceso: Solo Admin, Supervisor y Developer
  if (!isAllowed(userRole, ['Admin', 'Supervisor', 'Developer'])) {
    return <AccessDenied role={userRole} sectionName="Black List" />;
  }

  const supabase = await createClient();

  // Obtener zonas de reparto registradas para poblar dropdowns
  const { data: zonasRaw } = await supabase
    .from('zonas_reparto')
    .select('nombre_zona')
    .order('nombre_zona', { ascending: true });

  const rawList: Array<{ nombre_zona: string | null }> = zonasRaw || [];
  const zonasDisponibles: string[] = Array.from(
    new Set(
      rawList
        .map((zonaRecord) => zonaRecord.nombre_zona?.trim())
        .filter((cleanZona): cleanZona is string => typeof cleanZona === 'string' && cleanZona.length > 0)
    )
  );

  // Obtener registros iniciales de la Black List
  const { data: initialData = [], error } = await getBlacklistEntries();

  if (error) {
    console.error('Error al cargar la página de Black List:', error);
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h2 className={styles.title}>Black List</h2>
          <p className={styles.desc}>
            Control, consulta y expediente de clientes bloqueados por fraude, morosidad o irregularidades.
          </p>
        </div>

        <Link href="/empresa/webapp" className={styles.btnHome} title="Volver al Inicio">
          <span className="material-symbols-outlined text-xl select-none">home</span>
        </Link>
      </header>

      <BlacklistClientPage
        initialData={initialData}
        zonasDisponibles={zonasDisponibles}
      />
    </div>
  );
}
