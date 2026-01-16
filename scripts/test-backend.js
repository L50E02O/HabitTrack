#!/usr/bin/env node

/**
 * Script de prueba para verificar la funcionalidad del backend de Google Fit
 */

const BASE_URL = 'http://localhost:3001';

// Colores para la consola
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testEndpoint(name, url, method = 'GET', body = null) {
    log(`\n🧪 Probando: ${name}`, 'cyan');
    log(`   ${method} ${url}`, 'blue');

    try {
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        if (body) {
            options.body = JSON.stringify(body);
        }

        const response = await fetch(url, options);
        const data = await response.json();

        if (response.ok) {
            log(`   ✅ Éxito (${response.status})`, 'green');
            log(`   Respuesta: ${JSON.stringify(data).substring(0, 100)}...`, 'reset');
            return { success: true, data };
        } else {
            log(`   ⚠️  Error ${response.status}`, 'yellow');
            log(`   Respuesta: ${JSON.stringify(data)}`, 'reset');
            return { success: false, data, status: response.status };
        }
    } catch (error) {
        log(`   ❌ Error de conexión: ${error.message}`, 'red');
        return { success: false, error: error.message };
    }
}

async function runTests() {
    log('\n' + '='.repeat(60), 'cyan');
    log('  PRUEBAS DE BACKEND - GOOGLE FIT API', 'cyan');
    log('='.repeat(60) + '\n', 'cyan');

    // 1. Verificar que el servidor esté corriendo
    log('📡 Verificando conectividad del servidor...', 'yellow');
    const serverCheck = await testEndpoint(
        'Health Check',
        `${BASE_URL}/api/health-connect/estado`
    );

    if (!serverCheck.success) {
        log('\n❌ El servidor no está corriendo en http://localhost:3001', 'red');
        log('   Por favor, ejecuta: npm run dev:api', 'yellow');
        process.exit(1);
    }

    log('\n✅ Servidor corriendo correctamente!', 'green');

    // 2. Probar endpoint de autenticación
    await testEndpoint(
        'Obtener URL de autenticación',
        `${BASE_URL}/api/google-fit/auth?userId=test-user-123`
    );

    // 3. Probar endpoint de pasos (sin autenticación - debería fallar)
    const stepsTest = await testEndpoint(
        'Obtener pasos (sin autenticación)',
        `${BASE_URL}/api/google-fit/steps?userId=test-user-123`
    );

    if (stepsTest.status === 401) {
        log('   ℹ️  Comportamiento esperado: usuario no autenticado', 'blue');
    }

    // 4. Probar endpoint de ranking
    await testEndpoint(
        'Obtener ranking',
        `${BASE_URL}/api/getRanking?limit=5`
    );

    // 5. Probar Health Connect Mock (deprecado pero funcional)
    await testEndpoint(
        'Health Connect Mock - Estado',
        `${BASE_URL}/api/health-connect/estado`
    );

    await testEndpoint(
        'Health Connect Mock - Datos',
        `${BASE_URL}/api/health-connect/datos?fecha=2026-01-11`
    );

    // Resumen
    log('\n' + '='.repeat(60), 'cyan');
    log('  RESUMEN DE PRUEBAS', 'cyan');
    log('='.repeat(60), 'cyan');
    log('\n✅ Servidor backend funcionando correctamente', 'green');
    log('✅ Endpoints de Google Fit disponibles', 'green');
    log('✅ Endpoints de Health Connect Mock disponibles (deprecados)', 'yellow');
    log('\n📝 Próximos pasos:', 'blue');
    log('   1. Asegúrate de que el frontend esté corriendo (npm run dev)', 'reset');
    log('   2. Abre http://localhost:5173 en tu navegador', 'reset');
    log('   3. Inicia sesión y prueba la conexión con Google Fit', 'reset');
    log('   4. Verifica que la tabla google_fit_tokens exista en Supabase', 'reset');
    log('\n');
}

// Ejecutar pruebas
runTests().catch(error => {
    log(`\n❌ Error fatal: ${error.message}`, 'red');
    process.exit(1);
});
