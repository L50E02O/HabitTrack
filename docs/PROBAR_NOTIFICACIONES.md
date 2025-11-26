# Cómo probar las notificaciones

## 1. Inicia el servidor
```bash
npm run dev
```

## 2. Abre el navegador
Ve a: http://localhost:5173/dashboard

## 3. Abre la consola del navegador
- **Chrome/Brave:** F12 o Ctrl+Shift+J
- Ve a la pestaña "Console"

## 4. Observa los logs

### Al cargar la página verás algo similar a:
```
[BANNER] Componente montado
[BANNER] Notification existe? true
[BANNER] Permiso actual: default
[BANNER] Programando mostrar en 2 segundos...
[BANNER] MOSTRANDO BANNER AHORA
[BANNER] RENDERIZANDO BANNER VISIBLE
```

### Cada minuto verás algo similar a:
```
[NOTIF] Verificando X recordatorios a las HH:MM
[NOTIF] Recordatorios encontrados: [...]
[NOTIF] Recordatorio X: { intervalo_recordar: "HH:MM:SS", horaActual: "HH:MM", debeActivarse: true/false }
```

### Cuando se envía una notificación:
```
[NOTIF] ENVIANDO NOTIFICACIÓN - Recordatorio X a las HH:MM
```

## 5. Usa el panel de debug

En la esquina inferior derecha verás un panel negro con:

### Botón 1: Probar notificación
- Solicita permisos si no los tienes
- Envía 2 notificaciones de prueba inmediatamente
- Muestra errores si algo falla

### Botón 2: Ver estado
- Muestra permiso actual
- Verifica Service Worker
- Confirma que todo esté OK

## 6. Si el banner no aparece

### Opción A: limpiar storage
Ejecuta en consola:
```javascript
sessionStorage.clear();
location.reload();
```

### Opción B: verificar permiso
```javascript
console.log("Permiso:", Notification.permission);
```

Si dice `granted` o `denied`, el banner NO aparecerá (ya decidiste).

### Para Resetear Permiso en Brave/Chrome:
1. Haz clic en el **candado** 🔒 en la barra de direcciones
2. Busca "Notificaciones"
3. Cambia a "Preguntar (predeterminado)" o "Bloquear"
4. Recarga la página

## 7. Crear un recordatorio de prueba

1. Ve al dashboard
2. Clic en "**Gestionar Recordatorios**" (botón abajo)
3. Selecciona un hábito
4. **Hora:** Pon la hora actual + 1 minuto
   - Ej: Si son las 21:30, pon 21:31
5. Mensaje: "Prueba de notificación"
6. Activa el recordatorio
7. **Espera 1-2 minutos**

### Deberías ver en consola algo similar a:
```
[NOTIF] Verificando 1 recordatorios a las 21:31
[NOTIF] Recordatorios encontrados: [{id: ..., hora: "21:31:00", ...}]
[NOTIF] Recordatorio X: { debeActivarse: true }
[NOTIF] ENVIANDO NOTIFICACIÓN
```

## 8. Si no funciona

### Revisar errores
Busca en consola líneas con `❌ [NOTIF]`

### Error común 1: permiso denegado
```
❌ [NOTIF] Error enviando notificación push: NotAllowedError
```
**Solución:** ve a la configuración del navegador y habilita notificaciones para localhost.

### Error común 2: Service Worker no registrado
```
🧪 [DEBUG] SW Registrado: false
```
**Solución:** 
- Verifica que `npm run dev` esté corriendo
- Recarga la página (Ctrl+Shift+R)
- Revisa errores en consola

### Error común 3: recordatorio en hora incorrecta
```
🔍 [NOTIF] Recordatorio X: { debeActivarse: false }
```
**Causa:** la hora del recordatorio no coincide con la hora actual.  
**Solución:** 
- Verifica que la hora sea exacta (minuto actual)
- Recuerda que se verifica cada 60 segundos

## 9. Probar notificación manual

Si todo lo demás falla, ejecuta en consola:
```javascript
// Solicitar permiso
await Notification.requestPermission();

// Enviar notificación
new Notification("Prueba manual", {
  body: "Si ves esto, las notificaciones SÍ funcionan",
  icon: "https://cdn-icons-png.flaticon.com/192/2234/2234767.png",
  requireInteraction: false
});
```

Si esta notificación **SÍ aparece**, el problema está en la lógica de recordatorios, no en los permisos.

## 10. Verificación final

### Checklist de funcionamiento
- [ ] El banner de permisos aparece después de 2 segundos
- [ ] Puedo hacer clic en "Activar" y sale el diálogo de permisos del navegador
- [ ] Después de aceptar, veo una notificación de prueba de activación
- [ ] El panel de debug aparece en la esquina inferior derecha
- [ ] El botón "Probar notificación" envía notificaciones visibles
- [ ] El botón "Ver estado" muestra `Permiso: granted`
- [ ] Cada minuto veo logs `[NOTIF]` en consola
- [ ] El recordatorio programado envía notificaciones a la hora correcta

### Si algo falla
1. **Copia TODOS los logs de consola** (desde que cargas la página)
2. **Captura de pantalla** del panel de debug después de "Ver Estado"
3. **Captura de pantalla** de configuración de recordatorios
4. Comparte eso para debug más avanzado

---

## Importante: notificaciones fuera de la página

Esto no funciona en localhost. Requiere:

1. **HTTPS** (localhost es HTTP)
2. **Web Push API** con suscripción
3. **Backend push service** (Supabase Edge Function)

### Para probar en producción (Vercel)
1. Deploy a Vercel: `npm run build && vercel --prod`
2. Ve a `https://habittrack.vercel.app`
3. Las notificaciones **dentro de la app** funcionarán
4. Para notificaciones fuera de la aplicación, necesitas configurar Web Push (ver `GUIA_NOTIFICACIONES.md`).

---

Ejecuta `npm run dev` y sigue los pasos anteriores para verificar que las notificaciones funcionen correctamente.
