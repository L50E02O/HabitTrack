import { useState, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Dumbbell, Ham, GraduationCap, HeartPulse, BriefcaseBusiness, Star } from 'lucide-react';
import { obtenerDiasFinIntervaloEnRango, type DiaFinIntervalo } from '../../../services/calendario/calendarioService';
import type { IHabito } from '../../../types/IHabito';
import './CalendarioWidget.css';

interface CalendarioWidgetProps {
  userId: string;
  darkMode?: boolean;
}

export default function CalendarioWidget({ userId, darkMode = false }: CalendarioWidgetProps) {
  const [fechaActual, setFechaActual] = useState(new Date());
  const [diasFinIntervalo, setDiasFinIntervalo] = useState<Map<string, DiaFinIntervalo>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cargarDiasFinIntervalo = async () => {
      if (!userId) return;
      
      try {
        setLoading(true);
        
        // Calcular inicio y fin del mes actual
        const año = fechaActual.getFullYear();
        const mes = fechaActual.getMonth();
        
        // También cargar días del mes anterior y siguiente para mostrar contexto
        const inicioRango = new Date(año, mes - 1, 1);
        const finRango = new Date(año, mes + 2, 0);
        
        const dias = await obtenerDiasFinIntervaloEnRango(userId, inicioRango, finRango);
        setDiasFinIntervalo(dias);
      } catch (error) {
        console.error('Error cargando días de fin de intervalo:', error);
      } finally {
        setLoading(false);
      }
    };

    cargarDiasFinIntervalo();
  }, [userId, fechaActual]);

  const año = fechaActual.getFullYear();
  const mes = fechaActual.getMonth();

  // Obtener primer día del mes y último día
  const primerDia = new Date(año, mes, 1);
  const ultimoDia = new Date(año, mes + 1, 0);
  const diasEnMes = ultimoDia.getDate();
  const diaInicioSemana = primerDia.getDay(); // 0 = Domingo, 6 = Sábado

  // Nombres de los días de la semana
  const nombresDias = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const nombresMeses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const mesAnterior = () => {
    setFechaActual(new Date(año, mes - 1, 1));
  };

  const mesSiguiente = () => {
    setFechaActual(new Date(año, mes + 1, 1));
  };

  const irAHoy = () => {
    setFechaActual(new Date());
  };

  // Función para obtener el icono según la categoría (igual que en HabitCard)
  const pickIcon = (categoria: string) => {
    const iconSize = 14;
    const iconMap: Record<string, React.ReactElement> = {
      ejercicio: <Dumbbell size={iconSize} />,
      alimentacion: <Ham size={iconSize} />,
      estudio: <GraduationCap size={iconSize} />,
      salud: <HeartPulse size={iconSize} />,
      trabajo: <BriefcaseBusiness size={iconSize} />,
      otro: <Star size={iconSize} />,
    };
    return iconMap[categoria] || iconMap['otro'];
  };

  const obtenerInfoDiaFinIntervalo = (dia: number): DiaFinIntervalo | null => {
    const fecha = new Date(año, mes, dia);
    const fechaStr = fecha.toISOString().split('T')[0];
    return diasFinIntervalo.get(fechaStr) || null;
  };

  const esHoy = (dia: number): boolean => {
    const hoy = new Date();
    return (
      hoy.getFullYear() === año &&
      hoy.getMonth() === mes &&
      hoy.getDate() === dia
    );
  };

  const esDiaFuturo = (dia: number): boolean => {
    const hoy = new Date();
    const fecha = new Date(año, mes, dia);
    hoy.setHours(0, 0, 0, 0);
    fecha.setHours(0, 0, 0, 0);
    return fecha > hoy;
  };

  // Generar array de días del mes
  const diasDelMes: (number | null)[] = [];
  
  // Agregar espacios vacíos antes del primer día
  for (let i = 0; i < diaInicioSemana; i++) {
    diasDelMes.push(null);
  }
  
  // Agregar días del mes
  for (let dia = 1; dia <= diasEnMes; dia++) {
    diasDelMes.push(dia);
  }

  const totalDiasFinIntervalo = Array.from(diasFinIntervalo.keys()).filter(fecha => {
    const fechaObj = new Date(fecha);
    return fechaObj.getFullYear() === año && fechaObj.getMonth() === mes;
  }).length;

  return (
    <div className={`calendario-widget ${darkMode ? 'dark' : ''}`}>
      <div className="calendario-header">
        <div className="calendario-title-section">
          <Calendar className="calendario-icon" size={20} />
          <h3 className="calendario-title">Calendario de Rachas</h3>
        </div>
        <div className="calendario-stats">
          <span className="calendario-stat">
            {totalDiasFinIntervalo} día{totalDiasFinIntervalo !== 1 ? 's' : ''} con hábitos este mes
          </span>
        </div>
      </div>

      <div className="calendario-controls">
        <button 
          className="calendario-nav-button" 
          onClick={mesAnterior}
          aria-label="Mes anterior"
        >
          <ChevronLeft size={18} />
        </button>
        <div className="calendario-mes-info">
          <span className="calendario-mes-nombre">
            {nombresMeses[mes]} {año}
          </span>
          <button 
            className="calendario-hoy-button" 
            onClick={irAHoy}
            aria-label="Ir a hoy"
          >
            Hoy
          </button>
        </div>
        <button 
          className="calendario-nav-button" 
          onClick={mesSiguiente}
          aria-label="Mes siguiente"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {loading ? (
        <div className="calendario-loading">
          <div className="calendario-skeleton"></div>
        </div>
      ) : (
        <>
          <div className="calendario-dias-semana">
            {nombresDias.map((dia, index) => (
              <div key={index} className="calendario-dia-semana">
                {dia}
              </div>
            ))}
          </div>

          <div className="calendario-grid">
            {diasDelMes.map((dia, index) => {
              if (dia === null) {
                return <div key={index} className="calendario-dia-vacio"></div>;
              }

              const infoFinIntervalo = obtenerInfoDiaFinIntervalo(dia);
              const hoy = esHoy(dia);
              const futuro = esDiaFuturo(dia);

              // Crear tooltip con información de los hábitos
              const tooltip = infoFinIntervalo 
                ? `Fin de intervalo: ${infoFinIntervalo.habitos.map(h => h.nombre_habito).join(', ')}`
                : '';

              return (
                <div
                  key={index}
                  className={`calendario-dia ${
                    infoFinIntervalo ? 'fin-intervalo' : ''
                  } ${hoy ? 'hoy' : ''} ${futuro ? 'futuro' : ''}`}
                  title={tooltip}
                >
                  <span className="calendario-dia-numero">{dia}</span>
                  {infoFinIntervalo && (
                    <div className="calendario-dia-habitos">
                      {infoFinIntervalo.habitos.slice(0, 3).map((habito, idx) => (
                        <div 
                          key={habito.id_habito} 
                          className="calendario-habito-icono"
                          style={{ 
                            zIndex: 10 - idx,
                            marginLeft: idx > 0 ? '-4px' : '0'
                          }}
                        >
                          {pickIcon(habito.categoria)}
                        </div>
                      ))}
                      {infoFinIntervalo.habitos.length > 3 && (
                        <div className="calendario-habito-contador">
                          +{infoFinIntervalo.habitos.length - 3}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      <div className="calendario-leyenda">
        <div className="calendario-leyenda-item">
          <div className="calendario-leyenda-color fin-intervalo"></div>
          <span>Fin de intervalo</span>
        </div>
        <div className="calendario-leyenda-item">
          <div className="calendario-leyenda-color hoy"></div>
          <span>Hoy</span>
        </div>
      </div>
    </div>
  );
}

