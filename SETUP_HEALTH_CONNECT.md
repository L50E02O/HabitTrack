# INSTRUCCIONES: Configurar Health Connect Mock

## Problema Detectado
El error `ERR_CONNECTION_REFUSED` indica que no hay backend corriendo en el puerto 3001.

## Solución

### Paso 1: Instalar Dependencias

Abre una terminal **CMD** (no PowerShell) y ejecuta:

```cmd
npm install express cors --save-dev
```

Si tienes problemas con PowerShell, puedes:

**Opción A: Usar CMD**
1. Presiona `Win + R`
2. Escribe `cmd`
3. Navega al proyecto: `cd C:\Users\leoan\Desktop\HabitTrack`
4. Ejecuta: `npm install express cors --save-dev`

**Opción B: Habilitar scripts en PowerShell (como administrador)**
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Paso 2: Iniciar el Servidor Mock

Una vez instaladas las dependencias, ejecuta:

```bash
npm run dev:health
```

Deberías ver:
```
╔════════════════════════════════════════════════════════════╗
║  🏥 Health Connect Mock API                                ║
║  📡 Corriendo en http://localhost:3001                     ║
╚════════════════════════════════════════════════════════════╝
```

### Paso 3: Mantener Ambos Servidores Corriendo

**Terminal 1 - Vite (Frontend):**
```bash
npm run dev
```

**Terminal 2 - Health Connect Mock:**
```bash
npm run dev:health
```

## Verificación

Una vez que ambos estén corriendo:

1. Abre http://localhost:5173
2. Ve al Dashboard
3. La sección "Health Connect" debería conectarse sin errores
4. Deberías ver datos simulados (pasos, frecuencia cardíaca, etc.)

## Alternativa Temporal

Si no quieres instalar el servidor mock ahora, puedes modificar el código para que maneje gracefully cuando no hay backend. El componente mostrará un mensaje indicando que necesitas configurar el backend.

## Para Producción

Este servidor mock es solo para desarrollo. Para producción necesitarás:
1. Un backend real con Android
2. Integración con Health Connect API oficial
3. Ver documentación en `docs/HEALTH_CONNECT_API.md`
