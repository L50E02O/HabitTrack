# API Backend para Health Connect

## Descripción

Este documento describe la implementación necesaria de una API backend para conectar HabitTrack con Health Connect.

## Requisitos

- Node.js 18+ o Python 3.9+
- Acceso a un dispositivo Android con Health Connect
- SDK de Android para acceder a Health Connect

## Endpoints Requeridos

### 1. Estado de Health Connect

```http
GET /api/health-connect/estado
```

**Response:**
```json
{
  "disponible": true,
  "aplicacionOrigen": "Mi Smartwatch",
  "ultimaSincronizacion": "2026-01-07T10:30:00Z",
  "permisosOtorgados": true
}
```

### 2. Obtener Permisos

```http
GET /api/health-connect/permisos
```

**Response:**
```json
{
  "leerPasos": true,
  "leerFrecuenciaCardiaca": true,
  "leerCalorias": true,
  "leerDistancia": true,
  "leerSueno": true,
  "leerEjercicio": true,
  "leerOxigeno": false
}
```

### 3. Solicitar Permisos

```http
POST /api/health-connect/permisos/solicitar
Content-Type: application/json
```

**Body:**
```json
{
  "tiposDatos": [
    "steps",
    "heart_rate",
    "calories",
    "distance",
    "sleep",
    "exercise",
    "oxygen_saturation"
  ]
}
```

**Response:**
```json
{
  "otorgados": true
}
```

### 4. Obtener Datos del Día

```http
GET /api/health-connect/datos?fecha=2026-01-07
```

**Response:**
```json
{
  "pasos": 8542,
  "frecuenciaCardiaca": 72,
  "caloriasQuemadas": 425.5,
  "distanciaKm": 6.3,
  "horasSueno": 7.5,
  "minutosEjercicio": 45,
  "nivelOxigeno": 98,
  "ultimaActualizacion": "2026-01-07T14:25:00Z"
}
```

## Implementación con Node.js/Express

```typescript
import express from 'express';
import { HealthConnectClient } from '@android/health-connect';

const app = express();
app.use(express.json());

const healthClient = new HealthConnectClient();

// Estado
app.get('/api/health-connect/estado', async (req, res) => {
  try {
    const disponible = await healthClient.isAvailable();
    const permisos = await healthClient.hasPermissions();
    
    res.json({
      disponible,
      aplicacionOrigen: 'Mi Smartwatch',
      ultimaSincronizacion: new Date().toISOString(),
      permisosOtorgados: permisos
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener datos
app.get('/api/health-connect/datos', async (req, res) => {
  try {
    const fecha = req.query.fecha || new Date().toISOString().split('T')[0];
    const startTime = new Date(fecha + 'T00:00:00Z');
    const endTime = new Date(fecha + 'T23:59:59Z');
    
    const pasos = await healthClient.readSteps(startTime, endTime);
    const frecuenciaCardiaca = await healthClient.readHeartRate(startTime, endTime);
    const calorias = await healthClient.readCalories(startTime, endTime);
    const distancia = await healthClient.readDistance(startTime, endTime);
    const sueno = await healthClient.readSleep(startTime, endTime);
    const ejercicio = await healthClient.readExercise(startTime, endTime);
    const oxigeno = await healthClient.readOxygenSaturation(startTime, endTime);
    
    res.json({
      pasos: pasos.total,
      frecuenciaCardiaca: frecuenciaCardiaca.average,
      caloriasQuemadas: calorias.total,
      distanciaKm: distancia.totalKm,
      horasSueno: sueno.totalHours,
      minutosEjercicio: ejercicio.totalMinutes,
      nivelOxigeno: oxigeno.average,
      ultimaActualizacion: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Solicitar permisos
app.post('/api/health-connect/permisos/solicitar', async (req, res) => {
  try {
    const { tiposDatos } = req.body;
    const otorgados = await healthClient.requestPermissions(tiposDatos);
    
    res.json({ otorgados });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Health Connect API corriendo en puerto ${PORT}`);
});
```

## Implementación con Python/FastAPI

```python
from fastapi import FastAPI, Query
from datetime import date, datetime
from typing import List
from android_health_connect import HealthConnectClient

app = FastAPI()
health_client = HealthConnectClient()

@app.get("/api/health-connect/estado")
async def obtener_estado():
    disponible = await health_client.is_available()
    permisos = await health_client.has_permissions()
    
    return {
        "disponible": disponible,
        "aplicacionOrigen": "Mi Smartwatch",
        "ultimaSincronizacion": datetime.now().isoformat(),
        "permisosOtorgados": permisos
    }

@app.get("/api/health-connect/datos")
async def obtener_datos(fecha: date = Query(default=date.today())):
    start_time = datetime.combine(fecha, datetime.min.time())
    end_time = datetime.combine(fecha, datetime.max.time())
    
    pasos = await health_client.read_steps(start_time, end_time)
    frecuencia = await health_client.read_heart_rate(start_time, end_time)
    calorias = await health_client.read_calories(start_time, end_time)
    distancia = await health_client.read_distance(start_time, end_time)
    sueno = await health_client.read_sleep(start_time, end_time)
    ejercicio = await health_client.read_exercise(start_time, end_time)
    oxigeno = await health_client.read_oxygen(start_time, end_time)
    
    return {
        "pasos": pasos.total,
        "frecuenciaCardiaca": frecuencia.average,
        "caloriasQuemadas": calorias.total,
        "distanciaKm": distancia.total_km,
        "horasSueno": sueno.total_hours,
        "minutosEjercicio": ejercicio.total_minutes,
        "nivelOxigeno": oxigeno.average,
        "ultimaActualizacion": datetime.now().isoformat()
    }

@app.post("/api/health-connect/permisos/solicitar")
async def solicitar_permisos(tipos_datos: List[str]):
    otorgados = await health_client.request_permissions(tipos_datos)
    return {"otorgados": otorgados}
```

## Configuración en HabitTrack

Agregar variable de entorno en el archivo `.env`:

```env
VITE_HEALTH_CONNECT_API=http://localhost:3001
```

Para producción, usar la URL de tu servidor:

```env
VITE_HEALTH_CONNECT_API=https://api.habittrack.com
```

## Seguridad

1. **Autenticación**: Implementar OAuth 2.0 o JWT para autenticar usuarios
2. **HTTPS**: Usar siempre HTTPS en producción
3. **Rate Limiting**: Limitar número de peticiones por usuario
4. **Validación**: Validar todos los datos antes de procesarlos

## Notas

- Esta es una implementación de referencia
- Los SDKs `@android/health-connect` y `android_health_connect` son ejemplos
- Debes usar las librerías oficiales de Android para Health Connect
- Para producción, considera usar una app Android nativa que exponga una API REST
