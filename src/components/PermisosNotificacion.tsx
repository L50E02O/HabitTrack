import { useEffect, useState } from 'react';
import { solicitarPermisoNotificaciones } from '../utils/initPWA';
import './PermisosNotificacion.css';

/**
 * Componente que solicita permisos de notificación de forma amigable
 * Se muestra solo si el permiso está en "default" (no preguntado aún)
 */
export function PermisosNotificacion() {
  const [mostrar, setMostrar] = useState(false);
  const [solicitando, setSolicitando] = useState(false);

  useEffect(() => {
    console.log("🎯 [BANNER] Componente montado");
    console.log("🎯 [BANNER] Notification existe?", 'Notification' in window);
    console.log("🎯 [BANNER] Permiso actual:", Notification?.permission);
    console.log("🎯 [BANNER] sessionStorage:", sessionStorage.getItem('notificacion-banner-cerrado'));
    
    // Verificar si debemos mostrar el banner
    if ('Notification' in window && Notification.permission === 'default') {
      console.log("🎯 [BANNER] Programando mostrar en 2 segundos...");
      // Esperar 2 segundos para no ser intrusivos
      const timer = setTimeout(() => {
        console.log("🎯 [BANNER] ¡MOSTRANDO BANNER AHORA!");
        setMostrar(true);
      }, 2000);

      return () => clearTimeout(timer);
    } else {
      console.log("🎯 [BANNER] No se muestra - Permiso:", Notification?.permission);
    }
  }, []);

  const solicitarPermiso = async () => {
    console.log("🎯 [BANNER] Usuario hizo clic en Activar");
    setSolicitando(true);
    try {
      const permiso = await solicitarPermisoNotificaciones();
      console.log("🎯 [BANNER] Permiso obtenido:", permiso);
      if (permiso === 'granted') {
        console.log('✅ [BANNER] Permiso de notificaciones otorgado');
        
        // Mostrar notificación de prueba
        new Notification("¡Notificaciones activadas!", {
          body: "Recibirás recordatorios de tus hábitos",
          icon: "https://cdn-icons-png.flaticon.com/192/2234/2234767.png"
        });
      }
    } catch (error) {
      console.error('❌ [BANNER] Error solicitando permiso:', error);
    } finally {
      setSolicitando(false);
      setMostrar(false);
    }
  };

  const cerrar = () => {
    console.log("🎯 [BANNER] Usuario cerró el banner");
    setMostrar(false);
    // Recordar que el usuario cerró el banner (no volver a mostrar en esta sesión)
    sessionStorage.setItem('notificacion-banner-cerrado', 'true');
  };

  console.log("🎯 [BANNER] Render - mostrar:", mostrar, "solicitando:", solicitando);

  // No mostrar si ya fue cerrado en esta sesión
  if (sessionStorage.getItem('notificacion-banner-cerrado')) {
    console.log("🎯 [BANNER] No renderiza - banner ya cerrado");
    return null;
  }

  if (!mostrar) {
    console.log("🎯 [BANNER] No renderiza - mostrar=false");
    return null;
  }

  console.log("🎯 [BANNER] 🎨 RENDERIZANDO BANNER VISIBLE");

  return (
    <div className="permisos-notificacion-overlay">
      <div className="permisos-notificacion-banner">
        <div className="banner-icono">🔔</div>
        <div className="banner-contenido">
          <h3>¿Activar notificaciones?</h3>
          <p>Recibe recordatorios para completar tus hábitos diarios</p>
        </div>
        <div className="banner-acciones">
          <button 
            className="btn-activar" 
            onClick={solicitarPermiso}
            disabled={solicitando}
          >
            {solicitando ? 'Activando...' : 'Activar'}
          </button>
          <button 
            className="btn-despues" 
            onClick={cerrar}
            disabled={solicitando}
          >
            Después
          </button>
        </div>
      </div>
    </div>
  );
}
