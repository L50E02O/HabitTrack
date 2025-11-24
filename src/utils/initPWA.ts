/**
 * Inicialización de PWA
 * Debe ser llamado al inicio de la app para configurar Service Worker y permisos
 */

/**
 * Inicializa la PWA solicitando permisos necesarios
 */
export async function initPWA(): Promise<void> {
  // 1. Verificar que el navegador soporte Service Workers
  if (!('serviceWorker' in navigator)) {
    console.warn('[PWA] Service Workers no soportados');
    return;
  }

  // 2. Esperar a que el Service Worker esté listo
  try {
    const registration = await navigator.serviceWorker.ready;
    console.log('[PWA] Service Worker activo:', registration.scope);

    // 3. Verificar permisos de notificaciones
    if ('Notification' in window) {
      console.log('[PWA] Permiso de notificaciones:', Notification.permission);
      
      // Si el permiso es 'default', lo solicitaremos cuando el usuario interactúe
      // No lo pedimos automáticamente para no ser intrusivos
    }

    // 4. Escuchar actualizaciones del Service Worker
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            console.log('[PWA] Nueva versión disponible. Recarga para actualizar.');
            // Aquí podrías mostrar un toast al usuario
          }
        });
      }
    });

  } catch (error) {
    console.error('[PWA] Error inicializando:', error);
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
