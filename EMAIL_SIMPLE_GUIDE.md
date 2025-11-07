# 📧 Guía Simple - Enviar Recordatorios por Email

## 🎯 Opción 1: GMAIL SMTP (Recomendado - Más Fácil)

### Requisitos:
- Cuenta de Gmail
- Contraseña de aplicación de Google

### Pasos:

#### 1. Crear contraseña de aplicación en Gmail

1. Ve a: https://myaccount.google.com/security
2. Activa **verificación en 2 pasos** (si no la tienes)
3. Ve a: https://myaccount.google.com/apppasswords
4. Crear contraseña para "Correo" y "Windows"
5. **COPIA LA CONTRASEÑA** (16 caracteres sin espacios)

#### 2. Usar con Supabase

Ejecuta este SQL en Supabase Dashboard → SQL Editor:

\`\`\`sql
-- Función para enviar email via Gmail SMTP
CREATE OR REPLACE FUNCTION send_gmail_reminder(
    recipient_email TEXT,
    subject TEXT,
    message_body TEXT
)
RETURNS jsonb AS $$
DECLARE
    gmail_user TEXT := 'tu_email@gmail.com'; -- CAMBIAR
    gmail_password TEXT := 'tu_contraseña_app'; -- CAMBIAR (16 chars de Google)
    response net.http_response_result;
BEGIN
    -- Usar servicio SMTP2GO o similar como proxy
    SELECT * INTO response FROM net.http_post(
        url := 'https://api.smtp2go.com/v3/email/send',
        headers := jsonb_build_object(
            'Content-Type', 'application/json'
        ),
        body := jsonb_build_object(
            'api_key', 'TU_API_KEY_SMTP2GO',
            'to', jsonb_build_array(recipient_email),
            'sender', gmail_user,
            'subject', subject,
            'html_body', message_body
        )
    );
    
    RETURN jsonb_build_object(
        'status', response.status,
        'success', response.status = 200
    );
END;
$$ LANGUAGE plpgsql;
\`\`\`

---

## 🎯 Opción 2: Servicios Gratuitos (Sin configuración)

### A. **EmailJS** (Más Fácil)
- ✅ 200 emails/mes gratis
- ✅ No requiere backend
- ✅ Se integra directo en React

**Pasos:**
1. Crea cuenta en: https://www.emailjs.com/
2. Crea un servicio de email (Gmail, Outlook, etc)
3. Crea template de email
4. Obtén tus credenciales
5. Instala en tu app:

\`\`\`bash
npm install @emailjs/browser
\`\`\`

6. En tu código React:

\`\`\`typescript
import emailjs from '@emailjs/browser';

// Enviar recordatorio
emailjs.send(
  'SERVICE_ID',
  'TEMPLATE_ID', 
  {
    to_email: user.email,
    habit_name: 'Hacer ejercicio',
    message: '¡Es hora de hacer ejercicio!',
    time: '09:00'
  },
  'PUBLIC_KEY'
);
\`\`\`

### B. **SendGrid** 
- ✅ 100 emails/día gratis
- Signup: https://sendgrid.com/

### C. **Brevo** (ex-Sendinblue)
- ✅ 300 emails/día gratis  
- Signup: https://www.brevo.com/

---

## 🎯 Opción 3: Notificaciones del Navegador (SIN EMAIL)

La más simple de todas - usar Web Push Notifications:

\`\`\`typescript
// Pedir permiso
Notification.requestPermission().then(permission => {
  if (permission === 'granted') {
    // Mostrar notificación a la hora del recordatorio
    new Notification('🔔 HabitTrack', {
      body: '¡Es hora de hacer ejercicio!',
      icon: '/logo.png',
      badge: '/badge.png'
    });
  }
});
\`\`\`

---

## 🎯 Opción 4: Webhooks con Make.com o Zapier

### Make.com (Recomendado)
1. Crea cuenta en: https://www.make.com/
2. Crea un webhook
3. Conecta Gmail/Outlook
4. En Supabase, llama al webhook con pg_net

**Ventajas:**
- ✅ Completamente gratis
- ✅ Visual, sin código
- ✅ Puedes agregar más automatizaciones

---

## 📊 Comparación Rápida

| Opción | Gratis | Emails/día | Dificultad | Recomendado |
|--------|--------|------------|------------|-------------|
| EmailJS | ✅ | 200/mes | ⭐ Fácil | ✅ SÍ |
| Brevo | ✅ | 300 | ⭐⭐ Media | ✅ SÍ |
| SendGrid | ✅ | 100 | ⭐⭐ Media | ⚠️ OK |
| Make.com | ✅ | Ilimitado | ⭐ Fácil | ✅ SÍ |
| Web Push | ✅ | Ilimitado | ⭐ Muy fácil | ✅ SÍ (no email) |
| Gmail SMTP | ✅ | 500 | ⭐⭐⭐ Difícil | ⚠️ Complicado |

---

## 🚀 Recomendación

**Para empezar YA:**
1. **EmailJS** - Lo más rápido y simple
2. **Make.com** - Visual y potente
3. **Web Push Notifications** - No requiere email

**Para escalar:**
- **Brevo** - Más emails gratis (300/día)

---

## ⚡ Quick Start con EmailJS

\`\`\`bash
# 1. Instalar
npm install @emailjs/browser

# 2. Crear archivo .env
VITE_EMAILJS_SERVICE_ID=tu_service_id
VITE_EMAILJS_TEMPLATE_ID=tu_template_id
VITE_EMAILJS_PUBLIC_KEY=tu_public_key

# 3. Listo! Ver código en próximo archivo
\`\`\`

¿Cuál opción prefieres?
