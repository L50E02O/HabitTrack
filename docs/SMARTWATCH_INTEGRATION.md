# Integración con Health Connect

## 📱 Descripción

Esta guía explica cómo integrar HabitTrack con **Health Connect**, la plataforma de Android para compartir datos de salud y fitness. Health Connect permite sincronizar datos desde aplicaciones como "Mi Smartwatch", FitCloudPro, Google Fit, Samsung Health, entre otras.

## 🔧 Requisitos Previos

### 1. Dispositivo Android
- **Android 14+** (Health Connect viene preinstalado)
- **Android 13** o anterior: Instalar la app Health Connect desde Play Store

### 2. Aplicación de Smartwatch
- Tener instalada la app de tu smartwatch (ej: "Mi Smartwatch", FitCloudPro)
- Sincronizar tu smartwatch con la app
- La app debe compartir datos con Health Connect

### 3. API Backend
- Configurar un backend que se conecte a Health Connect
- Exponer endpoints REST para obtener datos
- Variable de entorno `VITE_HEALTH_CONNECT_API` configurada

## 🚀 Pasos para Configurar

### Paso 1: Configurar Health Connect en Android

1. Abre **Health Connect** en tu dispositivo Android
2. Navega a **Permisos de aplicaciones**
3. Selecciona tu app de smartwatch (ej: "Mi Smartwatch")
4. Otorga permisos para compartir:
   - Pasos
   - Frecuencia cardíaca
   - Calorías quemadas
   - Distancia
   - Sueño
   - Ejercicio
   - Saturación de oxígeno

### Paso 2: Ejecutar la Migración de Base de Datos

Antes de usar la funcionalidad, debes actualizar la tabla en Supabase:

1. Ve a [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecciona tu proyecto HabitTrack
3. Abre el **SQL Editor**
4. Ejecuta la siguiente migración para agregar nuevos campos:

```sql
-- Agregar nuevos campos a datos_salud
ALTER TABLE datos_salud 
ADD COLUMN IF NOT EXISTS minutos_ejercicio INTEGER,
ADD COLUMN IF NOT EXISTS nivel_oxigeno INTEGER;

-- Actualizar comentarios
COMMENT ON COLUMN datos_salud.minutos_ejercicio IS 'Minutos de ejercicio registrados desde Health Connect';
COMMENT ON COLUMN datos_salud.nivel_oxigeno IS 'Nivel de saturación de oxígeno (%) desde Health Connect';
```

### Paso 3: Configurar el Backend

Crea una API que se conecte a Health Connect. Ejemplo con Node.js/Express:

```typescript
// Endpoints necesarios:
// GET /api/health-connect/estado - Verifica disponibilidad
// GET /api/health-connect/permisos - Obtiene permisos actuales
// POST /api/health-connect/permisos/solicitar - Solicita nuevos permisos
// GET /api/health-connect/datos?fecha=YYYY-MM-DD - Obtiene datos del día
```

### Paso 4: Sincronizar Datos en HabitTrack

1. Abre HabitTrack en tu navegador
2. Ve al **Dashboard**
3. Busca la sección **"Health Connect"**
4. Haz clic en **"Sincronizar Datos"**
5. Los datos del día actual se guardarán en la base de datos

## 📊 Datos que se Sincronizan

- **Pasos**: Número de pasos registrados durante el día
- **Frecuencia Cardíaca**: Latidos por minuto (bpm)
- **Calorías Quemadas**: Calorías quemadas durante el día
- **Distancia**: Distancia recorrida en kilómetros
- **Horas de Sueño**: Horas de sueño registradas
- **Minutos de Ejercicio**: Tiempo de ejercicio activo
- **Nivel de Oxígeno**: Saturación de oxígeno en sangre (%)

## 🔄 Funcionamiento

### Integración con Health Connect

Health Connect funciona como un hub centralizado:
- Las apps de smartwatch suben datos a Health Connect
- HabitTrack lee datos desde Health Connect vía API
- No se requiere conexión directa Bluetooth
- Los datos están siempre sincronizados

### Flujo de Datos

```
Smartwatch → App (Mi Smartwatch/FitCloudPro) → Health Connect → API Backend → HabitTrack
```

### Almacenamiento de Datos

Los datos se almacenan en la tabla `datos_salud` con:
- Un registro por usuario por día
- Si sincronizas múltiples veces en el mismo día, se actualiza el registro existente
- Los datos se asocian a tu perfil de usuario
- Se guarda la fecha de última sincronización

### Seguridad

- **RLS (Row Level Security)** habilitado: Solo puedes ver y modificar tus propios datos
- Los datos se almacenan de forma segura en Supabase
- Health Connect encripta los datos en tránsito y en reposo
- El usuario controla qué apps tienen acceso a sus datos

## ⚠️ Limitaciones y Consideraciones

### Health Connect

1. **Solo Android**: Health Connect está disponible únicamente en dispositivos Android
2. **Requiere permisos**: El usuario debe otorgar permisos explícitos para cada tipo de dato
3. **Dependencia de apps**: Los datos provienen de otras apps que deben compartirlos con Health Connect

### Sincronización

1. **Manual por ahora**: La sincronización se realiza manualmente desde HabitTrack
2. **Requiere backend**: Necesitas una API que se conecte a Health Connect
3. **Datos del día**: Solo se sincronizan datos del día actual o fechas específicas

## 🛠️ Solución de Problemas

### "Health Connect API no está disponible"

**Solución:**
- Verifica que Health Connect esté instalado (Android 13-) o actualizado (Android 14+)
- Asegúrate de que tu backend esté corriendo y accesible
- Verifica la variable de entorno `VITE_HEALTH_CONNECT_API`

### "No se encontraron datos"

**Solución:**
- Verifica que tu app de smartwatch esté sincronizada
- Asegúrate de que la app comparta datos con Health Connect
- Revisa los permisos en la configuración de Health Connect
- Intenta sincronizar nuevamente tu smartwatch con su app

### "Error al sincronizar datos"

**Solución:**
- Verifica tu conexión a internet
- Revisa que los permisos de Health Connect estén activos
- Comprueba que tu backend esté respondiendo correctamente
- Revisa los logs de la consola del navegador

### "Permisos no otorgados"

**Solución:**
- Abre Health Connect en tu dispositivo Android
- Ve a **Permisos de aplicaciones**
- Selecciona tu aplicación
- Activa los permisos necesarios para cada tipo de dato

## 📝 Notas Técnicas

### API Endpoints Requeridos

El backend debe implementar los siguientes endpoints:

```typescript
// Estado y disponibilidad
GET /api/health-connect/estado
Response: {
  disponible: boolean,
  aplicacionOrigen: string | null,
  ultimaSincronizacion: string | null,
  permisosOtorgados: boolean
}

// Permisos actuales
GET /api/health-connect/permisos
Response: {
  leerPasos: boolean,
  leerFrecuenciaCardiaca: boolean,
  leerCalorias: boolean,
  leerDistancia: boolean,
  leerSueno: boolean,
  leerEjercicio: boolean,
  leerOxigeno: boolean
}

// Solicitar permisos
POST /api/health-connect/permisos/solicitar
Body: {
  tiposDatos: string[] // Array de TipoDatoHealthConnect
}
Response: {
  otorgados: boolean
}

// Obtener datos del día
GET /api/health-connect/datos?fecha=YYYY-MM-DD
Response: {
  pasos: number,
  frecuenciaCardiaca?: number,
  caloriasQuemadas?: number,
  distanciaKm?: number,
  horasSueno?: number,
  minutosEjercicio?: number,
  nivelOxigeno?: number,
  ultimaActualizacion: string
}
```

### Estructura de Datos

```typescript
interface IDatosSalud {
  id_datos: string;
  id_perfil: string;
  fecha: string; // YYYY-MM-DD
  pasos: number;
  frecuencia_cardiaca?: number | null;
  calorias_quemadas?: number | null;
  distancia_km?: number | null;
  horas_sueno?: number | null;
  minutos_ejercicio?: number | null;
  nivel_oxigeno?: number | null;
  fecha_sincronizacion: Date;
}
```

### Tipos de Datos Soportados

```typescript
enum TipoDatoHealthConnect {
  PASOS = 'steps',
  FRECUENCIA_CARDIACA = 'heart_rate',
  CALORIAS = 'calories',
  DISTANCIA = 'distance',
  SUENO = 'sleep',
  EJERCICIO = 'exercise',
  OXIGENO = 'oxygen_saturation'
}
```

## 🔮 Funcionalidades Futuras

- [ ] Sincronización automática periódica en segundo plano
- [ ] Crear hábitos automáticos basados en datos del smartwatch
- [ ] Gráficos de progreso de salud y tendencias
- [ ] Soporte para iOS con HealthKit
- [ ] Notificaciones cuando se alcanzan metas de pasos o ejercicio
- [ ] Integración con más tipos de datos (presión arterial, glucosa, etc.)
- [ ] Dashboard de análisis de salud completo

## 📚 Referencias

- [Health Connect Documentation](https://developer.android.com/health-and-fitness/guides/health-connect)
- [Health Connect Data Types](https://developer.android.com/health-and-fitness/guides/health-connect/data-and-data-types)
- [Health Connect Permissions](https://developer.android.com/health-and-fitness/guides/health-connect/permissions)
- [Jetpack Health API](https://developer.android.com/jetpack/androidx/releases/health)


