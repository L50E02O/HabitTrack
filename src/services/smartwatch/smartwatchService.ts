import { supabase } from "../../config/supabase";
import type { IDatosSalud, CreateIDatosSalud, DatosSmartwatchTiempoReal, EstadoConexion, PermisosHealthConnect, TipoDatoHealthConnect } from "../../types/ISmartwatch";

/**
 * Servicio para gestionar la sincronización con Health Connect
 * 
 * Health Connect es la plataforma de Android que permite compartir datos de salud
 * entre aplicaciones. Se integra con apps como "Mi Smartwatch" y FitCloudPro.
 * 
 * Requisitos:
 * - Android 14+ o la app Health Connect instalada en Android 13-
 * - Permisos de lectura otorgados para cada tipo de dato
 * - API backend para obtener datos desde Health Connect
 */

const HEALTH_CONNECT_API_BASE = import.meta.env.VITE_HEALTH_CONNECT_API || '/api/health-connect';

/**
 * Verifica si la aplicación tiene permisos para acceder a Health Connect
 * @returns Promise con el estado de los permisos
 */
export async function verificarPermisos(): Promise<PermisosHealthConnect> {
  try {
    const response = await fetch(`${HEALTH_CONNECT_API_BASE}/permisos`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Error al verificar permisos: ${response.statusText}`);
    }

    const permisos = await response.json();
    return permisos;
  } catch (error: any) {
    console.error("Error al verificar permisos de Health Connect:", error);
    throw new Error(
      "No se pudieron verificar los permisos de Health Connect. " +
      "Asegúrate de que la API esté configurada correctamente."
    );
  }
}

/**
 * Solicita permisos para acceder a datos específicos de Health Connect
 * @param tiposDatos Array con los tipos de datos a solicitar
 * @returns Promise que se resuelve cuando se otorgan los permisos
 */
export async function solicitarPermisos(
  tiposDatos: TipoDatoHealthConnect[]
): Promise<void> {
  try {
    const response = await fetch(`${HEALTH_CONNECT_API_BASE}/permisos/solicitar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ tiposDatos }),
    });

    if (!response.ok) {
      throw new Error(`Error al solicitar permisos: ${response.statusText}`);
    }

    const resultado = await response.json();
    
    if (!resultado.otorgados) {
      throw new Error(
        "Permisos no otorgados. Por favor, acepta los permisos en la configuración de Health Connect."
      );
    }
  } catch (error: any) {
    console.error("Error al solicitar permisos:", error);
    throw error;
  }
}

/**
 * Obtiene datos de salud desde Health Connect para una fecha específica
 * @param fecha Fecha en formato YYYY-MM-DD
 * @returns Promise con los datos del día
 */
export async function obtenerDatosTiempoReal(
  fecha?: string
): Promise<DatosSmartwatchTiempoReal> {
  try {
    const fechaConsulta = fecha || new Date().toISOString().split('T')[0];
    
    const response = await fetch(`${HEALTH_CONNECT_API_BASE}/datos?fecha=${fechaConsulta}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Error al obtener datos: ${response.statusText}`);
    }

    const datos = await response.json();
    
    return {
      pasos: datos.pasos || 0,
      frecuenciaCardiaca: datos.frecuenciaCardiaca || undefined,
      caloriasQuemadas: datos.caloriasQuemadas || undefined,
      distanciaKm: datos.distanciaKm || undefined,
      horasSueno: datos.horasSueno || undefined,
      minutosEjercicio: datos.minutosEjercicio || undefined,
      nivelOxigeno: datos.nivelOxigeno || undefined,
      conectado: true,
      ultimaActualizacion: datos.ultimaActualizacion ? new Date(datos.ultimaActualizacion) : new Date(),
    };
  } catch (error: any) {
    console.error("Error al obtener datos de Health Connect:", error);
    throw new Error(`Error al obtener datos del smartwatch: ${error.message}`);
  }
}

/**
 * Inicializa la conexión con Health Connect
 * Verifica permisos y disponibilidad de la API
 * @returns Promise con true si la conexión es exitosa
 */
export async function inicializarHealthConnect(): Promise<boolean> {
  try {
    // Verificar que la API esté disponible
    const response = await fetch(`${HEALTH_CONNECT_API_BASE}/estado`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error("Health Connect API no está disponible");
    }

    const estado = await response.json();
    
    if (!estado.disponible) {
      throw new Error(
        "Health Connect no está disponible en este dispositivo. " +
        "Instala la app Health Connect desde Play Store."
      );
    }

    return true;
  } catch (error: any) {
    console.error("Error al inicializar Health Connect:", error);
    throw new Error(
      "No se pudo conectar con Health Connect. " +
      "Verifica que tengas Android 13+ y Health Connect instalado, " +
      "o que tu API backend esté configurada correctamente."
    );
  }
}

/**
 * Guarda datos de salud en la base de datos
 * @param datos Datos de salud a guardar
 * @returns Promise con los datos guardados
 */
export async function guardarDatosSalud(datos: CreateIDatosSalud): Promise<IDatosSalud> {
  try {
    // Validar datos
    if (datos.pasos < 0) {
      throw new Error("Los pasos no pueden ser negativos");
    }

    if (datos.frecuencia_cardiaca && (datos.frecuencia_cardiaca < 30 || datos.frecuencia_cardiaca > 220)) {
      throw new Error("La frecuencia cardíaca debe estar entre 30 y 220 bpm");
    }

    if (datos.nivel_oxigeno && (datos.nivel_oxigeno < 70 || datos.nivel_oxigeno > 100)) {
      throw new Error("El nivel de oxígeno debe estar entre 70 y 100%");
    }

    // Verificar si ya existe un registro para esta fecha
    const { data: existente, error: errorExistente } = await supabase
      .from("datos_salud")
      .select("*")
      .eq("id_perfil", datos.id_perfil)
      .eq("fecha", datos.fecha)
      .single();

    let resultado: IDatosSalud;

    if (existente && !errorExistente) {
      // Actualizar registro existente
      const { data: actualizado, error: errorUpdate } = await supabase
        .from("datos_salud")
        .update({
          pasos: datos.pasos,
          frecuencia_cardiaca: datos.frecuencia_cardiaca ?? null,
          calorias_quemadas: datos.calorias_quemadas ?? null,
          distancia_km: datos.distancia_km ?? null,
          horas_sueno: datos.horas_sueno ?? null,
          minutos_ejercicio: datos.minutos_ejercicio ?? null,
          nivel_oxigeno: datos.nivel_oxigeno ?? null,
          fecha_sincronizacion: new Date().toISOString(),
        })
        .eq("id_datos", existente.id_datos)
        .select()
        .single();

      if (errorUpdate) {
        throw new Error(`Error al actualizar datos de salud: ${errorUpdate.message}`);
      }

      if (!actualizado) {
        throw new Error("No se pudo actualizar los datos de salud");
      }

      resultado = actualizado;
    } else {
      // Crear nuevo registro
      const { data: nuevo, error: errorInsert } = await supabase
        .from("datos_salud")
        .insert({
          id_perfil: datos.id_perfil,
          fecha: datos.fecha,
          pasos: datos.pasos,
          frecuencia_cardiaca: datos.frecuencia_cardiaca ?? null,
          calorias_quemadas: datos.calorias_quemadas ?? null,
          distancia_km: datos.distancia_km ?? null,
          horas_sueno: datos.horas_sueno ?? null,
          minutos_ejercicio: datos.minutos_ejercicio ?? null,
          nivel_oxigeno: datos.nivel_oxigeno ?? null,
          fecha_sincronizacion: new Date().toISOString(),
        })
        .select()
        .single();

      if (errorInsert) {
        throw new Error(`Error al guardar datos de salud: ${errorInsert.message}`);
      }

      if (!nuevo) {
        throw new Error("No se pudo crear el registro de datos de salud");
      }

      resultado = nuevo;
    }

    return resultado;
  } catch (error: any) {
    console.error("Error en guardarDatosSalud:", error);
    throw error;
  }
}

/**
 * Obtiene los datos de salud de un usuario para una fecha específica
 * @param idPerfil ID del perfil del usuario
 * @param fecha Fecha en formato YYYY-MM-DD
 * @returns Promise con los datos de salud o null si no existen
 */
export async function obtenerDatosSaludPorFecha(
  idPerfil: string,
  fecha: string
): Promise<IDatosSalud | null> {
  try {
    const { data, error } = await supabase
      .from("datos_salud")
      .select("*")
      .eq("id_perfil", idPerfil)
      .eq("fecha", fecha)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      throw new Error(`Error al obtener datos de salud: ${error.message}`);
    }

    return data || null;
  } catch (error: any) {
    console.error("Error en obtenerDatosSaludPorFecha:", error);
    throw error;
  }
}

/**
 * Obtiene los datos de salud de un usuario para un rango de fechas
 * @param idPerfil ID del perfil del usuario
 * @param fechaInicio Fecha de inicio (YYYY-MM-DD)
 * @param fechaFin Fecha de fin (YYYY-MM-DD)
 * @returns Promise con array de datos de salud
 */
export async function obtenerDatosSaludPorRango(
  idPerfil: string,
  fechaInicio: string,
  fechaFin: string
): Promise<IDatosSalud[]> {
  try {
    const { data, error } = await supabase
      .from("datos_salud")
      .select("*")
      .eq("id_perfil", idPerfil)
      .gte("fecha", fechaInicio)
      .lte("fecha", fechaFin)
      .order("fecha", { ascending: true });

    if (error) {
      throw new Error(`Error al obtener datos de salud: ${error.message}`);
    }

    return data || [];
  } catch (error: any) {
    console.error("Error en obtenerDatosSaludPorRango:", error);
    throw error;
  }
}

/**
 * Obtiene el estado de conexión con Health Connect
 * @returns Estado de conexión
 */
export async function obtenerEstadoConexion(): Promise<EstadoConexion> {
  try {
    const response = await fetch(`${HEALTH_CONNECT_API_BASE}/estado`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return {
        conectado: false,
        conectando: false,
        error: "No se pudo conectar con Health Connect API",
        aplicacionOrigen: null,
        ultimaSincronizacion: null,
        permisosOtorgados: false,
      };
    }

    const estado = await response.json();
    
    return {
      conectado: estado.disponible || false,
      conectando: false,
      error: null,
      aplicacionOrigen: estado.aplicacionOrigen || null,
      ultimaSincronizacion: estado.ultimaSincronizacion ? new Date(estado.ultimaSincronizacion) : null,
      permisosOtorgados: estado.permisosOtorgados || false,
    };
  } catch (error: any) {
    return {
      conectado: false,
      conectando: false,
      error: error.message,
      aplicacionOrigen: null,
      ultimaSincronizacion: null,
      permisosOtorgados: false,
    };
  }
}

/**
 * Sincroniza datos de Health Connect con la base de datos
 * @param idPerfil ID del perfil del usuario
 * @param fecha Fecha a sincronizar (opcional, por defecto hoy)
 * @returns Promise con los datos sincronizados
 */
export async function sincronizarDatos(
  idPerfil: string,
  fecha?: string
): Promise<IDatosSalud> {
  try {
    // Obtener datos de Health Connect
    const datosTiempoReal = await obtenerDatosTiempoReal(fecha);
    
    // Preparar datos para guardar
    const fechaSincronizacion = fecha || new Date().toISOString().split('T')[0];
    
    const datosGuardar: CreateIDatosSalud = {
      id_perfil: idPerfil,
      fecha: fechaSincronizacion,
      pasos: datosTiempoReal.pasos,
      frecuencia_cardiaca: datosTiempoReal.frecuenciaCardiaca,
      calorias_quemadas: datosTiempoReal.caloriasQuemadas,
      distancia_km: datosTiempoReal.distanciaKm,
      horas_sueno: datosTiempoReal.horasSueno,
      minutos_ejercicio: datosTiempoReal.minutosEjercicio,
      nivel_oxigeno: datosTiempoReal.nivelOxigeno,
    };
    
    // Guardar en base de datos
    const resultado = await guardarDatosSalud(datosGuardar);
    
    return resultado;
  } catch (error: any) {
    console.error("Error al sincronizar datos:", error);
    throw error;
  }
}

