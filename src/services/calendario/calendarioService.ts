import { supabase } from "../../config/supabase";

/**
 * Información sobre un día de fin de intervalo
 */
export interface DiaFinIntervalo {
  fecha: string; // YYYY-MM-DD
  habitos: Array<{
    id_habito: string;
    nombre_habito: string;
    intervalo_meta: string;
    categoria: string;
  }>;
}

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
 * Obtiene los días de fin de intervalo para un rango de fechas específico
 * Retorna un Map con la fecha como clave y la información de los hábitos que terminan ese día
 */
export async function obtenerDiasFinIntervaloEnRango(
  idPerfil: string,
  fechaInicio: Date,
  fechaFin: Date
): Promise<Map<string, DiaFinIntervalo>> {
  try {
    // Obtener todos los hábitos del usuario con su información
    const { data: habitos, error: habitosError } = await supabase
      .from("habito")
      .select("id_habito, nombre_habito, intervalo_meta, categoria")
      .eq("id_perfil", idPerfil)
      .eq("activo", true);

    if (habitosError) {
      console.error("Error obteniendo hábitos del usuario:", habitosError);
      return new Map();
    }

    if (!habitos || habitos.length === 0) {
      return new Map();
    }

    const idsHabitos = habitos.map(h => h.id_habito);
    const habitosMap = new Map(habitos.map(h => [h.id_habito, h]));

    // Normalizar fechas a formato YYYY-MM-DD
    const inicio = new Date(fechaInicio);
    inicio.setUTCHours(0, 0, 0, 0);
    const fin = new Date(fechaFin);
    fin.setUTCHours(23, 59, 59, 999);
    
    const fechaInicioStr = inicio.toISOString().split('T')[0];
    const fechaFinStr = fin.toISOString().split('T')[0];

    // Obtener todos los registros con fecha_fin_intervalo en el rango de fechas
    // Esto incluye intervalos futuros que se crearon al crear el hábito
    const { data: registros, error: registrosError } = await supabase
      .from("registro_intervalo")
      .select("id_habito, fecha_fin_intervalo")
      .in("id_habito", idsHabitos)
      .not("fecha_fin_intervalo", "is", null)
      .gte("fecha_fin_intervalo", fechaInicioStr)
      .lte("fecha_fin_intervalo", fechaFinStr);

    if (registrosError) {
      console.error("Error obteniendo registros de fin de intervalo:", registrosError);
      return new Map();
    }

    if (!registros || registros.length === 0) {
      return new Map();
    }

    // Agrupar por fecha de fin de intervalo
    const diasFinIntervalo = new Map<string, DiaFinIntervalo>();

    registros.forEach(registro => {
      if (!registro.fecha_fin_intervalo) return;

      const fechaFinIntervalo = new Date(registro.fecha_fin_intervalo);
      const fechaNormalizada = fechaFinIntervalo.toISOString().split('T')[0];

      const habito = habitosMap.get(registro.id_habito);
      if (!habito) return;

      // Si ya existe un día con esta fecha, agregar el hábito
      if (diasFinIntervalo.has(fechaNormalizada)) {
        const diaExistente = diasFinIntervalo.get(fechaNormalizada)!;
        // Verificar que el hábito no esté ya en la lista
        if (!diaExistente.habitos.some(h => h.id_habito === habito.id_habito)) {
          diaExistente.habitos.push({
            id_habito: habito.id_habito,
            nombre_habito: habito.nombre_habito,
            intervalo_meta: habito.intervalo_meta,
            categoria: habito.categoria,
          });
        }
      } else {
        // Crear nuevo día
        diasFinIntervalo.set(fechaNormalizada, {
          fecha: fechaNormalizada,
          habitos: [{
            id_habito: habito.id_habito,
            nombre_habito: habito.nombre_habito,
            intervalo_meta: habito.intervalo_meta,
            categoria: habito.categoria,
          }],
        });
      }
    });

    return diasFinIntervalo;

  } catch (error) {
    console.error("Error en obtenerDiasFinIntervaloEnRango:", error);
    return new Map();
  }
}

/**
 * Obtiene los días con racha para un rango de fechas específico
 * Útil para mostrar un mes completo en el calendario
 * @deprecated Usar obtenerDiasFinIntervaloEnRango en su lugar
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

