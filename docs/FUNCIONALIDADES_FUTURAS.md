# Funcionalidades Futuras - HabitTrack

Este documento describe las funcionalidades planificadas para implementar en futuras versiones de HabitTrack. Cada funcionalidad incluye una descripción, requisitos técnicos y un checklist de tareas.

---

## 1. Notificaciones Push cuando la App está Cerrada

### Descripción

Implementar notificaciones push que funcionen incluso cuando la aplicación está completamente cerrada. Esto requiere usar Web Push API con VAPID keys y un sistema de cron jobs en Supabase que verifique recordatorios periódicamente y envíe notificaciones push a través de Edge Functions.

### Objetivos

- Notificaciones push funcionando con la app cerrada
- Sistema de cron jobs en Supabase para verificar recordatorios
- Edge Function para enviar notificaciones push
- Suscripciones push almacenadas en base de datos
- Manejo de errores y reintentos

### Requisitos Técnicos

- VAPID keys (claves públicas y privadas)
- Tabla `push_subscriptions` en Supabase
- Edge Function para enviar notificaciones push
- Cron job en Supabase (pg_cron)
- Web Push API en el frontend
- Service Worker actualizado

### Checklist de Tareas

#### Fase 1: Configuración de VAPID Keys
- [ ] Generar VAPID keys usando `web-push` npm package
- [ ] Guardar VAPID public key en variables de entorno del frontend
- [ ] Guardar VAPID private key en Supabase Secrets
- [ ] Documentar proceso de generación de keys

#### Fase 2: Base de Datos
- [ ] Crear tabla `push_subscriptions` en Supabase
  - `id` (uuid, primary key)
  - `id_perfil` (uuid, foreign key a perfil)
  - `endpoint` (text, URL del push service)
  - `keys` (jsonb, auth y p256dh keys)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)
- [ ] Crear índices para optimizar búsquedas
- [ ] Configurar RLS (Row Level Security) para la tabla
- [ ] Crear función para limpiar suscripciones expiradas

#### Fase 3: Frontend - Suscripción Push
- [ ] Crear servicio para suscribirse a push notifications
- [ ] Solicitar permiso de notificaciones (si no está otorgado)
- [ ] Obtener Service Worker registration
- [ ] Suscribirse usando `pushManager.subscribe()`
- [ ] Guardar suscripción en Supabase
- [ ] Manejar errores de suscripción
- [ ] Implementar renovación de suscripción cuando expire

#### Fase 4: Edge Function - Enviar Push
- [ ] Crear Edge Function `send-push-notification` en Supabase
- [ ] Instalar dependencia `web-push` en Edge Function
- [ ] Configurar VAPID details en Edge Function
- [ ] Implementar función para enviar notificación a una suscripción
- [ ] Manejar errores (suscripción expirada, rechazada, etc.)
- [ ] Implementar logging de notificaciones enviadas

#### Fase 5: Cron Job - Verificar Recordatorios
- [ ] Crear función SQL `verificar_recordatorios_activos()`
  - Consultar recordatorios activos
  - Filtrar por hora actual
  - Obtener suscripciones push de usuarios
- [ ] Crear función SQL `enviar_notificaciones_push()`
  - Llamar a Edge Function para cada suscripción
  - Manejar errores
  - Registrar intentos de envío
- [ ] Configurar cron job en Supabase:
  - Ejecutar cada minuto: `* * * * *`
  - Llamar a `enviar_notificaciones_push()`
- [ ] Crear tabla de logs de notificaciones (opcional, para debugging)

#### Fase 6: Service Worker - Recibir Push
- [ ] Actualizar `public/sw.js` para manejar eventos `push`
- [ ] Implementar `self.addEventListener('push', ...)`
- [ ] Mostrar notificación cuando llegue push event
- [ ] Manejar clic en notificación (abrir app)
- [ ] Implementar acciones rápidas en notificaciones (opcional)

#### Fase 7: Testing y Optimización
- [ ] Probar notificaciones con app abierta
- [ ] Probar notificaciones con app en background
- [ ] Probar notificaciones con app completamente cerrada
- [ ] Verificar que no se envíen duplicados
- [ ] Optimizar queries del cron job
- [ ] Implementar rate limiting si es necesario
- [ ] Monitorear uso de recursos de Supabase

#### Fase 8: Documentación
- [ ] Actualizar `docs/GUIA_NOTIFICACIONES.md`
- [ ] Documentar proceso de configuración de VAPID keys
- [ ] Documentar troubleshooting común
- [ ] Crear guía para usuarios sobre cómo habilitar notificaciones

### Recursos Necesarios

- Supabase Pro (para cron jobs, si no está incluido en plan actual)
- Tiempo estimado: 2-3 semanas

### Referencias

- [Web Push Protocol](https://web.dev/push-notifications-overview/)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Supabase pg_cron](https://supabase.com/docs/guides/database/extensions/pg_cron)

---

## 2. Conexión con API de Reloj (Zona Horaria Ecuador)

### Descripción

Conectar la aplicación con una API de reloj que proporcione la hora actual de Ecuador (zona horaria UTC-5). Esto permitirá sincronizar recordatorios y verificaciones de rachas con la hora local de Ecuador, independientemente de dónde se encuentre el usuario.

### Objetivos

- Obtener hora actual de Ecuador desde API externa
- Sincronizar recordatorios con hora de Ecuador
- Mostrar hora de Ecuador en la interfaz (opcional)
- Manejar cambios de horario (horario de verano, si aplica)
- Fallback a hora local si la API falla

### Requisitos Técnicos

- API de reloj/zona horaria (WorldTimeAPI, TimeZoneDB, o similar)
- Servicio en frontend para consultar hora de Ecuador
- Actualización periódica de la hora
- Manejo de errores y fallbacks
- Caché de la hora para evitar requests excesivos

### Checklist de Tareas

#### Fase 1: Investigación de APIs
- [ ] Investigar APIs disponibles de zona horaria
  - WorldTimeAPI (gratuita)
  - TimeZoneDB (gratuita con límites)
  - Google Time Zone API (requiere API key)
  - Otras opciones
- [ ] Comparar límites de rate, costo, y confiabilidad
- [ ] Seleccionar API más adecuada
- [ ] Obtener API key si es necesario

#### Fase 2: Servicio de Hora Ecuador
- [ ] Crear servicio `horaEcuadorService.ts` en `src/services/`
- [ ] Implementar función para obtener hora actual de Ecuador
- [ ] Implementar caché de hora (actualizar cada X minutos)
- [ ] Implementar fallback a hora local si API falla
- [ ] Manejar errores de red y timeouts
- [ ] Implementar retry logic para requests fallidos

#### Fase 3: Integración con Recordatorios
- [ ] Modificar `notificacionService.ts` para usar hora de Ecuador
- [ ] Actualizar función `debeActivarseRecordatorio()` para comparar con hora de Ecuador
- [ ] Actualizar función `programarNotificacionesDiarias()` para usar hora de Ecuador
- [ ] Probar que recordatorios se activen a la hora correcta de Ecuador

#### Fase 4: Integración con Sistema de Rachas
- [ ] Revisar `autoProgressService.ts` y funciones relacionadas
- [ ] Actualizar verificaciones de períodos (día, semana, mes) para usar hora de Ecuador
- [ ] Asegurar que cambios de día/semana/mes se basen en hora de Ecuador
- [ ] Probar que rachas se actualicen correctamente según hora de Ecuador

#### Fase 5: UI (Opcional)
- [ ] Agregar indicador de hora de Ecuador en dashboard
- [ ] Mostrar diferencia de hora entre local y Ecuador (si aplica)
- [ ] Agregar configuración para mostrar/ocultar hora de Ecuador

#### Fase 6: Testing
- [ ] Probar con usuario en zona horaria diferente a Ecuador
- [ ] Probar cambio de día según hora de Ecuador
- [ ] Probar recordatorios a diferentes horas
- [ ] Probar cuando API de reloj falla (fallback)
- [ ] Probar con cambios de horario (si aplica en Ecuador)

#### Fase 7: Optimización
- [ ] Optimizar frecuencia de requests a API
- [ ] Implementar caché más inteligente
- [ ] Reducir requests innecesarios
- [ ] Monitorear uso de API y costos

### Recursos Necesarios

- API key de servicio de zona horaria (puede ser gratuita)
- Tiempo estimado: 1-2 semanas

### Referencias

- [WorldTimeAPI](https://worldtimeapi.org/)
- [TimeZoneDB](https://timezonedb.com/)
- [Google Time Zone API](https://developers.google.com/maps/documentation/timezone)

---

## 4. Calendario Acorde a la Fecha Actual

### Descripción

Implementar un componente de calendario que muestre el mes actual y permita a los usuarios ver su progreso de hábitos día por día. El calendario debe resaltar días con hábitos completados, días con rachas activas, y permitir navegación entre meses.

### Objetivos

- Mostrar calendario del mes actual
- Resaltar días con hábitos completados
- Mostrar rachas activas visualmente
- Navegación entre meses (anterior/siguiente)
- Vista de detalles al hacer clic en un día
- Integración con sistema de rachas existente

### Requisitos Técnicos

- Componente de calendario (puede usar librería o construir custom)
- Consultas a Supabase para obtener registros por fecha
- Cálculo de días con hábitos completados
- Visualización de rachas en el calendario
- Responsive design para móvil y desktop

### Checklist de Tareas

#### Fase 1: Diseño y Planificación
- [ ] Diseñar UI del calendario (mockups)
- [ ] Definir qué información mostrar en cada día
- [ ] Decidir si usar librería (react-calendar, date-fns) o construir custom
- [ ] Definir esquema de colores para diferentes estados (completado, racha, sin actividad)

#### Fase 2: Servicio de Datos
- [ ] Crear servicio `calendarioService.ts` en `src/services/`
- [ ] Implementar función para obtener registros de hábitos por rango de fechas
- [ ] Implementar función para obtener días con hábitos completados
- [ ] Implementar función para obtener rachas activas por fecha
- [ ] Optimizar queries para evitar N+1 queries
- [ ] Implementar caché de datos del calendario

#### Fase 3: Componente de Calendario
- [ ] Crear componente `Calendario.tsx` en `src/core/components/`
- [ ] Implementar vista de mes con días
- [ ] Implementar navegación entre meses (anterior/siguiente)
- [ ] Mostrar nombre del mes y año
- [ ] Resaltar día actual
- [ ] Resaltar días con hábitos completados
- [ ] Mostrar indicadores visuales de rachas activas
- [ ] Implementar hover states y tooltips

#### Fase 4: Vista de Detalles del Día
- [ ] Crear componente `DetalleDia.tsx` o modal
- [ ] Mostrar hábitos completados en ese día
- [ ] Mostrar hábitos no completados
- [ ] Mostrar progreso de cada hábito
- [ ] Permitir marcar hábitos como completados desde el detalle
- [ ] Mostrar racha actual en ese momento

#### Fase 5: Integración con Dashboard
- [ ] Agregar componente de calendario al dashboard
- [ ] Sincronizar selección de día con vista de hábitos
- [ ] Actualizar calendario cuando se completa un hábito
- [ ] Actualizar calendario cuando cambia el mes

#### Fase 6: Responsive Design
- [ ] Asegurar que calendario se vea bien en móvil
- [ ] Asegurar que calendario se vea bien en tablet
- [ ] Asegurar que calendario se vea bien en desktop
- [ ] Optimizar para pantallas pequeñas (ocultar información no esencial)

#### Fase 7: Funcionalidades Avanzadas (Opcional)
- [ ] Vista de semana
- [ ] Vista de año (overview)
- [ ] Filtros por hábito en el calendario
- [ ] Exportar calendario (iCal, Google Calendar)
- [ ] Estadísticas mensuales en el calendario

#### Fase 8: Testing
- [ ] Probar navegación entre meses
- [ ] Probar resaltado de días completados
- [ ] Probar visualización de rachas
- [ ] Probar vista de detalles del día
- [ ] Probar en diferentes dispositivos
- [ ] Probar con diferentes zonas horarias

### Recursos Necesarios

- Librería de calendario (opcional, puede ser gratuita)
- Tiempo estimado: 2-3 semanas

### Referencias

- [react-calendar](https://github.com/wojtekmaj/react-calendar)
- [date-fns](https://date-fns.org/)
- [Day.js](https://day.js.org/)

---

## 5. Chatbot para Recomendar Hábitos (API Gemini)

### Descripción

Implementar un chatbot inteligente que use la API de Google Gemini para recomendar hábitos personalizados a los usuarios basándose en sus objetivos, historial de hábitos, y preferencias. El chatbot debe poder mantener conversaciones naturales y proporcionar sugerencias contextuales.

### Objetivos

- Chatbot conversacional usando API Gemini
- Recomendaciones personalizadas de hábitos
- Análisis del historial del usuario para sugerencias
- Interfaz de chat amigable
- Integración con creación de hábitos desde el chatbot

### Requisitos Técnicos

- API key de Google Gemini
- Edge Function en Supabase para llamar a Gemini API (seguridad)
- Frontend: componente de chat
- Sistema de prompts para Gemini
- Almacenamiento de historial de conversaciones (opcional)
- Manejo de rate limits y errores de API

### Checklist de Tareas

#### Fase 1: Configuración de Gemini API
- [ ] Crear cuenta en Google AI Studio
- [ ] Obtener API key de Gemini
- [ ] Guardar API key en Supabase Secrets
- [ ] Probar conexión con Gemini API
- [ ] Investigar límites de rate y costos
- [ ] Documentar proceso de obtención de API key

#### Fase 2: Edge Function - Backend
- [ ] Crear Edge Function `chatbot-gemini` en Supabase
- [ ] Instalar dependencia para llamar a Gemini API
- [ ] Implementar función para enviar mensaje a Gemini
- [ ] Implementar sistema de prompts:
  - Prompt inicial para contexto del chatbot
  - Prompt para análisis de historial de usuario
  - Prompt para recomendaciones de hábitos
- [ ] Implementar manejo de contexto de conversación
- [ ] Implementar rate limiting
- [ ] Implementar logging de conversaciones (opcional, para mejorar prompts)

#### Fase 3: Servicio Frontend
- [ ] Crear servicio `chatbotService.ts` en `src/services/`
- [ ] Implementar función para enviar mensaje al chatbot
- [ ] Implementar función para recibir respuesta
- [ ] Implementar manejo de errores
- [ ] Implementar sistema de mensajes (enviados/recibidos)

#### Fase 4: Componente de Chat
- [ ] Crear componente `Chatbot.tsx` en `src/core/components/`
- [ ] Diseñar UI del chat (burbujas de mensajes)
- [ ] Implementar input de texto
- [ ] Implementar envío de mensajes
- [ ] Implementar recepción y visualización de respuestas
- [ ] Implementar indicador de "escribiendo..."
- [ ] Implementar scroll automático a último mensaje
- [ ] Implementar botón para cerrar/abrir chat

#### Fase 5: Integración con Datos del Usuario
- [ ] Obtener historial de hábitos del usuario
- [ ] Obtener hábitos actuales del usuario
- [ ] Obtener rachas y logros del usuario
- [ ] Enviar contexto del usuario a Gemini en cada mensaje
- [ ] Formatear datos del usuario para que Gemini los entienda

#### Fase 6: Recomendaciones de Hábitos
- [ ] Implementar análisis de respuesta de Gemini para extraer sugerencias
- [ ] Crear componente para mostrar hábitos sugeridos
- [ ] Permitir crear hábito directamente desde sugerencia del chatbot
- [ ] Mostrar preview del hábito antes de crearlo
- [ ] Integrar con formulario de creación de hábitos existente

#### Fase 7: Mejoras de UX
- [ ] Agregar mensajes de bienvenida
- [ ] Agregar sugerencias rápidas (quick replies)
- [ ] Agregar ejemplos de preguntas que el usuario puede hacer
- [ ] Implementar historial de conversación (localStorage o BD)
- [ ] Agregar animaciones suaves
- [ ] Mejorar diseño responsive

#### Fase 8: Optimización y Testing
- [ ] Optimizar prompts para respuestas más relevantes
- [ ] Implementar caché de respuestas comunes (opcional)
- [ ] Probar con diferentes tipos de preguntas
- [ ] Probar recomendaciones de hábitos
- [ ] Probar creación de hábitos desde chatbot
- [ ] Monitorear uso de API y costos
- [ ] Ajustar rate limiting si es necesario

#### Fase 9: Seguridad y Privacidad
- [ ] Asegurar que API key no se exponga en frontend
- [ ] Validar inputs del usuario antes de enviar a Gemini
- [ ] Implementar sanitización de respuestas de Gemini
- [ ] Revisar qué datos se envían a Gemini (privacidad)
- [ ] Documentar política de privacidad del chatbot

### Recursos Necesarios

- API key de Google Gemini (puede tener tier gratuito)
- Supabase Edge Functions (incluido en plan)
- Tiempo estimado: 3-4 semanas

### Referencias

- [Google Gemini API](https://ai.google.dev/)
- [Gemini API Documentation](https://ai.google.dev/docs)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)

---

## Priorización Sugerida

1. **Notificaciones Push cuando App está Cerrada** (Alta prioridad)
   - Mejora significativa la experiencia de usuario
   - Relativamente rápido de implementar
   - Alto impacto

2. **Calendario Acorde a la Fecha Actual** (Media-Alta prioridad)
   - Visualización clara del progreso
   - Mejora engagement del usuario
   - Complejidad media

3. **Conexión con API de Reloj (Ecuador)** (Media prioridad)
   - Específico para caso de uso de Ecuador
   - Relativamente simple
   - Impacto medio

4. **Chatbot para Recomendar Hábitos** (Media-Baja prioridad)
   - Funcionalidad avanzada
   - Requiere más tiempo y recursos
   - Alto valor pero complejidad alta


---

## Notas Generales

- Todas las funcionalidades deben mantener la arquitectura actual del proyecto
- Reutilizar servicios y componentes existentes cuando sea posible
- Seguir las convenciones de código establecidas
- Actualizar documentación conforme se implementen funcionalidades
- Considerar impacto en performance y costos de Supabase
- Testing exhaustivo antes de lanzar cada funcionalidad

---

**Última actualización:** 18/12/25

