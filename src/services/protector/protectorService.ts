import { supabase } from '../../config/supabase';

/**
 * Calcula cuántos protectores debe tener un usuario según su racha máxima
 * Fórmula: 1 protector cada 7 días de racha
 */
export function calcularProtectoresPorRacha(diasRacha: number): number {
  return Math.floor(diasRacha / 7);
}

/**
 * Obtiene los protectores actuales del usuario
 */
export async function getProtectoresActuales(userId: string): Promise<number> {
  try {
    const { data, error } = await supabase
      .from('perfil')
      .select('protectores_racha')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data?.protectores_racha || 0;
  } catch (error) {
    console.error('Error obteniendo protectores:', error);
    return 0;
  }
}

/**
 * Obtiene los puntos actuales del usuario
 */
export async function getPuntosActuales(userId: string): Promise<number> {
  try {
    const { data, error } = await supabase
      .from('perfil')
      .select('puntos')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data?.puntos || 0;
  } catch (error) {
    console.error('Error obteniendo puntos:', error);
    return 0;
  }
}

/**
 * Verifica si el usuario puede comprar un protector esta semana
 */
export async function puedeComprarProtectorEstaSemana(userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc('puede_comprar_protector', {
      user_id: userId,
    });

    if (error) throw error;
    return data || false;
  } catch (error) {
    console.error('Error verificando límite semanal:', error);
    // Si hay error en la función RPC, verificar manualmente
    return await verificarLimiteSemanalManual(userId);
  }
}

/**
 * Verificación manual del límite semanal (fallback)
 */
async function verificarLimiteSemanalManual(userId: string): Promise<boolean> {
  try {
    const hoy = new Date();
    const inicioSemana = new Date(hoy);
    inicioSemana.setDate(hoy.getDate() - hoy.getDay()); // Inicio de la semana (domingo)
    inicioSemana.setHours(0, 0, 0, 0);

    const { data, error } = await supabase
      .from('compra_protector')
      .select('id_compra')
      .eq('id_perfil', userId)
      .gte('fecha_compra', inicioSemana.toISOString());

    if (error) throw error;
    return (data?.length || 0) < 1; // Límite: 1 por semana
  } catch (error) {
    console.error('Error en verificación manual:', error);
    return false;
  }
}

/**
 * Compra un protector de racha con puntos
 */
export async function comprarProtector(userId: string): Promise<{
  success: boolean;
  message: string;
  protectoresNuevos?: number;
}> {
  try {
    // 1. Verificar límite semanal
    const puedeComprar = await puedeComprarProtectorEstaSemana(userId);
    if (!puedeComprar) {
      return {
        success: false,
        message: 'Ya compraste tu protector esta semana. Vuelve la próxima semana.',
      };
    }

    // 2. Verificar puntos suficientes
    const puntosActuales = await getPuntosActuales(userId);
    const COSTO_PROTECTOR = 250;

    if (puntosActuales < COSTO_PROTECTOR) {
      return {
        success: false,
        message: `Necesitas ${COSTO_PROTECTOR} puntos. Tienes ${puntosActuales}.`,
      };
    }

    // 3. Realizar la compra (transacción)
    const { data: perfil, error: updateError } = await supabase
      .from('perfil')
      .update({
        puntos: puntosActuales - COSTO_PROTECTOR,
        protectores_racha: (await getProtectoresActuales(userId)) + 1,
      })
      .eq('id', userId)
      .select('protectores_racha, puntos')
      .single();

    if (updateError) throw updateError;

    // 4. Registrar la compra
    await supabase.from('compra_protector').insert({
      id_perfil: userId,
      cantidad: 1,
      costo_puntos: COSTO_PROTECTOR,
    });

    return {
      success: true,
      message: '¡Protector comprado exitosamente! 🛡️',
      protectoresNuevos: perfil?.protectores_racha || 0,
    };
  } catch (error: any) {
    console.error('Error comprando protector:', error);
    return {
      success: false,
      message: error.message || 'Error al comprar protector',
    };
  }
}

/**
 * Usa un protector de racha para un hábito
 */
export async function usarProtector(
  userId: string,
  habitoId: string,
  rachaActual: number
): Promise<{
  success: boolean;
  message: string;
  protectoresRestantes?: number;
}> {
  try {
    // 1. Verificar que tiene protectores
    const protectoresActuales = await getProtectoresActuales(userId);
    if (protectoresActuales <= 0) {
      return {
        success: false,
        message: 'No tienes protectores disponibles',
      };
    }

    // 2. Usar el protector
    const { data: perfil, error: updateError } = await supabase
      .from('perfil')
      .update({
        protectores_racha: protectoresActuales - 1,
      })
      .eq('id', userId)
      .select('protectores_racha')
      .single();

    if (updateError) throw updateError;

    // 3. Registrar el uso
    await supabase.from('uso_protector').insert({
      id_perfil: userId,
      id_habito: habitoId,
      racha_protegida: rachaActual,
    });

    return {
      success: true,
      message: '¡Racha protegida! 🛡️',
      protectoresRestantes: perfil?.protectores_racha || 0,
    };
  } catch (error: any) {
    console.error('Error usando protector:', error);
    return {
      success: false,
      message: error.message || 'Error al usar protector',
    };
  }
}

/**
 * Sincroniza los protectores del usuario según su racha máxima
 */
export async function sincronizarProtectoresPorRacha(userId: string): Promise<void> {
  try {
    // Obtener racha máxima directamente del perfil del usuario
    const { data: perfilData, error: perfilError } = await supabase
      .from('perfil')
      .select('racha_maxima')
      .eq('id', userId)
      .single();

    if (perfilError) throw perfilError;

    const rachaMaxima = perfilData?.racha_maxima || 0;
    const protectoresEsperados = calcularProtectoresPorRacha(rachaMaxima);

    // Obtener protectores actuales
    const protectoresActuales = await getProtectoresActuales(userId);

    // Si debe tener más protectores, actualizarlos
    if (protectoresEsperados > protectoresActuales) {
      await supabase
        .from('perfil')
        .update({ protectores_racha: protectoresEsperados })
        .eq('id', userId);

      console.log(
        `✅ Protectores sincronizados: ${protectoresActuales} → ${protectoresEsperados}`
      );
    }
  } catch (error) {
    console.error('Error sincronizando protectores:', error);
  }
}

/**
 * Obtiene el historial de compras del usuario
 */
export async function getHistorialCompras(userId: string): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('compra_protector')
      .select('*')
      .eq('id_perfil', userId)
      .order('fecha_compra', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error obteniendo historial de compras:', error);
    return [];
  }
}

/**
 * Obtiene el historial de usos del usuario
 */
export async function getHistorialUsos(userId: string): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('uso_protector')
      .select('*, habito:id_habito(nombre_habito)')
      .eq('id_perfil', userId)
      .order('fecha_uso', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error obteniendo historial de usos:', error);
    return [];
  }
}

/**
 * Asigna un protector a un hábito específico
 */
export async function asignarProtectorAHabito(
  userId: string,
  habitoId: string,
  cantidad: number = 1
): Promise<{
  success: boolean;
  message: string;
  protectoresAsignados?: number;
}> {
  try {
    const { data, error } = await supabase.rpc('asignar_protector_a_habito', {
      p_user_id: userId,
      p_habito_id: habitoId,
      p_cantidad: cantidad,
    });

    if (error) throw error;

    return data || {
      success: false,
      message: 'Error al asignar protector',
    };
  } catch (error: any) {
    console.error('Error asignando protector:', error);
    return {
      success: false,
      message: error?.message || 'Error al asignar protector',
    };
  }
}

/**
 * Quita un protector de un hábito específico
 */
export async function quitarProtectorDeHabito(
  userId: string,
  habitoId: string,
  cantidad: number = 1
): Promise<{
  success: boolean;
  message: string;
  protectoresAsignados?: number;
}> {
  try {
    const { data, error } = await supabase.rpc('quitar_protector_de_habito', {
      p_user_id: userId,
      p_habito_id: habitoId,
      p_cantidad: cantidad,
    });

    if (error) throw error;

    return data || {
      success: false,
      message: 'Error al quitar protector',
    };
  } catch (error: any) {
    console.error('Error quitando protector:', error);
    return {
      success: false,
      message: error?.message || 'Error al quitar protector',
    };
  }
}

/**
 * Obtiene los protectores asignados a un hábito específico
 */
export async function getProtectoresPorHabito(
  userId: string,
  habitoId: string
): Promise<number> {
  try {
    const { data, error } = await supabase.rpc('obtener_protectores_de_habito', {
      p_user_id: userId,
      p_habito_id: habitoId,
    });

    if (error) throw error;
    return data || 0;
  } catch (error) {
    console.error('Error obteniendo protectores del hábito:', error);
    // Fallback: consultar directamente la tabla racha
    return await getProtectoresPorHabitoFallback(userId, habitoId);
  }
}

/**
 * Fallback para obtener protectores de un hábito
 */
async function getProtectoresPorHabitoFallback(
  userId: string,
  habitoId: string
): Promise<number> {
  try {
    const { data, error } = await supabase
      .from('racha')
      .select('protectores_asignados')
      .eq('id_perfil', userId)
      .eq('id_habito', habitoId)
      .single();

    if (error) throw error;
    return data?.protectores_asignados || 0;
  } catch (error) {
    console.error('Error en fallback de protectores:', error);
    return 0;
  }
}

/**
 * Obtiene estadísticas de protectores por hábito
 */
export async function getEstadisticasProtectoresHabito(
  userId: string,
  habitoId: string
): Promise<any> {
  try {
    const { data, error } = await supabase
      .from('estadisticas_protectores_habito')
      .select('*')
      .eq('id_perfil', userId)
      .eq('id_habito', habitoId)
      .single();

    if (error) throw error;
    return data || null;
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    return null;
  }
}

/**
 * Obtiene todos los hábitos con sus protectores asignados
 */
export async function getAllHabitosConProtectores(userId: string): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('estadisticas_protectores_habito')
      .select('*')
      .eq('id_perfil', userId);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error obteniendo hábitos con protectores:', error);
    return [];
  }
}
