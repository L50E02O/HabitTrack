import { supabase } from "../../config/supabase";
import type { IHabito, CreateIHabito, UpdateIHabito } from "../../types/IHabito";

// Helpers para calcular fechas de períodos
function toDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function getPeriodDates(intervaloMeta: string | null, fechaBase?: Date): { inicio: Date; fin: Date } | null {
  const fecha = fechaBase || new Date();
  fecha.setHours(0, 0, 0, 0);

  if (intervaloMeta === "semanal") {
    // Inicio: Lunes de la semana actual
    const inicio = new Date(fecha);
    const diaSemana = inicio.getDay(); // 0 = Domingo, 1 = Lunes, ..., 6 = Sábado
    const diasDesdeLunes = diaSemana === 0 ? 6 : diaSemana - 1; // Si es domingo, retroceder 6 días
    inicio.setDate(inicio.getDate() - diasDesdeLunes);
    
    // Fin: Domingo de la misma semana (6 días después del lunes)
    const fin = new Date(inicio);
    fin.setDate(fin.getDate() + 6);
    fin.setHours(23, 59, 59, 999);
    return { inicio, fin };
  }

  if (intervaloMeta === "mensual") {
    // Inicio: Primer día del mes actual
    const inicio = new Date(fecha);
    inicio.setDate(1);
    
    // Fin: Último día del mes actual
    const fin = new Date(inicio);
    fin.setMonth(fin.getMonth() + 1);
    fin.setDate(0); // Último día del mes anterior (que es el último día del mes actual)
    fin.setHours(23, 59, 59, 999);
    return { inicio, fin };
  }

  // diario
  if (intervaloMeta === "diario") {
    const inicio = new Date(fecha);
    const fin = new Date(fecha);
    fin.setHours(23, 59, 59, 999);
    return { inicio, fin };
  }

  return null;
}

/**
 * Genera todos los intervalos futuros para un hábito
 */
function generarIntervalosFuturos(
  intervaloMeta: string,
  fechaInicio: Date,
  cantidadMeses: number = 6
): Array<{ inicio: Date; fin: Date }> {
  const intervalos: Array<{ inicio: Date; fin: Date }> = [];
  const fechaActual = new Date(fechaInicio);
  fechaActual.setHours(0, 0, 0, 0);

  if (intervaloMeta === "diario") {
    // Para hábitos diarios, generar los próximos 90 días
    for (let i = 0; i < 90; i++) {
      const periodo = getPeriodDates(intervaloMeta, fechaActual);
      if (periodo) {
        intervalos.push(periodo);
        fechaActual.setDate(fechaActual.getDate() + 1);
      }
    }
  } else if (intervaloMeta === "semanal") {
    // Para hábitos semanales, generar las próximas semanas (aproximadamente 6 meses = 26 semanas)
    const semanasTotales = cantidadMeses * 4;
    for (let i = 0; i < semanasTotales; i++) {
      const periodo = getPeriodDates(intervaloMeta, fechaActual);
      if (periodo) {
        intervalos.push(periodo);
        // Avanzar al siguiente lunes
        fechaActual.setDate(fechaActual.getDate() + 7);
      }
    }
  } else if (intervaloMeta === "mensual") {
    // Para hábitos mensuales, generar los próximos meses
    for (let i = 0; i < cantidadMeses; i++) {
      const periodo = getPeriodDates(intervaloMeta, fechaActual);
      if (periodo) {
        intervalos.push(periodo);
        // Avanzar al siguiente mes
        fechaActual.setMonth(fechaActual.getMonth() + 1);
        fechaActual.setDate(1);
      }
    }
  }

  return intervalos;
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
    
    if (!periodoInfo) {
        console.error("No se pudo calcular el período para el hábito");
        return habitoCreado;
    }

    // Generar todos los intervalos futuros (6 meses hacia adelante)
    const intervalosFuturos = generarIntervalosFuturos(
        habitoCreado.intervalo_meta,
        periodoInfo.inicio,
        6
    );

    // Crear todos los registros de intervalo
    const registrosParaInsertar = intervalosFuturos.map(periodo => ({
        id_habito: habitoCreado.id_habito,
        fecha: toDateString(periodo.inicio),
        fecha_inicio_intervalo: toDateString(periodo.inicio),
        fecha_fin_intervalo: toDateString(periodo.fin),
        cumplido: false,
        puntos: 0,
        progreso: 0,
        cumplido_periodo_anterior: false,
    }));

    // Insertar todos los registros de intervalo
    const { data: registrosCreados, error: errorRegistro } = await supabase
        .from("registro_intervalo")
        .insert(registrosParaInsertar)
        .select();

    if (errorRegistro) {
        console.error("Error creando registros de intervalo:", errorRegistro);
        // No lanzamos error para no bloquear la creación del hábito
    }

    // Usar el primer registro para la racha inicial
    const registroInicial = registrosCreados && registrosCreados.length > 0 ? registrosCreados[0] : null;

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