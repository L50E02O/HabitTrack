/**
 * Servicio para manejar el registro y uso del Service Worker (PWA)
 */

/**
 * Registra el Service Worker para habilitar funcionalidades PWA
 * @returns Promise que se resuelve cuando el SW está registrado
 */
export async function registrarServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) {
    console.warn('Service Workers no están soportados en este navegador');
    return null;
  }

  try {
    // En desarrollo, usar el SW personalizado
    // En producción, Vite PWA lo manejará automáticamente
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
      type: 'module'
    });

    console.log('[PWA] Service Worker registrado:', registration.scope);

    // Escuchar actualizaciones
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            console.log('[PWA] Nueva versión disponible. Recarga la página para actualizar.');
          }
        });
      }
    });

    return registration;
  } catch (error) {
    console.error('[PWA] Error registrando Service Worker:', error);
    return null;
  }
}

/**
 * Verifica si el Service Worker está activo
 * @returns true si el SW está activo
 */
export function tieneServiceWorkerActivo(): boolean {
  return 'serviceWorker' in navigator && navigator.serviceWorker.controller !== null;
}

/**
 * Envía un mensaje al Service Worker para mostrar una notificación
 * @param titulo Título de la notificación
 * @param cuerpo Cuerpo del mensaje
 * @param opciones Opciones adicionales
 */
export async function enviarNotificacionViaSW(
  titulo: string,
  cuerpo: string,
  opciones?: NotificationOptions
): Promise<void> {
  if (!tieneServiceWorkerActivo()) {
    console.warn('[PWA] Service Worker no está activo, usando Notification API directamente');
    return;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    
    registration.active?.postMessage({
      type: 'SHOW_NOTIFICATION',
      title: titulo,
      body: cuerpo,
      options: {
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        tag: `habittrack-${Date.now()}`,
        requireInteraction: false,
        ...opciones
      }
    });
  } catch (error) {
    console.error('[PWA] Error enviando notificación via SW:', error);
  }
}

/**
 * Solicita permiso para notificaciones push
 * @returns Promise con el resultado del permiso
 */
export async function solicitarPermisoPush(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    throw new Error('Este navegador no soporta notificaciones');
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  if (Notification.permission === 'denied') {
    return 'denied';
  }

  const permission = await Notification.requestPermission();
  return permission;
}

/**
 * Verifica si las notificaciones están permitidas
 * @returns true si están permitidas
 */
export function tienePermisoNotificaciones(): boolean {
  return 'Notification' in window && Notification.permission === 'granted';
}

