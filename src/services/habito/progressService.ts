import { supabase } from "../../config/supabase";
// import { shouldResetProgress } from "../../utils/progressResetUtils"; // No usado actualmente
import { updateRachaOnHabitCompletion, checkAndDeactivateExpiredRachas } from "../racha/rachaAutoService";
import type { IRegistroIntervalo } from "../../types/IRegistroIntervalo";

// Esto es lo que devolvemos cuando alguien avanza en un hábito
export interface ProgressResponse {
  success: boolean;
  newProgress: number;
  pointsAdded: number;
  message: string;
  isComplete: boolean;
  rachaInfo?: {
    diasConsecutivos: number;
    isNewRacha: boolean;
    rachaMessage: string;
  };
}

/**
 * Esta función se ejecuta cuando alguien presiona el botón "Avanzar" en un hábito
 * Maneja todo: registrar el progreso, dar puntos y actualizar rachas
 */
export async function recordHabitProgress(
  idHabito: string,
  idPerfil: string,
  intervaloMeta: string,
  metaRepeticion: number,
  dificultad: string = 'medio'
): Promise<ProgressResponse> {
  try {
    // Primero vemos cuál es el progreso actual del usuario
    const { currentProgress, lastRegistro } = await obtenerProgresoActual(idHabito, intervaloMeta);

    // Calculamos el nuevo progreso
    const newProgress = currentProgress + 1;

    // Verificamos si ya completó el hábito para este período
    if (newProgress > metaRepeticion) {
      return {
        success: false,
        newProgress: currentProgress,
        pointsAdded: 0,
        message: `Ya completaste este hábito para este período. ¡Buen trabajo! 💪`,
        isComplete: true,
      };
    }

    const habitoCompletado = newProgress >= metaRepeticion;

    // Calculamos cuántos puntos darle según la dificultad
    const puntosBase = calcularPuntosPorDificultad(dificultad);
    const puntosADar = habitoCompletado ? puntosBase * 2 : puntosBase; // Doble puntos si completa

    // Guardamos el registro del progreso
    const registroId = await guardarRegistroProgreso(
      idHabito,
      lastRegistro,
      intervaloMeta,
      newProgress,
      habitoCompletado
    );

    // Le damos puntos al usuario
    await actualizarPuntosUsuario(idPerfil, puntosADar);

    // Actualizamos la racha en CADA avance, no solo cuando se completa
    let infoRacha: ProgressResponse['rachaInfo'] | undefined;

    // PRIMERO: Revisamos si hay rachas que deben expirar (ANTES de actualizar)
    console.log("🔍 Verificando rachas expiradas ANTES de actualizar...");
    await checkAndDeactivateExpiredRachas(idHabito, intervaloMeta);

    // DESPUÉS: Actualizar la racha en cada click
    console.log("📈 Actualizando racha para hábito:", idHabito);
    const resultadoRacha = await updateRachaOnHabitCompletion(
      registroId,
      idHabito,
      intervaloMeta,
      habitoCompletado,
      metaRepeticion
    );

    console.log("Resultado de actualización de racha:", resultadoRacha);

    if (resultadoRacha.success && resultadoRacha.racha) {
      infoRacha = {
        diasConsecutivos: resultadoRacha.diasConsecutivos,
        isNewRacha: resultadoRacha.isNewRacha,
        rachaMessage: resultadoRacha.message,
      };
      console.log("Info de racha creada:", infoRacha);
    }

    // Creamos el mensaje para mostrar al usuario
    let mensaje = habitoCompletado
      ? `¡Felicidades! Completaste tu hábito y ganaste ${puntosADar} puntos 🎉`
      : `¡Buen progreso! Ganaste ${puntosADar} puntos`;

    if (infoRacha) {
      mensaje += ` ${infoRacha.rachaMessage}`;
    }

    return {
      success: true,
      newProgress,
      pointsAdded: puntosADar,
      message: mensaje,
      isComplete: habitoCompletado,
      rachaInfo: infoRacha,
    };

  } catch (error: any) {
    console.error("Error al registrar progreso:", error);
    throw new Error(error?.message || "No pudimos registrar tu progreso");
  }
}

/**
 * Esta función obtiene cuánto progreso lleva un hábito en su período actual
 * La usa el dashboard para mostrar la barra de progreso
 * NUEVA LÓGICA: Cuenta los registros del período actual
 */
export async function getHabitCurrentProgress(
  idHabito: string,
  intervaloMeta: string
): Promise<number> {
  try {
    const hoy = new Date();
    hoy.setUTCHours(0, 0, 0, 0);

    // Calcular el inicio del período actual según el intervalo
    const inicioPeriodo = calcularInicioPeriodo(hoy, intervaloMeta);

    // Contar TODOS los registros desde el inicio del período hasta hoy
    const { data: registros, error } = await supabase
      .from("registro_intervalo")
      .select("*", { count: 'exact' })
      .eq("id_habito", idHabito)
      .gte("fecha", inicioPeriodo.toISOString())
      .lte("fecha", hoy.toISOString());

    if (error) {
      console.error("Error al obtener progreso:", error);
      return 0;
    }

    const progresoActual = registros ? registros.length : 0;
    console.log(`Progreso actual del hábito ${idHabito}: ${progresoActual} registros`);
    return progresoActual;

  } catch (error: any) {
    console.error("No pudimos obtener el progreso:", error);
    return 0;
  }
}

// Función auxiliar para calcular el inicio del período
function calcularInicioPeriodo(fecha: Date, intervaloMeta: string): Date {
  const inicio = new Date(fecha);
  inicio.setUTCHours(0, 0, 0, 0);

  if (intervaloMeta === 'diario') {
    // Para diario, el inicio es el mismo día
    return inicio;
  } else if (intervaloMeta === 'semanal') {
    // Para semanal, el inicio es el lunes de esta semana
    const diaSemana = inicio.getDay();
    const diasDesdeInicio = diaSemana === 0 ? 6 : diaSemana - 1;
    inicio.setDate(inicio.getDate() - diasDesdeInicio);
    return inicio;
  } else if (intervaloMeta === 'mensual') {
    // Para mensual, el inicio es el día 1 del mes
    inicio.setDate(1);
    return inicio;
  }

  return inicio;
}

// Funciones auxiliares que hacen el trabajo pesado

async function obtenerProgresoActual(idHabito: string, intervaloMeta: string) {
  const hoy = new Date();
  hoy.setUTCHours(0, 0, 0, 0);

  // Calcular el inicio del período actual
  const inicioPeriodo = calcularInicioPeriodo(hoy, intervaloMeta);

  // Contar TODOS los registros del período actual
  const { data: registros, error } = await supabase
    .from("registro_intervalo")
    .select("*")
    .eq("id_habito", idHabito)
    .gte("fecha", inicioPeriodo.toISOString())
    .lte("fecha", hoy.toISOString())
    .order("fecha", { ascending: false });

  if (error) throw error;

  // El progreso actual es el número de registros en este período
  const currentProgress = registros ? registros.length : 0;
  const lastRegistro = registros && registros.length > 0 ? registros[0] : null;

  console.log(`Progreso actual en obtenerProgresoActual: ${currentProgress}`);
  return { currentProgress, lastRegistro };
}

function calcularPuntosPorDificultad(dificultad: string): number {
  // Puntos base según qué tan difícil sea el hábito
  if (dificultad === 'facil') return 3;
  if (dificultad === 'medio') return 5;
  if (dificultad === 'dificil') return 8;
  return 5; // Por defecto
}

async function guardarRegistroProgreso(
  idHabito: string,
  _lastRegistro: IRegistroIntervalo | null, // Prefijo _ indica parámetro no usado
  _intervaloMeta: string, // No usado actualmente
  newProgress: number,
  habitoCompletado: boolean
): Promise<string> {

  const hoy = new Date();
  hoy.setUTCHours(0, 0, 0, 0);

  // SIEMPRE creamos un nuevo registro por cada avance (cada clic cuenta)
  const { data: nuevoRegistro, error } = await supabase
    .from("registro_intervalo")
    .insert({
      id_habito: idHabito,
      fecha: hoy,
      cumplido: habitoCompletado,
      puntos: newProgress,
      notas: "",
    })
    .select()
    .single();

  if (error) {
    console.error("Error al guardar registro:", error);
    throw error;
  }

  console.log("Nuevo registro creado:", nuevoRegistro.id_registro);
  return nuevoRegistro.id_registro;
}

async function actualizarPuntosUsuario(idPerfil: string, puntosADar: number): Promise<void> {
  // Primero vemos cuántos puntos tiene ahora
  const { data: perfil, error: perfilError } = await supabase
    .from("perfil")
    .select("puntos")
    .eq("id", idPerfil)
    .single();

  if (perfilError) throw perfilError;

  const puntosActuales = perfil?.puntos || 0;
  const puntosTotales = puntosActuales + puntosADar;

  // Le sumamos los nuevos puntos
  const { error } = await supabase
    .from("perfil")
    .update({ puntos: puntosTotales })
    .eq("id", idPerfil);

  if (error) throw error;
}

// Esta función decide si dos fechas están en el mismo período
// Comentada temporalmente - no se usa actualmente pero puede ser útil en el futuro
/* function estamosEnElMismoPeriodo(fecha1: Date, fecha2: Date, intervalo: string): boolean {
  const d1 = new Date(fecha1);
  const d2 = new Date(fecha2);

  if (intervalo === 'diario') {
    // Mismo día
    return d1.toDateString() === d2.toDateString();
  } else if (intervalo === 'semanal') {
    // Misma semana (lunes a domingo)
    const inicioSemana = (fecha: Date) => {
      const d = new Date(fecha);
      const dia = d.getDay();
      const diferencia = d.getDate() - dia + (dia === 0 ? -6 : 1); // Lunes como primer día
      return new Date(d.setDate(diferencia));
    };
    return inicioSemana(d1).toDateString() === inicioSemana(d2).toDateString();
  } else if (intervalo === 'mensual') {
    // Mismo mes y año
    return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth();
  }

  return false;
} */
