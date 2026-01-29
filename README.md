# HabitTrack

Proyecto modelado siguiendo metodologías ágiles (Kanban y XP), centrado en la construcción de una aplicación moderna de seguimiento de hábitos.

## Descripción

HabitTrack es una aplicación React (Vite + TypeScript) para seguimiento de hábitos con funcionalidades avanzadas como:
- **Sistema de hábitos**: Diario, semanal y mensual con categorías y dificultades.
- **Gamificación**: Sistema de puntos (XP), niveles y logros automáticos.
- **Social**: Ranking global de usuarios (top 100).
- **Integración con Google Fit**: Sincronización automática de pasos, calorías y distancia.
- **PWA**: Instalable como app nativa con soporte para notificaciones push y uso offline.
- **Rachas**: Sistema de rachas automático con protectores de racha (tienda de protectores).
- **Recordatorios**: Notificaciones programadas vía navegador y email.

## Inicio rápido

### Requisitos Previos
- Node.js (recomendado >= 20.x) o Bun
- npm (v10+)
- Una cuenta en Supabase
- Google Cloud Project (para Google Fit API)

### Instalación

1. Clona el repositorio:
```bash
git clone https://github.com/L50E02O/HabitTrack.git
cd HabitTrack
```

2. Instala las dependencias:
```bash
npm install
```

3. Configura las variables de entorno:
Crea un archivo `.env` en la raíz (ver `.env.example` si existe):
```env
# Supabase
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key

# Google Fit API
GOOGLE_FIT_CLIENT_ID=tu-client-id.apps.googleusercontent.com
GOOGLE_FIT_CLIENT_SECRET=tu-client-secret
GOOGLE_FIT_REDIRECT_URI=http://localhost:3001/api/google-fit/callback
```

4. Inicia los servidores:
Debes ejecutar el backend y el frontend simultáneamente:
```bash
# Terminal 1: Backend API
npm run dev:api

# Terminal 2: Frontend
npm run dev
```

## Scripts disponibles

| Script | Descripción |
|--------|-------------|
| `npm run dev` | Inicia el servidor de desarrollo (Vite) |
| `npm run dev:api` | Inicia el servidor API local (Express + Bun) |
| `npm run build` | Compila la aplicación para producción |
| `npm run quality` | Ejecuta verificación completa (Lint + TypeCheck + Tests) |
| `npm test` | Ejecuta los tests con Vitest |
| `npm run lint` | Ejecuta ESLint para verificar el estilo de código |
| `npm run type-check` | Verifica los tipos de TypeScript |
| `npm run generate-icons` | Genera iconos para la PWA |

## Calidad y Estándares

El proyecto sigue estrictos estándares de calidad:
- **SonarQube / Quality Gate**: Monitoreo de bugs, vulnerabilidades y deuda técnica.
- **Testing**: Suite completa de tests unitarios e integración (Vitest).
- **CI/CD**: Workflows de GitHub Actions para validación automática en cada PR.

Antes de realizar un Pull Request, se recomienda ejecutar:
```bash
npm run quality
```
Ver [Guía de Verificación de Calidad](./docs/VERIFICACION_CALIDAD_PR.md) para más detalles.

## Integración con Google Fit

HabitTrack se integra con Google Fit API para automatizar el seguimiento de hábitos de actividad física.
- **Auth**: Usa OAuth2 para una conexión segura.
- **Datos**: Sincroniza pasos, calorías quemadas y distancia recorrida.
- **Backend**: Requiere el servidor de la carpeta `api/` o el script `dev:api` corriendo.

Consulta [GOOGLE_FIT_SETUP.md](./docs/GOOGLE_FIT_SETUP.md) para la configuración inicial.

## PWA y Notificaciones

HabitTrack es una **Progressive Web App** instalable.
- **Offline**: Cache de recursos críticos mediante Service Workers.
- **Push**: Notificaciones en tiempo real para recordatorios de hábitos.
- **Instalación**: Botón dedicado para añadir a la pantalla de inicio en móviles y escritorio.

Detalles técnicos en [PWA_SETUP.md](./docs/PWA_SETUP.md).

## Despliegue

### Vercel
El proyecto está optimizado para desplegarse en Vercel:
- **Frontend**: SPA automática.
- **Backend**: Las rutas en `/api` se convierten automáticamente en **Serverless Functions**.

Ver [Guía de Despliegue en Vercel](./docs/DEPLOY_VERCEL_BACKEND.md).

## Documentación Detallada

Toda la documentación está organizada en la carpeta `docs/`:

| Documento | Descripción |
|-----------|-------------|
| [GUIA_NOTIFICACIONES.md](./docs/GUIA_NOTIFICACIONES.md) | Arquitectura y flujo de notificaciones |
| [SISTEMA_RACHAS_AUTOMATICO.md](./docs/SISTEMA_RACHAS_AUTOMATICO.md) | Lógica de cálculo de rachas |
| [GOOGLE_FIT_INTEGRATION.md](./docs/GOOGLE_FIT_INTEGRATION.md) | Guía técnica de Google Fit |
| [ANALISIS_QUALITY_GATE.md](./docs/ANALISIS_QUALITY_GATE.md) | Estado y métricas de SonarQube |
| [REFACTORING_SUMMARY.md](./docs/REFACTORING_SUMMARY.md) | Resumen de la arquitectura de código |
| [DESARROLLO_LOCAL.md](./docs/DESARROLLO_LOCAL.md) | Guía extendida para contribuidores |

## Estructura del proyecto

```
HabitTrack/
├── api/               # Serverless Functions (Vercel)
├── docs/              # Documentación técnica
├── public/            # Archivos estáticos y PWA manifest
├── src/
│   ├── components/    # Componentes UI reutilizables
│   ├── core/          # Lógica central (hábitos, rachas, logros)
│   ├── hooks/         # Custom hooks (Google Fit, PWA)
│   ├── pages/         # Páginas de la aplicación
│   ├── services/      # Servicios de negocio y API
│   ├── types/         # Definiciones de tipos (Dominio)
│   └── utils/         # Helpers y utilidades transversales
├── scripts/          # Scripts de automatización y herramientas de dev
└── database/         # Migraciones y esquemas SQL
```

## Arquitectura

HabitTrack utiliza una arquitectura por capas:
1. **Capa de Dominio (`src/types`)**: Define las entidades y reglas de negocio.
2. **Capa de Aplicación (`src/services`)**: Contiene la lógica orquestadora.
3. **Capa de Presentación (`src/pages` / `src/components`)**: Interfaz de usuario React.
4. **Infraestructura (`src/config` / `api`)**: Conexión con Supabase y servicios externos.

## Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## Licencia

Este proyecto es privado y todos los derechos están reservados.

---
© 2026 HabitTrack - Proyecto Privado.

