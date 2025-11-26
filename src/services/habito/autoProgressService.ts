import { supabase } from "../../config/supabase";
import { updateRachaOnHabitCompletion, checkAndDeactivateExpiredRachas, getRachaActivaByHabito } from "../racha/rachaAutoService";
import type { IHabito } from "../../types/IHabito";

/**
 * SERVICIO DE PROGRESO AUTOMÁTICO
 * 
 * LÓGICA DE RACHAS:
 * 
 * DIARIO: La racha aumenta +1 cada día que completes la meta diaria
 *    - Completas hoy → Racha +1
 *    - NO completas hoy → Racha se PIERDE
 * 
 * SEMANAL: La racha aumenta +1 CADA DÍA durante la semana
 *    - Cada día que avanzas → Racha +1 (acumulando)
 *    - Al final de la semana verifica si completaste meta_repeticion
 *      Completaste → Racha continúa acumulando
 *      NO completaste → Racha se PIERDE (toda la acumulada)
 * 
 * MENSUAL: La racha aumenta +1 CADA DÍA durante el mes
 *    - Cada día que avanzas → Racha +1 (acumulando)
 *    - Al final del mes verifica si completaste meta_repeticion
 *      Completaste → Racha continúa acumulando
 *      NO completaste → Racha se PIERDE (toda la acumulada)
 * 
 * Se ejecuta:
 * - Cuando el usuario abre el dashboard
 * - Cada 30 segundos mientras navega
 * - Inmediatamente después de hacer clic en "Avanzar"
 */

interface AutoProgressResult {
  habitosActualizados: number;
  rachasActualizadas: string[]; // IDs de hábitos cuyas rachas se actualizaron
  mensaje: string;
}

/**
 * Verifica automáticamente todos los hábitos del usuario
 * y actualiza rachas si detecta que ya completaron la meta del día
 */
export async function checkAndUpdateAutoProgress(
  idPerfil: string
): Promise<AutoProgressResult> {
  try {
    console.log("Iniciando verificación automática de progreso...");

    // 1. Obtener todos los hábitos activos del usuario
    const { data: habitos, error: habitosError } = await supabase
      .from("habito")
      .select("*")
      .eq("id_perfil", idPerfil)
      .eq("activo", true);

    if (habitosError) {
      console.error("Error al obtener hábitos:", habitosError);
      return {
        habitosActualizados: 0,
        rachasActualizadas: [],
        mensaje: "Error al verificar hábitos"
      };
    }

    if (!habitos || habitos.length === 0) {
      return {
        habitosActualizados: 0,
        rachasActualizadas: [],
        mensaje: "No hay hábitos activos"
      };
    }

    const rachasActualizadas: string[] = [];

    // 2. Por cada hábito, verificar si ya completó la meta de hoy
    for (const habito of habitos as IHabito[]) {
      const actualizado = await verificarYActualizarRacha(habito);
      if (actualizado) {
        rachasActualizadas.push(habito.id_habito);
      }
    }

    console.log(`Verificación completa. ${rachasActualizadas.length} rachas actualizadas.`);

    return {
      habitosActualizados: habitos.length,
      rachasActualizadas,
      mensaje: `${rachasActualizadas.length} racha${rachasActualizadas.length !== 1 ? 's' : ''} actualizada${rachasActualizadas.length !== 1 ? 's' : ''}`
    };

  } catch (error) {
    console.error("Error en checkAndUpdateAutoProgress:", error);
    return {
      habitosActualizados: 0,
      rachasActualizadas: [],
      mensaje: "Error al verificar progreso automático"
    };
  }
}

/**
 * Verifica si un hábito específico debe actualizar su racha
 * 
 * LÓGICA POR TIPO DE INTERVALO:
 * 
 * DIARIO: Actualiza racha solo si completó la meta del día
 * SEMANAL: Actualiza racha CADA DÍA que hace progreso (acumula durante la semana)
 *          Al final de semana verifica si completó meta semanal
 * MENSUAL: Actualiza racha CADA DÍA que hace progreso (acumula durante el mes)
 *          Al final de mes verifica si completó meta mensual
 */
async function verificarYActualizarRacha(habito: IHabito): Promise<boolean> {
  try {
    const hoy = new Date();
    hoy.setUTCHours(0, 0, 0, 0);

    // 1. VERIFICAR SI YA ACTUALIZAMOS LA RACHA HOY
    // Usar la función correcta que busca por id_habito a través de registro_intervalo
    const rachaActual = await getRachaActivaByHabito(habito.id_habito);

      if (rachaActual) {
      const finRacha = new Date(rachaActual.fin_racha);
      finRacha.setUTCHours(0, 0, 0, 0);
      
      if (finRacha.getTime() === hoy.getTime()) {
        console.log(`${habito.nombre_habito}: Racha ya actualizada hoy`);
        return false; // Ya actualizamos hoy, no duplicar
      }
    }

    // 2. OBTENER PROGRESO ACTUAL

    const { data: registrosHoy, error: registrosError } = await supabase
      .from("registro_intervalo")
      .select("*")
      .eq("id_habito", habito.id_habito)
      .gte("fecha", hoy.toISOString())
      .lte("fecha", hoy.toISOString());

    if (registrosError) {
      console.error(`Error al obtener registros de hoy:`, registrosError);
      return false;
    }

    const progresoHoy = registrosHoy ? registrosHoy.length : 0;

    // 3. LÓGICA ESPECÍFICA POR TIPO DE INTERVALO
    
    if (habito.intervalo_meta === 'diario') {
      // DIARIO: Solo actualiza si completó la meta del día
      const metaCompletada = progresoHoy >= habito.meta_repeticion;
      
      if (!metaCompletada) {
        console.log(`${habito.nombre_habito} (Diario): ${progresoHoy}/${habito.meta_repeticion} - Meta no alcanzada`);
        return false;
      }

      console.log(`${habito.nombre_habito} (Diario): Meta completada - Actualizando racha...`);
      return await actualizarRachaHabito(habito, registrosHoy[0]);
    }

    if (habito.intervalo_meta === 'semanal' || habito.intervalo_meta === 'mensual') {
      // SEMANAL/MENSUAL: Actualiza racha CADA DÍA que hay progreso
      // Al final del período verifica si completó la meta
      
      if (progresoHoy === 0) {
        console.log(`${habito.nombre_habito} (${habito.intervalo_meta}): Sin progreso hoy`);
        
        // Verificar si terminó el período sin completar meta
        if (rachaActual) {
          const finRacha = new Date(rachaActual.fin_racha);
          const inicioPeriodoRacha = calcularInicioPeriodo(finRacha, habito.intervalo_meta);
          const inicioPeriodoActual = calcularInicioPeriodo(hoy, habito.intervalo_meta);
          
          // Si cambió el período, verificar si completó la meta del período anterior
          if (inicioPeriodoActual.getTime() !== inicioPeriodoRacha.getTime()) {
            console.log(`${habito.nombre_habito}: Periodo cambió, verificando meta del período anterior...`);
            
            // Obtener registros del período anterior
            const finPeriodoAnterior = new Date(inicioPeriodoActual);
            finPeriodoAnterior.setDate(finPeriodoAnterior.getDate() - 1);
            finPeriodoAnterior.setUTCHours(23, 59, 59, 999);
            
            const inicioPeriodoAnterior = calcularInicioPeriodo(finPeriodoAnterior, habito.intervalo_meta);
            
            const { data: registrosPeriodoAnterior } = await supabase
              .from("registro_intervalo")
              .select("*")
              .eq("id_habito", habito.id_habito)
              .gte("fecha", inicioPeriodoAnterior.toISOString())
              .lte("fecha", finPeriodoAnterior.toISOString());
            
            const progresoAnterior = registrosPeriodoAnterior ? registrosPeriodoAnterior.length : 0;
            
            if (progresoAnterior < habito.meta_repeticion) {
              console.log(`${habito.nombre_habito}: Período anterior NO completado (${progresoAnterior}/${habito.meta_repeticion}). Verificando rachas expiradas...`);
              await checkAndDeactivateExpiredRachas(habito.id_habito, habito.intervalo_meta);
            }
          }
        }
        
        return false;
      }

      // Hay progreso hoy → Actualizar racha (suma +1 por el día)
      console.log(`${habito.nombre_habito} (${habito.intervalo_meta}): Progreso hoy (${progresoHoy}) - Actualizando racha diaria...`);
      return await actualizarRachaHabito(habito, registrosHoy[0]);
    }

    return false;

  } catch (error) {
    console.error(`Error al verificar hábito ${habito.nombre_habito}:`, error);
    return false;
  }
}

/**
 * Actualiza la racha de un hábito específico
 */
async function actualizarRachaHabito(habito: IHabito, ultimoRegistro: any): Promise<boolean> {
  try {
    // Verificar rachas expiradas primero
    await checkAndDeactivateExpiredRachas(habito.id_habito, habito.intervalo_meta);

    if (!ultimoRegistro) {
      console.error(`No hay registro para actualizar racha del hábito ${habito.nombre_habito}`);
      return false;
    }

    // Actualizar la racha
    const resultado = await updateRachaOnHabitCompletion(
      ultimoRegistro.id_registro,
      habito.id_habito,
      habito.intervalo_meta,
      true, // habitoCompletado
      habito.meta_repeticion
    );

    if (resultado.success) {
      console.log(`Racha actualizada para ${habito.nombre_habito}: ${resultado.diasConsecutivos} días`);
      return true;
    }

    return false;
  } catch (error) {
    console.error(`Error al actualizar racha:`, error);
    return false;
  }
}

/**
 * Calcula el inicio del período actual según el tipo de intervalo
 */
function calcularInicioPeriodo(fecha: Date, intervaloMeta: string): Date {
  const inicio = new Date(fecha);
  inicio.setUTCHours(0, 0, 0, 0);

  if (intervaloMeta === 'diario') {
    return inicio;
  } else if (intervaloMeta === 'semanal') {
    const diaSemana = inicio.getDay();
    const diasDesdeInicio = diaSemana === 0 ? 6 : diaSemana - 1;
    inicio.setDate(inicio.getDate() - diasDesdeInicio);
    return inicio;
  } else if (intervaloMeta === 'mensual') {
    inicio.setDate(1);
    return inicio;
  }

  return inicio;
}
