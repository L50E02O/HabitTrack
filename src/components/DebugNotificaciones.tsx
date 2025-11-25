import { useState } from 'react';
import { enviarNotificacion } from '../services/recordatorio/notificacionService';

/**
 * Componente de debug para probar notificaciones manualmente
 * Solo visible en desarrollo
 */
export function DebugNotificaciones() {
  const [mensaje, setMensaje] = useState('');

  const probarNotificacion = async () => {
    console.log("🧪 [DEBUG] Probando notificación...");
    console.log("🧪 [DEBUG] Permiso:", Notification.permission);

    if (Notification.permission === 'default') {
      console.log("🧪 [DEBUG] Solicitando permiso...");
      const permiso = await Notification.requestPermission();
      console.log("🧪 [DEBUG] Permiso obtenido:", permiso);
      
      if (permiso !== 'granted') {
        setMensaje('❌ Permiso denegado');
        return;
      }
    }

    if (Notification.permission === 'denied') {
      setMensaje('❌ Notificaciones bloqueadas. Ve a configuración del navegador.');
      return;
    }

    try {
      // Método 1: API directa
      console.log("🧪 [DEBUG] Creando notificación directa...");
      const notif = new Notification("🧪 Prueba Directa", {
        body: "Si ves esto, las notificaciones funcionan!",
        icon: "/icon-192.png",
        badge: "/badge.png",
        requireInteraction: false,
        tag: "test-direct"
      });
      
      notif.onclick = () => {
        console.log("🧪 [DEBUG] Usuario hizo clic en notificación directa");
      };

      // Método 2: Service Worker
      console.log("🧪 [DEBUG] Enviando vía Service Worker...");
      await enviarNotificacion(
        "🧪 Prueba Service Worker",
        "Enviado vía Service Worker",
        {
          tag: "test-sw",
          requireInteraction: false
        }
      );

      setMensaje('✅ Notificaciones enviadas! Revisa si aparecen.');
    } catch (error) {
      console.error("🧪 [DEBUG] Error:", error);
      setMensaje(`❌ Error: ${error}`);
    }
  };

  const verificarEstado = () => {
    console.log("🧪 [DEBUG] === ESTADO DEL SISTEMA ===");
    console.log("🧪 [DEBUG] Notification API:", 'Notification' in window);
    console.log("🧪 [DEBUG] Permiso:", Notification.permission);
    console.log("🧪 [DEBUG] Service Worker:", 'serviceWorker' in navigator);
    
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then(reg => {
        console.log("🧪 [DEBUG] SW Registrado:", !!reg);
        console.log("🧪 [DEBUG] SW Activo:", !!reg?.active);
        console.log("🧪 [DEBUG] SW State:", reg?.active?.state);
      });
    }

    setMensaje(`
      Notification: ${'Notification' in window ? '✅' : '❌'}
      Permiso: ${Notification.permission}
      Service Worker: ${'serviceWorker' in navigator ? '✅' : '❌'}
    `);
  };

  // Solo mostrar en localhost
  if (!window.location.hostname.includes('localhost')) {
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      background: '#2d3748',
      color: 'white',
      padding: '15px',
      borderRadius: '10px',
      boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
      zIndex: 9999,
      minWidth: '250px'
    }}>
      <h4 style={{ margin: '0 0 10px 0', fontSize: '14px' }}>🧪 Debug Notificaciones</h4>
      
      <button
        onClick={probarNotificacion}
        style={{
          width: '100%',
          padding: '8px',
          marginBottom: '5px',
          background: '#4299e1',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
          fontSize: '12px'
        }}
      >
        🔔 Probar Notificación
      </button>

      <button
        onClick={verificarEstado}
        style={{
          width: '100%',
          padding: '8px',
          background: '#48bb78',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
          fontSize: '12px'
        }}
      >
        📊 Ver Estado
      </button>

      {mensaje && (
        <div style={{
          marginTop: '10px',
          padding: '8px',
          background: '#1a202c',
          borderRadius: '5px',
          fontSize: '11px',
          whiteSpace: 'pre-line'
        }}>
          {mensaje}
        </div>
      )}
    </div>
  );
}
