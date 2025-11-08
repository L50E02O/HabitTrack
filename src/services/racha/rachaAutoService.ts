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
 * Esta función se ejecuta cuando se COMPLETA un hábito
 * NUEVA LÓGICA:
 * - Diaria: Se llama solo cuando se completa el objetivo del día
 * - Semanal: Se llama cuando se completa el objetivo, actualiza semanas con avances
 * - Mensual: Se llama cuando se completa el objetivo, actualiza meses con avances
 */
export async function updateRachaOnHabitCompletion(
  idRegistroIntervalo: string,
  idHabito: string,
  intervaloMeta: string,
  habitoCompletado?: boolean,
  metaRepeticion?: number
): Promise<RachaUpdateResult> {
  try {
    // Obtener información del hábito si no se proporcionó
    if (habitoCompletado === undefined || metaRepeticion === undefined) {
      const { data: habito, error: habitoError } = await supabase
        .from("habito")
        .select("meta_repeticion, intervalo_meta")
        .eq("id_habito", idHabito)
        .single();

      if (habitoError) throw habitoError;

      metaRepeticion = habito.meta_repeticion;
      intervaloMeta = habito.intervalo_meta;
      habitoCompletado = true; // Si se llama esta función, es porque se completó
    }

    // Primero buscamos si ya tiene una racha activa para este hábito
    const rachaActual = await buscarRachaActiva(idHabito);

    const hoy = new Date();
    hoy.setUTCHours(0, 0, 0, 0);

    // Asegurar que metaRepeticion tiene un valor
    const metaFinal = metaRepeticion || 1;

    // Calculamos cuántos períodos consecutivos lleva
    const periodosConsecutivos = await calcularPeriodosConsecutivos(
      idHabito,
      intervaloMeta,
      hoy,
      metaFinal
    );

    // Si no tiene racha, creamos una nueva
    if (!rachaActual) {
      return await crearNuevaRacha(idRegistroIntervalo, null, periodosConsecutivos, intervaloMeta);
    } else if (seRompioLaRacha(rachaActual, hoy, intervaloMeta)) {
      // Si la racha se rompió por tiempo, creamos una nueva
      return await crearNuevaRacha(idRegistroIntervalo, rachaActual, periodosConsecutivos, intervaloMeta);
    } else {
      // Si la racha sigue activa, la extendemos
      return await extenderRacha(rachaActual, idRegistroIntervalo, hoy, periodosConsecutivos, intervaloMeta);
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
  try {
    // Primero obtenemos todos los registros_intervalo de este hábito
    const { data: registros, error: errorRegistros } = await supabase
      .from("registro_intervalo")
      .select("id_registro")
      .eq("id_habito", idHabito);

    if (errorRegistros) {
      console.error("❌ Error al buscar registros:", errorRegistros);
      return null;
    }

    if (!registros || registros.length === 0) {
      return null;
    }

    // Extraer los IDs de los registros
    const idsRegistros = registros.map(r => r.id_registro);

    // Buscar rachas activas para estos registros
    const { data: rachas, error } = await supabase
      .from("racha")
      .select("*")
      .in("id_registro_intervalo", idsRegistros)
      .eq("racha_activa", true)
      .order("fin_racha", { ascending: false })
      .limit(1);

    if (error) {
      console.error("❌ Error al buscar racha activa:", error);
      return null;
    }

    if (!rachas || rachas.length === 0) {
      return null; // No hay racha activa
    } return rachas[0];
  } catch (error) {
    console.error("💥 Error en buscarRachaActiva:", error);
    return null;
  }
}

// Cuenta períodos consecutivos según el tipo de intervalo
// IMPORTANTE: Cuenta TODOS los registros del hábito
async function calcularPeriodosConsecutivos(
  idHabito: string,
  _intervaloMeta: string,
  _fechaHoy: Date,
  _metaRepeticion: number
): Promise<number> {
  // Obtener TODOS los registros del hábito (sin filtrar por cumplido)
  const { data: registros, error } = await supabase
    .from("registro_intervalo")
    .select("fecha")
    .eq("id_habito", idHabito)
    .order("fecha", { ascending: false });

  console.log(`📊 Total de registros para hábito ${idHabito}:`, registros?.length || 0);

  if (error) {
    console.error("❌ Error al contar registros:", error);
    return 1;
  }

  if (!registros || registros.length === 0) {
    console.log("📍 Este es el primer registro");
    return 1;
  }

  // Simplemente contar cuántos registros hay
  const totalRegistros = registros.length;
  console.log(`🔥 Racha actual: ${totalRegistros} registros`);

  return totalRegistros;
}

// Revisa si la racha se rompió porque pasó mucho tiempo
function seRompioLaRacha(racha: IRacha, _fechaHoy: Date, intervaloMeta: string): boolean {
  const ultimaFecha = new Date(racha.fin_racha);
  const ahora = new Date();

  // Calcular la diferencia en milisegundos
  const diferenciaMs = ahora.getTime() - ultimaFecha.getTime();

  // Tiempos de expiración según el tipo de intervalo
  if (intervaloMeta === 'diario') {
    // 1 día = 24 horas
    const unDiaEnMs = 24 * 60 * 60 * 1000;
    return diferenciaMs > unDiaEnMs;
  } else if (intervaloMeta === 'semanal') {
    // 7 días
    const sieteDiasEnMs = 7 * 24 * 60 * 60 * 1000;
    return diferenciaMs > sieteDiasEnMs;
  } else if (intervaloMeta === 'mensual') {
    // 31 días
    const treintaYUnDiasEnMs = 31 * 24 * 60 * 60 * 1000;
    return diferenciaMs > treintaYUnDiasEnMs;
  }

  return false;
}

// Crea una racha completamente nueva
async function crearNuevaRacha(
  idRegistroIntervalo: string,
  rachaAnterior: IRacha | null,
  periodosConsecutivos: number,
  intervaloMeta: string
): Promise<RachaUpdateResult> {

  const hoy = new Date();
  hoy.setUTCHours(0, 0, 0, 0);

  const nuevaRacha: CreateIRacha = {
    id_registro_intervalo: idRegistroIntervalo,
    inicio_racha: hoy,
    fin_racha: hoy,
    dias_consecutivos: periodosConsecutivos,
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

  // Crear mensaje según el tipo de intervalo
  const unidad = obtenerUnidadTiempo(intervaloMeta);
  const mensaje = `¡Empezaste una nueva racha! Llevas ${periodosConsecutivos} ${unidad}${periodosConsecutivos > 1 ? 's' : ''} 🔥`;

  return {
    success: true,
    racha: rachaCreada,
    diasConsecutivos: periodosConsecutivos,
    message: mensaje,
    isNewRacha: true,
  };
}

// Continúa una racha que ya existía
async function extenderRacha(
  racha: IRacha,
  idRegistroIntervalo: string,
  fechaHoy: Date,
  periodosConsecutivos: number,
  intervaloMeta: string
): Promise<RachaUpdateResult> {

  const datosActualizados: UpdateIRacha = {
    fin_racha: fechaHoy,
    dias_consecutivos: periodosConsecutivos,
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

  // Crear mensaje según el tipo de intervalo
  const unidad = obtenerUnidadTiempo(intervaloMeta);
  const mensaje = `¡Sigue así! Ya llevas ${periodosConsecutivos} ${unidad}${periodosConsecutivos > 1 ? 's' : ''} consecutivos 💪`;

  return {
    success: true,
    racha: rachaActualizada,
    diasConsecutivos: periodosConsecutivos,
    message: mensaje,
    isNewRacha: false,
  };
}

// Funciones que ayudan con las fechas

function obtenerUnidadTiempo(intervaloMeta: string): string {
  if (intervaloMeta === 'diario') return 'día';
  if (intervaloMeta === 'semanal') return 'semana';
  if (intervaloMeta === 'mensual') return 'mes';
  return 'período';
}

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
 * Lee directamente desde la tabla `racha` en la base de datos
 */
export async function getRachasMultiplesHabitos(idsHabitos: string[]): Promise<Record<string, number>> {
  try {
    if (idsHabitos.length === 0) return {};

    const rachasMap: Record<string, number> = {};

    // Inicializar todos los hábitos en 0
    idsHabitos.forEach(id => {
      rachasMap[id] = 0;
    });

    // Obtener todos los registros_intervalo de estos hábitos
    const { data: registros, error: errorRegistros } = await supabase
      .from("registro_intervalo")
      .select("id_registro, id_habito")
      .in("id_habito", idsHabitos);

    if (errorRegistros) {
      console.error("❌ Error al buscar registros:", errorRegistros);
      return rachasMap;
    }

    if (!registros || registros.length === 0) {
      console.log("⚠️ No hay registros para estos hábitos");
      return rachasMap;
    }

    console.log(`📝 Registros encontrados para ${idsHabitos.length} hábitos:`, registros.length);

    // Crear un mapa de id_registro -> id_habito
    const registroToHabito: Record<string, string> = {};
    registros.forEach(reg => {
      registroToHabito[reg.id_registro] = reg.id_habito;
    });

    const idsRegistros = registros.map(r => r.id_registro);

    // Obtener todas las rachas activas de estos registros
    const { data: rachas, error } = await supabase
      .from("racha")
      .select("id_racha, dias_consecutivos, racha_activa, id_registro_intervalo")
      .in("id_registro_intervalo", idsRegistros)
      .eq("racha_activa", true);

    if (error) {
      console.error("Error al obtener rachas:", error);
      return rachasMap;
    }

    // Actualizar el mapa con las rachas activas encontradas
    if (rachas && rachas.length > 0) {
      rachas.forEach((racha: any) => {
        const idHabito = registroToHabito[racha.id_registro_intervalo];
        if (idHabito) {
          rachasMap[idHabito] = racha.dias_consecutivos;
        }
      });
    }

    console.log("Rachas obtenidas desde BD:", rachasMap);
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

/**
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
    if (!rachaActiva) {
      return; // No hay nada que desactivar
    }

    const fechaHoy = new Date();
    fechaHoy.setUTCHours(0, 0, 0, 0);

    const seRompio = seRompioLaRacha(rachaActiva, fechaHoy, intervaloMeta);

    if (seRompio) {
      const { error } = await supabase
        .from("racha")
        .update({ racha_activa: false })
        .eq("id_racha", rachaActiva.id_racha);

      if (error) {
        console.error("Error al desactivar racha expirada:", error);
      }
    }
  } catch (error: any) {
    console.error("Error al verificar rachas expiradas:", error);
  }
}