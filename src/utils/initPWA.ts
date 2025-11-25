/**
 * Inicialización de PWA
 * Debe ser llamado al inicio de la app para configurar Service Worker y permisos
 */

/**
 * Inicializa la PWA solicitando permisos necesarios
 */
export async function initPWA(): Promise<void> {
  console.log('🚀 [PWA] Iniciando inicialización de PWA...');
  console.log('🚀 [PWA] URL actual:', window.location.href);
  console.log('🚀 [PWA] Protocolo:', window.location.protocol);
  console.log('🚀 [PWA] Hostname:', window.location.hostname);
  
  // 1. Verificar que el navegador soporte Service Workers
  if (!('serviceWorker' in navigator)) {
    console.warn('[PWA] ❌ Service Workers no soportados en este navegador');
    console.warn('[PWA] User Agent:', window.navigator.userAgent);
    return;
  }
  console.log('[PWA] ✅ Service Workers soportados');

  // 2. Verificar manifest
  const manifestLink = document.querySelector('link[rel="manifest"]') as HTMLLinkElement;
  if (manifestLink) {
    console.log('[PWA] ✅ Manifest link encontrado:', manifestLink.href);
    try {
      const manifestResponse = await fetch(manifestLink.href);
      if (manifestResponse.ok) {
        const manifest = await manifestResponse.json();
        console.log('[PWA] ✅ Manifest cargado correctamente:', {
          name: manifest.name,
          short_name: manifest.short_name,
          icons: manifest.icons?.length || 0,
          start_url: manifest.start_url,
          display: manifest.display
        });
      } else {
        console.error('[PWA] ❌ Error cargando manifest:', manifestResponse.status);
      }
    } catch (error) {
      console.error('[PWA] ❌ Error verificando manifest:', error);
    }
  } else {
    console.warn('[PWA] ⚠️ No se encontró link al manifest');
  }

  // 3. Esperar a que el Service Worker esté listo
  try {
    console.log('[PWA] Esperando Service Worker...');
    const registration = await navigator.serviceWorker.ready;
    console.log('[PWA] ✅ Service Worker activo:', {
      scope: registration.scope,
      active: registration.active?.scriptURL,
      installing: registration.installing?.scriptURL,
      waiting: registration.waiting?.scriptURL
    });

    // Verificar si hay un controller activo
    if (navigator.serviceWorker.controller) {
      console.log('[PWA] ✅ Service Worker controller activo:', navigator.serviceWorker.controller.scriptURL);
    } else {
      console.warn('[PWA] ⚠️ No hay Service Worker controller activo');
    }

    // 4. Verificar permisos de notificaciones
    if ('Notification' in window) {
      console.log('[PWA] ✅ Notificaciones soportadas');
      console.log('[PWA] Permiso de notificaciones:', Notification.permission);
      
      // Si el permiso es 'default', lo solicitaremos cuando el usuario interactúe
      // No lo pedimos automáticamente para no ser intrusivos
    } else {
      console.warn('[PWA] ⚠️ Notificaciones no soportadas');
    }

    // 5. Escuchar actualizaciones del Service Worker
    registration.addEventListener('updatefound', () => {
      console.log('[PWA] 🔄 Actualización del Service Worker encontrada');
      const newWorker = registration.installing;
      if (newWorker) {
        console.log('[PWA] Nuevo Service Worker instalando:', newWorker.scriptURL);
        newWorker.addEventListener('statechange', () => {
          console.log('[PWA] Estado del nuevo Service Worker:', newWorker.state);
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            console.log('[PWA] ⚠️ Nueva versión disponible. Recarga para actualizar.');
            // Aquí podrías mostrar un toast al usuario
          }
        });
      }
    });

    // 6. Verificar estado de instalación
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isInWebAppiOS = (window.navigator as any).standalone === true;
    console.log('[PWA] Estado de instalación:', {
      isStandalone,
      isInWebAppiOS,
      installed: isStandalone || isInWebAppiOS
    });

    console.log('[PWA] ✅ Inicialización completada exitosamente');

  } catch (error) {
    console.error('[PWA] ❌ Error inicializando:', error);
  }
}

/**
 * Solicita permiso para notificaciones
 * Debe ser llamado como resultado de una acción del usuario (click)
 */
export async function solicitarPermisoNotificaciones(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    throw new Error('Este navegador no soporta notificaciones');
  }

  if (Notification.permission === 'granted') {
    console.log('[PWA] Ya tiene permiso para notificaciones');
    return 'granted';
  }

  if (Notification.permission === 'denied') {
    console.warn('[PWA] Usuario denegó permisos de notificaciones');
    return 'denied';
  }

  // Solicitar permiso
  console.log('[PWA] Solicitando permiso para notificaciones...');
  const permission = await Notification.requestPermission();
  console.log('[PWA] Permiso otorgado:', permission);
  
  return permission;
}
