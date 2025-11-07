# 📧 Sistema de Recordatorios Automáticos - HabitTrack

## 🎯 ¿Qué hemos creado?

Un sistema completo que envía **recordatorios automáticos por email** a los usuarios para sus hábitos, usando:
- ✅ **Supabase Edge Functions** (backend serverless)
- ✅ **Resend API** (envío de emails profesionales)
- ✅ **pg_cron** (tareas programadas)
- ✅ **React Components** (gestión frontend)

---

## 📁 Archivos Creados

### **Backend (Supabase)**
```
supabase/
├── functions/
│   └── send-daily-reminders/
│       ├── index.ts           ← Edge Function principal (envío de emails)
│       └── deno.json          ← Configuración Deno
├── migrations/
│   ├── 20250106_improve_recordatorio_table.sql  ← Mejoras DB
│   └── 20250106_setup_reminders_cron.sql        ← Configuración cron
└── .gitignore
```

### **Frontend (React)**
```
src/
├── core/components/Recordatorio/
│   ├── RecordatorioConfig.tsx     ← Crear recordatorio (ya existía)
│   ├── RecordatorioList.tsx       ← ✨ NUEVO: Listar/editar/eliminar
│   └── RecordatorioList.css       ← Estilos del listado
└── services/recordatorio/
    └── recordatorioService.ts     ← Funciones mejoradas
```

### **Documentación**
```
├── RECORDATORIOS_SETUP.md    ← Guía completa de configuración
└── TEST_REMINDERS.md         ← Scripts de prueba
```

---

## 🚀 Cómo Funciona

### **Flujo Completo**

1. **Usuario crea recordatorio** (desde dashboard → hábito → ⋮ → Recordatorio)
   - Selecciona hora: 09:00
   - Escribe mensaje: "¡Es hora de hacer ejercicio!"
   - Activa recordatorio ✅

2. **Se guarda en base de datos** (tabla `recordatorio`)
   ```sql
   {
     id_perfil: "uuid-user",
     id_habito: "uuid-habit",
     mensaje: "¡Es hora de hacer ejercicio!",
     activo: true,
     intervalo_recordar: "09:00:00"
   }
   ```

3. **Cron job ejecuta cada minuto** (pg_cron)
   - Busca recordatorios activos para la hora actual
   - Invoca la Edge Function

4. **Edge Function procesa** (`send-daily-reminders`)
   - Consulta Supabase: recordatorios activos
   - Por cada recordatorio:
     - Obtiene email del usuario desde tabla `perfil`
     - Genera HTML bonito del email
     - Envía via Resend API

5. **Usuario recibe email** 📬
   - Subject: "🔔 Recordatorio: Hacer ejercicio"
   - Body: Template HTML profesional y responsive

---

## ⚙️ Configuración Requerida

### **1. Instalar Supabase CLI**
```powershell
scoop install supabase
```

### **2. Conectar Proyecto**
```powershell
cd "C:\Users\jvice\Downloads\HabitTrack-master\HabitTrack-master"
supabase login
supabase link --project-ref pahegdcyadnndhbtzaps
```

### **3. Crear Cuenta Resend**
- Ir a [resend.com](https://resend.com)
- Crear cuenta (gratis: 100 emails/día)
- Obtener API Key

### **4. Configurar Secret en Supabase**
```powershell
supabase secrets set RESEND_API_KEY=re_tu_api_key_aqui
```

### **5. Desplegar Edge Function**
```powershell
supabase functions deploy send-daily-reminders
```

### **6. Ejecutar Migraciones SQL**
```powershell
supabase db push
```

### **7. Activar pg_cron**
- Dashboard Supabase → Database → Extensions
- Buscar "pg_cron" → Enable

### **8. Crear Cron Job**
Ejecutar en SQL Editor:
```sql
-- Contenido de: supabase/migrations/20250106_setup_reminders_cron.sql
```

---

## 🧪 Probar el Sistema

### **Crear recordatorio de prueba**
```sql
INSERT INTO recordatorio (id_perfil, id_habito, mensaje, activo, intervalo_recordar)
SELECT 
    p.id,
    h.id_habito,
    '¡Prueba de recordatorio! 🚀',
    true,
    TO_CHAR(NOW() + INTERVAL '2 minutes', 'HH24:MI:00')
FROM perfil p
CROSS JOIN habito h
WHERE p.email = 'tu_email@gmail.com'
LIMIT 1;
```

### **Invocar manualmente**
```powershell
supabase functions invoke send-daily-reminders --method POST
```

### **Ver logs**
```powershell
supabase functions logs send-daily-reminders --tail
```

---

## 📊 Funcionalidades del Frontend

### **RecordatorioList Component**

Usuario puede:
- ✅ Ver todos sus recordatorios
- ✅ Activar/desactivar recordatorios (toggle)
- ✅ Editar mensaje y hora
- ✅ Eliminar recordatorios
- ✅ Ver estado activo/inactivo
- ✅ Identificar hábito asociado

**Para usarlo en dashboard:**
```tsx
import RecordatorioList from '../core/components/Recordatorio/RecordatorioList';

// Dentro del componente:
<RecordatorioList />
```

---

## 💰 Costos

### **Resend**
- Gratis: 100 emails/día, 3,000/mes
- Pro: $20/mes → 50,000 emails/mes

### **Supabase**
- Gratis: 500,000 invocaciones/mes de Edge Functions
- Pro: $25/mes (más recursos)

**Estimación:** 
- 50 usuarios × 2 recordatorios/día = 100 emails/día
- **Plan gratuito suficiente** ✅

---

## 🛠️ Personalización

### **Cambiar template del email**
Editar función `generateEmailHTML()` en:
```
supabase/functions/send-daily-reminders/index.ts
```

### **Cambiar frecuencia del cron**
Modificar en SQL:
```sql
-- Actual: cada minuto
'* * * * *'

-- Cada 5 minutos
'*/5 * * * *'

-- Cada hora
'0 * * * *'
```

### **Cambiar remitente**
```typescript
from: 'HabitTrack <recordatorios@tudominio.com>',
```

---

## 📝 Próximos Pasos

### **Después de configurar:**

1. ✅ Agregar `RecordatorioList` al dashboard
2. ✅ Configurar dominio personalizado en Resend
3. ✅ Crear templates múltiples (motivacional, urgente, etc.)
4. ✅ Agregar estadísticas (emails enviados, abiertos)
5. ✅ Implementar notificaciones push (Firebase)

### **Mejoras opcionales:**

- 📊 Dashboard de estadísticas de emails
- 🎨 Templates A/B testing
- 🔔 Notificaciones en app (además de email)
- 📅 Recordatorios smart (basados en rachas)
- 🌍 Soporte multi-idioma

---

## 🆘 Troubleshooting

### **"RESEND_API_KEY no configurada"**
```powershell
supabase secrets set RESEND_API_KEY=re_tu_key
supabase functions deploy send-daily-reminders
```

### **Emails no llegan**
1. Verificar dominio en Resend
2. Revisar spam
3. Ver logs: `supabase functions logs send-daily-reminders`
4. Verificar email en tabla `perfil`

### **Cron no se ejecuta**
```sql
-- Ver estado
SELECT * FROM cron.job;

-- Ver ejecuciones
SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 5;

-- Re-crear
SELECT cron.unschedule('send-daily-reminders');
-- Ejecutar de nuevo el script de creación
```

---

## 📚 Documentación Completa

- **Setup:** `RECORDATORIOS_SETUP.md` (guía paso a paso)
- **Testing:** `TEST_REMINDERS.md` (scripts de prueba)
- **Edge Function:** `supabase/functions/send-daily-reminders/index.ts`
- **SQL Migrations:** `supabase/migrations/`

---

## ✅ Checklist de Implementación

- [ ] Cuenta Resend creada
- [ ] API Key obtenida
- [ ] Supabase CLI instalado
- [ ] Proyecto linkeado
- [ ] Secret configurado
- [ ] Edge Function desplegada
- [ ] pg_cron activado
- [ ] Migraciones ejecutadas
- [ ] Cron job creado
- [ ] Prueba exitosa

---

¡Sistema completo y listo para usar! 🎉
