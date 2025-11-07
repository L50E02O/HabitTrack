import { supabase } from "../../config/supabase";
import type { IRacha, CreateIRacha, UpdateIRacha } from "../../types/IRacha";

// Cuando el usuario completa un hábito, necesitamos decidir qué hacer con su racha
export interface RachaUpdateResult {
  success: boolean;
  racha: IRacha | null;
  diasConsecutivos: number;
  message: string;
  isNewRacha: boolean;
}

/**
 * Esta función se ejecuta cada vez que alguien avanza en un hábito
 * Crea o actualiza la racha con cada avance
 */
export async function updateRachaOnHabitCompletion(
  idRegistroIntervalo: string,
  idHabito: string,
  intervaloMeta: string
): Promise<RachaUpdateResult> {
  try {
    // Primero buscamos si ya tiene una racha activa para este hábito
    const rachaActual = await buscarRachaActiva(idHabito);

    const hoy = new Date();
    hoy.setUTCHours(0, 0, 0, 0);

    // Calculamos cuántos avances lleva (cada clic cuenta)
    const diasConsecutivos = await calcularDiasConsecutivos(idHabito, intervaloMeta, hoy);

    // Si no tiene racha, creamos una nueva
    if (!rachaActual) {
      return await crearNuevaRacha(idRegistroIntervalo, null, diasConsecutivos, intervaloMeta);
    } else {
      // Si ya tiene racha, la actualizamos
      return await extenderRacha(rachaActual, idRegistroIntervalo, hoy, diasConsecutivos, intervaloMeta);
    }

  } catch (error: any) {
    console.error("Algo salió mal al actualizar la racha:", error);
    return {
      success: false,
      racha: null,
      diasConsecutivos: 0,
      message: "No pudimos actualizar tu racha, pero el hábito sí se guardó",
      isNewRacha: false,
    };
  }
}

// Esta función busca la racha que está activa actualmente
async function buscarRachaActiva(idHabito: string): Promise<IRacha | null> {
  const { data: rachas, error } = await supabase
    .from("racha")
    .select(`
      *,
      registro_intervalo!inner(id_habito)
    `)
    .eq("registro_intervalo.id_habito", idHabito)
    .eq("racha_activa", true)
    .order("fin_racha", { ascending: false })
    .limit(1);

  if (error || !rachas || rachas.length === 0) {
    return null; // No hay racha activa
  }

  return rachas[0];
}

// Cuenta días consecutivos con límite de 24 horas entre registros
async function calcularDiasConsecutivos(idHabito: string, _intervaloMeta: string, _fechaHoy: Date): Promise<number> {
  // Obtener todos los registros ordenados por fecha
  const { data: registros, error } = await supabase
    .from("registro_intervalo")
    .select("fecha")
    .eq("id_habito", idHabito)
    .order("fecha", { ascending: false })
    .limit(100);

  console.log(`Registros encontrados para hábito ${idHabito}:`, registros?.length || 0);

  if (error) {
    console.error("Error al contar registros:", error);
    return 1;
  }

  if (!registros || registros.length === 0) {
    return 1; // Este es el primer avance
  }

  // Calcular días consecutivos usando la función auxiliar
  const diasConsecutivos = calcularDiasConsecutivosConLimite24h(registros);

  console.log(`Total de días consecutivos calculados: ${diasConsecutivos}`);

  return Math.max(1, diasConsecutivos);
}// Revisa si la racha se rompió porque pasó mucho tiempo
function seRompioLaRacha(racha: IRacha, fechaHoy: Date, intervaloMeta: string): boolean {
  const ultimaFecha = new Date(racha.fin_racha);
  ultimaFecha.setUTCHours(0, 0, 0, 0);

  const fechaEsperada = calcularFechaSiguiente(ultimaFecha, intervaloMeta);

  // Si hoy es después de cuando esperábamos el siguiente registro, se rompió
  return fechaHoy.getTime() > fechaEsperada.getTime();
}

// Crea una racha completamente nueva
async function crearNuevaRacha(
  idRegistroIntervalo: string,
  rachaAnterior: IRacha | null,
  diasConsecutivos: number,
  _intervaloMeta: string // No usado actualmente
): Promise<RachaUpdateResult> {

  const hoy = new Date();
  hoy.setUTCHours(0, 0, 0, 0);

  const nuevaRacha: CreateIRacha = {
    id_registro_intervalo: idRegistroIntervalo,
    inicio_recha: hoy, // Mantengo el typo del interface original
    fin_racha: hoy,
    dias_consecutivos: diasConsecutivos,
    racha_activa: true,
  };

  const { data: rachaCreada, error } = await supabase
    .from("racha")
    .insert(nuevaRacha)
    .select()
    .single();

  if (error) throw error;

  // Si había una racha anterior, la desactivamos
  if (rachaAnterior) {
    await supabase
      .from("racha")
      .update({ racha_activa: false })
      .eq("id_racha", rachaAnterior.id_racha);
  }

  return {
    success: true,
    racha: rachaCreada,
    diasConsecutivos,
    message: `¡Empezaste una nueva racha! Llevas ${diasConsecutivos} día${diasConsecutivos > 1 ? 's' : ''} 🔥`,
    isNewRacha: true,
  };
}

// Continúa una racha que ya existía
async function extenderRacha(
  racha: IRacha,
  idRegistroIntervalo: string,
  fechaHoy: Date,
  diasConsecutivos: number,
  _intervaloMeta: string // No usado actualmente
): Promise<RachaUpdateResult> {

  const datosActualizados: UpdateIRacha = {
    fin_racha: fechaHoy,
    dias_consecutivos: diasConsecutivos,
    id_registro_intervalo: idRegistroIntervalo,
  };

  const { error } = await supabase
    .from("racha")
    .update(datosActualizados)
    .eq("id_racha", racha.id_racha);

  if (error) throw error;

  // Traemos la racha actualizada
  const { data: rachaActualizada, error: fetchError } = await supabase
    .from("racha")
    .select("*")
    .eq("id_racha", racha.id_racha)
    .single();

  if (fetchError) throw fetchError;

  return {
    success: true,
    racha: rachaActualizada,
    diasConsecutivos,
    message: `¡Sigue así! Ya llevas ${diasConsecutivos} día${diasConsecutivos > 1 ? 's' : ''} consecutivos 💪`,
    isNewRacha: false,
  };
}

// Funciones que ayudan con las fechas
// Comentadas temporalmente - no se usan actualmente

/* function calcularFechaAnterior(fecha: Date, intervaloMeta: string): Date {
  const fechaAnterior = new Date(fecha);

  if (intervaloMeta === 'diario') {
    fechaAnterior.setDate(fechaAnterior.getDate() - 1);
  } else if (intervaloMeta === 'semanal') {
    fechaAnterior.setDate(fechaAnterior.getDate() - 7);
  } else if (intervaloMeta === 'mensual') {
    fechaAnterior.setMonth(fechaAnterior.getMonth() - 1);
  }

  return fechaAnterior;
} */

function calcularFechaSiguiente(fecha: Date, intervaloMeta: string): Date {
  const fechaSiguiente = new Date(fecha);

  if (intervaloMeta === 'diario') {
    fechaSiguiente.setDate(fechaSiguiente.getDate() + 1);
  } else if (intervaloMeta === 'semanal') {
    fechaSiguiente.setDate(fechaSiguiente.getDate() + 7);
  } else if (intervaloMeta === 'mensual') {
    fechaSiguiente.setMonth(fechaSiguiente.getMonth() + 1);
  }

  return fechaSiguiente;
}

/* function obtenerUnidadTiempo(intervaloMeta: string): string {
  if (intervaloMeta === 'diario') return 'días';
  if (intervaloMeta === 'semanal') return 'semanas';
  if (intervaloMeta === 'mensual') return 'meses';
  return 'períodos';
} */

// Funciones públicas que usan otros archivos

/**
 * Busca cuántos días de racha tiene un hábito específico
 */
export async function getDiasRachaByHabito(idHabito: string): Promise<number> {
  try {
    const rachaActiva = await buscarRachaActiva(idHabito);
    return rachaActiva ? rachaActiva.dias_consecutivos : 0;
  } catch (error: any) {
    console.error("No pudimos obtener los días de racha:", error);
    return 0;
  }
}

/**
 * Busca las rachas de varios hábitos de una vez
 * NUEVA LÓGICA: Calcula rachas basándose en días consecutivos (1 minuto para pruebas)
 * La racha NO se reinicia si el hábito fue completado exitosamente
 */
export async function getRachasMultiplesHabitos(idsHabitos: string[]): Promise<Record<string, number>> {
  try {
    if (idsHabitos.length === 0) return {};

    const rachasMap: Record<string, number> = {};

    // Para cada hábito, calculamos su racha de días consecutivos
    for (const idHabito of idsHabitos) {
      try {
        // Obtener información del hábito para saber si fue completado
        const { data: habito, error: habitoError } = await supabase
          .from("habito")
          .select("meta_repeticion, intervalo_meta")
          .eq("id_habito", idHabito)
          .single();

        if (habitoError) {
          console.error(`Error al obtener hábito ${idHabito}:`, habitoError);
          rachasMap[idHabito] = 0;
          continue;
        }

        const { data: registros, error } = await supabase
          .from("registro_intervalo")
          .select("fecha, cumplido")
          .eq("id_habito", idHabito)
          .order("fecha", { ascending: false })
          .limit(100);

        if (error) {
          console.error(`Error al obtener registros para hábito ${idHabito}:`, error);
          rachasMap[idHabito] = 0;
          continue;
        }

        if (!registros || registros.length === 0) {
          rachasMap[idHabito] = 0;
          continue;
        }

        // Calcular días consecutivos (verificando si el hábito fue completado)
        const diasConsecutivos = calcularDiasConsecutivosConLimite24hYCompletado(
          registros,
          habito.meta_repeticion,
          habito.intervalo_meta
        );
        rachasMap[idHabito] = diasConsecutivos;
        console.log(`Hábito ${idHabito}: ${diasConsecutivos} días de racha`);

      } catch (err) {
        console.error(`Error procesando hábito ${idHabito}:`, err);
        rachasMap[idHabito] = 0;
      }
    }

    console.log("Rachas calculadas (días consecutivos):", rachasMap);
    return rachasMap;

  } catch (error: any) {
    console.error("No pudimos obtener las rachas:", error);
    const fallbackMap: Record<string, number> = {};
    idsHabitos.forEach(id => {
      fallbackMap[id] = 0;
    });
    return fallbackMap;
  }
}

// Nueva función: Calcula días consecutivos verificando si el hábito fue completado
function calcularDiasConsecutivosConLimite24hYCompletado(
  registros: Array<{ fecha: any; cumplido?: boolean }>,
  metaRepeticion: number,
  _intervaloMeta: string // No usado actualmente
): number {
  if (!registros || registros.length === 0) return 0;

  const ahora = new Date();
  const registroMasReciente = new Date(registros[0].fecha);

  // Calcular cuántos registros tiene el período actual
  const hoy = new Date();
  hoy.setUTCHours(0, 0, 0, 0);

  const registrosHoy = registros.filter(reg => {
    const fechaReg = new Date(reg.fecha);
    fechaReg.setUTCHours(0, 0, 0, 0);
    return fechaReg.getTime() === hoy.getTime();
  });

  const registrosHoyCount = registrosHoy.length;
  const habitoCompletado = registrosHoyCount >= metaRepeticion;

  // Si el hábito fue completado exitosamente, NO verificar el límite de tiempo
  if (habitoCompletado) {
    console.log(`✅ Hábito completado (${registrosHoyCount}/${metaRepeticion}). Racha NO se reinicia.`);
  } else {
    // Solo verificar el límite de 1 minuto si el hábito NO está completado
    const diferenciaMinutos = (ahora.getTime() - registroMasReciente.getTime()) / (1000 * 60);
    if (diferenciaMinutos > 1) {
      console.log(`⚠️ Racha rota: último registro hace ${diferenciaMinutos.toFixed(2)} minutos y NO completaste el hábito (${registrosHoyCount}/${metaRepeticion})`);
      return 0;
    }
    console.log(`✅ Racha activa: último registro hace ${diferenciaMinutos.toFixed(2)} minutos (${registrosHoyCount}/${metaRepeticion})`);
  }

  // Agrupar registros por día (fecha sin hora)
  const fechasUnicas = new Set<string>();
  registros.forEach(reg => {
    const fecha = new Date(reg.fecha);
    fecha.setUTCHours(0, 0, 0, 0);
    fechasUnicas.add(fecha.toISOString());
  });

  const diasUnicos = Array.from(fechasUnicas).sort().reverse();

  // Contar días consecutivos desde hoy hacia atrás
  let diasConsecutivos = 0;
  let fechaEsperada = new Date();
  fechaEsperada.setUTCHours(0, 0, 0, 0);

  for (const diaStr of diasUnicos) {
    const diaRegistro = new Date(diaStr);

    if (diaRegistro.getTime() === fechaEsperada.getTime()) {
      diasConsecutivos++;
      fechaEsperada.setDate(fechaEsperada.getDate() - 1);
    } else if (diaRegistro.getTime() < fechaEsperada.getTime()) {
      break;
    }
  }

  return diasConsecutivos;
}

// Función anterior (mantenerla por compatibilidad)
function calcularDiasConsecutivosConLimite24h(registros: Array<{ fecha: any }>): number {
  if (!registros || registros.length === 0) return 0;

  const ahora = new Date();
  const registroMasReciente = new Date(registros[0].fecha);

  // Si el último registro fue hace más de 1 MINUTO, la racha se rompió (para pruebas)
  const diferenciaMinutos = (ahora.getTime() - registroMasReciente.getTime()) / (1000 * 60);
  if (diferenciaMinutos > 1) {
    console.log(`⚠️ Racha rota: último registro hace ${diferenciaMinutos.toFixed(2)} minutos (límite: 1 minuto)`);
    return 0;
  }

  console.log(`✅ Racha activa: último registro hace ${diferenciaMinutos.toFixed(2)} minutos`);

  // Agrupar registros por día (fecha sin hora)
  const fechasUnicas = new Set<string>();
  registros.forEach(reg => {
    const fecha = new Date(reg.fecha);
    fecha.setUTCHours(0, 0, 0, 0);
    fechasUnicas.add(fecha.toISOString());
  });

  const diasUnicos = Array.from(fechasUnicas).sort().reverse();

  // Contar días consecutivos desde hoy hacia atrás
  let diasConsecutivos = 0;
  let fechaEsperada = new Date();
  fechaEsperada.setUTCHours(0, 0, 0, 0);

  for (const diaStr of diasUnicos) {
    const diaRegistro = new Date(diaStr);

    if (diaRegistro.getTime() === fechaEsperada.getTime()) {
      diasConsecutivos++;
      // Retroceder un día
      fechaEsperada.setDate(fechaEsperada.getDate() - 1);
    } else if (diaRegistro.getTime() < fechaEsperada.getTime()) {
      // Hay un salto de días, la racha se rompió
      break;
    }
  }

  return diasConsecutivos;
}/**
 * Obtiene la racha activa de un hábito (función pública)
 */
export async function getRachaActivaByHabito(idHabito: string): Promise<IRacha | null> {
  return await buscarRachaActiva(idHabito);
}

/**
 * Revisa y desactiva rachas que ya no son válidas
 * Se usa cuando alguien no completa un hábito en el tiempo esperado
 */
export async function checkAndDeactivateExpiredRachas(
  idHabito: string,
  intervaloMeta: string
): Promise<void> {
  try {
    const rachaActiva = await buscarRachaActiva(idHabito);
    if (!rachaActiva) return; // No hay nada que desactivar

    const fechaHoy = new Date();
    fechaHoy.setUTCHours(0, 0, 0, 0);

    if (seRompioLaRacha(rachaActiva, fechaHoy, intervaloMeta)) {
      await supabase
        .from("racha")
        .update({ racha_activa: false })
        .eq("id_racha", rachaActiva.id_racha);
    }
  } catch (error: any) {
    console.error("No pudimos verificar las rachas expiradas:", error);
  }
}