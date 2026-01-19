import { supabase } from "../../config/supabase";
import type { IUsuarioRanking, IEstadisticasRanking } from "../../types/IRanking";
import { 
    obtenerRangoPorPuntos, 
    obtenerSiguienteRango, 
    calcularProgresoRango,
    puntosFaltantesParaSiguienteRango 
} from "../../core/constants/rangos";

/**
 * Obtiene el ranking completo de usuarios ordenados por puntos
 * Usa Supabase directamente como backend
 * @param limite Número máximo de usuarios a retornar (por defecto 50, máximo 100)
 */
export async function obtenerRankingCompleto(limite?: number): Promise<IUsuarioRanking[]> {
    try {
        // Limitar a máximo 100 usuarios, por defecto 50
        const limiteFinal = limite ? Math.min(limite, 100) : 50;

        // Consultar directamente desde Supabase
        const { data, error } = await supabase
            .from('perfil')
            .select('id, nombre, puntos, foto_perfil')
            .order('puntos', { ascending: false })
            .limit(limiteFinal);

        if (error) {
            console.error("Error al obtener ranking desde Supabase:", error);
            throw error;
        }

        // Mapear los datos al formato IUsuarioRanking
        const ranking: IUsuarioRanking[] = (data || []).map((usuario, index) => ({
            id: usuario.id,
            nombre: usuario.nombre,
            puntos: usuario.puntos || 0,
            posicion: index + 1,
            rango: obtenerRangoPorPuntos(usuario.puntos || 0),
            foto_perfil: usuario.foto_perfil
        }));

        return ranking;
    } catch (error: any) {
        console.error("Error al obtener ranking:", error);
        throw error;
    }
}

/**
 * Obtiene la posición y estadísticas de un usuario específico
 */
export async function obtenerEstadisticasUsuario(userId: string): Promise<IEstadisticasRanking> {
    try {
        // Obtener datos del usuario
        const { data: usuario, error: userError } = await supabase
            .from('perfil')
            .select('puntos')
            .eq('id', userId)
            .maybeSingle();

        if (userError) throw userError;

        const puntos = usuario?.puntos || 0;

        // Calcular posición del usuario
        const { count, error: countError } = await supabase
            .from('perfil')
            .select('id', { count: 'exact', head: true })
            .gt('puntos', puntos);

        if (countError) throw countError;

        const posicion = (count || 0) + 1;

        // Obtener total de usuarios
        const { count: totalUsuarios, error: totalError } = await supabase
            .from('perfil')
            .select('id', { count: 'exact', head: true });

        if (totalError) throw totalError;

        // Calcular rango y progreso
        const rangoActual = obtenerRangoPorPuntos(puntos);
        const siguienteRango = obtenerSiguienteRango(rangoActual);
        const progresoRango = calcularProgresoRango(puntos, rangoActual);
        const puntosParaSiguienteRango = puntosFaltantesParaSiguienteRango(puntos, siguienteRango);

        return {
            totalUsuarios: totalUsuarios || 0,
            tuPosicion: posicion,
            puntosParaSiguienteRango,
            rangoActual,
            siguienteRango,
            progresoRango
        };
    } catch (error: any) {
        console.error("Error al obtener estadísticas del usuario:", error);
        throw error;
    }
}

/**
 * Obtiene el top N de usuarios
 */
export async function obtenerTopUsuarios(limite: number = 10): Promise<IUsuarioRanking[]> {
    return obtenerRankingCompleto(limite);
}

/**
 * Obtiene usuarios cercanos en el ranking (arriba y abajo de tu posición)
 */
export async function obtenerUsuariosCercanos(
    userId: string, 
    cantidad: number = 5
): Promise<IUsuarioRanking[]> {
    try {
        // Obtener puntos del usuario
        const { data: usuario, error: userError } = await supabase
            .from('perfil')
            .select('puntos')
            .eq('id', userId)
            .maybeSingle();

        if (userError) throw userError;

        const puntos = usuario?.puntos || 0;

        // Obtener usuarios con más puntos (arriba)
        const { data: arriba, error: arribaError } = await supabase
            .from('perfil')
            .select('id, nombre, puntos, foto_perfil')
            .gt('puntos', puntos)
            .order('puntos', { ascending: true })
            .limit(cantidad);

        if (arribaError) throw arribaError;

        // Obtener usuarios con menos puntos (abajo)
        const { data: abajo, error: abajoError } = await supabase
            .from('perfil')
            .select('id, nombre, puntos, foto_perfil')
            .lte('puntos', puntos)
            .order('puntos', { ascending: false })
            .limit(cantidad + 1); // +1 para incluir al usuario actual

        if (abajoError) throw abajoError;

        // Combinar y ordenar
        const todos = [...(arriba || []), ...(abajo || [])]
            .sort((a, b) => {
                const puntosA = a.puntos || 0;
                const puntosB = b.puntos || 0;
                return puntosB - puntosA;
            });

        // Si no hay resultados, devolver vacío
        if (todos.length === 0) return [];

        // Calcular posiciones
        const ranking: IUsuarioRanking[] = [];
        let posicionInicial = 0;

        // Calcular posición inicial
        const { count } = await supabase
            .from('perfil')
            .select('id', { count: 'exact', head: true })
            .gt('puntos', todos[0]?.puntos || 0);

        posicionInicial = (count || 0) + 1;

        todos.forEach((u, index) => {
            ranking.push({
                id: u.id,
                nombre: u.nombre,
                puntos: u.puntos || 0,
                posicion: posicionInicial + index,
                rango: obtenerRangoPorPuntos(u.puntos || 0),
                foto_perfil: u.foto_perfil
            });
        });

        return ranking;
    } catch (error: any) {
        console.error("Error al obtener usuarios cercanos:", error);
        throw error;
    }
}
