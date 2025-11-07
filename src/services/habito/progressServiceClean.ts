import { supabase } from "../../config/supabase";
import { shouldResetProgress } from "../../utils/progressResetUtils";
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

    // Si completó el hábito, actualizamos su racha
    let infoRacha: ProgressResponse['rachaInfo'] | undefined;
    
    if (habitoCompletado) {
      const resultadoRacha = await updateRachaOnHabitCompletion(
        registroId,
        idHabito,
        intervaloMeta
      );
      
      if (resultadoRacha.success) {
        infoRacha = {
          diasConsecutivos: resultadoRacha.diasConsecutivos,
          isNewRacha: resultadoRacha.isNewRacha,
          rachaMessage: resultadoRacha.message,
        };
      }
    } else {
      // Si no completó, revisamos si hay rachas que deben expirar
      await checkAndDeactivateExpiredRachas(idHabito, intervaloMeta);
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
 */
export async function getHabitCurrentProgress(
  idHabito: string,
  intervaloMeta: string
): Promise<number> {
  try {
    const { data: registros, error } = await supabase
      .from("registro_intervalo")
      .select("*")
      .eq("id_habito", idHabito)
      .order("fecha", { ascending: false })
      .limit(1);

    if (error) throw error;

    if (!registros || registros.length === 0) {
      return 0; // No hay registros todavía
    }

    const ultimoRegistro = registros[0];
    const hoy = new Date();
    hoy.setUTCHours(0, 0, 0, 0);

    const fechaUltimoRegistro = new Date(ultimoRegistro.fecha);
    fechaUltimoRegistro.setUTCHours(0, 0, 0, 0);

    // Si debe resetearse, no hay progreso
    if (shouldResetProgress(intervaloMeta as any, ultimoRegistro.fecha)) {
      return 0;
    }

    // Si estamos en el mismo período, devolvemos el progreso actual
    if (estamosEnElMismoPeriodo(fechaUltimoRegistro, hoy, intervaloMeta)) {
      return ultimoRegistro.puntos || 0;
    }

    return 0; // No hay progreso para el período actual
  } catch (error: any) {
    console.error("No pudimos obtener el progreso:", error);
    return 0;
  }
}

// Funciones auxiliares que hacen el trabajo pesado

async function obtenerProgresoActual(idHabito: string, intervaloMeta: string) {
  const { data: registros, error } = await supabase
    .from("registro_intervalo")
    .select("*")
    .eq("id_habito", idHabito)
    .order("fecha", { ascending: false })
    .limit(1);

  if (error) throw error;

  const hoy = new Date();
  hoy.setUTCHours(0, 0, 0, 0);

  let currentProgress = 0;
  let lastRegistro: IRegistroIntervalo | null = null;

  if (registros && registros.length > 0) {
    lastRegistro = registros[0];
    if (lastRegistro) {
      const fechaUltimoRegistro = new Date(lastRegistro.fecha);
      fechaUltimoRegistro.setUTCHours(0, 0, 0, 0);

      // ¿Necesitamos resetear el progreso?
      if (shouldResetProgress(intervaloMeta as any, lastRegistro.fecha)) {
        currentProgress = 0;
      } else if (estamosEnElMismoPeriodo(fechaUltimoRegistro, hoy, intervaloMeta)) {
        // Estamos en el mismo período, seguimos sumando
        currentProgress = lastRegistro.puntos || 0;
      } else {
        currentProgress = 0;
      }
    }
  }

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
  lastRegistro: IRegistroIntervalo | null,
  intervaloMeta: string,
  newProgress: number,
  habitoCompletado: boolean
): Promise<string> {
  
  const hoy = new Date();
  hoy.setUTCHours(0, 0, 0, 0);

  // Si ya hay un registro del mismo período, lo actualizamos
  if (lastRegistro && estamosEnElMismoPeriodo(new Date(lastRegistro.fecha), hoy, intervaloMeta)) {
    const { error } = await supabase
      .from("registro_intervalo")
      .update({
        puntos: newProgress,
        cumplido: habitoCompletado,
      })
      .eq("id_registro", lastRegistro.id_registro);

    if (error) throw error;
    return lastRegistro.id_registro;
  } else {
    // Creamos un nuevo registro para este período
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

    if (error) throw error;
    return nuevoRegistro.id_registro;
  }
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
function estamosEnElMismoPeriodo(fecha1: Date, fecha2: Date, intervalo: string): boolean {
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
}