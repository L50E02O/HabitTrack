# Guía: Verificación de Calidad antes del PR

## 🎯 Problema

Tu PR no pasó la puerta de calidad y necesitas identificar qué archivos fallaron.

## ✅ Solución Rápida

### Opción 1: Script Automático (Recomendado)

Ejecuta el script de verificación de calidad:

```bash
npm run quality
```

Este script ejecuta:
1. ✅ **ESLint** - Verifica estilo de código
2. ✅ **TypeScript** - Verifica tipos
3. ✅ **Tests** - Ejecuta la suite de pruebas

### Opción 2: Verificaciones Manuales

#### 1. Verificar Linting:

```bash
npm run lint
```

Si hay errores, puedes intentar corregirlos automáticamente:

```bash
npm run lint:fix
```

#### 2. Verificar Tipos de TypeScript:

```bash
npm run type-check
```

Esto mostrará todos los errores de tipos sin compilar.

#### 3. Ejecutar Tests:

```bash
npm test
```

O en modo CI (sin watch):

```bash
npm run test:ci
```

---

## 🔍 Identificar Archivos con Problemas

### Errores de ESLint

Si ESLint falla, verás algo como:

```
✖ 3 problems (2 errors, 1 warning)
  src/pages/dashboard.tsx
    15:5  error  'variable' is assigned a value but never used
    20:3  error  Missing return type on function
```

**Solución:**
- Revisa los archivos mencionados
- Ejecuta `npm run lint:fix` para corregir automáticamente algunos errores
- Corrige manualmente los que no se pueden auto-corregir

### Errores de TypeScript

Si TypeScript falla, verás algo como:

```
src/services/habito/habitoService.ts:45:7 - error TS2322: Type 'string' is not assignable to type 'number'.
```

**Solución:**
- Revisa el archivo y la línea mencionada
- Corrige el tipo o la asignación

### Tests Fallidos

Si los tests fallan, verás algo como:

```
FAIL  src/services/ranking/rankingService.test.ts
  ✖ obtenerRankingCompleto > debería retornar ranking ordenado por puntos
    Expected: 100
    Received: 50
```

**Solución:**
- Revisa el test y el código relacionado
- Asegúrate de que la lógica sea correcta

---

## 🚀 Workflow Recomendado antes del PR

1. **Verificar calidad localmente:**
   ```bash
   npm run quality
   ```

2. **Si hay errores, corregirlos:**
   - Linting: `npm run lint:fix`
   - TypeScript: Revisa los errores y corrígelos
   - Tests: Revisa los tests fallidos y corrígelos

3. **Verificar nuevamente:**
   ```bash
   npm run quality
   ```

4. **Hacer commit y push:**
   ```bash
   git add .
   git commit -m "fix: corregir errores de calidad"
   git push
   ```

---

## 📋 Checklist antes del PR

- [ ] `npm run lint` pasa sin errores
- [ ] `npm run type-check` pasa sin errores
- [ ] `npm test` pasa todos los tests
- [ ] No hay `console.log` o código de debug
- [ ] Los imports están organizados correctamente
- [ ] Los tipos TypeScript están correctos
- [ ] No hay `any` sin justificación

---

## 🐛 Si SonarQube está configurado en tu organización

Si tu organización usa SonarQube y necesitas ver los resultados:

### Opción 1: Ver en SonarQube Web

1. Ve a la URL de SonarQube de tu organización
2. Busca tu proyecto
3. Ve a la pestaña "Issues" o "Code Smells"
4. Filtra por tu branch/PR

### Opción 2: SonarQube CLI (si está instalado)

```bash
# Analizar código
sonar-scanner

# Ver issues
sonar-scanner -Dsonar.issuesReport.html.enable=true
```

### Opción 3: GitHub Actions / CI

Si SonarQube está integrado en tu CI/CD:

1. Ve a tu PR en GitHub
2. Revisa los "Checks" o "Actions"
3. Busca el job de SonarQube
4. Revisa los errores reportados

---

## 💡 Tips

### Ver solo errores de ESLint (no warnings)

```bash
npm run lint -- --max-warnings=0
```

### Ver errores de TypeScript en un archivo específico

```bash
npx tsc --noEmit src/pages/dashboard.tsx
```

### Ejecutar un test específico

```bash
npm test -- src/services/ranking/rankingService.test.ts
```

### Ver cobertura de tests

```bash
npm test -- --coverage
```

---

## 🔧 Configuración de SonarQube (Opcional)

Si quieres configurar SonarQube en tu proyecto:

1. **Crear `sonar-project.properties`:**

```properties
sonar.projectKey=habittrack
sonar.projectName=HabitTrack
sonar.projectVersion=1.0
sonar.sources=src
sonar.tests=src
sonar.exclusions=**/node_modules/**,**/dist/**,**/*.test.ts,**/*.test.tsx
sonar.test.inclusions=**/*.test.ts,**/*.test.tsx
sonar.javascript.lcov.reportPaths=coverage/lcov.info
```

2. **Agregar a GitHub Actions:**

```yaml
- name: SonarQube Scan
  uses: sonarsource/sonarqube-scan-action@master
  env:
    SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
    SONAR_HOST_URL: ${{ secrets.SONAR_HOST_URL }}
```

---

## 📚 Referencias

- [ESLint Docs](https://eslint.org/docs/latest/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [Vitest Docs](https://vitest.dev/)
- [SonarQube Docs](https://docs.sonarqube.org/)
