/**
 * Ejemplos de Uso: Google Fit API Integration
 * Este archivo muestra cómo usar la integración en diferentes contextos
 */

// ============================================================================
// 1. USO EN COMPONENTES REACT
// ============================================================================

import { useGoogleFit } from './hooks/useGoogleFit';
import GoogleFitConnection from './components/GoogleFitConnection';

// Componente simple que obtiene pasos del día actual
function DashboardGoogleFit({ userId }: { userId: string }) {
  const { stepsData, loading, error, isAuthenticated } = useGoogleFit({ userId });

  if (!isAuthenticated) {
    return <p>Por favor, conecta Google Fit primero</p>;
  }

  if (loading) return <p>Cargando datos...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div>
      <h3>Hoy: {stepsData?.steps || 0} pasos</h3>
      <p>Calorías: {stepsData?.calories || 0}</p>
    </div>
  );
}

// Componente con histórico de pasos
function StepsHistoryComponent({ userId }: { userId: string }) {
  const { getStepsRange, stepsRange, loading } = useGoogleFit({ userId, autoFetch: false });

  const handleLoadHistory = async () => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30); // Últimos 30 días

    const endDate = new Date();
    await getStepsRange(startDate, endDate);
  };

  return (
    <div>
      <button onClick={handleLoadHistory} disabled={loading}>
        {loading ? 'Cargando...' : 'Ver últimos 30 días'}
      </button>

      {stepsRange.length > 0 && (
        <ul>
          {stepsRange.map((day) => (
            <li key={day.date}>
              {day.date}: {day.steps} pasos, {day.calories} calorías
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ============================================================================
// 2. USO DIRECTO DEL SERVICIO (Backend)
// ============================================================================

import googleFitService from './services/googleFit/googleFitService';
import type { GoogleFitTokens } from './services/googleFit/types';

// Obtener pasos para un usuario
async function obtenerPasosDelUsuario(userId: string) {
  try {
    // Obtener tokens de la base de datos
    const { data: tokenData } = await supabase
      .from('google_fit_tokens')
      .select('access_token, refresh_token, expiry_date')
      .eq('user_id', userId)
      .single();

    if (!tokenData) {
      throw new Error('Usuario no autenticado con Google Fit');
    }

    const tokens: GoogleFitTokens = {
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expiry_date: new Date(tokenData.expiry_date).getTime(),
      token_type: 'Bearer'
    };

    // Obtener pasos del día
    const stepsData = await googleFitService.getDailySteps(tokens);
    console.log(`Pasos hoy: ${stepsData.steps}`);

    return stepsData;
  } catch (error) {
    console.error('Error al obtener pasos:', error);
    throw error;
  }
}

// Procesar callback de autenticación
async function procesarCallbackGoogle(code: string, userId: string) {
  try {
    // Intercambiar código por tokens
    const tokens = await googleFitService.exchangeCodeForTokens(code);

    // Guardar en la base de datos
    const { error } = await supabase.from('google_fit_tokens').upsert({
      user_id: userId,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expiry_date: new Date(tokens.expiry_date).toISOString(),
      token_type: tokens.token_type
    });

    if (error) throw error;

    console.log('Autenticación completada exitosamente');
    return true;
  } catch (error) {
    console.error('Error en autenticación:', error);
    return false;
  }
}

// ============================================================================
// 3. INTEGRACIÓN CON RACHAS (Sistema de Hábitos)
// ============================================================================

import { supabase } from './config/supabase';

// Sincronizar pasos de Google Fit con registro de hábitos
async function sincronizarPasosConHabito(userId: string, habitoId: string) {
  try {
    // Obtener pasos de hoy
    const stepsData = await obtenerPasosDelUsuario(userId);

    // Determinar si completó el hábito basado en los pasos
    const { data: habito } = await supabase
      .from('habitos')
      .select('meta')
      .eq('id', habitoId)
      .single();

    const metaPasos = habito?.meta || 10000;
    const completado = stepsData.steps >= metaPasos;

    // Registrar el hábito
    const { error } = await supabase.from('registros').insert({
      id_habito: habitoId,
      id_perfil: userId,
      fecha: new Date().toISOString().split('T')[0],
      completado,
      descripcion: `${stepsData.steps} pasos - ${stepsData.calories} calorías`
    });

    if (error) throw error;

    return {
      success: true,
      message: `Registro completado: ${stepsData.steps} / ${metaPasos} pasos`,
      data: stepsData
    };
  } catch (error) {
    console.error('Error en sincronización:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
}

// ============================================================================
// 4. TAREA CRON PARA SINCRONIZACIÓN AUTOMÁTICA
// ============================================================================

// Ejecutar cada hora para actualizar datos de Google Fit
async function sincronizacionAutomatica() {
  try {
    // Obtener todos los usuarios con Google Fit conectado
    const { data: usuarios } = await supabase
      .from('google_fit_tokens')
      .select('user_id');

    if (!usuarios || usuarios.length === 0) {
      console.log('No hay usuarios con Google Fit conectado');
      return;
    }

    // Procesar cada usuario
    for (const { user_id } of usuarios) {
      try {
        await sincronizarPasosConHabito(user_id, 'habito-pasos-diarios');
        console.log(`Sincronizado usuario ${user_id}`);
      } catch (error) {
        console.error(`Error sincronizando usuario ${user_id}:`, error);
      }
    }

    console.log('Sincronización completada');
  } catch (error) {
    console.error('Error en sincronización automática:', error);
  }
}

// Agendar sincronización cada hora
// setInterval(sincronizacionAutomatica, 60 * 60 * 1000);

// ============================================================================
// 5. USAR EL CLIENTE FRONTEND
// ============================================================================

import googleFitClient from './services/googleFit/client';

// Iniciar login
async function iniciarLogin() {
  try {
    await googleFitClient.initiateLogin();
  } catch (error) {
    console.error('Error al iniciar sesión:', error);
  }
}

// Obtener pasos desde el frontend
async function obtenerPasosAlternativo(userId: string) {
  try {
    const data = await googleFitClient.getDailySteps(userId);
    console.log('Pasos:', data.steps);
    return data;
  } catch (error) {
    console.error('Error:', error);
  }
}

// Obtener rango de pasos
async function obtenerHistorico(userId: string) {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);
    const endDate = new Date();

    const data = await googleFitClient.getDailyStepsRange(userId, startDate, endDate);
    console.log(`Últimos 7 días:`, data);
    return data;
  } catch (error) {
    console.error('Error:', error);
  }
}

// ============================================================================
// 6. MANEJO DE ERRORES Y CASOS ESPECIALES
// ============================================================================

// Refrescar token automáticamente
async function obtenerPasosConRefresh(userId: string, refreshToken: string) {
  try {
    let tokens: GoogleFitTokens = {
      access_token: 'token-expirado',
      refresh_token: refreshToken,
      expiry_date: Date.now() - 1000, // Ya expirado
      token_type: 'Bearer'
    };

    // googleFitService detectará que está expirado y usará refresh_token
    const stepsData = await googleFitService.getDailySteps(tokens);

    // Guardar tokens actualizados
    await supabase.from('google_fit_tokens').update({
      access_token: tokens.access_token,
      expiry_date: new Date(tokens.expiry_date).toISOString()
    });

    return stepsData;
  } catch (error) {
    console.error('Error:', error);

    if (error instanceof Error && error.message.includes('token de refresco')) {
      // Pedir que se autentique de nuevo
      return { error: 'Por favor, vuelve a conectar tu cuenta de Google Fit' };
    }

    throw error;
  }
}

// Manejar desconexión
async function desconectarGoogleFit(userId: string) {
  try {
    const { error } = await supabase
      .from('google_fit_tokens')
      .delete()
      .eq('user_id', userId);

    if (error) throw error;

    console.log('Google Fit desconectado');
    return { success: true };
  } catch (error) {
    console.error('Error al desconectar:', error);
    return { success: false };
  }
}

export {
  DashboardGoogleFit,
  StepsHistoryComponent,
  obtenerPasosDelUsuario,
  procesarCallbackGoogle,
  sincronizarPasosConHabito,
  sincronizacionAutomatica,
  iniciarLogin,
  obtenerPasosAlternativo,
  obtenerHistorico,
  obtenerPasosConRefresh,
  desconectarGoogleFit
};
