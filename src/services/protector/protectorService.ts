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
    // Obtener racha máxima del usuario
    const { data: rachas, error: rachaError } = await supabase
      .from('racha')
      .select('racha_maxima')
      .eq('id_perfil', userId)
      .order('racha_maxima', { ascending: false })
      .limit(1);

    if (rachaError) throw rachaError;

    const rachaMaxima = rachas?.[0]?.racha_maxima || 0;
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
