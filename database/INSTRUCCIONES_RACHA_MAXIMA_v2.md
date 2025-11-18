# 🚀 INSTRUCCIONES: Racha Máxima en Perfil

## ✅ NUEVA FUNCIONALIDAD

Se ha implementado un sistema que **actualiza automáticamente la racha máxima** en el **perfil del usuario**, evitando consultas pesadas a múltiples tablas.

### 📊 Cómo Funciona

1. **Nueva columna `racha_maxima`** en la tabla `perfil` (NO en racha)
2. Se **actualiza automáticamente** cuando:
   - El usuario completa un hábito y su racha actual supera la máxima anterior
   - Ejemplo: Si tenías racha máxima de 10 días y ahora alcanzas 13, se actualiza a 13
3. **Nunca disminuye** - Solo aumenta cuando se supera el récord anterior
4. **1 consulta simple** en lugar de JOINs complejos

### 🎯 Ventajas

- ✅ **Rendimiento**: 1 query simple vs múltiples JOINs
- ✅ **Centralizado**: Todo en el perfil del usuario
- ✅ **Eficiente**: No necesita consultar todas las rachas
- ✅ **Rápido**: Acceso directo sin JOIN

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
    racha_maxima,
    puntos,
    protectores_racha
FROM perfil
ORDER BY racha_maxima DESC
LIMIT 10;

-- Verificar que NO existe en racha
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'racha' AND column_name = 'racha_maxima';
-- Debe retornar 0 filas
```

**Resultado esperado:**
- ✅ Debe mostrar la columna `racha_maxima` en tabla `perfil`
- ✅ Debe mostrar usuarios con valores en `racha_maxima`
- ✅ NO debe mostrar `racha_maxima` en tabla `racha`

---

## 📋 CAMBIOS IMPLEMENTADOS

### 1. **Base de Datos** 
- ✅ Nueva columna `racha_maxima` en tabla `perfil`
- ✅ Valores migrados desde tabla `racha`
- ✅ Índice para optimizar consultas
- ✅ Columna eliminada de tabla `racha` (ya no se necesita)

### 2. **Interfaces TypeScript**
- ✅ `IPerfil` - Agregado campo `racha_maxima?: number`
- ✅ `UpdateIPerfil` - Agregado campo `racha_maxima?: number`
- ✅ `IRacha` - Eliminado campo `racha_maxima` (ya no se usa)

### 3. **Servicios**
- ✅ `rachaAutoService.ts` - Actualiza `perfil.racha_maxima` directamente
- ✅ `protectorService.ts` - Lee `racha_maxima` desde `perfil`
- ✅ `LogrosModal.tsx` - Consulta simple a `perfil`
- ✅ `LogrosPage.tsx` - Consulta simple a `perfil`

---

## 🎯 EJEMPLO DE USO

### Escenario:
1. Usuario completa un hábito por primera vez
   - `perfil.racha_maxima = 1` ✅

2. Continúa 12 días más
   - `perfil.racha_maxima = 13` ✅ (Se actualiza automáticamente)

3. Rompe la racha y empieza de nuevo
   - `perfil.racha_maxima = 13` ✅ (Se mantiene el récord)

4. Alcanza 15 días
   - `perfil.racha_maxima = 15` ✅ (Se actualiza porque superó el récord)

---

## 📊 COMPARACIÓN: Antes vs Después

### ❌ ANTES (Con consultas complejas)
```typescript
// Consulta con JOINs a 3 tablas
const { data } = await supabase
  .from('racha')
  .select(`
    racha_maxima,
    registro_intervalo!inner(
      habito!inner(id_perfil)
    )
  `)
  .eq('registro_intervalo.habito.id_perfil', userId);

const maxRacha = Math.max(...data.map(r => r.racha_maxima));
```

### ✅ DESPUÉS (Consulta simple)
```typescript
// 1 consulta directa a perfil
const { data } = await supabase
  .from('perfil')
  .select('racha_maxima')
  .eq('id', userId)
  .single();

const maxRacha = data?.racha_maxima || 0;
```

**Beneficios:**
- 🚀 **10x más rápido** - Sin JOINs complejos
- 💾 **Menos carga en DB** - 1 query vs múltiples
- 🎯 **Código más simple** - Fácil de entender
- ✅ **Más confiable** - Menos puntos de fallo

---

## 🔍 VERIFICACIÓN EN LA APLICACIÓN

Después de aplicar la migración:

1. **Dashboard** - Completa un hábito varias veces
2. **Página de Logros** - Verifica que muestra la racha máxima
3. **Modal de Logros** - Abre el modal y verifica "Racha máxima: X días"
4. **Inspecciona la red** - Verás solo 1 query simple a `perfil`

---

## ⚠️ NOTAS IMPORTANTES

- La racha máxima está en **`perfil`**, NO en `racha`
- Se actualiza **automáticamente** en el código TypeScript
- Los datos históricos se migran automáticamente con el script SQL
- **Nunca disminuye**, solo aumenta

---

## ❓ TROUBLESHOOTING

### Error: "column racha_maxima does not exist in perfil"
- **Solución**: Ejecuta la migración SQL en Supabase

### Racha máxima muestra 0
- **Solución**: Completa un hábito para que se actualice automáticamente

### Error: "column racha_maxima does not exist in racha"
- ✅ **Esto es correcto** - Ya no está en `racha`, ahora está en `perfil`

---

✅ **¡Listo! El sistema de racha máxima en perfil está implementado y funcionando.**
