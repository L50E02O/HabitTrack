# Servidor Mock de Health Connect

Este servidor simula la API de Health Connect para desarrollo local.

## Instalación

Primero, instala las dependencias necesarias:

```bash
npm install express cors --save-dev
```

## Uso

### Opción 1: Script npm (Recomendado)

```bash
npm run dev:health
```

### Opción 2: Comando directo

```bash
node scripts/health-connect-mock.js
```

## Endpoints Disponibles

- `GET /api/health-connect/estado` - Estado de Health Connect
- `GET /api/health-connect/permisos` - Permisos actuales
- `POST /api/health-connect/permisos/solicitar` - Solicitar permisos
- `GET /api/health-connect/datos?fecha=YYYY-MM-DD` - Datos del día

## Configuración en HabitTrack

Asegúrate de tener la variable de entorno configurada:

```env
VITE_HEALTH_CONNECT_API=http://localhost:3001
```

## Desarrollo Completo

Para trabajar con el proyecto completo, ejecuta en terminales separadas:

**Terminal 1 - Frontend:**
```bash
npm run dev
```

**Terminal 2 - Mock Health Connect API:**
```bash
npm run dev:health
```

Luego abre http://localhost:5173 en tu navegador.

## Datos Simulados

El servidor retorna datos simulados con pequeñas variaciones aleatorias:

- Pasos: ~8542
- Frecuencia cardíaca: ~72 bpm
- Calorías: ~425.5 kcal
- Distancia: ~6.3 km
- Sueño: ~7.5 horas
- Ejercicio: ~45 minutos
- Oxígeno: ~98%

## Notas

⚠️ Este es un servidor MOCK solo para desarrollo. No se conecta a Health Connect real.

Para producción, debes implementar un backend real que se integre con Health Connect de Android.
