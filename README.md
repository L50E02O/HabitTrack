# HabitTrack
Proyecto modelado siguiendo metodologías ágiles (Kanban y XP).

## Descripción
HabitTrack es una aplicación React (Vite + TypeScript) para seguimiento de hábitos. Este README explica cómo instalar, configurar y ejecutar el proyecto en un entorno de desarrollo local, así como las dependencias principales usadas.

## Requisitos previos
- Node.js (recomendado >= 18)
- npm (v8+ normalmente instalada con Node)
- Una cuenta en Supabase si vas a usar la integración con Supabase

Nota: en Windows usa PowerShell (el proyecto se probó desde PowerShell en este equipo).

## Instalación
1. Clona el repositorio:

```powershell
git clone https://github.com/L50E02O/HabitTrack.git
cd HabitTrack
```

2. Instala las dependencias:

```powershell
npm install
```

Si necesitas instalar paquetes adicionales mencionados durante el desarrollo, aquí están los comandos que se usaron en este proyecto:

```powershell
# Dependencias de runtime
npm install react-router-dom @supabase/supabase-js

# Dependencias de desarrollo / testing
npm install --save-dev vitest @testing-library/react @testing-library/jest-dom
```

## Scripts útiles
Los scripts definidos en `package.json` en este proyecto son:

- `npm run dev` — arranca el servidor de desarrollo (Vite).
- `npm run build` — compila la app (TypeScript + Vite build).
- `npm run preview` — sirve la build para probarla localmente.
- `npm run lint` — lanza ESLint (según configuración del repo).

Ejecutar en PowerShell:

```powershell
npm run dev
```

Para ejecutar pruebas con Vitest (no hay script `test` por defecto en `package.json`), puedes usar:

```powershell
npx vitest
# o para ejecutar en modo watch
npx vitest --watch
```

## Variables de entorno (Supabase)
Si usas Supabase en el cliente, Vite requiere que las variables de entorno públicas empiecen con `VITE_`. Crea un archivo `.env` en la raíz del proyecto con al menos:

```text
VITE_SUPABASE_URL=https://tu-supabase-url.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key
```

No comites estas claves al repositorio. Para producción usa secretos o variables del entorno del proveedor de hosting.

## Dependencias principales detectadas
Basado en `package.json`, estas son las dependencias y devDependencies relevantes del proyecto:

- Dependencias (runtime):
	- react ^19.1.1
	- react-dom ^19.1.1
	- react-router-dom ^7.9.5
	- @supabase/supabase-js ^2.78.0

- DevDependencies (testing, build, lint):
	- vite ^7.1.7
	- typescript ~5.9.3
	- vitest ^4.0.5
	- @testing-library/react ^16.3.0
	- @testing-library/jest-dom ^6.9.1
	- eslint, @vitejs/plugin-react, plugins y tipos para TS/React

Si agregaste paquetes durante tu sesión local (por ejemplo con `npm install`), ya deberían aparecer en `package.json` y en `node_modules`.

## Notas rápidas y buenas prácticas
- Usa variables con prefijo `VITE_` para exponer las que necesite el cliente.
- Para producción, protege tus claves (usa server-side functions o variables de entorno en el hosting).
- Añade un script `test` en `package.json` si prefieres ejecutar pruebas con `npm test`. Por ejemplo:

```json
"scripts": {
	"test": "vitest"
}
```

## Cómo contribuir
- Sigue las normas de estilo del proyecto (ESLint configurado).
- Abre issues o pull requests en GitHub y describe claramente los cambios.

## Recursos
- Vite: https://vitejs.dev/
- React Router: https://reactrouter.com/
- Supabase JS: https://supabase.com/docs/reference/javascript
- Vitest: https://vitest.dev/

---

Si quieres, puedo añadir un script de `test` al `package.json`, crear ejemplos de configuración `.env.example` o añadir instrucciones para desplegar en Netlify/Vercel. ¿Qué prefieres que haga ahora?

