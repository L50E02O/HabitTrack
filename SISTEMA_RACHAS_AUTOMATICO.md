# Sistema de Rachas Automático

## 📋 Descripción General

El sistema de rachas ahora funciona **automáticamente**. Ya no necesitas hacer clic adicional para actualizar las rachas - el sistema detecta cuando completaste tu objetivo y actualiza la racha automáticamente.

## 🔥 Cómo Funciona

### Lógica de Rachas por Tipo de Intervalo

#### 📅 **Hábitos DIARIOS**

La racha aumenta **+1 cada día** que completes la meta diaria:

```
Día 1: Completas 3/3 clicks → Racha: 1 día ✅
Día 2: Completas 3/3 clicks → Racha: 2 días ✅
Día 3: Solo 2/3 clicks → Racha: 0 (se pierde) ❌
Día 4: Completas 3/3 clicks → Racha: 1 día (nueva) ✅
```

**Regla:** Si no completas la meta de un día → Racha se PIERDE

#### 📆 **Hábitos SEMANALES**

La racha aumenta **+1 cada día** que hagas progreso durante la semana:

```
Lunes: 1 click → Racha +1 (Racha: 1 día)
Martes: 1 click → Racha +1 (Racha: 2 días)
Miércoles: 1 click → Racha +1 (Racha: 3 días)
Jueves: 1 click → Racha +1 (Racha: 4 días)
Viernes: 1 click → Racha +1 (Racha: 5 días)

Fin de semana: 
  ✅ Completaste 5/5 clicks → Racha CONTINÚA (sigue acumulando)
  ❌ Solo 3/5 clicks → Racha se PIERDE (pierdes todos los días acumulados)
```

**Regla:** La racha crece cada día, pero al final de la semana verifica:
- Si completaste `meta_repeticion` → Racha continúa
- Si NO completaste `meta_repeticion` → Racha se PIERDE (toda)

#### 🗓️ **Hábitos MENSUALES**

La racha aumenta **+1 cada día** que hagas progreso durante el mes:

```
Día 1-15: Haces progreso cada día → Racha: 15 días
Día 16: Sin progreso → Racha: 15 días (no aumenta)
Día 17-30: Haces progreso → Racha: 29 días

Fin de mes:
  ✅ Completaste 20/20 clicks → Racha CONTINÚA (sigue acumulando)
  ❌ Solo 18/20 clicks → Racha se PIERDE (pierdes los 29 días)
```

**Regla:** La racha crece cada día, pero al final del mes verifica:
- Si completaste `meta_repeticion` → Racha continúa
- Si NO completaste `meta_repeticion` → Racha se PIERDE (toda)

### Verificaciones Automáticas

El sistema verifica y actualiza rachas en tres momentos:

1. **Al cargar el dashboard** - Verifica todos los hábitos al iniciar sesión
2. **Cada 30 segundos** - Verificación periódica mientras navegas
3. **Después de hacer clic** - Verifica inmediatamente tras registrar progreso

## ✅ Validaciones Implementadas

### 1. Actualización de Rachas por Día

**Para TODOS los tipos de hábitos (diario, semanal, mensual):**
- La racha aumenta **+1 por cada día** que haces progreso
- Solo actualiza **UNA VEZ por día** (evita duplicados)

### 2. Verificación al Final del Período

**Diario:**
- Cada día verifica: ¿Completaste `meta_repeticion`?
  - ✅ SÍ → Racha +1
  - ❌ NO → Racha se PIERDE

**Semanal:**
- Al final de la semana verifica: ¿Completaste `meta_repeticion` de la semana?
  - ✅ SÍ → Racha continúa acumulando
  - ❌ NO → Racha se PIERDE (toda la acumulada)

**Mensual:**
- Al final del mes verifica: ¿Completaste `meta_repeticion` del mes?
  - ✅ SÍ → Racha continúa acumulando
  - ❌ NO → Racha se PIERDE (toda la acumulada)

### 3. Sistema de Protectores

Si tienes protectores asignados:
- Se usan **automáticamente** cuando la racha está por perderse
- Salvaguarda tu racha acumulada
- Te notifica cuando se usa un protector

## 📁 Archivos Modificados

### Nuevos Archivos

- `src/services/habito/autoProgressService.ts` - Servicio de verificación automática

### Archivos Modificados

- `src/services/habito/progressService.ts` - Simplificado, solo registra progreso
- `src/pages/dashboard.tsx` - Integra verificación automática

## 🔍 Funciones Principales

### `checkAndUpdateAutoProgress(idPerfil)`

Verifica todos los hábitos activos del usuario:

```typescript
{
  habitosActualizados: number,      // Total de hábitos verificados
  rachasActualizadas: string[],     // IDs de hábitos con rachas actualizadas
  mensaje: string                   // Mensaje de resumen
}
```

### `verificarYActualizarRacha(habito)`

Verifica un hábito específico:

1. Cuenta progreso del período actual
2. Verifica si cambió el período sin completar meta → Pierde racha
3. Verifica si ya actualizó hoy → No duplica
4. Si alcanzó meta y no actualizó → Actualiza racha
5. Usa protectores automáticamente si están asignados

## 🎯 Ejemplos de Uso

### Ejemplo 1: Hábito Diario (3 veces al día)

**Lunes:**
- Click 1: Progreso 1/3 ✅
- Click 2: Progreso 2/3 ✅
- Click 3: Progreso 3/3 ✅ → **Racha: 1 día**

**Martes:**
- Click 1: Progreso 1/3 ✅
- Click 2: Progreso 2/3 ✅
- Click 3: Progreso 3/3 ✅ → **Racha: 2 días**

**Miércoles (no completa):**
- Click 1: Progreso 1/3 ✅
- Click 2: Progreso 2/3 ✅
- Fin del día → **Racha: 0 días** (se pierde porque no completó 3/3)

**Jueves:**
- Click 1: Progreso 1/3 ✅
- Click 2: Progreso 2/3 ✅
- Click 3: Progreso 3/3 ✅ → **Racha: 1 día** (nueva racha)

### Ejemplo 2: Hábito Semanal (5 veces a la semana)

**Semana 1:**
- Lunes: 1 click → Racha: 1 día
- Martes: 1 click → Racha: 2 días
- Miércoles: 1 click → Racha: 3 días
- Jueves: 1 click → Racha: 4 días
- Viernes: 1 click → Racha: 5 días
- **Fin de semana:** Completó 5/5 → ✅ **Racha continúa (5 días acumulados)**

**Semana 2:**
- Lunes: 1 click → Racha: 6 días
- Martes: 1 click → Racha: 7 días
- Miércoles: 1 click → Racha: 8 días
- Jueves: (sin click)
- Viernes: (sin click)
- **Fin de semana:** Solo 3/5 → ❌ **Racha se pierde** (pierde los 8 días)

### Ejemplo 3: Hábito Mensual (20 veces al mes)

**Enero:**
- Días 1-20: Hace 1 click cada día → Racha: 20 días
- Días 21-31: Sin progreso
- **Fin de mes:** Completó 20/20 → ✅ **Racha continúa (20 días acumulados)**

**Febrero:**
- Días 1-15: Hace 1 click cada día → Racha: 35 días (20 + 15)
- Días 16-28: Sin progreso
- **Fin de mes:** Solo 15/20 → ❌ **Racha se pierde** (pierde los 35 días)

### Ejemplo 4: Hábito Semanal con Protector

**Semana 1:** 
- Lunes-Viernes: 5 clicks → Completó 5/5 → Racha: 5 días ✅

**Semana 2:** 
- Lunes-Jueves: 4 clicks → Solo 4/5
- Fin de semana → **Protector se usa automáticamente** 🛡️
- Racha salvada: 9 días (5 de semana 1 + 4 de semana 2)

**Semana 3:**
- Lunes-Viernes: 5 clicks → Completó 5/5 → Racha: 14 días ✅

## 🛠️ Configuración

No requiere configuración adicional. El sistema funciona automáticamente al:

1. Hacer `npm install`
2. Iniciar la app con `npm run dev`
3. Iniciar sesión en el dashboard

## 📊 Monitoreo

El sistema imprime logs en consola para debugging:

```
🔄 Iniciando verificación automática de progreso...
📊 Hábito Ejercicio: 3/3
🔥 Hábito Ejercicio: Meta alcanzada - Actualizando racha...
✅ Racha actualizada para Ejercicio: 5 días
✅ Verificación completa. 1 rachas actualizadas.
```

## ⚡ Beneficios

1. **Automático** - No necesitas pensar en actualizar rachas
2. **Justo** - Si no completas la meta, pierdes la racha
3. **Protegido** - Los protectores se usan automáticamente
4. **Eficiente** - Solo actualiza una vez por día
5. **Inmediato** - Verifica después de cada progreso

## 🔄 Migración desde Sistema Anterior

El sistema anterior requería hacer clic en "Avanzar" para actualizar rachas. Ahora:

- ✅ **Antes:** Click → Progreso → Click adicional → Racha
- ✅ **Ahora:** Click → Progreso → **Racha automática**

No se requiere migración de datos. El sistema funciona con la base de datos actual.
