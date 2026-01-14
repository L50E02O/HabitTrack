import { supabase } from "../../config/supabase";
import type { IRegistroIntervalo } from "../../types/IRegistroIntervalo";

// Esto es lo que devolvemos cuando alguien avanza en un hábito
export interface ProgressResponse {
  success: boolean;
  newProgress: number;
  pointsAdded: number;
  message: string;
  isComplete: boolean;
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
  dificultad: string = 'medio',
  cantidad: number = 1
): Promise<ProgressResponse> {
  try {
    // Primero vemos cuál es el progreso actual del usuario
    const { currentProgress, lastRegistro } = await obtenerProgresoActual(idHabito, intervaloMeta);

    // Calculamos el nuevo progreso
    const newProgress = currentProgress + cantidad;

    // Verificamos si ya completó el hábito para este período
    if (newProgress > metaRepeticion) {
      return {
        success: false,
        newProgress: currentProgress,
        pointsAdded: 0,
        message: `Ya completaste este hábito para este período. Buen trabajo.`,
        isComplete: true,
      };
    }

    const habitoCompletado = newProgress >= metaRepeticion;

    // Calculamos cuántos puntos darle según la dificultad
    const puntosBase = calcularPuntosPorDificultad(dificultad);
    const puntosADar = habitoCompletado ? puntosBase * 2 : puntosBase; // Doble puntos si completa

    // Guardamos el registro del progreso
    await guardarRegistroProgreso(
      idHabito,
      lastRegistro,
      intervaloMeta,
      newProgress,
      habitoCompletado
    );

    // Le damos puntos al usuario
    await actualizarPuntosUsuario(idPerfil, puntosADar);

    // NOTA: La actualización de racha ahora es AUTOMÁTICA
    // El servicio autoProgressService verificará y actualizará la racha
    // cuando detecte que se alcanzó meta_repeticion
    console.log("Progreso registrado. La racha se actualizará automáticamente.");

    // Creamos el mensaje para mostrar al usuario
    const mensaje = habitoCompletado
      ? `Has completado tu hábito y ganaste ${puntosADar} puntos.`
      : `Buen progreso. Ganaste ${puntosADar} puntos (${newProgress}/${metaRepeticion}).`;

    return {
      success: true,
      newProgress,
      pointsAdded: puntosADar,
      message: mensaje,
      isComplete: habitoCompletado,
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
  _intervaloMeta: string // No usado, mantenido para compatibilidad
): Promise<number> {
  try {
    // Buscar el registro único del hábito y usar el campo progreso
    const { data: registro, error } = await supabase
      .from("registro_intervalo")
      .select("progreso")
      .eq("id_habito", idHabito)
      .single();

    if (error) {
      console.error("Error al obtener progreso:", error);
      return 0;
    }

    const progresoActual = registro?.progreso || 0;
    console.log(`Progreso actual del hábito ${idHabito}: ${progresoActual} (del campo progreso).`);
    return progresoActual;

  } catch (error: any) {
    console.error("No pudimos obtener el progreso:", error);
    return 0;
  }
}

// Funciones auxiliares que hacen el trabajo pesado

async function obtenerProgresoActual(idHabito: string, _intervaloMeta: string) {
  // Buscar el registro único del hábito directamente por su ID
  const { data: registro, error } = await supabase
    .from("registro_intervalo")
    .select("*")
    .eq("id_habito", idHabito)
    .single(); // Relación 1:1, siempre debe haber uno

  if (error) throw error;

  // El progreso actual viene del campo progreso del registro único
  const currentProgress = registro?.progreso || 0;

  console.log(`Progreso actual en obtenerProgresoActual: ${currentProgress} para hábito ${idHabito}.`);
  return { currentProgress, lastRegistro: registro };
}

function calcularPuntosPorDificultad(dificultad: string): number {
  if (dificultad === 'facil') return 3;
  if (dificultad === 'medio') return 5;
  if (dificultad === 'dificil') return 8;
  return 5;
}

async function guardarRegistroProgreso(
  idHabito: string,
  _lastRegistro: IRegistroIntervalo | null,
  _intervaloMeta: string,
  newProgress: number,
  habitoCompletado: boolean
): Promise<string> {

  console.log("Actualizando progreso en registro único:", {
    idHabito,
    progreso: newProgress,
    cumplido: habitoCompletado
  });

  // Actualizar el registro único existente
  const { data: registroActualizado, error: errorUpdate } = await supabase
    .from("registro_intervalo")
    .update({
      progreso: newProgress,
      cumplido: habitoCompletado,
      puntos: newProgress,
    })
    .eq("id_habito", idHabito)
    .select()
    .single();

  if (errorUpdate) {
    console.error("Error al actualizar registro único:", errorUpdate);
    throw new Error(`Error al actualizar progreso: ${errorUpdate.message}`);
  }

  if (!registroActualizado) {
    throw new Error("No se encontró el registro para actualizar");
  }

  console.log("Registro único actualizado con éxito:", registroActualizado.id_registro);
  return registroActualizado.id_registro;
}

async function actualizarPuntosUsuario(idPerfil: string, puntosADar: number): Promise<void> {
  const { data: perfil, error: perfilError } = await supabase
    .from("perfil")
    .select("puntos")
    .eq("id", idPerfil)
    .single();

  if (perfilError) throw perfilError;

  const puntosActuales = perfil?.puntos || 0;
  const puntosTotales = puntosActuales + puntosADar;

  const { error } = await supabase
    .from("perfil")
    .update({ puntos: puntosTotales })
    .eq("id", idPerfil);

  if (error) throw error;
}
