# 🚀 INSTRUCCIONES: Migración de Racha Máxima

## ✅ NUEVA FUNCIONALIDAD

Se ha implementado un sistema que **actualiza automáticamente la racha máxima** cada vez que un usuario alcanza una racha más alta.

### 📊 Cómo Funciona

1. **Nueva columna `racha_maxima`** en la tabla `perfil` (almacena UN valor por usuario)
2. Se **actualiza automáticamente** cuando:
   - El usuario completa un hábito y su racha actual supera la máxima anterior
   - Se calcula comparando TODOS los hábitos del usuario, no solo el actual
   - Ejemplo: Si tenías racha máxima de 10 días en el perfil y ahora alcanzas 13 en cualquier hábito, se actualiza a 13
3. **Nunca disminuye** - Solo aumenta cuando se supera el récord anterior
4. **Cálculo Global** - Compara entre TODOS los hábitos del usuario para encontrar el máximo absoluto

---

## 🔧 PASOS PARA APLICAR LA MIGRACIÓN

### PASO 1: Abrir Supabase SQL Editor
1. Ve a [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Selecciona tu proyecto **HabitTrack**
3. En el menú lateral, haz clic en **SQL Editor**
4. Haz clic en **New Query**

### PASO 2: Ejecutar la Migración
1. Abre el archivo: `database/migrations/20250118_add_racha_maxima.sql`
2. **COPIA TODO EL CONTENIDO** del archivo
3. **PEGA** el contenido en el editor SQL de Supabase
4. Haz clic en **RUN** (botón verde)

### PASO 3: Verificar que Funcionó

Ejecuta esta query en el SQL Editor:

```sql
-- Verificar que la columna existe en perfil
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'perfil' AND column_name = 'racha_maxima';

-- Ver usuarios con sus rachas máximas
SELECT 
    id,
    nombre,
    racha_maxima
FROM perfil
ORDER BY racha_maxima DESC NULLS LAST
LIMIT 10;

-- Verificar índice
SELECT indexname
FROM pg_indexes
WHERE indexname = 'idx_perfil_racha_maxima';
```

**Resultado esperado:**
- ✅ Debe mostrar la columna `racha_maxima` en tabla `perfil` de tipo `integer`
- ✅ Debe mostrar usuarios con valores en `racha_maxima`
- ✅ Debe mostrar el índice `idx_perfil_racha_maxima`

---

## 📋 CAMBIOS IMPLEMENTADOS

### 1. **Base de Datos** 
- ✅ Nueva columna `racha_maxima` en tabla `perfil` (NO en `racha`)
- ✅ Valores migrados desde la racha máxima existente de cada usuario
- ✅ Índice para optimizar consultas: `idx_perfil_racha_maxima`
- ✅ Columna eliminada de tabla `racha` (ya no se almacena por racha individual)

### 2. **Interfaces TypeScript**
- ✅ `IPerfil` - Agregado campo `racha_maxima?: number`
- ✅ `UpdateIPerfil` - Agregado campo `racha_maxima?: number`
- ✅ `IRacha` - REMOVIDO campo `racha_maxima` (ya no se almacena aquí)

### 3. **Servicios**
- ✅ `rachaAutoService.ts` - Nueva función `actualizarRachaMaximaEnPerfil()`
  - Calcula máximo entre TODOS los hábitos del usuario
  - Solo actualiza si el nuevo valor supera al almacenado
  - No lanza excepciones, solo loguea errores
- ✅ `rachaAutoService.ts` - `crearNuevaRacha()` llama a `actualizarRachaMaximaEnPerfil()`
- ✅ `rachaAutoService.ts` - `extenderRacha()` llama a `actualizarRachaMaximaEnPerfil()`
- ✅ `protectorService.ts` - Lee `racha_maxima` desde `perfil` en lugar de `racha`
- ✅ `LogrosModal.tsx` - Consulta simplificada a `perfil.racha_maxima`
- ✅ `LogrosPage.tsx` - Consulta simplificada a `perfil.racha_maxima`

### 4. **Tests**
- ✅ `rachaMaxima.test.ts` - Suite de 5 tests cubriendo:
  - Cálculo entre múltiples hábitos
  - Actualización cuando racha actual es la mayor
  - No actualización cuando no supera el récord
  - Manejo de usuarios sin hábitos
  - Manejo de errores sin lanzar excepciones

---

## 🎯 EJEMPLO DE USO

### Escenario con MÚLTIPLES HÁBITOS:

**Estado inicial:**
- `perfil.racha_maxima = 10` (récord anterior)

**Usuario tiene 3 hábitos:**

1. **Hábito A (Ejercicio):**
   - Racha actual: 5 días
   
2. **Hábito B (Lectura):**
   - Racha actual: 25 días ← **LA MÁS ALTA**
   
3. **Hábito C (Meditación):**
   - Racha actual: 7 días

**Usuario completa Hábito A:**
- Sistema ejecuta `actualizarRachaMaximaEnPerfil(userId, 5)`
- Consulta TODOS los hábitos del usuario
- Encuentra rachas: [5, 25, 7]
- Calcula máximo: `Math.max(5, 25, 7) = 25`
- Compara con `perfil.racha_maxima = 10`
- Como 25 > 10, **actualiza** `perfil.racha_maxima = 25` ✅

**Días después, usuario rompe Hábito B y continúa con los demás:**
- Hábito A: 15 días
- Hábito B: 3 días (racha rota)
- Hábito C: 17 días

**Usuario completa Hábito C:**
- Sistema ejecuta `actualizarRachaMaximaEnPerfil(userId, 17)`
- Encuentra rachas: [15, 3, 17]
- Calcula máximo: `Math.max(15, 3, 17) = 17`
- Compara con `perfil.racha_maxima = 25`
- Como 17 < 25, **NO actualiza** (mantiene el récord de 25) ✅

**Semanas después, usuario alcanza nuevo récord en Hábito A:**
- Hábito A: 30 días ← **NUEVO RÉCORD**
- Sistema calcula máximo entre todos: 30
- Como 30 > 25, **actualiza** `perfil.racha_maxima = 30` ✅

---

## 🔍 VERIFICACIÓN EN LA APLICACIÓN

Después de aplicar la migración, puedes verificar que funciona:

1. **Dashboard** - Completa un hábito varias veces
2. **Página de Logros** - Verifica que muestra la racha máxima correcta
3. **Modal de Logros** - Abre el modal y verifica "Racha máxima: X días"

---

## ⚠️ NOTAS IMPORTANTES

- La racha máxima **nunca disminuye**, solo aumenta
- Se almacena **UNA sola vez por usuario** en `perfil`, no por cada racha
- Se actualiza **automáticamente** en TypeScript cuando se completan hábitos
- Calcula el máximo entre **TODOS los hábitos del usuario**, no solo el actual
- **Performance mejorada**: 1 query simple vs múltiples JOINs
  - **ANTES**: `SELECT racha_maxima FROM racha r JOIN registro_intervalo ri JOIN habito h WHERE ...`
  - **AHORA**: `SELECT racha_maxima FROM perfil WHERE id = userId`
- Los datos históricos se migran desde las rachas existentes
- La función `actualizarRachaMaximaEnPerfil()` NO lanza excepciones, solo loguea errores

---

## ❓ TROUBLESHOOTING

### Error: "column racha_maxima does not exist"
- **Solución**: Ejecuta la migración SQL en Supabase

### Racha máxima muestra 0
- **Solución**: Completa un hábito para que se actualice automáticamente

### Trigger no funciona
- **Solución**: Verifica que el trigger existe con la query de verificación

---

✅ **¡Listo! El sistema de racha máxima está implementado y funcionando.**
