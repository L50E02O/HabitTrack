# 🚀 CÓMO PROBAR LAS NOTIFICACIONES

## 1️⃣ Inicia el servidor
```bash
npm run dev
```

## 2️⃣ Abre el navegador
Ve a: http://localhost:5173/dashboard

## 3️⃣ Abre la Consola del Navegador
- **Chrome/Brave:** F12 o Ctrl+Shift+J
- Ve a la pestaña "Console"

## 4️⃣ Observa los Logs

### Al cargar la página verás:
```
🎯 [BANNER] Componente montado
🎯 [BANNER] Notification existe? true
🎯 [BANNER] Permiso actual: default
🎯 [BANNER] Programando mostrar en 2 segundos...
🎯 [BANNER] ¡MOSTRANDO BANNER AHORA!
🎯 [BANNER] 🎨 RENDERIZANDO BANNER VISIBLE
```

### Cada minuto verás:
```
⏰ [NOTIF] Verificando X recordatorios a las HH:MM
📋 [NOTIF] Recordatorios encontrados: [...]
🔍 [NOTIF] Recordatorio X: { intervalo_recordar: "HH:MM:SS", horaActual: "HH:MM", debeActivarse: true/false }
```

### Cuando se envía notificación:
```
🔔 [NOTIF] *** ENVIANDO NOTIFICACIÓN *** Recordatorio X a las HH:MM
```

## 5️⃣ Usa el Panel de Debug

En la **esquina inferior derecha** verás un panel negro con:

### Botón 1: 🔔 Probar Notificación
- Solicita permisos si no los tienes
- Envía 2 notificaciones de prueba inmediatamente
- Muestra errores si algo falla

### Botón 2: 📊 Ver Estado
- Muestra permiso actual
- Verifica Service Worker
- Confirma que todo esté OK

## 6️⃣ Si el Banner NO Aparece

### Opción A: Limpiar Storage
Ejecuta en consola:
```javascript
sessionStorage.clear();
location.reload();
```

### Opción B: Verificar Permiso
```javascript
console.log("Permiso:", Notification.permission);
```

Si dice `granted` o `denied`, el banner NO aparecerá (ya decidiste).

### Para Resetear Permiso en Brave/Chrome:
1. Haz clic en el **candado** 🔒 en la barra de direcciones
2. Busca "Notificaciones"
3. Cambia a "Preguntar (predeterminado)" o "Bloquear"
4. Recarga la página

## 7️⃣ Crear un Recordatorio de Prueba

1. Ve al dashboard
2. Clic en "**Gestionar Recordatorios**" (botón abajo)
3. Selecciona un hábito
4. **Hora:** Pon la hora actual + 1 minuto
   - Ej: Si son las 21:30, pon 21:31
5. Mensaje: "Prueba de notificación"
6. Activa el recordatorio
7. **Espera 1-2 minutos**

### Deberías ver en consola:
```
⏰ [NOTIF] Verificando 1 recordatorios a las 21:31
📋 [NOTIF] Recordatorios encontrados: [{id: ..., hora: "21:31:00", ...}]
🔍 [NOTIF] Recordatorio X: { debeActivarse: true }
🔔 [NOTIF] *** ENVIANDO NOTIFICACIÓN ***
```

## 8️⃣ Si NO Funciona

### Revisar Errores
Busca en consola líneas con `❌ [NOTIF]`

### Error Común 1: Permiso Denegado
```
❌ [NOTIF] Error enviando notificación push: NotAllowedError
```
**Solución:** Ve a configuración del navegador y habilita notificaciones para localhost

### Error Común 2: Service Worker No Registrado
```
🧪 [DEBUG] SW Registrado: false
```
**Solución:** 
- Verifica que `npm run dev` esté corriendo
- Recarga la página (Ctrl+Shift+R)
- Revisa errores en consola

### Error Común 3: Recordatorio en Hora Incorrecta
```
🔍 [NOTIF] Recordatorio X: { debeActivarse: false }
```
**Causa:** La hora del recordatorio no coincide con la hora actual
**Solución:** 
- Verifica que la hora sea exacta (minuto actual)
- Recuerda que se verifica cada 60 segundos

## 9️⃣ Probar Notificación Manual

Si todo lo demás falla, ejecuta en consola:
```javascript
// Solicitar permiso
await Notification.requestPermission();

// Enviar notificación
new Notification("🧪 Prueba Manual", {
  body: "Si ves esto, las notificaciones SÍ funcionan",
  icon: "https://cdn-icons-png.flaticon.com/192/2234/2234767.png",
  requireInteraction: false
});
```

Si esta notificación **SÍ aparece**, el problema está en la lógica de recordatorios, no en los permisos.

## 🔟 Verificación Final

### ✅ Checklist de Funcionamiento:
- [ ] Banner de permisos aparece después de 2 segundos
- [ ] Puedo hacer clic en "Activar" y sale popup de permisos
- [ ] Después de aceptar, veo notificación de prueba "¡Notificaciones activadas!"
- [ ] Panel de debug aparece en esquina inferior derecha
- [ ] "🔔 Probar Notificación" envía notificaciones visibles
- [ ] "📊 Ver Estado" muestra `Permiso: granted`
- [ ] Cada minuto veo logs `⏰ [NOTIF]` en consola
- [ ] Recordatorio programado envía notificación a la hora correcta

### ❌ Si Algo Falla:
1. **Copia TODOS los logs de consola** (desde que cargas la página)
2. **Captura de pantalla** del panel de debug después de "Ver Estado"
3. **Captura de pantalla** de configuración de recordatorios
4. Comparte eso para debug más avanzado

---

## 🌐 IMPORTANTE: Notificaciones Fuera de la Página

**Esto NO funciona en localhost.** Requiere:

1. **HTTPS** (localhost es HTTP)
2. **Web Push API** con suscripción
3. **Backend push service** (Supabase Edge Function)

### Para Probar en Producción (Vercel):
1. Deploy a Vercel: `npm run build && vercel --prod`
2. Ve a `https://habittrack.vercel.app`
3. Las notificaciones **dentro de la app** funcionarán
4. Para notificaciones **fuera de la app**, necesitas configurar Web Push (ver `GUIA_NOTIFICACIONES.md`)

---

**¿Listo?** Ejecuta `npm run dev` y sigue los pasos. ¡Buena suerte! 🚀
