import { supabase } from "../../config/supabase";
import type { IRacha } from "../../types/IRacha";

export interface UsarProtectorResult {
  success: boolean;
  mensaje: string;
  protectoresRestantes: number;
}

/**
 * Usa un protector de racha para salvar una racha que está a punto de romperse
 * 
 * @param idPerfil - ID del perfil del usuario
 * @param idRacha - ID de la racha a proteger
 * @returns Resultado de la operación
 */
export async function usarProtectorRacha(
  idPerfil: string,
  idRacha: string
): Promise<UsarProtectorResult> {
  try {
    // 1. Verificar que el usuario tiene protectores disponibles
    const { data: perfil, error: perfilError } = await supabase
      .from("perfil")
      .select("protectores_racha")
      .eq("id", idPerfil)
      .single();

    if (perfilError) throw perfilError;

    if (!perfil || perfil.protectores_racha <= 0) {
      return {
        success: false,
        mensaje: "No tienes protectores de racha disponibles 😢",
        protectoresRestantes: 0,
      };
    }

    // 2. Verificar que la racha existe y está activa
    const { data: racha, error: rachaError } = await supabase
      .from("racha")
      .select("*")
      .eq("id_racha", idRacha)
      .eq("racha_activa", true)
      .single();

    if (rachaError || !racha) {
      return {
        success: false,
        mensaje: "La racha no existe o ya no está activa",
        protectoresRestantes: perfil.protectores_racha,
      };
    }

    // 3. Extender la racha por 1 día más
    const hoy = new Date();
    hoy.setUTCHours(0, 0, 0, 0);

    const { error: updateRachaError } = await supabase
      .from("racha")
      .update({
        fin_racha: hoy,
      })
      .eq("id_racha", idRacha);

    if (updateRachaError) throw updateRachaError;

    // 4. Restar 1 protector del perfil
    const nuevosProtectores = perfil.protectores_racha - 1;

    const { error: updatePerfilError } = await supabase
      .from("perfil")
      .update({ protectores_racha: nuevosProtectores })
      .eq("id", idPerfil);

    if (updatePerfilError) throw updatePerfilError;

    console.log(`🛡️ Protector usado para racha ${idRacha}`);
    console.log(`   Protectores restantes: ${nuevosProtectores}`);

    return {
      success: true,
      mensaje: `¡Tu racha ha sido protegida! 🛡️ Protectores restantes: ${nuevosProtectores}`,
      protectoresRestantes: nuevosProtectores,
    };
  } catch (error: any) {
    console.error("Error al usar protector de racha:", error);
    throw error;
  }
}

/**
 * Verifica si una racha necesita un protector (está por vencer)
 * 
 * @param racha - La racha a verificar
 * @param intervaloMeta - Tipo de intervalo (diario, semanal, mensual)
 * @returns true si la racha está por vencer
 */
export function rachaDebeUsarProtector(racha: IRacha, intervaloMeta: string): boolean {
  const ahora = new Date();
  ahora.setUTCHours(0, 0, 0, 0);

  const ultimaFecha = new Date(racha.fin_racha);
  ultimaFecha.setUTCHours(0, 0, 0, 0);

  const diferenciaMs = ahora.getTime() - ultimaFecha.getTime();

  // Verificar si está cerca del límite de expiración
  if (intervaloMeta === 'diario') {
    // Si pasaron más de 20 horas pero menos de 24
    const veintHoras = 20 * 60 * 60 * 1000;
    const unDia = 24 * 60 * 60 * 1000;
    return diferenciaMs >= veintHoras && diferenciaMs < unDia;
  } else if (intervaloMeta === 'semanal') {
    // Si pasaron más de 6 días pero menos de 7
    const seisDias = 6 * 24 * 60 * 60 * 1000;
    const sieteDias = 7 * 24 * 60 * 60 * 1000;
    return diferenciaMs >= seisDias && diferenciaMs < sieteDias;
  } else if (intervaloMeta === 'mensual') {
    // Si pasaron más de 29 días pero menos de 31
    const veintinueveDias = 29 * 24 * 60 * 60 * 1000;
    const treintaYUnDias = 31 * 24 * 60 * 60 * 1000;
    return diferenciaMs >= veintinueveDias && diferenciaMs < treintaYUnDias;
  }

  return false;
}

/**
 * Obtiene todas las rachas del usuario que están en peligro
 * 
 * @param idPerfil - ID del perfil del usuario
 * @returns Lista de rachas en peligro
 */
export async function obtenerRachasEnPeligro(idPerfil: string): Promise<IRacha[]> {
  try {
    // Obtener todos los hábitos del usuario
    const { data: habitos, error: habitosError } = await supabase
      .from("habito")
      .select("id_habito, intervalo_meta")
      .eq("id_perfil", idPerfil);

    if (habitosError) throw habitosError;

    if (!habitos || habitos.length === 0) {
      return [];
    }

    // Obtener rachas activas de esos hábitos
    const rachasEnPeligro: IRacha[] = [];

    for (const habito of habitos) {
      const { data: rachas, error: rachasError } = await supabase
        .from("racha")
        .select(`
          *,
          registro_intervalo!inner(id_habito)
        `)
        .eq("registro_intervalo.id_habito", habito.id_habito)
        .eq("racha_activa", true);

      if (rachasError) {
        console.error(`Error al obtener rachas del hábito ${habito.id_habito}:`, rachasError);
        continue;
      }

      if (rachas && rachas.length > 0) {
        const racha = rachas[0];
        if (rachaDebeUsarProtector(racha, habito.intervalo_meta)) {
          rachasEnPeligro.push(racha);
        }
      }
    }

    return rachasEnPeligro;
  } catch (error: any) {
    console.error("Error al obtener rachas en peligro:", error);
    throw error;
  }
}

/**
 * Obtiene la cantidad de protectores disponibles del usuario
 * 
 * @param idPerfil - ID del perfil del usuario
 * @returns Cantidad de protectores disponibles
 */
export async function obtenerProtectoresDisponibles(idPerfil: string): Promise<number> {
  try {
    const { data: perfil, error } = await supabase
      .from("perfil")
      .select("protectores_racha")
      .eq("id", idPerfil)
      .single();

    if (error) throw error;

    return perfil?.protectores_racha || 0;
  } catch (error: any) {
    console.error("Error al obtener protectores disponibles:", error);
    return 0;
  }
}
