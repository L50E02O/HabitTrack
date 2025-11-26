# Sistema de rachas automático

## Descripción general

El sistema de rachas ahora funciona de forma automática. Ya no necesitas hacer clic adicional para actualizar las rachas: el sistema detecta cuándo completaste tu objetivo y actualiza la racha automáticamente.

## Cómo funciona

### Lógica de rachas por tipo de intervalo

#### Hábitos diarios

La racha aumenta en una unidad cada día que completes la meta diaria:

```
Día 1: completas 3/3 clics → Racha: 1 día
Día 2: completas 3/3 clics → Racha: 2 días
Día 3: solo 2/3 clics → Racha: 0 (se pierde)
Día 4: completas 3/3 clics → Racha: 1 día (nueva)
```

Regla: si no completas la meta de un día, la racha se pierde.

#### Hábitos semanales

La racha aumenta en una unidad cada día que hagas progreso durante la semana:

```
Lunes: 1 clic → Racha +1 (racha: 1 día)
Martes: 1 clic → Racha +1 (racha: 2 días)
Miércoles: 1 clic → Racha +1 (racha: 3 días)
Jueves: 1 clic → Racha +1 (racha: 4 días)
Viernes: 1 clic → Racha +1 (racha: 5 días)

Fin de semana: 
  - Completaste 5/5 clics → la racha continúa (sigue acumulando).
  - Solo 3/5 clics → la racha se pierde (pierdes todos los días acumulados).
```

Regla: la racha crece cada día, pero al final de la semana se verifica:
- Si completaste `meta_repeticion` → la racha continúa.
- Si no completaste `meta_repeticion` → la racha se pierde por completo.

#### Hábitos mensuales

La racha aumenta en una unidad cada día que hagas progreso durante el mes:

```
Día 1-15: haces progreso cada día → Racha: 15 días
Día 16: sin progreso → Racha: 15 días (no aumenta)
Día 17-30: haces progreso → Racha: 29 días

Fin de mes:
  - Completaste 20/20 clics → la racha continúa (sigue acumulando).
  - Solo 18/20 clics → la racha se pierde (pierdes los 29 días).
```

Regla: la racha crece cada día, pero al final del mes se verifica:
- Si completaste `meta_repeticion` → la racha continúa.
- Si no completaste `meta_repeticion` → la racha se pierde por completo.

### Verificaciones automáticas

El sistema verifica y actualiza rachas en tres momentos:

1. Al cargar el dashboard: verifica todos los hábitos al iniciar sesión.
2. Cada 30 segundos: verificación periódica mientras navegas.
3. Después de hacer clic: verifica inmediatamente tras registrar progreso.

## Validaciones implementadas

### 1. Actualización de rachas por día

Para todos los tipos de hábitos (diario, semanal, mensual):
- La racha aumenta en una unidad por cada día que haces progreso.
- Solo actualiza una vez por día (evita duplicados).

### 2. Verificación al final del período

Diario:
- Cada día verifica: ¿completaste `meta_repeticion`?
  - Sí → la racha aumenta en una unidad.
  - No → la racha se pierde.

Semanal:
- Al final de la semana verifica: ¿completaste `meta_repeticion` de la semana?
  - Sí → la racha continúa acumulando.
  - No → la racha se pierde (toda la acumulada).

Mensual:
- Al final del mes verifica: ¿completaste `meta_repeticion` del mes?
  - Sí → la racha continúa acumulando.
  - No → la racha se pierde (toda la acumulada).

### 3. Sistema de protectores

Si tienes protectores asignados:
- Se usan automáticamente cuando la racha está por perderse.
- Protegen tu racha acumulada.
- Se notifica al usuario cuando se usa un protector.

## Archivos modificados

### Nuevos archivos

- `src/services/habito/autoProgressService.ts`: servicio de verificación automática.

### Archivos modificados

- `src/services/habito/progressService.ts`: simplificado, solo registra progreso.
- `src/pages/dashboard.tsx`: integra la verificación automática.

## Funciones principales

### `checkAndUpdateAutoProgress(idPerfil)`

Verifica todos los hábitos activos del usuario y devuelve:

```typescript
{
  habitosActualizados: number,      // Total de hábitos verificados
  rachasActualizadas: string[],     // IDs de hábitos con rachas actualizadas
  mensaje: string                   // Mensaje de resumen
}
```

### `verificarYActualizarRacha(habito)`

Verifica un hábito específico:

1. Cuenta el progreso del período actual.
2. Verifica si cambió el período sin completar la meta (en ese caso, se pierde la racha).
3. Verifica si ya se actualizó hoy (para no duplicar).
4. Si se alcanzó la meta y no se ha actualizado aún, actualiza la racha.
5. Usa protectores automáticamente si están asignados.

## Ejemplos de uso

### Ejemplo 1: hábito diario (3 veces al día)

Lunes:
- Clic 1: progreso 1/3
- Clic 2: progreso 2/3
- Clic 3: progreso 3/3 → racha: 1 día

Martes:
- Clic 1: progreso 1/3
- Clic 2: progreso 2/3
- Clic 3: progreso 3/3 → racha: 2 días

Miércoles (no completa):
- Clic 1: progreso 1/3
- Clic 2: progreso 2/3
- Fin del día → racha: 0 días (se pierde porque no completó 3/3)

Jueves:
- Clic 1: progreso 1/3
- Clic 2: progreso 2/3
- Clic 3: progreso 3/3 → racha: 1 día (nueva racha)

### Ejemplo 2: hábito semanal (5 veces a la semana)

Semana 1:
- Lunes: 1 clic → racha: 1 día
- Martes: 1 clic → racha: 2 días
- Miércoles: 1 clic → racha: 3 días
- Jueves: 1 clic → racha: 4 días
- Viernes: 1 clic → racha: 5 días
- Fin de semana: completó 5/5 → la racha continúa (5 días acumulados).

Semana 2:
- Lunes: 1 clic → racha: 6 días
- Martes: 1 clic → racha: 7 días
- Miércoles: 1 clic → racha: 8 días
- Jueves: sin clic
- Viernes: sin clic
- Fin de semana: solo 3/5 → la racha se pierde (pierde los 8 días).

### Ejemplo 3: hábito mensual (20 veces al mes)

Enero:
- Días 1-20: hace 1 clic cada día → racha: 20 días.
- Días 21-31: sin progreso.
- Fin de mes: completó 20/20 → la racha continúa (20 días acumulados).

Febrero:
- Días 1-15: hace 1 clic cada día → racha: 35 días (20 + 15).
- Días 16-28: sin progreso.
- Fin de mes: solo 15/20 → la racha se pierde (pierde los 35 días).

### Ejemplo 4: hábito semanal con protector

Semana 1: 
- Lunes-viernes: 5 clics → completó 5/5 → racha: 5 días.

Semana 2: 
- Lunes-jueves: 4 clics → solo 4/5.
- Fin de semana → el protector se usa automáticamente.
- Racha salvada: 9 días (5 de la semana 1 + 4 de la semana 2).

Semana 3:
- Lunes-viernes: 5 clics → completó 5/5 → racha: 14 días.

## Configuración

No requiere configuración adicional. El sistema funciona automáticamente al:

1. Ejecutar `npm install`.
2. Iniciar la aplicación con `npm run dev`.
3. Iniciar sesión en el dashboard.

## Monitoreo

El sistema imprime logs en consola para depuración, por ejemplo:

```
[RACHAS] Iniciando verificación automática de progreso...
[RACHAS] Hábito Ejercicio: 3/3
[RACHAS] Hábito Ejercicio: meta alcanzada - actualizando racha...
[RACHAS] Racha actualizada para Ejercicio: 5 días
[RACHAS] Verificación completa. 1 racha actualizada.
```

## Beneficios

1. Automático: no necesitas pensar en actualizar rachas.
2. Justo: si no completas la meta, pierdes la racha.
3. Protegido: los protectores se usan automáticamente.
4. Eficiente: solo actualiza una vez por día.
5. Inmediato: verifica después de cada progreso.

## Migración desde el sistema anterior

El sistema anterior requería hacer clic en "Avanzar" para actualizar rachas. Ahora:

- Antes: clic → progreso → clic adicional → racha.
- Ahora: clic → progreso → racha automática.

No se requiere migración de datos. El sistema funciona con la base de datos actual.
