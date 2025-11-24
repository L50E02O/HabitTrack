# HabitTrack

Proyecto modelado siguiendo metodologías ágiles (Kanban y XP).

## 📖 Descripción

HabitTrack es una aplicación React (Vite + TypeScript) para seguimiento de hábitos con funcionalidades avanzadas como:
- Sistema de puntos y logros
- Ranking de usuarios
- PWA con notificaciones push
- Sistema de protectores de racha
- Recordatorios programados

## 🚀 Inicio Rápido

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

## 📚 Scripts Disponibles

- `npm run dev` - Servidor de desarrollo (Vite)
- `npm run build` - Compila la aplicación
- `npm run preview` - Previsualiza la build
- `npm test` - Ejecuta los tests
- `npm run lint` - Ejecuta ESLint
- `npm run dev:api` - Servidor API local (requiere variables de entorno)
- `npm run generate-icons` - Genera iconos PWA

## 🧪 Testing

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

## 📋 Documentación

Toda la documentación está en la carpeta `docs/`:

- **[docs/README.md](./docs/README.md)** - Índice de documentación
- **[docs/PWA_SETUP.md](./docs/PWA_SETUP.md)** - Configuración PWA y notificaciones
- **[docs/RANKING_FIX.md](./docs/RANKING_FIX.md)** - Sistema de ranking
- **[docs/TESTS_README.md](./docs/TESTS_README.md)** - Guía completa de testing
- **[docs/BACKEND_VERIFICATION.md](./docs/BACKEND_VERIFICATION.md)** - Verificación del backend

## 🛠️ Tecnologías

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

## 📁 Estructura del Proyecto

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

## ✅ Funcionalidades

- ✅ Sistema de hábitos con categorías y dificultades
- ✅ Sistema de puntos y logros automáticos
- ✅ Ranking de usuarios (máximo 100)
- ✅ PWA instalable con notificaciones
- ✅ Sistema de protectores de racha
- ✅ Recordatorios programados
- ✅ Tema oscuro/claro
- ✅ Responsive design

## 🔒 Seguridad

- Variables de entorno para credenciales
- RLS (Row Level Security) en Supabase
- Validación de datos en frontend y backend

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📝 Licencia

Este proyecto es privado.

## 🔗 Recursos

- [Vite](https://vitejs.dev/)
- [React Router](https://reactrouter.com/)
- [Supabase](https://supabase.com/)
- [Vitest](https://vitest.dev/)
- [PWA Guide](https://web.dev/progressive-web-apps/)

---

Para más información, consulta la [documentación completa](./docs/README.md).
