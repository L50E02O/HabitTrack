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
    // Esperar a que el Service Worker esté listo (Vite PWA lo registra automáticamente)
    const registration = await navigator.serviceWorker.ready;

    console.log('[PWA] Service Worker listo:', registration.scope);

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
  try {
    // Verificar permisos primero
    if (!('Notification' in window) || Notification.permission !== 'granted') {
      console.warn('[PWA] No hay permisos para notificaciones');
      return;
    }

    // Intentar usar Service Worker si está disponible
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready;
        
        if (registration) {
          console.log('[PWA] Enviando notificación via Service Worker');
          await registration.showNotification(titulo, {
            body: cuerpo,
            icon: 'https://cdn-icons-png.flaticon.com/192/2234/2234767.png',
            badge: 'https://cdn-icons-png.flaticon.com/192/2234/2234767.png',
            tag: opciones?.tag || `habittrack-${Date.now()}`,
            requireInteraction: opciones?.requireInteraction || false,
            vibrate: [200, 100, 200],
            data: opciones?.data || {},
            ...opciones
          });
          console.log('[PWA] Notificación enviada correctamente');
          return; // Salir si se envió correctamente
        }
      } catch (swError) {
        console.warn('[PWA] Error con Service Worker, usando Notification API:', swError);
      }
    }

    // Fallback: usar Notification API directamente
    console.log('[PWA] Usando Notification API directamente');
    const notification = new Notification(titulo, {
      body: cuerpo,
      icon: 'https://cdn-icons-png.flaticon.com/192/2234/2234767.png',
      badge: 'https://cdn-icons-png.flaticon.com/192/2234/2234767.png',
      tag: opciones?.tag || `habittrack-${Date.now()}`,
      requireInteraction: opciones?.requireInteraction || false,
      data: opciones?.data || {},
      ...opciones
    });

    // Manejar clic en la notificación
    notification.onclick = (event) => {
      event.preventDefault();
      if (opciones?.data?.url) {
        window.focus();
        window.location.href = opciones.data.url;
      }
      notification.close();
    };
  } catch (error) {
    console.error('[PWA] Error enviando notificación:', error);
    throw error;
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

