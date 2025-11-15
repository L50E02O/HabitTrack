# 🔥 Guía de Testing del Sistema de Rachas - CORREGIDO

## ✅ Cambios Realizados

Se corrigieron **bugs críticos** en el sistema de rachas para hábitos semanales y mensuales:

### Bugs Corregidos:
1. ✅ **`calcularPeriodosConsecutivos()`** ahora cuenta períodos CONSECUTIVOS (no totales)
2. ✅ **`seRompioLaRachaConProteccion()`** ahora verifica correctamente si se saltó un período
3. ✅ La lógica funciona igual de bien para diarios, semanales y mensuales

---

## 📊 Lógica Correcta - Hábitos SEMANALES

### Ejemplo 1: Racha exitosa ✅
```
Semana 46 (Nov 11-17): Completas 3/3 veces → Racha: 1 semana 🔥
Semana 47 (Nov 18-24): Completas 3/3 veces → Racha: 2 semanas 🔥
Semana 48 (Nov 25-Dic 1): Completas 3/3 veces → Racha: 3 semanas 🔥
```

### Ejemplo 2: Racha rota ❌
```
Semana 46: Completas 3/3 → Racha: 1 semana 🔥
Semana 47: NO completas (solo 2/3) ❌
Semana 48: Completas 3/3 → Racha: 1 semana (reseteo)
```

### Ejemplo 3: Con protector 🛡️
```
Semana 46: Completas 3/3 → Racha: 5 semanas 🔥
Semana 47: NO completas ❌
Semana 48: Completas 3/3 → Protector usado → Racha: 6 semanas 🛡️
```

### Verificación de tiempo:
- ✅ **Se permite**: Estar en la misma semana O la siguiente
- ❌ **Se rompe**: Saltar MÁS de 1 semana (ej: Semana 1 → Semana 3+)

---

## 📊 Lógica Correcta - Hábitos MENSUALES

### Ejemplo 1: Racha exitosa ✅
```
Octubre 2025: Completas 5/5 veces → Racha: 1 mes 🔥
Noviembre 2025: Completas 5/5 veces → Racha: 2 meses 🔥
Diciembre 2025: Completas 5/5 veces → Racha: 3 meses 🔥
```

### Ejemplo 2: Racha rota ❌
```
Octubre: Completas 5/5 → Racha: 1 mes 🔥
Noviembre: NO completas (solo 3/5) ❌
Diciembre: Completas 5/5 → Racha: 1 mes (reseteo)
```

### Verificación de tiempo:
- ✅ **Se permite**: Estar en el mismo mes O el siguiente
- ❌ **Se rompe**: Saltar MÁS de 1 mes (ej: Enero → Marzo+)

---

## 🧪 Escenarios de Prueba

### Test 1: Hábito Semanal - Racha Consecutiva
```
1. Crea hábito semanal (meta: 3 veces/semana)
2. Semana 1: Haz 3 clicks → Racha: 1 ✅
3. Semana 2: Haz 3 clicks → Racha: 2 ✅
4. Semana 3: Haz 3 clicks → Racha: 3 ✅

ESPERADO: Racha aumenta cada semana
```

### Test 2: Hábito Semanal - Saltar Semana
```
1. Crea hábito semanal (meta: 2 veces/semana)
2. Semana 1: Haz 2 clicks → Racha: 1 ✅
3. Semana 2: NO hagas nada ❌
4. Semana 3: Haz 2 clicks → Racha: 1 (reseteo) ✅

ESPERADO: Racha se resetea
```

### Test 3: Hábito Mensual - Racha Consecutiva
```
1. Crea hábito mensual (meta: 5 veces/mes)
2. Octubre: Haz 5 clicks → Racha: 1 mes ✅
3. Noviembre: Haz 5 clicks → Racha: 2 meses ✅
4. Diciembre: Haz 5 clicks → Racha: 3 meses ✅

ESPERADO: Racha aumenta cada mes
```

### Test 4: Hábito Mensual - Saltar Mes
```
1. Crea hábito mensual (meta: 4 veces/mes)
2. Octubre: Haz 4 clicks → Racha: 1 mes ✅
3. Noviembre: Solo 2 clicks ❌
4. Diciembre: Haz 4 clicks → Racha: 1 mes (reseteo) ✅

ESPERADO: Racha se resetea
```

### Test 5: Protector Automático (Semanal)
```
1. Asigna protectores manualmente en BD:
   UPDATE racha SET protectores_asignados = 2 WHERE id_habito = 'xxx';
2. Semana 1: Completa meta → Racha: 3 semanas
3. Semana 2: NO completes
4. Semana 3: Completa meta
5. ESPERADO: Mensaje "🛡️ Protector usado" y racha salvada
```

---

## 🔍 Debugging

### Ver logs en consola del navegador (F12):
```javascript
📊 Total de registros para hábito abc: 12
✅ Semanas completadas: 2024-W46, 2024-W47
📈 Semanas consecutivas calculadas: 2
🔍 Verificación de tiempo: semana anterior 2024-W46, actual 2024-W47
✅ Diferencia de semanas: 1 (no se rompió)
```

### Consultas SQL útiles:

**Ver registros por semana:**
```sql
SELECT 
  DATE_TRUNC('week', fecha) as semana,
  COUNT(*) as registros,
  id_habito
FROM registro_intervalo
WHERE id_habito = 'tu-id-aqui'
GROUP BY semana, id_habito
ORDER BY semana DESC;
```

**Ver rachas activas:**
```sql
SELECT 
  r.id_racha,
  r.dias_consecutivos,
  r.inicio_racha,
  r.fin_racha,
  r.protectores_asignados,
  h.nombre as habito_nombre,
  h.intervalo_meta
FROM racha r
JOIN registro_intervalo ri ON r.id_registro_intervalo = ri.id_registro
JOIN habito h ON ri.id_habito = h.id_habito
WHERE r.racha_activa = true;
```

---

## 📝 Notas Importantes

1. **Semanas vs Días**: Para semanales, importa la SEMANA calendario, no 7 días exactos
2. **Meses vs Días**: Para mensuales, importa el MES calendario, no 30/31 días exactos
3. **Meta de Repetición**: Debe cumplirse COMPLETAMENTE para que cuente el período
4. **Protectores**: Se usan automáticamente al detectar una racha rota
5. **Consecutividad**: Solo cuenta hacia atrás desde HOY, no períodos aleatorios

---

## 🚀 Cómo Iniciar la App

```powershell
cd 'C:\Users\derli\Documents\modelado\HabitTrack'
npm run dev
```

Abre http://localhost:5173 y comienza a probar 🔥
