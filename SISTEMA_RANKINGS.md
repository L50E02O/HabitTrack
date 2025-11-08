# 🏆 Sistema de Rankings y Rangos - HabitTrack

## 📋 Descripción General

El sistema de rankings permite a los usuarios competir entre sí y subir de rango según los puntos acumulados al completar hábitos. Incluye un **botón flotante** estilo chat y una página completa de clasificación.

---

## 🎖️ Rangos Disponibles

Los usuarios progresan a través de 9 rangos según sus puntos:

| Nivel | Rango | Puntos Mínimos | Puntos Máximos | Icono | Color |
|-------|-------|----------------|----------------|-------|-------|
| 1 | Novato | 0 | 99 | Seedling | Marrón |
| 2 | Aprendiz | 100 | 249 | Sprout | Verde |
| 3 | Comprometido | 250 | 499 | Flame | Naranja |
| 4 | Dedicado | 500 | 999 | Zap | Dorado |
| 5 | Experto | 1000 | 1999 | Star | Azul |
| 6 | Maestro | 2000 | 3999 | Award | Púrpura |
| 7 | Élite | 4000 | 7999 | Crown | Rosa |
| 8 | Leyenda | 8000 | 15999 | Trophy | Rojo |
| 9 | Inmortal | 16000+ | ∞ | Sparkles | Dorado |

---

## 📊 Cómo Funciona

### Obtención de Puntos

Los usuarios ganan puntos al:
- **Completar hábitos** según dificultad:
  - Fácil: 3 pts por avance, 6 pts por completar
  - Medio: 5 pts por avance, 10 pts por completar
  - Difícil: 8 pts por avance, 16 pts por completar

### Detección Automática de Rango

El sistema detecta automáticamente cuándo un usuario sube de rango:
1. El hook `useRankDetection` monitorea los puntos del usuario
2. Cuando los puntos alcanzan el umbral del siguiente rango, se activa
3. Se muestra un modal animado celebrando la subida de rango

---

## 💻 Componentes Creados

### 1. **RankingWidget (Botón Flotante)** 
**Ubicación:** `src/core/components/Ranking/RankingWidget.tsx`

**Botón flotante** (bolita dorada) en la esquina inferior derecha que muestra:
- ✅ Icono de trofeo animado
- ✅ Badge con tu posición actual (#1, #2, etc.)
- ✅ Al hacer clic, se expande mostrando:
  - Tu rango actual con icono y color
  - Tu posición en el ranking global
  - Progreso hacia el siguiente rango
  - Top 5 jugadores
  - Botón para ver ranking completo

**Características del botón:**
- Posición fija en pantalla (no se mueve al hacer scroll)
- Efecto hover con animación de escala
- Animación flotante del icono
- Badge pulsante con la posición
- Z-index alto para estar siempre visible

**Características del panel expandido:**
- Animación slide-up al abrir
- Botón X para cerrar
- Scroll interno si el contenido es largo
- Scrollbar personalizado
- Diseño responsive

**Props:**
```typescript
interface RankingWidgetProps {
    userId: string;
    onVerCompleto?: () => void;
}
```

### 2. **RankingPage**
**Ubicación:** `src/pages/RankingPage.tsx`

Página completa de clasificación con:
- ✅ Tabla de ranking completa (todos los usuarios)
- ✅ Sidebar con tu rango actual y estadísticas
- ✅ Lista de todos los rangos disponibles
- ✅ Buscador de usuarios
- ✅ Badge con total de usuarios
- ✅ Diseño responsive

**Sin pestañas:** Muestra directamente toda la base de datos de usuarios ordenados por puntos.

### 3. **RankUpModal**
**Ubicación:** `src/core/components/Ranking/RankUpModal.tsx`

Modal animado que se muestra al subir de rango:
- ✅ Confetti animado (30 partículas)
- ✅ Transición visual entre rangos
- ✅ Mensaje de felicitación
- ✅ Se cierra automáticamente en 5 segundos
- ✅ Animaciones suaves con CSS

**Props:**
```typescript
interface RankUpModalProps {
    nuevoRango: IRango;
    rangoAnterior: IRango;
    isOpen: boolean;
    onClose: () => void;
}
```

---

## 🔧 Servicios Implementados

### **rankingService.ts**
**Ubicación:** `src/services/ranking/rankingService.ts`

Funciones disponibles:

```typescript
// Obtener ranking completo
obtenerRankingCompleto(limite: number = 100): Promise<IUsuarioRanking[]>

// Obtener estadísticas de un usuario
obtenerEstadisticasUsuario(userId: string): Promise<IEstadisticasRanking>

// Obtener top N usuarios
obtenerTopUsuarios(limite: number = 10): Promise<IUsuarioRanking[]>

// Obtener usuarios cercanos en el ranking
obtenerUsuariosCercanos(userId: string, cantidad: number = 5): Promise<IUsuarioRanking[]>
```

---

## 📦 Tipos TypeScript

### **IRango**
```typescript
export interface IRango {
    nombre: string;
    puntosMinimos: number;
    puntosMaximos: number;
    icono: string;  // Nombre del icono de Lucide React
    color: string;  // Color HEX
    nivel: number;
}
```

### **IUsuarioRanking**
```typescript
export interface IUsuarioRanking {
    id: string;
    nombre: string;
    puntos: number;
    posicion: number;
    rango: IRango;
    foto_perfil?: string;
}
```

### **IEstadisticasRanking**
```typescript
export interface IEstadisticasRanking {
    totalUsuarios: number;
    tuPosicion: number;
    puntosParaSiguienteRango: number;
    rangoActual: IRango;
    siguienteRango: IRango | null;
    progresoRango: number; // 0-100
}
```

---

## 🎨 Diseño y UX

### Colores por Rango

Cada rango tiene un color único que se usa en:
- Icono del badge
- Nombre del rango
- Bordes y efectos glow
- Barras de progreso

### Animaciones

1. **Botón Flotante:**
   - Float animation del trofeo
   - Pulse del badge de posición
   - Scale on hover
   - Pulse loading cuando carga

2. **Panel Expandido:**
   - Slide-up al abrir
   - Fade smooth al cerrar
   - Shine effect en badges
   - Progreso animado con shimmer
   - Hover effects en items del top 5

3. **Página de Ranking:**
   - Skeleton loading
   - Smooth transitions
   - Trophy glow para top 3

3. **Modal de Rank Up:**
   - Confetti fall animation
   - Badge pulse effect
   - Slide-in transitions
   - Auto-close después de 5s

---

## 🔌 Integración en Dashboard

El sistema está completamente integrado en el dashboard:

1. **Widget lateral** muestra tu rango y top 5
2. **Hook `useRankDetection`** monitorea cambios de rango
3. **Modal automático** cuando subes de rango
4. **Actualización en tiempo real** al completar hábitos

```tsx
// En dashboard.tsx
const [puntosUsuario, setPuntosUsuario] = useState(0);
const { rangoAnterior, rangoActual, huboRankUp, resetRankUp } = useRankDetection(puntosUsuario);

// Actualizar puntos después de avanzar en hábito
const puntosActuales = await getPuntosActuales(user.id);
setPuntosUsuario(puntosActuales);

// Modal se muestra automáticamente cuando huboRankUp === true
```

---

## 📱 Responsive

El sistema es completamente responsive:

- **Desktop (>768px):** 
  - Botón flotante 60x60px
  - Panel expandido 400px ancho
  - Tabla completa con todas las columnas

- **Tablet (768px):** 
  - Botón flotante 56x56px
  - Panel expandido fullwidth con márgenes
  - Grid adaptativo, columnas reducidas

- **Mobile (<480px):** 
  - Botón flotante 52x52px
  - Panel expandido fullscreen con márgenes 1rem
  - Vista de una columna, optimizada para táctil
  - Scroll optimizado

---

## 🚀 Rutas

- `/dashboard` - Dashboard con widget de ranking
- `/ranking` - Página completa de clasificación

---

## ✨ Características Destacadas

1. **Competencia social** - Los usuarios pueden ver su posición vs otros
2. **Motivación gamificada** - Subir de rango es gratificante
3. **Progresión clara** - Siempre sabes cuánto falta para el siguiente rango
4. **Reconocimiento visual** - Cada rango tiene identidad única
5. **Feedback instantáneo** - Modal celebra tus logros
6. **Performance optimizada** - Queries eficientes con Supabase

---

## 🎯 Próximas Mejoras (Opcional)

- [ ] Rankings por categoría de hábito
- [ ] Rankings semanales/mensuales
- [ ] Ligas (División 1, 2, 3, etc.)
- [ ] Rewards especiales por rango
- [ ] Historial de rangos alcanzados
- [ ] Comparar perfil con amigos
- [ ] Notificaciones push cuando alguien te supera

---

## 💡 Tips de Uso

1. **Completa hábitos difíciles** para ganar más puntos rápido
2. **Mantén rachas activas** para bonificaciones
3. **Revisa el ranking** para ver tu progreso vs otros
4. **Compite sanamente** y motívate con la comunidad

---

¡Ahora tienes un sistema de rankings completo y profesional en tu app! 🎮🏆
