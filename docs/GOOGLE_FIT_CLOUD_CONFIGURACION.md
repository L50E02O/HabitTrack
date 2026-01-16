# Guía Completa de Configuración de Google Cloud para Google Fit API

Esta guía te ayudará a configurar correctamente Google Cloud Console para que la API de Google Fit funcione correctamente y devuelva datos.

---

## 📋 Requisitos Previos

- Cuenta de Google
- Acceso a [Google Cloud Console](https://console.cloud.google.com/)
- Proyecto de Supabase configurado
- Aplicación HabitTrack ejecutándose localmente

---

## 🚀 Paso 1: Crear o Seleccionar un Proyecto en Google Cloud

1. Accede a [Google Cloud Console](https://console.cloud.google.com/)
2. En la barra superior, haz clic en el **selector de proyectos**
3. Haz clic en **"NUEVO PROYECTO"** (o selecciona uno existente)
4. Asigna un nombre descriptivo, por ejemplo: `HabitTrack-GoogleFit`
5. Haz clic en **"Crear"**
6. Espera unos segundos a que el proyecto se cree
7. Asegúrate de que el proyecto esté seleccionado en la barra superior

---

## 🔌 Paso 2: Habilitar la API de Google Fit

1. En el menú de navegación izquierdo, ve a **"API y servicios"** > **"Biblioteca"**
2. En la barra de búsqueda, escribe: **"Fitness API"** o **"Google Fitness API"**
3. Selecciona **"Fitness API"** (no confundir con "Fitness API v1")
4. Haz clic en el botón **"Habilitar"**
5. Espera unos segundos a que se habilite
6. Deberías ver un mensaje de confirmación

> **⚠️ IMPORTANTE**: Asegúrate de habilitar **"Fitness API"**, no otras APIs relacionadas.

---

## 🔐 Paso 3: Configurar la Pantalla de Consentimiento OAuth

Esta es una de las partes más importantes y donde suelen ocurrir errores.

1. En el menú de navegación, ve a **"API y servicios"** > **"Pantalla de consentimiento de OAuth"**
2. Si es la primera vez, selecciona el tipo de usuario:
   - **Externo** (recomendado para pruebas y producción)
   - **Interno** (solo si usas Google Workspace)
3. Haz clic en **"Crear"**

### Información de la App (Paso 1 de 4)

Completa los campos:

- **Nombre de la aplicación**: `HabitTrack` (o el nombre que prefieras)
- **Correo electrónico de soporte del usuario**: Tu correo electrónico
- **Logo de la aplicación**: (Opcional) Puedes subir un logo
- **Dominio de inicio de la aplicación**: `localhost` (para desarrollo)
- **Dominios autorizados**: Agrega:
  - `localhost`
  - `127.0.0.1`
- **Correo electrónico del desarrollador**: Tu correo electrónico

Haz clic en **"Guardar y continuar"**

### Scopes (Paso 2 de 4)

**¿Qué son los scopes?**
Los scopes (alcances) son permisos que tu aplicación solicitará a los usuarios. Por ejemplo, "quiero leer tus datos de actividad física".

> **📝 NOTA IMPORTANTE**: Los scopes de Google Fit **NO se configuran directamente en la pantalla de consentimiento de OAuth** en Google Cloud Console. En lugar de eso, los scopes se solicitan automáticamente cuando tu código hace la solicitud de autenticación. La pantalla de consentimiento de OAuth principalmente controla qué información básica se muestra (email, profile, openid).

**¿Qué debes hacer aquí?**

1. En esta pantalla, normalmente verás scopes básicos como:
   - ✅ `email` - Correo del usuario
   - ✅ `profile` - Información del perfil
   - ✅ `openid` - Autenticación básica

2. **NO necesitas agregar manualmente los scopes de Google Fit aquí**. Los scopes de fitness (`fitness.activity.read`, `fitness.location.read`) se solicitan automáticamente cuando tu aplicación hace la solicitud de autenticación a través del código (que ya está configurado en `googleFitService.ts`).

3. Si ves un botón **"Agregar o quitar scopes"**, puedes hacer clic en él para ver qué scopes están disponibles, pero los scopes de Google Fit pueden no aparecer en esta lista. **Esto es normal**.

4. Simplemente haz clic en **"Guardar y continuar"** para avanzar al siguiente paso.

> **💡 Importante**: Los scopes de Google Fit están definidos en tu código (en `src/services/googleFit/googleFitService.ts`) y se solicitan automáticamente cuando el usuario autoriza tu aplicación. No necesitas configurarlos manualmente en Google Cloud Console.

### Usuarios de Prueba (Paso 3 de 4)

Si tu app está en modo **"Prueba"** (que es el estado inicial):

1. Haz clic en **"Agregar usuarios"**
2. Agrega tu correo electrónico de Google (el que usarás para autenticar)
3. También puedes agregar correos de otros usuarios que quieras probar
4. Haz clic en **"Guardar y continuar"**

> **⚠️ IMPORTANTE**: Si no agregas usuarios de prueba, NO podrás autenticar la aplicación. Esto es obligatorio en modo prueba.

### Resumen (Paso 4 de 4)

1. Revisa toda la información
2. Haz clic en **"Volver al panel"**

---

## 🔑 Paso 4: Crear Credenciales OAuth 2.0

1. En el menú de navegación, ve a **"API y servicios"** > **"Credenciales"**
2. Haz clic en **"+ CREAR CREDENCIALES"** en la parte superior
3. Selecciona **"ID de cliente de OAuth"**

### Paso 4.1: Seleccionar el Tipo de Credencial

**⚠️ MUY IMPORTANTE**: En la pantalla que aparece:

1. **"¿Qué API estás usando?"**: Selecciona **"Fitness API"** del dropdown (debería estar seleccionada por defecto)

2. **"¿A qué datos quieres acceder?"**: 
   - ✅ **SELECCIONA "Datos de los usuarios"** (User data)
   - ❌ **NO selecciones "Datos de aplicaciones"** (Application data)
   
   > **Nota**: "Datos de los usuarios" creará un cliente OAuth, que es lo que necesitas para acceder a los datos de Google Fit de los usuarios. "Datos de aplicaciones" crearía una cuenta de servicio, que NO es lo correcto para este caso.

3. Haz clic en **"Siguiente"**

### Paso 4.2: Configuración del Cliente OAuth

1. **Tipo de aplicación**: Selecciona **"Aplicación web"**
2. **Nombre**: `HabitTrack Web Client` (o el nombre que prefieras)

### Paso 4.3: URIs de redireccionamiento autorizados

Aquí debes agregar **TODAS** las URLs de callback que usarás:

**Para desarrollo local:**
```
http://localhost:3001/api/google-fit/callback
```

**Para producción (cuando despliegues):**
```
https://tu-dominio.com/api/google-fit/callback
```

> **📝 NOTA**: Puedes agregar múltiples URIs. Agrega todas las que necesites.

4. Haz clic en **"Crear"**

### Guardar las Credenciales

**⚠️ MUY IMPORTANTE**: Google mostrará una ventana con tus credenciales:

- **ID de cliente**: Algo como `123456789-abc123def456.apps.googleusercontent.com`
- **Secreto de cliente**: Algo como `GOCSPX-abc123def456ghi789`

**COPIA AMBOS VALORES** y guárdalos de forma segura. El secreto de cliente NO se mostrará de nuevo.

---

## 📝 Paso 5: Actualizar Variables de Entorno

Abre tu archivo `.env` en la raíz del proyecto y actualiza o agrega:

```env
# Google Fit API
GOOGLE_FIT_CLIENT_ID=TU_ID_DE_CLIENTE_AQUI.apps.googleusercontent.com
GOOGLE_FIT_CLIENT_SECRET=TU_SECRETO_DE_CLIENTE_AQUI
GOOGLE_FIT_REDIRECT_URI=http://localhost:3001/api/google-fit/callback
```

**Reemplaza:**
- `TU_ID_DE_CLIENTE_AQUI` con el ID de cliente que copiaste
- `TU_SECRETO_DE_CLIENTE_AQUI` con el secreto de cliente que copiaste

> **⚠️ IMPORTANTE**: 
> - NO incluyas espacios antes o después del `=`
> - NO agregues comillas alrededor de los valores
> - El `GOOGLE_FIT_REDIRECT_URI` debe coincidir EXACTAMENTE con el que agregaste en Google Cloud

---

## ✅ Paso 6: Verificar la Configuración

### Checklist de Verificación

Antes de probar, verifica que:

- [ ] El proyecto de Google Cloud está seleccionado
- [ ] La API "Fitness API" está habilitada
- [ ] La pantalla de consentimiento OAuth está configurada
- [ ] Los scopes correctos están agregados (fitness.activity.read, fitness.location.read)
- [ ] Tu correo está en la lista de usuarios de prueba (si la app está en modo prueba)
- [ ] Las credenciales OAuth están creadas
- [ ] El URI de redireccionamiento coincide en Google Cloud y en `.env`
- [ ] Las variables de entorno están correctamente configuradas

---

## 🧪 Paso 7: Probar la Configuración

1. **Reinicia el servidor backend**:
   ```bash
   # Detén el servidor (Ctrl+C) y vuelve a iniciarlo
   npm run dev:api
   ```

2. **Verifica que el servidor carga las credenciales correctamente**:
   Deberías ver en la consola:
   ```
   🏋️ GOOGLE_FIT_CLIENT_ID: Configurado ✓
   ```

3. **Inicia el frontend** (en otra terminal):
   ```bash
   npm run dev
   ```

4. **Intenta conectar Google Fit**:
   - Ve a http://localhost:5173
   - Inicia sesión
   - Haz clic en "Conectar Google Fit"
   - Deberías ser redirigido a la pantalla de consentimiento de Google
   - Autoriza la aplicación
   - Deberías ser redirigido de vuelta a tu app

---

## 🐛 Solución de Problemas Comunes

### ❌ Error: "redirect_uri_mismatch"

**Causa**: El URI de redireccionamiento en `.env` no coincide con el configurado en Google Cloud.

**Solución**:
1. Ve a Google Cloud Console > Credenciales
2. Edita tu cliente OAuth
3. Verifica que el URI en "URIs de redireccionamiento autorizados" coincida EXACTAMENTE con `GOOGLE_FIT_REDIRECT_URI` en tu `.env`
4. Asegúrate de que no haya espacios extras o diferencias de mayúsculas/minúsculas

### ❌ Error: "access_denied" o "invalid_scope"

**Causa**: Los scopes no están correctamente configurados o no estás en la lista de usuarios de prueba.

**Solución**:
1. Ve a "Pantalla de consentimiento de OAuth" > "Scopes"
2. Verifica que los scopes estén agregados:
   - `https://www.googleapis.com/auth/fitness.activity.read`
   - `https://www.googleapis.com/auth/fitness.location.read`
3. Ve a "Usuarios de prueba" y asegúrate de que tu correo esté agregado

### ❌ La API devuelve un array vacío

**Causa**: Puede ser por varias razones:
1. Los scopes no están correctamente configurados
2. El usuario no ha autorizado los permisos correctos
3. El usuario no tiene datos de Google Fit
4. Hay un error en el parsing de datos (revisa los logs del servidor)

**Solución**:
1. Revisa los logs del servidor backend para ver la respuesta cruda de Google Fit
2. Verifica que el usuario tenga datos en Google Fit (abre la app de Google Fit en tu teléfono)
3. Intenta revocar la autorización y volver a autorizar
4. Revisa la consola del navegador para ver si hay errores

### ❌ Error: "The request is missing a valid API key"

**Causa**: Las credenciales no están correctamente configuradas.

**Solución**:
1. Verifica que las variables de entorno estén correctamente escritas en `.env`
2. Reinicia el servidor backend después de cambiar `.env`
3. Verifica que no haya espacios extras en las variables de entorno

### ❌ Error: "API not enabled"

**Causa**: La API de Fitness no está habilitada.

**Solución**:
1. Ve a "API y servicios" > "Biblioteca"
2. Busca "Fitness API"
3. Haz clic en "Habilitar" si no está habilitada

---

## 📚 Referencias

- [Documentación oficial de Google Fit API](https://developers.google.com/fit)
- [Guía de scopes de Google Fit](https://developers.google.com/fit/scopes)
- [Documentación de OAuth 2.0 de Google](https://developers.google.com/identity/protocols/oauth2)
- [Console de Google Cloud](https://console.cloud.google.com/)

---

## 🔄 Siguiente Paso

Una vez que hayas completado esta configuración, deberías poder:

1. ✅ Autenticar usuarios con Google Fit
2. ✅ Obtener tokens de acceso y refresh
3. ✅ Obtener datos de pasos, calorías y distancia

Si después de seguir esta guía aún tienes problemas, revisa:
- Los logs del servidor backend
- Los logs de la consola del navegador
- La documentación de tu código en `docs/GOOGLE_FIT_INTEGRATION.md`

---

**Última actualización**: Enero 2026
