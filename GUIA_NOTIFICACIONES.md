# 🔔 Guía de Notificaciones - HabitTrack

## 📱 Tipos de Notificaciones

### 1. **Notificaciones Dentro de la App** (Funcionan ahora)
- ✅ Requiere: Página abierta en el navegador
- ✅ Funciona en: localhost y producción
- ✅ API: Notification API del navegador
- 🔧 Configuración: Banner automático solicita permisos

### 2. **Notificaciones Fuera de la App** (Requiere configuración)
- ❌ Requiere: HTTPS + Push API + Suscripción
- ❌ NO funciona en localhost
- ✅ Funciona en: Vercel (https://habittrack.vercel.app)
- 🔧 Configuración: Supabase Edge Functions + Web Push

---

## 🧪 Debug y Pruebas

### Panel de Debug (Solo localhost)
Aparece en la esquina inferior derecha con dos botones:

1. **🔔 Probar Notificación**
   - Envía notificación inmediata de prueba
   - Usa dos métodos: API directa + Service Worker
   - Muestra errores si algo falla

2. **📊 Ver Estado**
   - Muestra permiso actual (`granted`, `denied`, `default`)
   - Verifica si Service Worker está activo
   - Confirma soporte de Notification API

### Consola del Navegador
Buscar logs con prefijos:
- `🎯 [BANNER]` - Estado del banner de permisos
- `🚀 [NOTIF]` - Inicio de programación de notificaciones
- `⏰ [NOTIF]` - Verificación cada minuto
- `📋 [NOTIF]` - Recordatorios encontrados
- `🔍 [NOTIF]` - Evaluación de cada recordatorio
- `🔔 [NOTIF]` - Notificación enviada
- `❌ [NOTIF]` - Error en notificación

---

## 🔧 Solución de Problemas

### ❓ El banner no aparece
**Posibles causas:**
1. Permiso ya otorgado/denegado → Ir a `chrome://settings/content/notifications` y resetear
2. Banner ya cerrado esta sesión → Recargar página (F5)
3. sessionStorage bloqueando → Abrir consola: `sessionStorage.clear()`

**Verificar:**
```javascript
// En consola del navegador
console.log("Permiso:", Notification.permission);
console.log("Banner cerrado:", sessionStorage.getItem('notificacion-banner-cerrado'));
```

### ❓ No recibo notificaciones (página abierta)
**Checklist:**
1. ✅ Permiso otorgado?
   ```javascript
   Notification.permission === 'granted'
   ```
2. ✅ Service Worker activo?
   ```javascript
   navigator.serviceWorker.controller // No debe ser null
   ```
3. ✅ Recordatorio configurado?
   - Ir a "Gestionar Recordatorios" en dashboard
   - Verificar hora y que esté activo
4. ✅ Hora correcta?
   - Hora se guarda en UTC
   - Se convierte a hora local al verificar

**Forzar notificación de prueba:**
```javascript
// En consola del navegador
new Notification("Prueba", {
  body: "Si ves esto, las notificaciones funcionan",
  icon: "https://cdn-icons-png.flaticon.com/192/2234/2234767.png"
});
```

### ❓ No recibo notificaciones (página cerrada)
**Esto es NORMAL en localhost.** Requiere:

1. **HTTPS**: Localhost usa HTTP, Web Push requiere HTTPS
2. **Push Subscription**: Usuario debe suscribirse a notificaciones push
3. **Backend Push Service**: Supabase Edge Function que envíe push

**Para habilitar:**
1. Desplegar en Vercel (ya configurado)
2. Crear Edge Function en Supabase:
   ```typescript
   // supabase/functions/send-push-notification/index.ts
   import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
   import webpush from 'npm:web-push@3.6.0'
   ```
3. Configurar VAPID keys
4. Guardar suscripciones en base de datos
5. Modificar recordatorios para usar Edge Function

---

## 📂 Archivos Importantes

### Frontend (React)
- `src/components/PermisosNotificacion.tsx` - Banner de permisos
- `src/components/DebugNotificaciones.tsx` - Panel de debug
- `src/services/recordatorio/notificacionService.ts` - Lógica de notificaciones
- `src/utils/initPWA.ts` - Inicialización del Service Worker

### Service Worker
- `public/sw.js` - Service Worker custom
- `vite.config.ts` - Configuración de Vite PWA plugin

### Backend (Supabase)
- `database/migrations/notificaciones_email.sql` - Tabla de recordatorios
- `supabase/functions/send-daily-reminders/` - Edge Function para emails

---

## 🚀 Flujo de Notificaciones Actuales

```mermaid
graph TD
    A[Usuario entra al dashboard] --> B[initPWA se ejecuta]
    B --> C{Permiso de notificaciones?}
    C -->|default| D[Mostrar banner después de 2s]
    C -->|granted| E[Iniciar programarNotificacionesDiarias]
    C -->|denied| F[No hacer nada]
    
    D --> G[Usuario hace clic en Activar]
    G --> H[Notification.requestPermission]
    H --> I{Permiso otorgado?}
    I -->|Sí| J[Notificación de prueba + Iniciar programación]
    I -->|No| K[Mensaje de error]
    
    E --> L[setInterval cada 60 segundos]
    L --> M[obtenerRecordatoriosActivos]
    M --> N[Para cada recordatorio]
    N --> O{Hora coincide?}
    O -->|Sí| P[enviarNotificacion]
    O -->|No| Q[Continuar]
    
    P --> R{Service Worker registrado?}
    R -->|Sí| S[registration.showNotification]
    R -->|No| T[new Notification]
```

---

## 📝 Configurar Recordatorios

1. En el dashboard, clic en "Gestionar Recordatorios"
2. Seleccionar hábito
3. Elegir hora (se guarda en UTC automáticamente)
4. Escribir mensaje personalizado
5. Activar recordatorio
6. **Importante:** La verificación ocurre cada 60 segundos

**Ejemplo:**
- Hora actual: 21:30
- Recordatorio configurado: 21:31
- Resultado: Notificación entre 21:31:00 y 21:31:59

---

## 🌐 Notificaciones en Producción (Vercel)

### Actualmente Funcionan:
- ✅ Notificaciones mientras la página está abierta
- ✅ PWA instalable en Brave/Chrome
- ✅ Iconos desde CDN (flaticon)
- ✅ Service Worker activo

### Pendientes (Notificaciones Push):
- ❌ Notificaciones cuando la app está cerrada
- ❌ Web Push API subscription
- ❌ Backend push notification service

### Para Habilitar Push Notifications:

1. **Generar VAPID Keys:**
   ```bash
   npx web-push generate-vapid-keys
   ```

2. **Guardar en Supabase Secrets:**
   ```bash
   supabase secrets set VAPID_PUBLIC_KEY=<public_key>
   supabase secrets set VAPID_PRIVATE_KEY=<private_key>
   ```

3. **Crear tabla de suscripciones:**
   ```sql
   CREATE TABLE push_subscriptions (
     id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
     id_perfil uuid REFERENCES perfil(id_perfil),
     endpoint TEXT NOT NULL,
     keys JSONB NOT NULL,
     created_at TIMESTAMPTZ DEFAULT NOW()
   );
   ```

4. **Frontend: Suscribir usuario:**
   ```typescript
   const subscription = await registration.pushManager.subscribe({
     userVisibleOnly: true,
     applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
   });
   
   await supabase.from('push_subscriptions').insert({
     id_perfil: userId,
     endpoint: subscription.endpoint,
     keys: subscription.toJSON().keys
   });
   ```

5. **Edge Function: Enviar push:**
   ```typescript
   import webpush from 'web-push';
   
   webpush.setVapidDetails(
     'mailto:tu@email.com',
     VAPID_PUBLIC_KEY,
     VAPID_PRIVATE_KEY
   );
   
   await webpush.sendNotification(subscription, JSON.stringify({
     title: "Recordatorio",
     body: "Es hora de tu hábito",
     icon: "/icon-192.png"
   }));
   ```

6. **Cron Job en Supabase:**
   ```sql
   SELECT cron.schedule(
     'send-push-reminders',
     '* * * * *', -- Cada minuto
     $$ SELECT send_push_notifications(); $$
   );
   ```

---

## 📚 Referencias

- [Notification API - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Notifications_API)
- [Service Worker API - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Web Push Protocol](https://web.dev/push-notifications-overview/)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Vite PWA Plugin](https://vite-pwa-org.netlify.app/)

---

## 🎯 Checklist de Implementación

### ✅ Completado:
- [x] Banner de permisos con diseño atractivo
- [x] Panel de debug para desarrollo
- [x] Logs detallados en consola
- [x] Notificaciones en página abierta
- [x] Conversión UTC → Hora local
- [x] Prevención de duplicados
- [x] Service Worker con notificaciones
- [x] Iconos desde CDN
- [x] PWA instalable

### 🔄 En Progreso:
- [ ] Documentar proceso completo
- [ ] Mejorar UX de recordatorios
- [ ] Agregar sonidos a notificaciones

### 📋 Pendiente:
- [ ] Web Push API (notificaciones fuera de app)
- [ ] VAPID keys y suscripciones
- [ ] Edge Function para push
- [ ] Tabla de suscripciones en DB
- [ ] UI para gestionar suscripciones
- [ ] Estadísticas de notificaciones enviadas

---

**Última actualización:** ${new Date().toISOString()}
