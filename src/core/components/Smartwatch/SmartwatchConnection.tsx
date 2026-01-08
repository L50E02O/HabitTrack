import { useState, useEffect, useCallback } from 'react';
import { Activity, Heart, Footprints, Zap, ZapOff, RefreshCw, AlertCircle, Flame, Moon } from 'lucide-react';
import { 
  inicializarHealthConnect,
  obtenerDatosTiempoReal,
  sincronizarDatos,
  obtenerEstadoConexion,
  verificarPermisos,
  solicitarPermisos
} from '../../../services/smartwatch/smartwatchService';
import type { EstadoConexion, TipoDatoHealthConnect } from '../../../types/ISmartwatch';
import type { DatosSmartwatchTiempoReal } from '../../../types/ISmartwatch';
import './SmartwatchConnection.css';

interface SmartwatchConnectionProps {
  userId: string;
  darkMode?: boolean;
}

export default function SmartwatchConnection({ userId, darkMode = false }: SmartwatchConnectionProps) {
  const [estado, setEstado] = useState<EstadoConexion>({
    conectado: false,
    conectando: false,
    error: null,
    aplicacionOrigen: null,
    ultimaSincronizacion: null,
    permisosOtorgados: false,
  });
  const [datosTiempoReal, setDatosTiempoReal] = useState<DatosSmartwatchTiempoReal | null>(null);
  const [sincronizando, setSincronizando] = useState(false);
  const [mensaje, setMensaje] = useState<{ texto: string; tipo: 'success' | 'error' | 'info' } | null>(null);

  // Verificar estado de Health Connect al montar
  useEffect(() => {
    const verificarEstado = async () => {
      try {
        const estadoActual = await obtenerEstadoConexion();
        setEstado(estadoActual);
      } catch (error: any) {
        console.error('Error al verificar estado:', error);
      }
    };
    
    verificarEstado();
  }, []);

  const handleConectar = useCallback(async () => {
    try {
      setEstado((prev: EstadoConexion) => ({ ...prev, conectando: true, error: null }));
      setMensaje(null);

      // Inicializar Health Connect
      await inicializarHealthConnect();

      // Solicitar permisos necesarios
      const tiposDatos: TipoDatoHealthConnect[] = [
        TipoDatoHealthConnect.PASOS,
        TipoDatoHealthConnect.FRECUENCIA_CARDIACA,
        TipoDatoHealthConnect.CALORIAS,
        TipoDatoHealthConnect.DISTANCIA,
        TipoDatoHealthConnect.SUENO,
        TipoDatoHealthConnect.EJERCICIO,
        TipoDatoHealthConnect.OXIGENO
      ];

      await solicitarPermisos(tiposDatos);

      // Verificar permisos
      const permisos = await verificarPermisos();

      // Obtener estado actualizado
      const estadoActualizado = await obtenerEstadoConexion();

      // Obtener datos iniciales
      const datos = await obtenerDatosTiempoReal();
      setDatosTiempoReal(datos);

      setEstado({
        ...estadoActualizado,
        conectando: false,
        permisosOtorgados: true,
      });

      setMensaje({
        texto: 'Conectado a Health Connect exitosamente',
        tipo: 'success',
      });
    } catch (error: any) {
      setEstado((prev: EstadoConexion) => ({
        ...prev,
        conectando: false,
        error: error.message,
      }));
      setMensaje({
        texto: error.message || 'Error al conectar con Health Connect',
        tipo: 'error',
      });
    }
  }, []);


  const handleDesconectar = useCallback(async () => {
    try {
      setDatosTiempoReal(null);
      setEstado({
        conectado: false,
        conectando: false,
        error: null,
        aplicacionOrigen: null,
        ultimaSincronizacion: null,
        permisosOtorgados: false,
      });
      setMensaje({
        texto: 'Desconectado de Health Connect',
        tipo: 'info',
      });
    } catch (error: any) {
      setMensaje({
        texto: error.message || 'Error al desconectar',
        tipo: 'error',
      });
    }
  }, []);

  const handleSincronizar = useCallback(async () => {
    if (!estado.conectado) {
      setMensaje({
        texto: 'Primero debes conectar con Health Connect',
        tipo: 'error',
      });
      return;
    }

    try {
      setSincronizando(true);
      setMensaje(null);

      // Sincronizar datos desde Health Connect a la base de datos
      const datosSincronizados = await sincronizarDatos(userId);

      // Actualizar datos en tiempo real
      const datos = await obtenerDatosTiempoReal();
      setDatosTiempoReal(datos);

      setEstado((prev: EstadoConexion) => ({
        ...prev,
        ultimaSincronizacion: new Date(),
      }));

      setMensaje({
        texto: 'Datos sincronizados exitosamente',
        tipo: 'success',
      });
    } catch (error: any) {
      setMensaje({
        texto: error.message || 'Error al sincronizar datos',
        tipo: 'error',
      });
    } finally {
      setSincronizando(false);
    }
  }, [estado.conectado, userId]);

  // Limpiar mensaje después de 5 segundos
  useEffect(() => {
    if (mensaje) {
      const timer = setTimeout(() => {
        setMensaje(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [mensaje]);

  return (
    <div className={`smartwatch-connection ${darkMode ? 'dark' : ''}`}>
      <div className="smartwatch-header">
        <div className="smartwatch-title">
          <Activity size={24} />
          <h3>Health Connect</h3>
        </div>
        {estado.conectado && (
          <div className={`smartwatch-status ${estado.conectado ? 'connected' : ''}`}>
            <div className="status-dot"></div>
            <span>Conectado</span>
          </div>
        )}
      </div>

      {mensaje && (
        <div className={`smartwatch-message ${mensaje.tipo}`}>
          {mensaje.tipo === 'error' && <AlertCircle size={16} />}
          <span>{mensaje.texto}</span>
        </div>
      )}

      {estado.error && (
        <div className="smartwatch-error">
          <AlertCircle size={16} />
          <span>{estado.error}</span>
        </div>
      )}

      {!estado.conectado ? (
        <div className="smartwatch-actions">
          <button
            className="smartwatch-btn smartwatch-btn-primary"
            onClick={handleConectar}
            disabled={estado.conectando}
          >
            {estado.conectando ? (
              <>
                <RefreshCw size={18} className="spinning" />
                Conectando...
              </>
            ) : (
              <>
                <Zap size={18} />
                Conectar Health Connect
              </>
            )}
          </button>
          <p className="smartwatch-hint">
            Sincroniza datos de salud desde aplicaciones como "Mi Smartwatch", FitCloudPro, Google Fit y más.
            Requiere Android 13+ con Health Connect instalado.
          </p>
        </div>
      ) : (
        <>
          {datosTiempoReal && (
            <div className="smartwatch-datos">
              <div className="dato-item">
                <Footprints size={20} />
                <div className="dato-info">
                  <span className="dato-label">Pasos</span>
                  <span className="dato-value">{datosTiempoReal.pasos.toLocaleString()}</span>
                </div>
              </div>

              {datosTiempoReal.frecuenciaCardiaca && (
                <div className="dato-item">
                  <Heart size={20} />
                  <div className="dato-info">
                    <span className="dato-label">Frecuencia Cardíaca</span>
                    <span className="dato-value">{datosTiempoReal.frecuenciaCardiaca} bpm</span>
                  </div>
                </div>
              )}

              {datosTiempoReal.caloriasQuemadas && (
                <div className="dato-item">
                  <Flame size={20} />
                  <div className="dato-info">
                    <span className="dato-label">Calorías</span>
                    <span className="dato-value">{datosTiempoReal.caloriasQuemadas.toFixed(0)} kcal</span>
                  </div>
                </div>
              )}

              {datosTiempoReal.distanciaKm && (
                <div className="dato-item">
                  <Activity size={20} />
                  <div className="dato-info">
                    <span className="dato-label">Distancia</span>
                    <span className="dato-value">{datosTiempoReal.distanciaKm.toFixed(2)} km</span>
                  </div>
                </div>
              )}

              {datosTiempoReal.horasSueno && (
                <div className="dato-item">
                  <Moon size={20} />
                  <div className="dato-info">
                    <span className="dato-label">Sueño</span>
                    <span className="dato-value">{datosTiempoReal.horasSueno.toFixed(1)} hrs</span>
                  </div>
                </div>
              )}

              {datosTiempoReal.minutosEjercicio && (
                <div className="dato-item">
                  <Activity size={20} />
                  <div className="dato-info">
                    <span className="dato-label">Ejercicio</span>
                    <span className="dato-value">{datosTiempoReal.minutosEjercicio} min</span>
                  </div>
                </div>
              )}

              {datosTiempoReal.nivelOxigeno && (
                <div className="dato-item">
                  <Heart size={20} />
                  <div className="dato-info">
                    <span className="dato-label">Oxígeno</span>
                    <span className="dato-value">{datosTiempoReal.nivelOxigeno}%</span>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="smartwatch-actions">
            <button
              className="smartwatch-btn smartwatch-btn-secondary"
              onClick={handleSincronizar}
              disabled={sincronizando}
            >
              {sincronizando ? (
                <>
                  <RefreshCw size={18} className="spinning" />
                  Sincronizando...
                </>
              ) : (
                <>
                  <RefreshCw size={18} />
                  Sincronizar Datos
                </>
              )}
            </button>
            <button
              className="smartwatch-btn smartwatch-btn-danger"
              onClick={handleDesconectar}
            >
              <ZapOff size={18} />
              Desconectar
            </button>
          </div>

          {estado.ultimaSincronizacion && (
            <p className="smartwatch-last-sync">
              Última sincronización: {estado.ultimaSincronizacion.toLocaleString('es-ES')}
            </p>
          )}
        </>
      )}
    </div>
  );
}

