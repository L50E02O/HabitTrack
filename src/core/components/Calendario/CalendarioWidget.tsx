import { useState, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { obtenerDiasConRachaEnRango } from '../../../services/calendario/calendarioService';
import './CalendarioWidget.css';

interface CalendarioWidgetProps {
  userId: string;
  darkMode?: boolean;
}

export default function CalendarioWidget({ userId, darkMode = false }: CalendarioWidgetProps) {
  const [fechaActual, setFechaActual] = useState(new Date());
  const [diasCompletados, setDiasCompletados] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cargarDiasCompletados = async () => {
      if (!userId) return;
      
      try {
        setLoading(true);
        
        // Calcular inicio y fin del mes actual
        const año = fechaActual.getFullYear();
        const mes = fechaActual.getMonth();
        
        // También cargar días del mes anterior y siguiente para mostrar contexto
        const inicioRango = new Date(año, mes - 1, 1);
        const finRango = new Date(año, mes + 2, 0);
        
        const dias = await obtenerDiasConRachaEnRango(userId, inicioRango, finRango);
        setDiasCompletados(dias);
      } catch (error) {
        console.error('Error cargando días completados:', error);
      } finally {
        setLoading(false);
      }
    };

    cargarDiasCompletados();
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

  const esDiaCompletado = (dia: number): boolean => {
    const fecha = new Date(año, mes, dia);
    const fechaStr = fecha.toISOString().split('T')[0];
    return diasCompletados.has(fechaStr);
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

  const totalDiasCompletados = Array.from(diasCompletados).filter(fecha => {
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
            {totalDiasCompletados} día{totalDiasCompletados !== 1 ? 's' : ''} este mes
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

              const completado = esDiaCompletado(dia);
              const hoy = esHoy(dia);
              const futuro = esDiaFuturo(dia);

              return (
                <div
                  key={index}
                  className={`calendario-dia ${
                    completado ? 'completado' : ''
                  } ${hoy ? 'hoy' : ''} ${futuro ? 'futuro' : ''}`}
                  title={completado ? `Completaste tu racha el ${dia}/${mes + 1}/${año}` : ''}
                >
                  <span className="calendario-dia-numero">{dia}</span>
                  {completado && (
                    <div className="calendario-dia-check">
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path
                          d="M10 3L4.5 8.5L2 6"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
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
          <div className="calendario-leyenda-color completado"></div>
          <span>Día completado</span>
        </div>
        <div className="calendario-leyenda-item">
          <div className="calendario-leyenda-color hoy"></div>
          <span>Hoy</span>
        </div>
      </div>
    </div>
  );
}

