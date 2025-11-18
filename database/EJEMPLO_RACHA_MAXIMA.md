# 📊 EJEMPLO: Cómo Funciona la Racha Máxima

## 🎯 Caso de Uso Real

Imagina que Juan tiene un hábito "Hacer ejercicio diario":

---

### 📅 **Semana 1-2 (Días 1-13)**

Juan es constante y completa el hábito 13 días seguidos:

```
Día 1:  ✅ Completado  → dias_consecutivos: 1  | racha_maxima: 1
Día 2:  ✅ Completado  → dias_consecutivos: 2  | racha_maxima: 2
Día 3:  ✅ Completado  → dias_consecutivos: 3  | racha_maxima: 3
...
Día 10: ✅ Completado  → dias_consecutivos: 10 | racha_maxima: 10
Día 11: ✅ Completado  → dias_consecutivos: 11 | racha_maxima: 11
Día 12: ✅ Completado  → dias_consecutivos: 12 | racha_maxima: 12
Día 13: ✅ Completado  → dias_consecutivos: 13 | racha_maxima: 13 🏆
```

**Récord actual: 13 días 🔥**

---

### ⚠️ **Día 14-15 (Rompe la racha)**

Juan se enferma y no hace ejercicio:

```
Día 14: ❌ No completado → Racha se rompe
Día 15: ❌ No completado
```

**Estado actual:**
- `dias_consecutivos: 0` (racha rota)
- `racha_maxima: 13` ✅ (SE MANTIENE EL RÉCORD)

---

### 🔄 **Semana 3 (Días 16-22)**

Juan se recupera y empieza de nuevo:

```
Día 16: ✅ Completado  → dias_consecutivos: 1  | racha_maxima: 13 (no cambia)
Día 17: ✅ Completado  → dias_consecutivos: 2  | racha_maxima: 13 (no cambia)
Día 18: ✅ Completado  → dias_consecutivos: 3  | racha_maxima: 13 (no cambia)
...
Día 22: ✅ Completado  → dias_consecutivos: 7  | racha_maxima: 13 (no cambia)
```

**Estado actual:**
- `dias_consecutivos: 7` (nueva racha)
- `racha_maxima: 13` ✅ (récord anterior se mantiene)

---

### 🚀 **Semana 4-5 (Días 23-30)**

Juan se supera y alcanza 15 días:

```
Día 23: ✅ Completado  → dias_consecutivos: 8  | racha_maxima: 13
Día 24: ✅ Completado  → dias_consecutivos: 9  | racha_maxima: 13
Día 25: ✅ Completado  → dias_consecutivos: 10 | racha_maxima: 13
Día 26: ✅ Completado  → dias_consecutivos: 11 | racha_maxima: 13
Día 27: ✅ Completado  → dias_consecutivos: 12 | racha_maxima: 13
Día 28: ✅ Completado  → dias_consecutivos: 13 | racha_maxima: 13 (empata)
Día 29: ✅ Completado  → dias_consecutivos: 14 | racha_maxima: 14 🆕 NUEVO RÉCORD!
Día 30: ✅ Completado  → dias_consecutivos: 15 | racha_maxima: 15 🏆 NUEVO RÉCORD!
```

**Nuevo récord: 15 días 🎉**

---

## 🎮 Visualización en la App

### Dashboard
```
┌─────────────────────────────────┐
│  💪 Hacer Ejercicio             │
│                                 │
│  Racha actual: 15 días 🔥       │
│  Récord personal: 15 días 🏆    │
└─────────────────────────────────┘
```

### Página de Logros
```
┌─────────────────────────────────┐
│  🏆 Mis Logros                  │
│                                 │
│  🔥 Racha máxima: 15 días       │
│                                 │
│  ✅ Primer Paso (1 día)         │
│  ✅ En Marcha (3 días)          │
│  ✅ Compromiso (7 días)         │
│  ✅ Dedicación (10 días)        │
│  ✅ Disciplinado (15 días)      │
│  🔒 Imparable (25 días)         │
└─────────────────────────────────┘
```

---

## 💻 Cómo se Actualiza en el Código

### 1. **Función centralizada: `actualizarRachaMaximaEnPerfil`**
```typescript
/**
 * Actualiza la racha máxima en el perfil del usuario
 * Se llama automáticamente cuando se crea o extiende una racha
 */
export async function actualizarRachaMaximaEnPerfil(
  idPerfil: string,
  rachaActual: number
): Promise<void> {
  // 1. Obtener racha_maxima actual del perfil
  const { data } = await supabase
    .from('perfil')
    .select('racha_maxima')
    .eq('id', idPerfil)
    .single();

  const rachaMaximaPerfil = data?.racha_maxima || 0;

  // 2. Solo actualizar si la racha actual supera el récord
  if (rachaActual > rachaMaximaPerfil) {
    await supabase
      .from('perfil')
      .update({ racha_maxima: rachaActual })
      .eq('id', idPerfil);
    
    console.log(`🏆 Nuevo récord: ${rachaMaximaPerfil} → ${rachaActual} días`);
  }
}
```

### 2. **Al crear nueva racha** (`crearNuevaRacha`)
```typescript
async function crearNuevaRacha(...) {
  const periodosLimitados = Math.min(periodosConsecutivos, 365);

  // 🏆 Actualizar racha máxima en el perfil
  await actualizarRachaMaximaEnPerfil(idPerfil, periodosLimitados);

  // Luego crear la racha en la tabla racha...
}
```

**Ejemplo:**
- Nueva racha: 5 días
- Racha máxima anterior en perfil: 13 días
- ✅ **NO se actualiza** (5 < 13)

### 3. **Al extender racha existente** (`extenderRacha`)
```typescript
async function extenderRacha(...) {
  const periodosLimitados = Math.min(periodosConsecutivos, 365);

  // 🏆 Actualizar racha máxima en el perfil
  await actualizarRachaMaximaEnPerfil(idPerfil, periodosLimitados);

  // Luego actualizar la racha...
}
```

**Ejemplo:**
- Racha actual: 14 días
- Racha máxima anterior en perfil: 13 días
- ✅ **Se actualiza a 14** (14 > 13)

### 4. **Llamadas automáticas**

La función se ejecuta automáticamente en:
- ✅ `updateRachaOnHabitCompletion()` → Cuando completas un hábito
- ✅ `crearNuevaRacha()` → Cuando empiezas una nueva racha
- ✅ `extenderRacha()` → Cuando continúas una racha existente

**NO necesitas llamarla manualmente** - todo es automático 🎉

---

## 📊 Comparación: Antes vs Después

### ❌ ANTES (Sin racha_maxima)
```
Usuario alcanza 20 días → Se rompe la racha
Estado: dias_consecutivos = 0
Problema: ❌ Se pierde el récord de 20 días
```

### ✅ DESPUÉS (Con racha_maxima)
```
Usuario alcanza 20 días → Se rompe la racha
Estado: 
  - dias_consecutivos = 0 (racha actual)
  - racha_maxima = 20 ✅ (récord guardado)
  
Ventajas:
  ✅ El récord nunca se pierde
  ✅ Motivación para superar el récord anterior
  ✅ Logros se desbloquean según el récord
  ✅ Protectores se calculan según el récord
```

---

## 🎯 Beneficios

1. **Motivación** - Ver tu mejor marca te motiva a superarla
2. **Progreso visible** - Puedes ver cuánto has mejorado
3. **Logros justos** - No pierdes logros desbloqueados
4. **Estadísticas precisas** - Rankings muestran el mejor desempeño
5. **Gamificación** - Competir contra tu mejor versión

---

✅ **¡Ahora entiendes cómo funciona el sistema de racha máxima!**
