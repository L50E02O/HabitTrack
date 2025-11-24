import { supabase } from "../../config/supabase";
import type { IHabito, CreateIHabito, UpdateIHabito } from "../../types/IHabito";

// Helpers para calcular fechas de períodos
function toDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function getPeriodDates(intervaloMeta: string | null): { inicio: Date; fin: Date } | null {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  if (intervaloMeta === "semanal") {
    // Inicio: Hoy
    const inicio = new Date(hoy);
    // Fin: Hoy + 6 días
    const fin = new Date(hoy);
    fin.setDate(fin.getDate() + 6);
    fin.setHours(23, 59, 59, 999);
    return { inicio, fin };
  }

  if (intervaloMeta === "mensual") {
    // Inicio: Hoy
    const inicio = new Date(hoy);
    // Fin: Un día antes del mismo día del próximo mes
    const fin = new Date(hoy);
    fin.setMonth(fin.getMonth() + 1); // Ir al próximo mes
    fin.setDate(fin.getDate() - 1); // Restar 1 día (día anterior al mismo día del mes siguiente)
    fin.setHours(23, 59, 59, 999);
    return { inicio, fin };
  }

  // diario
  if (intervaloMeta === "diario") {
    const inicio = new Date(hoy);
    const fin = new Date(hoy);
    fin.setHours(23, 59, 59, 999);
    return { inicio, fin };
  }

  return null;
}

export async function createHabito(nuevoHabito: CreateIHabito): Promise<IHabito> {
    // Validar meta_repeticion
    if (nuevoHabito.meta_repeticion < 1 || nuevoHabito.meta_repeticion > 365) {
        throw new Error("La meta de repetición debe estar entre 1 y 365");
    }

    // Crear el hábito
    const { data: habitoCreado, error: errorHabito } = await supabase
        .from("habito")
        .insert(nuevoHabito)
        .select()
        .single();

    if (errorHabito) {
        throw new Error(errorHabito.message);
    }

    // Obtener fechas del período según el tipo de hábito
    const periodoInfo = getPeriodDates(habitoCreado.intervalo_meta);
    const hoy = new Date();
    hoy.setUTCHours(0, 0, 0, 0);
    
    const fechaInicio = periodoInfo ? toDateString(periodoInfo.inicio) : toDateString(hoy);
    const fechaFin = periodoInfo ? toDateString(periodoInfo.fin) : toDateString(hoy);

    // Crear registro_intervalo inicial
    const { data: registroInicial, error: errorRegistro } = await supabase
        .from("registro_intervalo")
        .insert({
            id_habito: habitoCreado.id_habito,
            fecha: fechaInicio,
            fecha_inicio_intervalo: fechaInicio,
            fecha_fin_intervalo: fechaFin,
            cumplido: false,
            puntos: 0,
            progreso: 0,
            cumplido_periodo_anterior: false,
        })
        .select()
        .single();

    if (errorRegistro) {
        console.error("Error creando registro inicial:", errorRegistro);
        // No lanzamos error para no bloquear la creación del hábito
        // El registro se puede crear después
    }

    // Crear racha inicial
    if (registroInicial) {
        const { error: errorRacha } = await supabase
            .from("racha")
            .insert({
                id_registro_intervalo: registroInicial.id_registro,
                inicio_racha: fechaInicio,
                fin_racha: fechaInicio,
                dias_consecutivos: 0,
                racha_activa: false,
                protectores_asignados: 0,
            });

        if (errorRacha) {
            console.error("Error creando racha inicial:", errorRacha);
            // No lanzamos error para no bloquear la creación del hábito
        }
    }

    return habitoCreado;
}

export async function getAllHabitos(): Promise<IHabito[]> {
    const { data, error } = await supabase
        .from("habito")
        .select("*");

    if (error) {
        throw new Error(error.message);
    }
    return data;
}

export async function getHabitoById(id: string): Promise<IHabito> {
    const { data, error } = await supabase
        .from("habito")
        .select("*")
        .eq("id_habito", id)
        .single();

    if (error) {
        throw new Error(error.message);
    }

    return data;
}

export async function updateHabito(id: string, habito: UpdateIHabito): Promise<void> {
    // Validar meta_repeticion si está presente
    if (habito.meta_repeticion !== undefined) {
        if (habito.meta_repeticion < 1 || habito.meta_repeticion > 365) {
            throw new Error("La meta de repetición debe estar entre 1 y 365");
        }
    }

    const { error } = await supabase
        .from("habito")
        .update(habito)
        .eq("id_habito", id)
        .single();

    if (error) {
        throw new Error(error.message);
    }
}

export async function deleteHabito(id: string): Promise<void> {
    const { error } = await supabase
        .from("habito")
        .delete()
        .eq("id_habito", id);

    if (error) {
        throw new Error(error.message);
    }
}


// function startOfWeekLocal(date: Date): Date {
//   // Lunes como inicio
//   const d = new Date(date);
//   const day = d.getDay(); // 0 dom .. 6 sab
//   const diff = d.getDate() - day + (day === 0 ? -6 : 1);
//   d.setDate(diff);
//   d.setHours(0, 0, 0, 0);
//   return d;
// }

// function endOfWeekLocal(date: Date): Date {
//   const s = startOfWeekLocal(date);
//   const e = new Date(s);
//   e.setDate(s.getDate() + 6);
//   e.setHours(23, 59, 59, 999);
//   return e;
// }

// function startOfMonthLocal(date: Date): Date {
//   const d = new Date(date);
//   d.setDate(1);
//   d.setHours(0, 0, 0, 0);
//   return d;
// }

// function endOfMonthLocal(date: Date): Date {
//   const d = new Date(date);
//   d.setMonth(d.getMonth() + 1);
//   d.setDate(0);
//   d.setHours(23, 59, 59, 999);
//   return d;
// }