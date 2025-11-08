# 🚀 Configuración SendGrid - Guía Paso a Paso

## ✅ Paso 1: Crear Cuenta en SendGrid (2 min)

1. Ve a [https://signup.sendgrid.com/](https://signup.sendgrid.com/)
2. Regístrate con tu email: **jvicenteontaneda110@gmail.com**
3. Completa el formulario:
   - First Name: Tu nombre
   - Last Name: Tu apellido
   - Company: HabitTrack (o el nombre de tu app)
   - Website: Deja en blanco o pon algo temporal
4. Verifica tu email (revisa inbox/spam)

---

## ✅ Paso 2: Verificar Single Sender (5 min)

SendGrid requiere que verifiques tu email antes de enviar:

1. Una vez dentro del dashboard, ve a **Settings** → **Sender Authentication**
2. Click en **"Verify a Single Sender"**
3. Completa el formulario:
   ```
   From Name: HabitTrack
   From Email Address: jvicenteontaneda110@gmail.com
   Reply To: jvicenteontaneda110@gmail.com
   Company: HabitTrack
   Address: Tu dirección
   City: Tu ciudad
   Country: Perú (o tu país)
   ```
4. Click en **"Create"**
5. **Revisa tu email** y haz clic en el enlace de verificación
6. ✅ Verás un mensaje de confirmación

---

## ✅ Paso 3: Crear API Key (2 min)

1. En el dashboard, ve a **Settings** → **API Keys**
2. Click en **"Create API Key"**
3. Configuración:
   - **API Key Name**: `HabitTrack-Production`
   - **API Key Permissions**: Selecciona **"Full Access"**
4. Click en **"Create & View"**
5. **⚠️ COPIA LA API KEY COMPLETA** (se muestra solo una vez)
   ```
   SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```
6. Guárdala en un lugar seguro (la necesitarás en el siguiente paso)

---

## ✅ Paso 4: Configurar en Supabase (3 min)

Ahora vamos a agregar la API Key a Supabase:

### Opción A: Usando Supabase CLI

```bash
# 1. Abrir terminal en tu proyecto
cd tu-proyecto

# 2. Configurar la API Key de SendGrid
supabase secrets set SENDGRID_API_KEY="SG.tu_api_key_aqui"

# 3. Configurar tu email de remitente
supabase secrets set SENDGRID_FROM_EMAIL="jvicenteontaneda110@gmail.com"
```

### Opción B: Usando Supabase Dashboard

1. Ve a tu proyecto en [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. En el menú lateral, ve a **Settings** → **Edge Functions**
3. Busca la sección **"Secrets"**
4. Agrega dos secretos:
   - **Name**: `SENDGRID_API_KEY`
   - **Value**: `SG.tu_api_key_completa_aqui`
   
   - **Name**: `SENDGRID_FROM_EMAIL`  
   - **Value**: `jvicenteontaneda110@gmail.com`

---

## ✅ Paso 5: Desplegar la Función Actualizada (2 min)

```bash
# 1. Navegar a la carpeta de funciones
cd supabase/functions

# 2. Desplegar la función con los cambios
supabase functions deploy send-daily-reminders

# 3. Verificar que se desplegó correctamente
# Deberías ver: ✅ Function deployed successfully
```

---

## ✅ Paso 6: Probar el Envío (3 min)

### Prueba Manual

1. Ve a tu app HabitTrack
2. Crea un hábito de prueba
3. Configura un recordatorio para **dentro de 1 minuto**
4. Espera 1 minuto
5. **Revisa tu email** (o el del destinatario)

### Verificar en SendGrid Dashboard

1. Ve a **Activity Feed** en SendGrid
2. Verás todos los emails enviados con su estado:
   - ✅ **Delivered** - Entregado correctamente
   - ⏳ **Processed** - En proceso
   - ❌ **Dropped/Bounced** - Email no válido

---

## 📊 Límites de SendGrid (Plan Gratuito)

| Característica | Límite |
|----------------|--------|
| Emails por día | 100 |
| Emails por mes | ~3,000 |
| Destinatarios únicos | Ilimitados |
| Remitentes verificados | 1 |
| Costo | **$0 / mes** |

---

## 🎯 Ventajas de SendGrid

✅ **Gratis** - 100 emails/día sin costo
✅ **Sin dominio** - Usa tu email de Gmail
✅ **Confiable** - 99% de entregabilidad
✅ **Dashboard** - Ve estadísticas de tus emails
✅ **Fácil** - Setup en menos de 15 minutos

---

## 🚨 Troubleshooting

### Problema 1: "Sender not verified"

**Solución:**
1. Ve a **Settings** → **Sender Authentication**
2. Verifica que tu email tenga el check verde ✅
3. Si no, revisa tu inbox/spam por el email de verificación

### Problema 2: API Key no funciona

**Solución:**
1. Verifica que copiaste la API Key completa (empieza con `SG.`)
2. Asegúrate de que tiene **Full Access** permissions
3. Crea una nueva API Key si es necesario

### Problema 3: Emails no llegan

**Revisa:**
1. ✅ Email de remitente verificado en SendGrid
2. ✅ API Key configurada correctamente en Supabase
3. ✅ Función desplegada con éxito
4. ✅ Revisar carpeta de spam del destinatario
5. ✅ Ver **Activity Feed** en SendGrid para ver el estado

### Problema 4: Error 403 Forbidden

**Causa:** API Key inválida o sin permisos
**Solución:** Crea una nueva API Key con Full Access

---

## ✅ Checklist de Verificación

- [ ] Cuenta SendGrid creada
- [ ] Email verificado como Single Sender
- [ ] API Key creada y copiada
- [ ] API Key configurada en Supabase (`SENDGRID_API_KEY`)
- [ ] Email configurado en Supabase (`SENDGRID_FROM_EMAIL`)
- [ ] Función desplegada
- [ ] Email de prueba enviado exitosamente

---

## 🎉 ¡Listo!

Ahora tu app puede enviar emails:
- ✅ Desde tu email: `jvicenteontaneda110@gmail.com`
- ✅ A cualquier destinatario
- ✅ Hasta **100 emails por día** gratis
- ✅ Sin necesidad de dominio propio

---

## 📈 Próximos Pasos (Opcional)

Cuando necesites más emails:

| Plan | Emails/mes | Costo |
|------|-----------|-------|
| **Gratuito** | 100/día | $0 |
| Essentials | 50,000 | $15/mes |
| Pro | 100,000 | $60/mes |

Por ahora, el plan gratuito es más que suficiente para desarrollo y pruebas! 🚀
