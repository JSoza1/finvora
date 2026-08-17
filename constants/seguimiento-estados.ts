import type { EstadoCuota } from "@/app/empresa/webapp/seguimiento-pagos/seguimiento-actions";

export interface EstadoConfig {
  value: EstadoCuota;
  label: string;
  bg: string;
  text: string;
  border: string;
}

export const ESTADOS_DISPONIBLES: EstadoConfig[] = [
  { value: 'En revisión', label: 'En revisión', bg: 'bg-slate-500/10', text: 'text-slate-400', border: 'border-slate-500/20' },
  { value: 'Por vencer', label: 'Por vencer', bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' },
  { value: 'Vencido', label: 'Vencido', bg: 'bg-red-500/10', text: 'text-red-500', border: 'border-red-500/20' },
  { value: 'Pagado', label: 'Pagado', bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
  { value: 'No Verificable', label: 'No Verificable', bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20' },
];
