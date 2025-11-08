# 🚀 INSTRUCCIONES PARA EJECUTAR MIGRACIÓN DE PROTECTORES

## ⚠️ PROBLEMA ACTUAL
Tu aplicación está intentando usar funciones y tablas que NO existen en Supabase:
- ❌ Función `puede_comprar_protector` (404 Not Found)
- ❌ Tabla `compra_protector` (404 Not Found)

## ✅ SOLUCIÓN

### PASO 1: Abrir Supabase SQL Editor
1. Ve a [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Selecciona tu proyecto **HabitTrack**
3. En el menú lateral, haz clic en **SQL Editor**
4. Haz clic en **New Query**

### PASO 2: Ejecutar la Migración
1. Abre el archivo: `database/migrations/protectores_sistema_completo.sql`
2. **COPIA TODO EL CONTENIDO** del archivo (desde línea 1 hasta línea 131)
3. **PEGA** el contenido en el editor SQL de Supabase
4. Haz clic en **RUN** (botón verde)

### PASO 3: Verificar que Funcionó
Ejecuta esta query en el SQL Editor para verificar:

```sql
-- Verificar tablas creadas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('compra_protector', 'uso_protector');

-- Verificar funciones creadas
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN ('puede_comprar_protector', 'calcular_protectores_por_racha');
```

**Resultado esperado:**
- Debe mostrar 2 tablas: `compra_protector` y `uso_protector`
- Debe mostrar 2 funciones: `puede_comprar_protector` y `calcular_protectores_por_racha`

### PASO 4: Recargar la Aplicación
1. Vuelve a tu aplicación en el navegador
2. Recarga la página (F5 o Ctrl+R)
3. Los errores 404 deberían desaparecer

## 📝 ¿QUÉ CREA ESTA MIGRACIÓN?

### Tablas:
1. **`compra_protector`**: Registra cada compra de protector con puntos
   - Incluye límite de 1 compra por semana
   - Costo: 250 puntos por protector

2. **`uso_protector`**: Registra cuándo se usa un protector para salvar una racha
   - Guarda qué hábito fue protegido
   - Guarda cuántos días de racha tenía

### Funciones:
1. **`puede_comprar_protector(user_id)`**: Verifica si el usuario puede comprar esta semana
2. **`calcular_protectores_por_racha(dias_racha)`**: Calcula protectores ganados (1 cada 7 días)

### Vista:
- **`estadisticas_protectores`**: Muestra estadísticas completas de protectores por usuario

## 🔧 SOLUCIÓN ALTERNATIVA (Si siguen los errores)

Si después de ejecutar la migración sigues viendo errores, es posible que la función RPC no esté expuesta correctamente. En ese caso, el código ya tiene un **fallback automático** que consulta directamente la tabla.

Para verificar que el fallback funciona, ejecuta esto en Supabase SQL Editor:

```sql
-- Verificar que la tabla tiene los permisos correctos
GRANT SELECT ON compra_protector TO authenticated;
GRANT INSERT ON compra_protector TO authenticated;
GRANT SELECT ON uso_protector TO authenticated;
GRANT INSERT ON uso_protector TO authenticated;
```

## ❓ ¿NECESITAS AYUDA?
Si después de ejecutar la migración sigues viendo errores, revisa:
1. ¿Se ejecutó la migración sin errores en Supabase?
2. ¿Las tablas y funciones aparecen en la verificación?
3. ¿Recargaste la página después de ejecutar la migración?
