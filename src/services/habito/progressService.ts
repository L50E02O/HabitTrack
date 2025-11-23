import { supabase } from "../../config/supabase";
// import { shouldResetProgress } from "../../utils/progressResetUtils"; // No usado actualmente
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
    console.log("✅ Progreso registrado. La racha se actualizará automáticamente.");

    // Creamos el mensaje para mostrar al usuario
    const mensaje = habitoCompletado
      ? `¡Felicidades! Completaste tu hábito y ganaste ${puntosADar} puntos 🎉`
      : `¡Buen progreso! Ganaste ${puntosADar} puntos (${newProgress}/${metaRepeticion})`;

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
 * NUEVA LÓGICA: Cuenta los registros del período actual
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
      .maybeSingle();

    if (error) {
      console.error("Error al obtener progreso:", error);
      return 0;
    }

    const progresoActual = registro?.progreso || 0;
    console.log(`Progreso actual del hábito ${idHabito}: ${progresoActual} (del campo progreso)`);
    return progresoActual;

  } catch (error: any) {
    console.error("No pudimos obtener el progreso:", error);
    return 0;
  }
}

// Función auxiliar para calcular el inicio del período
// Comentada porque ya no se usa (el backend maneja los períodos)
// function calcularInicioPeriodo(fecha: Date, intervaloMeta: string): Date {
//   const inicio = new Date(fecha);
//   inicio.setUTCHours(0, 0, 0, 0);
//
//   if (intervaloMeta === 'diario') {
//     return inicio;
//   } else if (intervaloMeta === 'semanal') {
//     const diaSemana = inicio.getDay();
//     const diasDesdeInicio = diaSemana === 0 ? 6 : diaSemana - 1;
//     inicio.setDate(inicio.getDate() - diasDesdeInicio);
//     return inicio;
//   } else if (intervaloMeta === 'mensual') {
//     inicio.setDate(1);
//     return inicio;
//   }
//
//   return inicio;
// }

// Funciones auxiliares que hacen el trabajo pesado

async function obtenerProgresoActual(idHabito: string, _intervaloMeta: string) {
  // Buscar el registro único del hábito
  const { data: registro, error } = await supabase
    .from("registro_intervalo")
    .select("*")
    .eq("id_habito", idHabito)
    .maybeSingle();

  if (error) throw error;

  // El progreso actual viene del campo progreso del registro único
  const currentProgress = registro?.progreso || 0;

  console.log(`Progreso actual en obtenerProgresoActual: ${currentProgress} (del campo progreso)`);
  return { currentProgress, lastRegistro: registro };
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

  console.log("🔍 Intentando actualizar registro:", { 
    idHabito, 
    progreso: newProgress, 
    cumplido: habitoCompletado 
  });

  // Buscar el registro único del hábito
  const { data: registroExistente, error: errorBusqueda } = await supabase
    .from("registro_intervalo")
    .select("*")
    .eq("id_habito", idHabito)
    .maybeSingle();

  if (errorBusqueda && errorBusqueda.code !== 'PGRST116') { // PGRST116 = no rows returned
    console.error("❌ Error al buscar registro:", errorBusqueda);
    throw new Error(`Error al buscar registro: ${errorBusqueda.message}`);
  }

  let registroId: string;

  if (registroExistente) {
    // Actualizar el registro existente
    const { data: registroActualizado, error: errorUpdate } = await supabase
      .from("registro_intervalo")
      .update({
        progreso: newProgress,
        cumplido: habitoCompletado,
        puntos: newProgress, // Los puntos también se actualizan
      })
      .eq("id_registro", registroExistente.id_registro)
      .select()
      .single();

    if (errorUpdate) {
      console.error("❌ Error al actualizar registro:", errorUpdate);
      throw new Error(`Error al actualizar registro: ${errorUpdate.message}`);
    }

    if (!registroActualizado) {
      throw new Error("No se pudo actualizar el registro");
    }

    registroId = registroActualizado.id_registro;
    console.log("✅ Registro actualizado:", registroId);
  } else {
    // Crear el registro si no existe (no debería pasar si se creó correctamente con el hábito)
    const { data: nuevoRegistro, error: errorInsert } = await supabase
      .from("registro_intervalo")
      .insert({
        id_habito: idHabito,
        fecha: hoy.toISOString().split('T')[0],
        cumplido: habitoCompletado,
        puntos: newProgress,
        progreso: newProgress,
      })
      .select()
      .single();

    if (errorInsert) {
      console.error("❌ Error al crear registro:", errorInsert);
      throw new Error(`Error al crear registro: ${errorInsert.message}`);
    }

    if (!nuevoRegistro) {
      throw new Error("No se pudo crear el registro");
    }

    registroId = nuevoRegistro.id_registro;
    console.log("✅ Nuevo registro creado:", registroId);
  }

  return registroId;
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
