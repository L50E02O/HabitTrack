/**
 * Tipos para integración con Health Connect API
 * Health Connect es la plataforma de Android para compartir datos de salud y fitness entre aplicaciones
 */

/**
 * Datos de salud obtenidos desde Health Connect
 */
export interface IDatosSalud {
  id_datos: string;
  id_perfil: string;
  fecha: string; // YYYY-MM-DD
  pasos: number;
  frecuencia_cardiaca?: number | null;
  calorias_quemadas?: number | null;
  distancia_km?: number | null;
  horas_sueno?: number | null;
  minutos_ejercicio?: number | null;
  nivel_oxigeno?: number | null;
  fecha_sincronizacion: Date;
}

/**
 * Datos para crear un nuevo registro de salud
 */
export interface CreateIDatosSalud {
  id_perfil: string;
  fecha: string; // YYYY-MM-DD
  pasos: number;
  frecuencia_cardiaca?: number | null;
  calorias_quemadas?: number | null;
  distancia_km?: number | null;
  horas_sueno?: number | null;
  minutos_ejercicio?: number | null;
  nivel_oxigeno?: number | null;
}

/**
 * Datos en tiempo real desde Health Connect (antes de guardar)
 */
export interface DatosSmartwatchTiempoReal {
  pasos: number;
  frecuenciaCardiaca?: number;
  caloriasQuemadas?: number;
  distanciaKm?: number;
  horasSueno?: number;
  minutosEjercicio?: number;
  nivelOxigeno?: number;
  conectado: boolean;
  ultimaActualizacion?: Date;
}

/**
 * Estado de sincronización con Health Connect
 */
export interface EstadoConexion {
  conectado: boolean;
  conectando: boolean;
  error: string | null;
  aplicacionOrigen: string | null; // App de origen de los datos (ej: "Mi Smartwatch", "Google Fit")
  ultimaSincronizacion: Date | null;
  permisosOtorgados: boolean;
}

/**
 * Configuración de sincronización automática
 */
export interface ConfiguracionSincronizacion {
  sincronizacionAutomatica: boolean;
  intervaloMinutos: number; // Cada cuántos minutos sincronizar
  sincronizarPasos: boolean;
  sincronizarFrecuenciaCardiaca: boolean;
  sincronizarCalorias: boolean;
  sincronizarDistancia: boolean;
  sincronizarSueno: boolean;
  sincronizarEjercicio: boolean;
  sincronizarOxigeno: boolean;
}

/**
 * Tipos de datos soportados por Health Connect
 */
export enum TipoDatoHealthConnect {
  PASOS = 'steps',
  FRECUENCIA_CARDIACA = 'heart_rate',
  CALORIAS = 'calories',
  DISTANCIA = 'distance',
  SUENO = 'sleep',
  EJERCICIO = 'exercise',
  OXIGENO = 'oxygen_saturation'
}

/**
 * Permisos necesarios para Health Connect
 */
export interface PermisosHealthConnect {
  leerPasos: boolean;
  leerFrecuenciaCardiaca: boolean;
  leerCalorias: boolean;
  leerDistancia: boolean;
  leerSueno: boolean;
  leerEjercicio: boolean;
  leerOxigeno: boolean;
}

