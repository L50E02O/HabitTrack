# 🧪 Script de Prueba para Recordatorios

Este script te permite probar manualmente el envío de recordatorios.

## Uso

### 1. Desde PowerShell (Local)

```powershell
# Invocar la función desplegada
$headers = @{
    "Authorization" = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBhaGVnZGN5YWRubmRoYnR6YXBzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2NzU2NzgsImV4cCI6MjA3NzI1MTY3OH0.TOBPejsOHSqpOF6A4eG-9oehk-gYH1zFR_pHFVLrIq8"
    "Content-Type" = "application/json"
}

$response = Invoke-RestMethod -Uri "https://pahegdcyadnndhbtzaps.supabase.co/functions/v1/send-daily-reminders" -Method POST -Headers $headers

$response | ConvertTo-Json -Depth 5
```

### 2. Usando Supabase CLI

```powershell
# Invocar función
supabase functions invoke send-daily-reminders --method POST

# Ver logs en tiempo real
supabase functions logs send-daily-reminders --tail

# Ver últimos 50 logs
supabase functions logs send-daily-reminders --limit 50
```

### 3. Usando cURL (Git Bash o WSL)

```bash
curl -X POST \
  https://pahegdcyadnndhbtzaps.supabase.co/functions/v1/send-daily-reminders \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json"
```

## Crear Recordatorio de Prueba

Ejecuta esto en SQL Editor de Supabase:

```sql
-- Insertar recordatorio para la hora actual + 2 minutos
INSERT INTO recordatorio (id_perfil, id_habito, mensaje, activo, intervalo_recordar)
SELECT 
    p.id,
    h.id_habito,
    '¡Es hora de ' || h.nombre_habito || '! 🚀',
    true,
    TO_CHAR(NOW() + INTERVAL '2 minutes', 'HH24:MI:00')
FROM perfil p
CROSS JOIN habito h
WHERE p.email = 'tu_email@example.com'  -- Reemplaza con tu email
LIMIT 1;

-- Ver recordatorios creados
SELECT 
    r.*,
    p.email,
    h.nombre_habito
FROM recordatorio r
JOIN perfil p ON r.id_perfil = p.id
JOIN habito h ON r.id_habito = h.id_habito
WHERE r.activo = true
ORDER BY r.intervalo_recordar;
```

## Verificar Estado del Cron

```sql
-- Ver jobs programados
SELECT * FROM cron.job;

-- Ver ejecuciones recientes
SELECT 
    jobid,
    job_name,
    status,
    return_message,
    start_time,
    end_time
FROM cron.job_run_details
ORDER BY start_time DESC
LIMIT 10;

-- Forzar ejecución manual
SELECT invoke_send_reminders();
```

## Respuestas Esperadas

### ✅ Éxito (con recordatorios)
```json
{
  "message": "Proceso completado",
  "time": "14:30",
  "total": 2,
  "sent": 2,
  "failed": 0,
  "results": [
    {
      "id": "uuid-123",
      "success": true,
      "emailId": "re_abc123"
    }
  ]
}
```

### ⚠️ Sin recordatorios
```json
{
  "message": "No hay recordatorios para esta hora",
  "time": "14:30",
  "sent": 0
}
```

### ❌ Error
```json
{
  "error": "RESEND_API_KEY no está configurada"
}
```

## Troubleshooting

### Email no llega

1. Verifica en Resend Dashboard → Logs
2. Revisa carpeta spam/correo no deseado
3. Verifica que el email en `perfil` sea correcto:
   ```sql
   SELECT email FROM perfil WHERE id = 'tu_user_id';
   ```

### Función no se ejecuta

```powershell
# Ver logs detallados
supabase functions logs send-daily-reminders --limit 100
```

### Ver variables de entorno

```powershell
supabase secrets list
```
