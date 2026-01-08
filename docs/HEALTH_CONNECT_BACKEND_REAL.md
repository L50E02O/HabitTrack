# Backend Real con Health Connect API

## Descripción

Health Connect es una API nativa de Android, por lo que necesitas crear una aplicación Android que:
1. Acceda a los datos de Health Connect
2. Exponga esos datos a través de una API REST
3. Tu aplicación web (HabitTrack) consuma esa API

## Arquitectura

```
Mi Smartwatch → FitCloudPro → Health Connect (Android) → Backend Android → API REST → HabitTrack Web
```

## Opción 1: Aplicación Android con Ktor (Recomendado)

### Paso 1: Crear Proyecto Android

1. Abre Android Studio
2. Crea un nuevo proyecto: **Empty Activity**
3. Nombre: `HabitTrackHealthAPI`
4. Lenguaje: **Kotlin**
5. Minimum SDK: **Android 9.0 (API 28)** o superior

### Paso 2: Configurar `build.gradle.kts`

```kotlin
plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "com.habittrack.healthapi"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.habittrack.healthapi"
        minSdk = 28
        targetSdk = 34
        versionCode = 1
        versionName = "1.0"
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }
    
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    
    kotlinOptions {
        jvmTarget = "17"
    }
}

dependencies {
    // Health Connect
    implementation("androidx.health.connect:connect-client:1.1.0-alpha07")
    
    // Ktor Server
    implementation("io.ktor:ktor-server-core:2.3.7")
    implementation("io.ktor:ktor-server-netty:2.3.7")
    implementation("io.ktor:ktor-server-content-negotiation:2.3.7")
    implementation("io.ktor:ktor-serialization-gson:2.3.7")
    implementation("io.ktor:ktor-server-cors:2.3.7")
    
    // Coroutines
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.7.3")
    
    // AndroidX
    implementation("androidx.core:core-ktx:1.12.0")
    implementation("androidx.appcompat:appcompat:1.6.1")
    implementation("com.google.android.material:material:1.11.0")
}
```

### Paso 3: Configurar Permisos en `AndroidManifest.xml`

```xml
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">

    <!-- Permisos de Internet -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    
    <!-- Permisos de Health Connect -->
    <uses-permission android:name="android.permission.health.READ_STEPS" />
    <uses-permission android:name="android.permission.health.READ_HEART_RATE" />
    <uses-permission android:name="android.permission.health.READ_ACTIVE_CALORIES_BURNED" />
    <uses-permission android:name="android.permission.health.READ_DISTANCE" />
    <uses-permission android:name="android.permission.health.READ_SLEEP" />
    <uses-permission android:name="android.permission.health.READ_EXERCISE" />
    <uses-permission android:name="android.permission.health.READ_OXYGEN_SATURATION" />

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="HabitTrack Health API"
        android:supportsRtl="true"
        android:theme="@style/Theme.AppCompat.Light.DarkActionBar"
        android:usesCleartextTraffic="true">
        
        <activity
            android:name=".MainActivity"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
            
            <!-- Health Connect Intent -->
            <intent-filter>
                <action android:name="androidx.health.ACTION_SHOW_PERMISSIONS_RATIONALE" />
            </intent-filter>
        </activity>
        
        <!-- Declarar Health Connect como requerido -->
        <activity
            android:name="androidx.health.connect.client.PermissionController"
            android:exported="true">
            <intent-filter>
                <action android:name="androidx.health.connect.action.HEALTH_CONNECT_SETTINGS" />
            </intent-filter>
        </activity>
    </application>
    
    <!-- Requiere Health Connect instalado -->
    <queries>
        <package android:name="com.google.android.apps.healthdata" />
    </queries>
</manifest>
```

### Paso 4: Crear el Cliente de Health Connect

Crea `HealthConnectManager.kt`:

```kotlin
package com.habittrack.healthapi

import android.content.Context
import androidx.health.connect.client.HealthConnectClient
import androidx.health.connect.client.permission.HealthPermission
import androidx.health.connect.client.records.*
import androidx.health.connect.client.request.ReadRecordsRequest
import androidx.health.connect.client.time.TimeRangeFilter
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneId

class HealthConnectManager(private val context: Context) {
    
    private val healthConnectClient by lazy {
        HealthConnectClient.getOrCreate(context)
    }
    
    // Lista de permisos necesarios
    val permissions = setOf(
        HealthPermission.getReadPermission(StepsRecord::class),
        HealthPermission.getReadPermission(HeartRateRecord::class),
        HealthPermission.getReadPermission(ActiveCaloriesBurnedRecord::class),
        HealthPermission.getReadPermission(DistanceRecord::class),
        HealthPermission.getReadPermission(SleepSessionRecord::class),
        HealthPermission.getReadPermission(ExerciseSessionRecord::class),
        HealthPermission.getReadPermission(OxygenSaturationRecord::class)
    )
    
    // Verificar si Health Connect está disponible
    suspend fun isAvailable(): Boolean {
        return HealthConnectClient.getSdkStatus(context) == HealthConnectClient.SDK_AVAILABLE
    }
    
    // Verificar permisos
    suspend fun hasAllPermissions(): Boolean {
        val granted = healthConnectClient.permissionController.getGrantedPermissions()
        return permissions.all { it in granted }
    }
    
    // Obtener datos del día
    suspend fun getDailyData(date: LocalDate): HealthData {
        val startOfDay = date.atStartOfDay(ZoneId.systemDefault()).toInstant()
        val endOfDay = date.plusDays(1).atStartOfDay(ZoneId.systemDefault()).toInstant()
        val timeRange = TimeRangeFilter.between(startOfDay, endOfDay)
        
        return HealthData(
            pasos = readSteps(timeRange),
            frecuenciaCardiaca = readHeartRate(timeRange),
            caloriasQuemadas = readCalories(timeRange),
            distanciaKm = readDistance(timeRange),
            horasSueno = readSleep(timeRange),
            minutosEjercicio = readExercise(timeRange),
            nivelOxigeno = readOxygenSaturation(timeRange),
            ultimaActualizacion = Instant.now().toString()
        )
    }
    
    private suspend fun readSteps(timeRange: TimeRangeFilter): Int {
        return try {
            val request = ReadRecordsRequest(
                recordType = StepsRecord::class,
                timeRangeFilter = timeRange
            )
            val response = healthConnectClient.readRecords(request)
            response.records.sumOf { it.count.toInt() }
        } catch (e: Exception) {
            0
        }
    }
    
    private suspend fun readHeartRate(timeRange: TimeRangeFilter): Int? {
        return try {
            val request = ReadRecordsRequest(
                recordType = HeartRateRecord::class,
                timeRangeFilter = timeRange
            )
            val response = healthConnectClient.readRecords(request)
            val samples = response.records.flatMap { it.samples }
            if (samples.isNotEmpty()) {
                (samples.sumOf { it.beatsPerMinute } / samples.size).toInt()
            } else null
        } catch (e: Exception) {
            null
        }
    }
    
    private suspend fun readCalories(timeRange: TimeRangeFilter): Double? {
        return try {
            val request = ReadRecordsRequest(
                recordType = ActiveCaloriesBurnedRecord::class,
                timeRangeFilter = timeRange
            )
            val response = healthConnectClient.readRecords(request)
            response.records.sumOf { it.energy.inKilocalories }
        } catch (e: Exception) {
            null
        }
    }
    
    private suspend fun readDistance(timeRange: TimeRangeFilter): Double? {
        return try {
            val request = ReadRecordsRequest(
                recordType = DistanceRecord::class,
                timeRangeFilter = timeRange
            )
            val response = healthConnectClient.readRecords(request)
            response.records.sumOf { it.distance.inKilometers }
        } catch (e: Exception) {
            null
        }
    }
    
    private suspend fun readSleep(timeRange: TimeRangeFilter): Double? {
        return try {
            val request = ReadRecordsRequest(
                recordType = SleepSessionRecord::class,
                timeRangeFilter = timeRange
            )
            val response = healthConnectClient.readRecords(request)
            val totalMillis = response.records.sumOf { 
                it.endTime.toEpochMilli() - it.startTime.toEpochMilli()
            }
            totalMillis / (1000.0 * 60 * 60) // Convertir a horas
        } catch (e: Exception) {
            null
        }
    }
    
    private suspend fun readExercise(timeRange: TimeRangeFilter): Int? {
        return try {
            val request = ReadRecordsRequest(
                recordType = ExerciseSessionRecord::class,
                timeRangeFilter = timeRange
            )
            val response = healthConnectClient.readRecords(request)
            val totalMillis = response.records.sumOf { 
                it.endTime.toEpochMilli() - it.startTime.toEpochMilli()
            }
            (totalMillis / (1000 * 60)).toInt() // Convertir a minutos
        } catch (e: Exception) {
            null
        }
    }
    
    private suspend fun readOxygenSaturation(timeRange: TimeRangeFilter): Int? {
        return try {
            val request = ReadRecordsRequest(
                recordType = OxygenSaturationRecord::class,
                timeRangeFilter = timeRange
            )
            val response = healthConnectClient.readRecords(request)
            if (response.records.isNotEmpty()) {
                (response.records.sumOf { it.percentage.value } / response.records.size).toInt()
            } else null
        } catch (e: Exception) {
            null
        }
    }
}

// Modelo de datos
data class HealthData(
    val pasos: Int,
    val frecuenciaCardiaca: Int?,
    val caloriasQuemadas: Double?,
    val distanciaKm: Double?,
    val horasSueno: Double?,
    val minutosEjercicio: Int?,
    val nivelOxigeno: Int?,
    val ultimaActualizacion: String
)
```

### Paso 5: Crear el Servidor API con Ktor

Crea `ApiServer.kt`:

```kotlin
package com.habittrack.healthapi

import android.content.Context
import io.ktor.http.*
import io.ktor.serialization.gson.*
import io.ktor.server.application.*
import io.ktor.server.engine.*
import io.ktor.server.netty.*
import io.ktor.server.plugins.contentnegotiation.*
import io.ktor.server.plugins.cors.routing.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import java.time.LocalDate

class ApiServer(private val context: Context) {
    
    private val healthManager = HealthConnectManager(context)
    private var server: NettyApplicationEngine? = null
    
    fun start(port: Int = 3001) {
        CoroutineScope(Dispatchers.IO).launch {
            server = embeddedServer(Netty, port = port, host = "0.0.0.0") {
                install(ContentNegotiation) {
                    gson {
                        setPrettyPrinting()
                    }
                }
                
                install(CORS) {
                    allowMethod(HttpMethod.Options)
                    allowMethod(HttpMethod.Get)
                    allowMethod(HttpMethod.Post)
                    allowHeader(HttpHeaders.ContentType)
                    anyHost()
                }
                
                routing {
                    // Estado de Health Connect
                    get("/api/health-connect/estado") {
                        val disponible = healthManager.isAvailable()
                        val permisosOtorgados = healthManager.hasAllPermissions()
                        
                        call.respond(mapOf(
                            "disponible" to disponible,
                            "aplicacionOrigen" to "Health Connect Android",
                            "ultimaSincronizacion" to System.currentTimeMillis().toString(),
                            "permisosOtorgados" to permisosOtorgados
                        ))
                    }
                    
                    // Verificar permisos
                    get("/api/health-connect/permisos") {
                        val hasPermissions = healthManager.hasAllPermissions()
                        
                        call.respond(mapOf(
                            "leerPasos" to hasPermissions,
                            "leerFrecuenciaCardiaca" to hasPermissions,
                            "leerCalorias" to hasPermissions,
                            "leerDistancia" to hasPermissions,
                            "leerSueno" to hasPermissions,
                            "leerEjercicio" to hasPermissions,
                            "leerOxigeno" to hasPermissions
                        ))
                    }
                    
                    // Obtener datos del día
                    get("/api/health-connect/datos") {
                        val fechaStr = call.request.queryParameters["fecha"]
                        val fecha = if (fechaStr != null) {
                            LocalDate.parse(fechaStr)
                        } else {
                            LocalDate.now()
                        }
                        
                        try {
                            val datos = healthManager.getDailyData(fecha)
                            call.respond(datos)
                        } catch (e: Exception) {
                            call.respond(
                                HttpStatusCode.InternalServerError,
                                mapOf("error" to e.message)
                            )
                        }
                    }
                }
            }.start(wait = false)
        }
    }
    
    fun stop() {
        server?.stop(1000, 2000)
    }
}
```

### Paso 6: Configurar MainActivity

```kotlin
package com.habittrack.healthapi

import android.os.Bundle
import android.widget.Button
import android.widget.TextView
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.health.connect.client.PermissionController
import androidx.lifecycle.lifecycleScope
import kotlinx.coroutines.launch

class MainActivity : AppCompatActivity() {
    
    private lateinit var healthManager: HealthConnectManager
    private lateinit var apiServer: ApiServer
    private lateinit var statusText: TextView
    
    private val requestPermissions = registerForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { grants ->
        if (grants.values.all { it }) {
            updateStatus("✅ Permisos otorgados")
            startServer()
        } else {
            updateStatus("❌ Permisos denegados")
        }
    }
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)
        
        healthManager = HealthConnectManager(this)
        apiServer = ApiServer(this)
        
        statusText = findViewById(R.id.statusText)
        val startButton: Button = findViewById(R.id.startButton)
        val stopButton: Button = findViewById(R.id.stopButton)
        
        startButton.setOnClickListener {
            lifecycleScope.launch {
                checkAndRequestPermissions()
            }
        }
        
        stopButton.setOnClickListener {
            apiServer.stop()
            updateStatus("🛑 Servidor detenido")
        }
        
        checkHealthConnect()
    }
    
    private fun checkHealthConnect() {
        lifecycleScope.launch {
            val available = healthManager.isAvailable()
            if (available) {
                updateStatus("Health Connect disponible\n\nPresiona 'Iniciar Servidor' para comenzar")
            } else {
                updateStatus("❌ Health Connect no está disponible.\nInstala Health Connect desde Play Store.")
            }
        }
    }
    
    private suspend fun checkAndRequestPermissions() {
        if (healthManager.hasAllPermissions()) {
            startServer()
        } else {
            requestPermissions.launch(
                healthManager.permissions.map { it.toString() }.toTypedArray()
            )
        }
    }
    
    private fun startServer() {
        apiServer.start(port = 3001)
        updateStatus("""
            🚀 Servidor iniciado
            
            📡 http://[IP-Android]:3001
            
            Endpoints:
            • /api/health-connect/estado
            • /api/health-connect/permisos  
            • /api/health-connect/datos
            
            💡 Configura HabitTrack para usar esta IP
        """.trimIndent())
    }
    
    private fun updateStatus(text: String) {
        runOnUiThread {
            statusText.text = text
        }
    }
    
    override fun onDestroy() {
        super.onDestroy()
        apiServer.stop()
    }
}
```

### Paso 7: Layout `activity_main.xml`

```xml
<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:orientation="vertical"
    android:padding="16dp"
    android:gravity="center">
    
    <TextView
        android:id="@+id/statusText"
        android:layout_width="match_parent"
        android:layout_height="0dp"
        android:layout_weight="1"
        android:text="Iniciando..."
        android:textSize="16sp"
        android:gravity="center"/>
    
    <Button
        android:id="@+id/startButton"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:text="Iniciar Servidor"
        android:layout_marginBottom="8dp"/>
    
    <Button
        android:id="@+id/stopButton"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:text="Detener Servidor"/>
</LinearLayout>
```

### Paso 8: Configurar HabitTrack

En tu archivo `.env` de HabitTrack:

```env
# Reemplaza con la IP de tu dispositivo Android
VITE_HEALTH_CONNECT_API=http://192.168.1.X:3001
```

Para encontrar la IP de tu Android:
1. Configuración → Wi-Fi → [Tu red] → IP

## Opción 2: Expo + React Native (Más Simple)

Si prefieres algo más simple, puedes crear una app Expo que haga de puente:

```bash
npx create-expo-app health-connect-bridge
cd health-connect-bridge
npx expo install expo-health-connect
```

## Despliegue

### En Red Local
1. Conecta tu Android y PC a la misma red Wi-Fi
2. Usa la IP local del Android

### En Producción
1. Despliega la app Android en Play Store
2. Los usuarios instalan tu app
3. Usa servicios como ngrok o Firebase para exponer la API

## Testing

```bash
# Probar desde tu PC (reemplaza IP)
curl http://192.168.1.X:3001/api/health-connect/estado
curl http://192.168.1.X:3001/api/health-connect/datos
```

## Notas Importantes

1. **Permisos**: El usuario debe otorgar permisos manualmente en Health Connect
2. **Red**: Ambos dispositivos deben estar en la misma red
3. **Batería**: Considera el consumo de batería del servidor
4. **Seguridad**: Implementa autenticación para producción

Esta es la forma real de conectar con Health Connect. El servidor mock que creamos antes es solo para desarrollo sin Android.
