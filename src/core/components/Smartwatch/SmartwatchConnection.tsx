import { useState, useEffect, useCallback } from 'react';
import { Activity, Heart, Battery, Zap, ZapOff, RefreshCw, AlertCircle } from 'lucide-react';
import { 
  conectarSmartwatch, 
  desconectarSmartwatch, 
  obtenerDatosTiempoReal,
  guardarDatosSalud,
  obtenerDatosSaludPorFecha,
  obtenerEstadoConexion
} from '../../../services/smartwatch/smartwatchService';
import type { EstadoConexion } from '../../../types/ISmartwatch';
import type { DatosSmartwatchTiempoReal } from '../../../types/ISmartwatch';
import './SmartwatchConnection.css';

interface SmartwatchConnectionProps {
  userId: string;
  darkMode?: boolean;
}

export default function SmartwatchConnection({ userId, darkMode = false }: SmartwatchConnectionProps) {
  const [device, setDevice] = useState<BluetoothDevice | null>(null);
  const [estado, setEstado] = useState<EstadoConexion>({
    conectado: false,
    conectando: false,
    error: null,
    dispositivoNombre: null,
    ultimaSincronizacion: null,
  });
  const [datosTiempoReal, setDatosTiempoReal] = useState<DatosSmartwatchTiempoReal | null>(null);
  const [sincronizando, setSincronizando] = useState(false);
  const [mensaje, setMensaje] = useState<{ texto: string; tipo: 'success' | 'error' | 'info' } | null>(null);

  // Actualizar estado cuando cambia el dispositivo
  useEffect(() => {
    if (device) {
      const nuevoEstado = obtenerEstadoConexion(device);
      setEstado((prev: EstadoConexion) => ({
        ...prev,
        ...nuevoEstado,
        dispositivoNombre: device.name || 'Smartwatch S100',
      }));
    }
  }, [device]);

  // Escuchar eventos de desconexión
  useEffect(() => {
    if (!device) return;

    const handleDisconnect = () => {
      setDevice(null);
      setEstado({
        conectado: false,
        conectando: false,
        error: null,
        dispositivoNombre: null,
        ultimaSincronizacion: null,
      });
      setDatosTiempoReal(null);
      setMensaje({
        texto: 'Smartwatch desconectado',
        tipo: 'info',
      });
    };

    device.addEventListener('gattserverdisconnected', handleDisconnect);

    return () => {
      device.removeEventListener('gattserverdisconnected', handleDisconnect);
    };
  }, [device]);

  const handleConectar = useCallback(async () => {
    try {
      setEstado((prev: EstadoConexion) => ({ ...prev, conectando: true, error: null }));
      setMensaje(null);

      const nuevoDevice = await conectarSmartwatch();
      setDevice(nuevoDevice);

      // Obtener datos iniciales
      const datos = await obtenerDatosTiempoReal(nuevoDevice);
      setDatosTiempoReal(datos);

      setEstado({
        conectado: true,
        conectando: false,
        error: null,
        dispositivoNombre: nuevoDevice.name || 'Smartwatch S100',
        ultimaSincronizacion: new Date(),
      });

      setMensaje({
        texto: 'Smartwatch conectado exitosamente',
        tipo: 'success',
      });
    } catch (error: any) {
      setEstado((prev: EstadoConexion) => ({
        ...prev,
        conectando: false,
        error: error.message,
      }));
      setMensaje({
        texto: error.message || 'Error al conectar el smartwatch',
        tipo: 'error',
      });
    }
  }, []);

  const handleDesconectar = useCallback(async () => {
    try {
      await desconectarSmartwatch(device);
      setDevice(null);
      setDatosTiempoReal(null);
      setEstado({
        conectado: false,
        conectando: false,
        error: null,
        dispositivoNombre: null,
        ultimaSincronizacion: null,
      });
      setMensaje({
        texto: 'Smartwatch desconectado',
        tipo: 'info',
      });
    } catch (error: any) {
      setMensaje({
        texto: error.message || 'Error al desconectar',
        tipo: 'error',
      });
    }
  }, [device]);

  const handleSincronizar = useCallback(async () => {
    if (!device || !estado.conectado) {
      setMensaje({
        texto: 'Primero debes conectar el smartwatch',
        tipo: 'error',
      });
      return;
    }

    try {
      setSincronizando(true);
      setMensaje(null);

      // Obtener datos del smartwatch
      const datos = await obtenerDatosTiempoReal(device);
      setDatosTiempoReal(datos);

      // Obtener fecha actual
      const hoy = new Date().toISOString().split('T')[0];

      // Verificar si ya hay datos para hoy
      const datosExistentes = await obtenerDatosSaludPorFecha(userId, hoy);

      // Preparar datos para guardar
      const datosParaGuardar = {
        id_perfil: userId,
        fecha: hoy,
        pasos: datos.pasos || 0,
        frecuencia_cardiaca: datos.frecuenciaCardiaca || null,
        calorias_quemadas: datos.caloriasQuemadas || null,
        distancia_km: datos.distanciaKm || null,
        horas_sueno: datos.horasSueno || null,
      };

      // Si ya existen datos, actualizar; si no, crear nuevo
      await guardarDatosSalud(datosParaGuardar);

      setEstado((prev: EstadoConexion) => ({
        ...prev,
        ultimaSincronizacion: new Date(),
      }));

      setMensaje({
        texto: datosExistentes 
          ? 'Datos actualizados exitosamente' 
          : 'Datos sincronizados exitosamente',
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
  }, [device, estado.conectado, userId]);

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
          <h3>Smartwatch S100</h3>
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
                Conectar Smartwatch
              </>
            )}
          </button>
          <p className="smartwatch-hint">
            Asegúrate de que el smartwatch esté encendido y cerca de tu dispositivo.
            Requiere navegador compatible con Web Bluetooth (Chrome, Edge).
          </p>
        </div>
      ) : (
        <>
          {datosTiempoReal && (
            <div className="smartwatch-datos">
              <div className="dato-item">
                <Activity size={20} />
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

              {datosTiempoReal.bateria !== undefined && (
                <div className="dato-item">
                  <Battery size={20} />
                  <div className="dato-info">
                    <span className="dato-label">Batería</span>
                    <span className="dato-value">{datosTiempoReal.bateria}%</span>
                  </div>
                </div>
              )}

              {datosTiempoReal.caloriasQuemadas && (
                <div className="dato-item">
                  <Activity size={20} />
                  <div className="dato-info">
                    <span className="dato-label">Calorías</span>
                    <span className="dato-value">{datosTiempoReal.caloriasQuemadas.toFixed(0)} kcal</span>
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

