import { supabase } from "../../config/supabase";
import type { ILogro } from "../../types/ILogro";
import type { ILogroUsuario } from "../../types/ILogroUsuario";

export interface LogroDesbloqueadoResult {
  logrosNuevos: ILogro[];
  protectoresGanados: number;
  mensaje: string;
}

/**
 * Verifica y desbloquea logros automáticamente cuando el usuario alcanza ciertos días de racha
 * También otorga protectores de racha (1 cada 3 días)
 */
export async function verificarYDesbloquearLogros(
  idPerfil: string,
  diasRachaActual: number
): Promise<LogroDesbloqueadoResult> {
  try {
    // 1. Obtener todos los logros que el usuario podría desbloquear
    const { data: logrosDisponibles, error: logrosError } = await supabase
      .from("logro")
      .select("*")
      .lte("criterio_racha", diasRachaActual)
      .order("criterio_racha", { ascending: true });

    if (logrosError) throw logrosError;

    if (!logrosDisponibles || logrosDisponibles.length === 0) {
      return {
        logrosNuevos: [],
        protectoresGanados: 0,
        mensaje: "",
      };
    }

    // 2. Obtener logros que el usuario YA tiene
    const { data: logrosObtenidos, error: logrosObtenidosError } = await supabase
      .from("logro_usuario")
      .select("id_logro")
      .eq("id_perfil", idPerfil);

    if (logrosObtenidosError) throw logrosObtenidosError;

    const idsLogrosObtenidos = new Set(
      logrosObtenidos?.map((l) => l.id_logro) || []
    );

    // 3. Filtrar logros que aún NO tiene
    const logrosNuevos = logrosDisponibles.filter(
      (logro) => !idsLogrosObtenidos.has(logro.id_logro)
    );

    // 4. Insertar los nuevos logros desbloqueados
    if (logrosNuevos.length > 0) {
      const logroUsuarioInserts = logrosNuevos.map((logro) => ({
        id_perfil: idPerfil,
        id_logro: logro.id_logro,
        fecha_obtenido: new Date(),
      }));

      const { error: insertError } = await supabase
        .from("logro_usuario")
        .insert(logroUsuarioInserts);

      if (insertError) {
        console.error("Error al insertar logros:", insertError);
        throw insertError;
      }
    }

    // 5. Calcular protectores de racha ganados
    // Se gana 1 protector cada 3 días de racha
    const protectoresDisponibles = Math.floor(diasRachaActual / 3);

    // Obtener protectores actuales del perfil
    const { data: perfil, error: perfilError } = await supabase
      .from("perfil")
      .select("protectores_racha")
      .eq("id", idPerfil)
      .single();

    if (perfilError) throw perfilError;

    const protectoresActuales = perfil?.protectores_racha || 0;

    // Solo actualizar si hay protectores nuevos
    let protectoresGanados = 0;
    if (protectoresDisponibles > protectoresActuales) {
      protectoresGanados = protectoresDisponibles - protectoresActuales;

      const { error: updateError } = await supabase
        .from("perfil")
        .update({ protectores_racha: protectoresDisponibles })
        .eq("id", idPerfil);

      if (updateError) {
        console.error("Error al actualizar protectores:", updateError);
        throw updateError;
      }
    }

    // 6. Crear mensaje de logros desbloqueados
    let mensaje = "";
    if (logrosNuevos.length > 0) {
      const nombresLogros = logrosNuevos.map((l) => `${l.icono} ${l.nombre_logro}`).join(", ");
      mensaje = `¡Logros desbloqueados: ${nombresLogros}!`;
    }

    if (protectoresGanados > 0) {
      if (mensaje) mensaje += " ";
      mensaje += `+${protectoresGanados} protector${protectoresGanados > 1 ? "es" : ""} de racha`;
    }

    console.log(`Verificación de logros completada para perfil ${idPerfil}`);
    console.log(`   - Logros nuevos: ${logrosNuevos.length}`);
    console.log(`   - Protectores ganados: ${protectoresGanados}`);
    console.log(`   - Días de racha: ${diasRachaActual}`);

    return {
      logrosNuevos,
      protectoresGanados,
      mensaje,
    };
  } catch (error: any) {
    console.error("Error al verificar logros:", error);
    throw error;
  }
}

/**
 * Obtener todos los logros del usuario con su información completa
 */
export async function obtenerLogrosUsuario(idPerfil: string): Promise<ILogroUsuario[]> {
  try {
    const { data, error } = await supabase
      .from("logro_usuario")
      .select(`
        *,
        logro:id_logro (*)
      `)
      .eq("id_perfil", idPerfil)
      .order("fecha_obtenido", { ascending: false });

    if (error) throw error;

    return data || [];
  } catch (error: any) {
    console.error("Error al obtener logros del usuario:", error);
    throw error;
  }
}

/**
 * Obtener progreso de logros: cuántos tiene vs cuántos existen
 */
export async function obtenerProgresoLogros(idPerfil: string): Promise<{
  logrosObtenidos: number;
  logosTotales: number;
  porcentaje: number;
}> {
  try {
    // Total de logros en el sistema
    const { count: totalLogros, error: errorTotal } = await supabase
      .from("logro")
      .select("*", { count: "exact", head: true });

    if (errorTotal) throw errorTotal;

    // Logros que el usuario tiene
    const { count: logrosUsuario, error: errorUsuario } = await supabase
      .from("logro_usuario")
      .select("*", { count: "exact", head: true })
      .eq("id_perfil", idPerfil);

    if (errorUsuario) throw errorUsuario;

    const obtenidos = logrosUsuario || 0;
    const totales = totalLogros || 0;
    const porcentaje = totales > 0 ? Math.round((obtenidos / totales) * 100) : 0;

    return {
      logrosObtenidos: obtenidos,
      logosTotales: totales,
      porcentaje,
    };
  } catch (error: any) {
    console.error("Error al obtener progreso de logros:", error);
    throw error;
  }
}

/**
 * Obtener el siguiente logro que el usuario puede desbloquear
 */
export async function obtenerSiguienteLogro(
  idPerfil: string,
  diasRachaActual: number
): Promise<ILogro | null> {
  try {
    // Obtener logros que el usuario YA tiene
    const { data: logrosObtenidos, error: logrosError } = await supabase
      .from("logro_usuario")
      .select("id_logro")
      .eq("id_perfil", idPerfil);

    if (logrosError) throw logrosError;

    const idsObtenidos = logrosObtenidos?.map((l) => l.id_logro) || [];

    // Buscar el próximo logro no obtenido
    const { data: siguienteLogro, error } = await supabase
      .from("logro")
      .select("*")
      .gt("criterio_racha", diasRachaActual)
      .not("id_logro", "in", `(${idsObtenidos.join(",")})`)
      .order("criterio_racha", { ascending: true })
      .limit(1)
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 = no rows returned
      throw error;
    }

    return siguienteLogro || null;
  } catch (error: any) {
    console.error("Error al obtener siguiente logro:", error);
    return null;
  }
}
