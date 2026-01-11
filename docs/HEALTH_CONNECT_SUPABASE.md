# Health Connect con Supabase como Intermediario

## Arquitectura Simplificada

```
Mi Smartwatch → FitCloudPro → Health Connect (Android) 
                                      ↓
                              App Android Simple
                                      ↓
                              Supabase Database
                                      ↓
                              HabitTrack Web
```

## Ventajas de usar Supabase

1. ✅ **Sin servidor REST propio** - Usa la base de datos directamente
2. ✅ **Realtime** - Sincronización automática con Supabase Realtime
3. ✅ **Seguridad RLS** - Ya tienes Row Level Security
4. ✅ **Simple** - Solo necesitas una app Android ligera que suba datos

## Opción 1: Supabase Database (Recomendado - Más Simple)

### Flujo de Datos

1. **App Android** lee Health Connect y sube a Supabase
2. **HabitTrack Web** lee directamente de Supabase (¡ya lo haces!)
3. **Sin API intermedia** - Todo a través de Supabase

### Implementación

#### Paso 1: Ya tienes la tabla `datos_salud`

La tabla que ya creamos funciona perfectamente. Solo asegúrate de ejecutar la migración:

```sql
-- Ya tienes esto en: database/migrations/20260107_datos_salud_health_connect.sql
ALTER TABLE datos_salud 
ADD COLUMN IF NOT EXISTS minutos_ejercicio INTEGER,
ADD COLUMN IF NOT EXISTS nivel_oxigeno INTEGER;
```

#### Paso 2: Crear App Android Simple (Solo Subida)

Crea una app Android minimalista que solo suba datos. Archivo `HealthSyncService.kt`:

```kotlin
package com.habittrack.healthsync

import android.content.Context
import androidx.health.connect.client.HealthConnectClient
import androidx.health.connect.client.records.*
import androidx.health.connect.client.request.ReadRecordsRequest
import androidx.health.connect.client.time.TimeRangeFilter
import io.github.jan.supabase.createSupabaseClient
import io.github.jan.supabase.postgrest.Postgrest
import io.github.jan.supabase.postgrest.from
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.serialization.Serializable
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneId

class HealthSyncService(private val context: Context) {
    
    private val healthConnectClient = HealthConnectClient.getOrCreate(context)
    
    // Configura tu Supabase
    private val supabase = createSupabaseClient(
        supabaseUrl = "https://pahegdcyadnndhbtzaps.supabase.co",
        supabaseKey = "TU_ANON_KEY_AQUI" // Pon tu anon key
    ) {
        install(Postgrest)
    }
    
    // Sincronizar datos a Supabase
    suspend fun syncToSupabase(userId: String, date: LocalDate = LocalDate.now()) {
        val datos = readHealthData(date)
        
        val datosSalud = DatosSaludDTO(
            id_perfil = userId,
            fecha = date.toString(),
            pasos = datos.pasos,
            frecuencia_cardiaca = datos.frecuenciaCardiaca,
            calorias_quemadas = datos.caloriasQuemadas,
            distancia_km = datos.distanciaKm,
            horas_sueno = datos.horasSueno,
            minutos_ejercicio = datos.minutosEjercicio,
            nivel_oxigeno = datos.nivelOxigeno,
            fecha_sincronizacion = Instant.now().toString()
        )
        
        // Insertar o actualizar en Supabase
        try {
            supabase.from("datos_salud").upsert(datosSalud)
        } catch (e: Exception) {
            println("Error al sincronizar: ${e.message}")
            throw e
        }
    }
    
    private suspend fun readHealthData(date: LocalDate): HealthData {
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
            nivelOxigeno = readOxygenSaturation(timeRange)
        )
    }
    
    // ... mismas funciones de lectura de Health Connect que antes
    private suspend fun readSteps(timeRange: TimeRangeFilter): Int {
        val request = ReadRecordsRequest(
            recordType = StepsRecord::class,
            timeRangeFilter = timeRange
        )
        val response = healthConnectClient.readRecords(request)
        return response.records.sumOf { it.count.toInt() }
    }
    
    // etc... (copia del código anterior)
}

@Serializable
data class DatosSaludDTO(
    val id_perfil: String,
    val fecha: String,
    val pasos: Int,
    val frecuencia_cardiaca: Int? = null,
    val calorias_quemadas: Double? = null,
    val distancia_km: Double? = null,
    val horas_sueno: Double? = null,
    val minutos_ejercicio: Int? = null,
    val nivel_oxigeno: Int? = null,
    val fecha_sincronizacion: String
)

data class HealthData(
    val pasos: Int,
    val frecuenciaCardiaca: Int?,
    val caloriasQuemadas: Double?,
    val distanciaKm: Double?,
    val horasSueno: Double?,
    val minutosEjercicio: Int?,
    val nivelOxigeno: Int?
)
```

#### Paso 3: Dependencias Android (`build.gradle.kts`)

```kotlin
dependencies {
    // Health Connect
    implementation("androidx.health.connect:connect-client:1.1.0-alpha07")
    
    // Supabase Kotlin
    implementation("io.github.jan-tennert.supabase:postgrest-kt:2.0.0")
    implementation("io.ktor:ktor-client-android:2.3.7")
    
    // Serialization
    implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.6.0")
}
```

#### Paso 4: MainActivity Simple

```kotlin
class MainActivity : AppCompatActivity() {
    
    private lateinit var healthSync: HealthSyncService
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)
        
        healthSync = HealthSyncService(this)
        
        findViewById<Button>(R.id.syncButton).setOnClickListener {
            lifecycleScope.launch {
                try {
                    // Obtén el ID del usuario de tu auth
                    val userId = getCurrentUserId() // Implementa esto
                    healthSync.syncToSupabase(userId)
                    Toast.makeText(this@MainActivity, "✅ Sincronizado", Toast.LENGTH_SHORT).show()
                } catch (e: Exception) {
                    Toast.makeText(this@MainActivity, "❌ Error: ${e.message}", Toast.LENGTH_LONG).show()
                }
            }
        }
    }
    
    private fun getCurrentUserId(): String {
        // Opción 1: Guardar en SharedPreferences cuando el usuario se loguea
        val prefs = getSharedPreferences("habittrack", MODE_PRIVATE)
        return prefs.getString("user_id", "") ?: ""
        
        // Opción 2: Login con Supabase Auth en la app también
    }
}
```

#### Paso 5: Modificar HabitTrack (¡Casi nada!)

Ya no necesitas el servicio de Health Connect API. Los datos están en Supabase.

Actualiza `smartwatchService.ts`:

```typescript
import { supabase } from "../../config/supabase";
import type { IDatosSalud } from "../../types/ISmartwatch";

/**
 * Obtener datos de salud directamente desde Supabase
 * Ya no necesitas API externa - la app Android sube a Supabase
 */
export async function obtenerDatosSaludHoy(
  idPerfil: string
): Promise<IDatosSalud | null> {
  const hoy = new Date().toISOString().split('T')[0];
  
  const { data, error } = await supabase
    .from("datos_salud")
    .select("*")
    .eq("id_perfil", idPerfil)
    .eq("fecha", hoy)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error("Error al obtener datos:", error);
    return null;
  }

  return data;
}

/**
 * Suscribirse a cambios en tiempo real
 */
export function suscribirseACambios(
  idPerfil: string,
  onUpdate: (datos: IDatosSalud) => void
) {
  const channel = supabase
    .channel('datos_salud_changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'datos_salud',
        filter: `id_perfil=eq.${idPerfil}`
      },
      (payload) => {
        onUpdate(payload.new as IDatosSalud);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
```

Actualiza el componente `SmartwatchConnection.tsx`:

```typescript
export default function SmartwatchConnection({ userId }: { userId: string }) {
  const [datos, setDatos] = useState<IDatosSalud | null>(null);

  useEffect(() => {
    // Cargar datos iniciales
    obtenerDatosSaludHoy(userId).then(setDatos);
    
    // Suscribirse a cambios en tiempo real
    const unsubscribe = suscribirseACambios(userId, (nuevosDatos) => {
      setDatos(nuevosDatos);
      toast.success('Datos actualizados desde tu smartwatch');
    });
    
    return unsubscribe;
  }, [userId]);

  return (
    <div>
      <h3>Datos de Salud (Sincronización Automática)</h3>
      {datos ? (
        <div>
          <p>🚶 Pasos: {datos.pasos.toLocaleString()}</p>
          <p>❤️ Frecuencia: {datos.frecuencia_cardiaca} bpm</p>
          <p>🔥 Calorías: {datos.calorias_quemadas} kcal</p>
          <p>📍 Distancia: {datos.distancia_km} km</p>
          <p>😴 Sueño: {datos.horas_sueno} hrs</p>
          <p>🏃 Ejercicio: {datos.minutos_ejercicio} min</p>
          <p>🫁 Oxígeno: {datos.nivel_oxigeno}%</p>
          <small>Última sync: {new Date(datos.fecha_sincronizacion).toLocaleString()}</small>
        </div>
      ) : (
        <p>Esperando sincronización desde la app móvil...</p>
      )}
    </div>
  );
}
```

## Opción 2: Supabase Edge Functions (Avanzado)

Si quieres que Supabase maneje la lógica, usa Edge Functions:

```typescript
// supabase/functions/health-connect-sync/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const { userId, datos } = await req.json()
  
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )
  
  const { data, error } = await supabase
    .from('datos_salud')
    .upsert({
      id_perfil: userId,
      fecha: new Date().toISOString().split('T')[0],
      ...datos,
      fecha_sincronizacion: new Date().toISOString()
    })
  
  return new Response(JSON.stringify({ success: !error }), {
    headers: { 'Content-Type': 'application/json' }
  })
})
```

## Comparación de Opciones

| Característica | Supabase DB Directo | Edge Functions | API Android |
|----------------|---------------------|----------------|-------------|
| Complejidad | ⭐ Baja | ⭐⭐ Media | ⭐⭐⭐ Alta |
| Tiempo Real | ✅ Nativo | ✅ Con webhook | ❌ Polling |
| Seguridad | ✅ RLS | ✅ Service Role | ⚠️ Requiere auth |
| Costo | 💰 Gratis | 💰 Gratis tier | 💰 Server hosting |
| Mantenimiento | ✅ Mínimo | ✅ Bajo | ❌ Alto |

## Recomendación

**Usa Supabase Database Directo** porque:

1. Ya tienes la infraestructura (tabla `datos_salud`)
2. Ya usas Supabase en HabitTrack
3. Realtime gratis para sincronización automática
4. App Android más simple (solo sube datos)
5. Cero configuración adicional de servidores

## Próximos Pasos

1. Ejecuta la migración SQL para agregar los nuevos campos
2. Crea una app Android simple que lea Health Connect
3. La app sube a Supabase cada X minutos o cuando el usuario lo pida
4. HabitTrack lee y se actualiza en tiempo real con Supabase Realtime

¿Te ayudo a implementar la parte de Supabase Realtime en HabitTrack?
