#!/usr/bin/env node

/**
 * Script para verificar calidad del código antes de hacer PR
 * Ejecuta: linting, type checking y tests
 */

import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function runCommand(command, description, continueOnError = false) {
  try {
    log(`\n${'='.repeat(60)}`, 'cyan');
    log(`🔍 ${description}`, 'blue');
    log('='.repeat(60), 'cyan');
    
    execSync(command, {
      cwd: rootDir,
      stdio: 'inherit',
      encoding: 'utf-8',
    });
    
    log(`✅ ${description} - OK`, 'green');
    return true;
  } catch (error) {
    log(`❌ ${description} - FALLÓ`, 'red');
    if (!continueOnError) {
      return false;
    }
    // Si continueOnError es true, retornar false pero no detener el proceso
    return false;
  }
}

async function main() {
  log('\n🚀 Verificación de Calidad del Código', 'cyan');
  log('='.repeat(60), 'cyan');

  const results = {
    lint: false,
    typeCheck: false,
    tests: false,
  };

  // 1. Linting
  results.lint = runCommand('npm run lint', 'ESLint - Verificando estilo de código', true);

  // 2. Type Checking
  results.typeCheck = runCommand('npx tsc --noEmit', 'TypeScript - Verificando tipos', true);

  // 3. Tests (ejecutar siempre para ver el estado completo)
  results.tests = runCommand('npm test -- --run', 'Tests - Ejecutando suite de pruebas', true);

  // Resumen
  log('\n' + '='.repeat(60), 'cyan');
  log('📊 RESUMEN DE VERIFICACIÓN', 'cyan');
  log('='.repeat(60), 'cyan');
  
  log(`\nESLint:        ${results.lint ? '✅ PASS' : '❌ FAIL'}`, results.lint ? 'green' : 'red');
  log(`TypeScript:    ${results.typeCheck ? '✅ PASS' : '❌ FAIL'}`, results.typeCheck ? 'green' : 'red');
  log(`Tests:         ${results.tests ? '✅ PASS' : '❌ FAIL'}`, results.tests ? 'green' : 'red');

  const allPassed = results.lint && results.typeCheck && results.tests;

  if (allPassed) {
    log('\n🎉 ¡Todo pasó! Tu código está listo para el PR.', 'green');
    process.exit(0);
  } else {
    log('\n⚠️  Algunas verificaciones fallaron. Por favor, corrígelas antes de hacer el PR.', 'yellow');
    log('\n💡 Tips:', 'cyan');
    if (!results.lint) {
      log('   - Ejecuta: npm run lint -- --fix  (para corregir automáticamente algunos errores)', 'yellow');
    }
    if (!results.typeCheck) {
      log('   - Revisa los errores de TypeScript arriba', 'yellow');
    }
    if (!results.tests) {
      log('   - Revisa los tests que fallaron arriba', 'yellow');
    }
    process.exit(1);
  }
}

main().catch((error) => {
  log(`\n❌ Error inesperado: ${error.message}`, 'red');
  process.exit(1);
});
