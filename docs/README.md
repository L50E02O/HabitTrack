# HabitTrack - Documentación

Proyecto modelado siguiendo metodologías ágiles (Kanban y XP).

## 📚 Documentación Disponible

- **[README Principal](../README.md)** - Instalación y configuración básica
- **[PWA_SETUP.md](./PWA_SETUP.md)** - Configuración de PWA y notificaciones
- **[RANKING_FIX.md](./RANKING_FIX.md)** - Corrección del sistema de ranking
- **[TESTS_README.md](./TESTS_README.md)** - Guía completa de testing
- **[RACHA_TESTING_GUIDE.md](./RACHA_TESTING_GUIDE.md)** - Guía de testing de rachas
- **[SISTEMA_RACHAS_AUTOMATICO.md](./SISTEMA_RACHAS_AUTOMATICO.md)** - Sistema automático de rachas
- **[BACKEND_VERIFICATION.md](./BACKEND_VERIFICATION.md)** - Verificación del backend con Supabase

## 🚀 Inicio Rápido

```bash
# Instalar dependencias
npm install

# Desarrollo
npm run dev

# Tests
npm test

# Build
npm run build
```

## 📋 Características Principales

- ✅ Sistema de seguimiento de hábitos
- ✅ Sistema de puntos y logros
- ✅ Ranking de usuarios
- ✅ PWA con notificaciones push
- ✅ Sistema de protectores de racha
- ✅ Recordatorios programados

## 🧪 Testing

El proyecto incluye tests completos para:
- Servicios de ranking
- Servicios de notificaciones (PWA)
- Servicios de PWA
- Componentes React
- Lógica de negocio

Ver [TESTS_README.md](./TESTS_README.md) para más detalles.

## 🔧 Configuración

### Variables de Entorno

Crea un archivo `.env` en la raíz:

```env
VITE_SUPABASE_URL=https://tu-supabase-url.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key
```

## 📖 Más Información

Consulta la documentación específica en cada archivo MD de esta carpeta.
