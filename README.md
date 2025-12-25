# HabitTrack

Proyecto modelado siguiendo metodologías ágiles (Kanban y XP), centrado en la construcción de una aplicación moderna de seguimiento de hábitos.

## Descripción

HabitTrack es una aplicación React (Vite + TypeScript) para seguimiento de hábitos con funcionalidades avanzadas como:
- Sistema de puntos y logros
- Ranking de usuarios
- PWA con notificaciones push
- Sistema de protectores de racha
- Recordatorios programados

## Inicio rápido

### Requisitos Previos
- Node.js (recomendado >= 18)
- npm (v8+)
- Una cuenta en Supabase

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
Crea un archivo `.env` en la raíz:
```env
VITE_SUPABASE_URL=https://tu-supabase-url.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key
```

4. Inicia el servidor de desarrollo:
```bash
npm run dev
```

## Scripts disponibles

- `npm run dev` - Servidor de desarrollo (Vite)
- `npm run build` - Compila la aplicación
- `npm run preview` - Previsualiza la build
- `npm test` - Ejecuta los tests
- `npm run lint` - Ejecuta ESLint
- `npm run dev:api` - Servidor API local (requiere variables de entorno)
- `npm run generate-icons` - Genera iconos PWA

## Testing

El proyecto incluye tests completos con Vitest:

```bash
# Ejecutar todos los tests
npm test

# Modo watch
npm test -- --watch

# Con cobertura
npm test -- --coverage
```

Ver [docs/TESTS_README.md](./docs/TESTS_README.md) para más detalles.

## PWA en HabitTrack (explicación resumida)

HabitTrack funciona como una **PWA (Progressive Web App)**, es decir, se puede **instalar como app** en el móvil o en el ordenador y seguir funcionando aunque cierres la pestaña del navegador.

- **Archivos clave**
  - `public/manifest.json`: describe el nombre, iconos y colores de la app (lo que ve el sistema operativo al instalarla).
  - `public/sw.js`: Service Worker que permite cache básico y manejo de notificaciones en segundo plano.
  - `src/utils/initPWA.ts`: inicializa la PWA (revisa Service Worker, manifest y permisos de notificación).
  - `src/components/InstallPWAButton.tsx`: muestra el botón de “Instalar App” cuando el navegador lo permite.
  - `src/components/PermisosNotificacion.tsx` y `src/core/components/Recordatorio/RecordatorioConfig.tsx`: gestionan los permisos y la creación de recordatorios con notificaciones.

- **Cómo se instala la app**
  1. Levanta el proyecto (`npm run dev`) o abre la versión desplegada.
  2. Abre HabitTrack en un navegador compatible (Chrome, Edge, Safari).
  3. Verás un botón de **“Instalar App”** en la interfaz (componente `InstallPWAButton`).
  4. Al aceptar, HabitTrack se añade al dispositivo como si fuera una app nativa (icono en escritorio o pantalla de inicio).

- **Cómo funcionan las notificaciones y recordatorios**
  - El usuario puede crear recordatorios desde el dashboard; se guardan en la tabla `recordatorio` de Supabase.
  - El código de `notificacionService` y el Service Worker revisan cada minuto qué recordatorios tocan y disparan:
    - una **notificación del navegador** (PWA), y
    - opcionalmente un **email** usando una Edge Function de Supabase.
  - El banner `PermisosNotificacion` y la pantalla de configuración de recordatorios piden el permiso de notificaciones solo cuando es necesario.

Para una explicación más completa y técnica puedes ver `docs/PWA_SETUP.md`.

## Documentación

Toda la documentación está en la carpeta `docs/`:

- `docs/BACKEND_VERIFICATION.md` - Verificación del backend y modelo de datos
- `docs/PWA_SETUP.md` - Configuración PWA y comportamiento de instalación/offline
- `docs/GUIA_NOTIFICACIONES.md` - Arquitectura de notificaciones y flujo actual
- `docs/PROBAR_NOTIFICACIONES.md` - Guía práctica para probar notificaciones
- `docs/SISTEMA_RACHAS_AUTOMATICO.md` - Lógica del sistema de rachas automático
- `docs/RACHA_TESTING_GUIDE.md` - Guía de testing específico de rachas
- `docs/TESTS_README.md` - Guía completa de testing del proyecto
- `docs/REFACTORING_SUMMARY.md` - Resumen de refactorización y organización del código
- `docs/FUNCIONALIDADES_FUTURAS.md` - Roadmap y planificación de funcionalidades futuras

## Tecnologías

### Dependencias Principales
- **React** ^19.1.1
- **React Router** ^7.9.5
- **Supabase** ^2.78.0
- **Lucide React** ^0.552.0

### DevDependencies
- **Vite** ^7.1.7
- **TypeScript** ~5.9.3
- **Vitest** ^4.0.5
- **Testing Library** ^16.3.0
- **Vite PWA Plugin** ^1.1.0

## Estructura del proyecto

```
HabitTrack/
├── docs/              # Documentación
├── public/            # Archivos estáticos (PWA)
├── src/
│   ├── config/       # Configuración (Supabase)
│   ├── core/         # Componentes y lógica core
│   ├── pages/        # Páginas de la aplicación
│   ├── services/     # Servicios y lógica de negocio
│   ├── types/        # Tipos TypeScript
│   └── utils/        # Utilidades (PWA, etc.)
├── scripts/          # Scripts de utilidad
└── database/         # Migraciones SQL
```

## Funcionalidades principales

- Sistema de hábitos con categorías y dificultades
- Sistema de puntos y logros automáticos
- Ranking de usuarios (máximo 100)
- PWA instalable con notificaciones
- Sistema de protectores de racha
- Recordatorios programados
- Tema oscuro/claro
- Diseño responsive

## Seguridad

- Variables de entorno para credenciales
- RLS (Row Level Security) en Supabase
- Validación de datos en frontend y backend

## Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## Licencia

Este proyecto es privado.

## Recursos

- [Vite](https://vitejs.dev/)
- [React Router](https://reactrouter.com/)
- [Supabase](https://supabase.com/)
- [Vitest](https://vitest.dev/)
- [PWA Guide](https://web.dev/progressive-web-apps/)

---

Para más información, consulta la [documentación completa](./docs/README.md).

## Arquitectura general

HabitTrack está organizado en capas claras:

- `src/core`: componentes y lógica central reutilizable (hábitos, rachas, protectores, logros, recordatorios).
- `src/pages`: páginas de la aplicación (dashboard, ranking, configuración, etc.).
- `src/services`: servicios que encapsulan la lógica de negocio (ranking, rachas, notificaciones, protectores, logros, etc.).
- `src/config`: configuración de Supabase y otros servicios externos.
- `src/utils`: utilidades transversales (PWA, helpers de tiempo, inicialización de notificaciones, etc.).

La persistencia de datos se realiza en Supabase (PostgreSQL) con políticas RLS para garantizar la seguridad, y el frontend se comunica directamente con Supabase o, en algunos casos, mediante funciones Edge.

## Flujo principal de la aplicación

1. El usuario inicia sesión y accede al dashboard.
2. Desde el dashboard puede:
   - Crear y gestionar hábitos (diarios, semanales, mensuales).
   - Configurar recordatorios con notificaciones.
   - Ver su racha actual y sus protectores.
   - Consultar sus logros y progreso.
3. El sistema actualiza automáticamente las rachas según el progreso registrado (ver `docs/SISTEMA_RACHAS_AUTOMATICO.md`).
4. El sistema de notificaciones programa recordatorios y, según la configuración, dispara notificaciones en el navegador y correos electrónicos (ver `docs/GUIA_NOTIFICACIONES.md` y `docs/PROBAR_NOTIFICACIONES.md`).
5. El ranking global muestra la posición del usuario frente al resto de perfiles (ver `docs/BACKEND_VERIFICATION.md` para el modelo de datos y políticas RLS necesarias).

## Calidad y pruebas

El proyecto cuenta con una batería de tests (unitarios, de integración y de componentes) escritos con Vitest y Testing Library, que cubren:

- Servicios de negocio clave (ranking, rachas, protectores, logros, notificaciones).
- Componentes de interfaz críticos (tienda de protectores, modales de logros, paneles de notificaciones).

Para detalles completos y estrategias de testing, revisar `docs/TESTS_README.md` y `docs/RACHA_TESTING_GUIDE.md`.
