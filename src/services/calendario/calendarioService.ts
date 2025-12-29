import { supabase } from "../../config/supabase";

/**
 * Obtiene todos los días donde el usuario completó al menos un hábito
 * Retorna un Set con las fechas en formato YYYY-MM-DD
 */
export async function obtenerDiasConRacha(idPerfil: string): Promise<Set<string>> {
  try {
    // Obtener todos los hábitos del usuario
    const { data: habitos, error: habitosError } = await supabase
      .from("habito")
      .select("id_habito")
      .eq("id_perfil", idPerfil);

    if (habitosError) {
      console.error("Error obteniendo hábitos del usuario:", habitosError);
      return new Set();
    }

    if (!habitos || habitos.length === 0) {
      return new Set();
    }

    const idsHabitos = habitos.map(h => h.id_habito);

    // Obtener todos los registros donde se completó al menos un hábito
    // Para hábitos diarios: días donde cumplido = true
    // Para hábitos semanales/mensuales: días donde hubo progreso y se completó el período
    const { data: registros, error: registrosError } = await supabase
      .from("registro_intervalo")
      .select("fecha, cumplido, id_habito")
      .in("id_habito", idsHabitos)
      .eq("cumplido", true);

    if (registrosError) {
      console.error("Error obteniendo registros completados:", registrosError);
      return new Set();
    }

    if (!registros || registros.length === 0) {
      return new Set();
    }

    // Agrupar por fecha y obtener días únicos
    const diasCompletados = new Set<string>();

    registros.forEach(registro => {
      const fecha = new Date(registro.fecha);
      // Normalizar fecha a YYYY-MM-DD
      const fechaNormalizada = fecha.toISOString().split('T')[0];
      diasCompletados.add(fechaNormalizada);
    });

    return diasCompletados;

  } catch (error) {
    console.error("Error en obtenerDiasConRacha:", error);
    return new Set();
  }
}

/**
 * Obtiene los días con racha para un rango de fechas específico
 * Útil para mostrar un mes completo en el calendario
 */
export async function obtenerDiasConRachaEnRango(
  idPerfil: string,
  fechaInicio: Date,
  fechaFin: Date
): Promise<Set<string>> {
  try {
    // Obtener todos los hábitos del usuario
    const { data: habitos, error: habitosError } = await supabase
      .from("habito")
      .select("id_habito")
      .eq("id_perfil", idPerfil);

    if (habitosError) {
      console.error("Error obteniendo hábitos del usuario:", habitosError);
      return new Set();
    }

    if (!habitos || habitos.length === 0) {
      return new Set();
    }

    const idsHabitos = habitos.map(h => h.id_habito);

    // Normalizar fechas
    const inicio = new Date(fechaInicio);
    inicio.setUTCHours(0, 0, 0, 0);
    const fin = new Date(fechaFin);
    fin.setUTCHours(23, 59, 59, 999);

    // Obtener registros completados en el rango de fechas
    const { data: registros, error: registrosError } = await supabase
      .from("registro_intervalo")
      .select("fecha, cumplido, id_habito")
      .in("id_habito", idsHabitos)
      .eq("cumplido", true)
      .gte("fecha", inicio.toISOString())
      .lte("fecha", fin.toISOString());

    if (registrosError) {
      console.error("Error obteniendo registros en rango:", registrosError);
      return new Set();
    }

    if (!registros || registros.length === 0) {
      return new Set();
    }

    // Agrupar por fecha y obtener días únicos
    const diasCompletados = new Set<string>();

    registros.forEach(registro => {
      const fecha = new Date(registro.fecha);
      const fechaNormalizada = fecha.toISOString().split('T')[0];
      diasCompletados.add(fechaNormalizada);
    });

    return diasCompletados;

  } catch (error) {
    console.error("Error en obtenerDiasConRachaEnRango:", error);
    return new Set();
  }
}

