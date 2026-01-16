import { useState, useEffect } from 'react';
import { X, Plus, Clock } from 'lucide-react';
import { parseTimeToNumber, numberToTimeFormat } from '../../../../utils/habitTypeUtils';
import '../RegistroProgresoModal/RegistroProgresoModal.css';

type Props = {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (cantidad: number) => void;
    metaTotal: number;
    progresoActual: number;
    unidadMedida: 'minutos' | 'horas';
    nombreHabito: string;
};

export default function RegistroDuracionModal({
    isOpen,
    onClose,
    onSubmit,
    metaTotal,
    progresoActual,
    unidadMedida,
    nombreHabito
}: Props) {
    const [horas, setHoras] = useState<number>(0);
    const [minutos, setMinutos] = useState<number>(0);
    const [error, setError] = useState<string>('');

    useEffect(() => {
        if (!isOpen) return;

        const tiempoFormateado = `${horas}:${minutos.toString().padStart(2, '0')}`;
        let valor = 0;
        try {
            valor = parseTimeToNumber(tiempoFormateado, unidadMedida);
        } catch {
            return;
        }

        if (valor === 0) {
            setError('');
            return;
        }

        if (valor > metaTotal) {
            const metaFormateada = numberToTimeFormat(metaTotal, unidadMedida);
            setError(`El valor no puede ser mayor a la meta (${metaFormateada})`);
            return;
        }

        const nuevoProgreso = progresoActual + valor;
        if (nuevoProgreso > metaTotal) {
            const disponible = metaTotal - progresoActual;
            const disponibleFormateado = numberToTimeFormat(disponible, unidadMedida);
            const nuevoProgresoFormateado = numberToTimeFormat(nuevoProgreso, unidadMedida);
            const metaFormateada = numberToTimeFormat(metaTotal, unidadMedida);
            setError(
                `Solo puedes agregar hasta ${disponibleFormateado} (llegarías a ${nuevoProgresoFormateado}/${metaFormateada})`
            );
            return;
        }

        setError('');
    }, [isOpen, horas, minutos, metaTotal, progresoActual, unidadMedida]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Si hay un error visible, no permitir envío
        if (error) return;

        const tiempoFormateado = `${horas}:${minutos.toString().padStart(2, '0')}`;
        const valor = parseTimeToNumber(tiempoFormateado, unidadMedida);

        // Validación: no puede ser 00:00
        if (valor === 0) {
            setError('El tiempo debe ser mayor a 00:00');
            return;
        }

        // Todo válido, enviar
        onSubmit(valor);
        setHoras(0);
        setMinutos(0);
        setError('');
    };

    const handleClose = () => {
        setHoras(0);
        setMinutos(0);
        setError('');
        onClose();
    };

    // Calcular progreso resultante
    const tiempoFormateado = `${horas}:${minutos.toString().padStart(2, '0')}`;
    let progresoResultante = progresoActual;
    let valorNumerico = 0;
    try {
        valorNumerico = parseTimeToNumber(tiempoFormateado, unidadMedida);
        progresoResultante = progresoActual + valorNumerico;
    } catch {
        // Ignorar
    }

    const disponible = metaTotal - progresoActual;
    const progresoActualFormateado = numberToTimeFormat(progresoActual, unidadMedida);
    const metaTotalFormateada = numberToTimeFormat(metaTotal, unidadMedida);
    const disponibleFormateado = numberToTimeFormat(disponible, unidadMedida);
    const progresoResultanteFormateado = numberToTimeFormat(progresoResultante, unidadMedida);

    return (
        <div className="rpm-overlay" onClick={handleClose}>
            <div className="rpm-card" onClick={(e) => e.stopPropagation()}>
                <div className="rpm-header">
                    <div className="rpm-header-content">
                        <Clock size={20} />
                        <h3>Registro de Tiempo</h3>
                    </div>
                    <button className="rpm-close-btn" onClick={handleClose} aria-label="Cerrar">
                        <X size={18} />
                    </button>
                </div>

                <div className="rpm-habit-name">{nombreHabito}</div>

                <form onSubmit={handleSubmit} className="rpm-form">
                    <div className="rpm-field">
                        <label>Selecciona el tiempo</label>

                        <div className="rpm-time-selector">
                            <div className="rpm-time-select-group">
                                <span className="rpm-time-sublabel">Horas</span>
                                <select
                                    value={horas}
                                    onChange={(e) => setHoras(parseInt(e.target.value))}
                                    autoFocus
                                >
                                    {Array.from({ length: 24 }, (_, i) => (
                                        <option key={i} value={i}>{i}h</option>
                                    ))}
                                </select>
                            </div>

                            <div className="rpm-time-separator">:</div>

                            <div className="rpm-time-select-group">
                                <span className="rpm-time-sublabel">Minutos</span>
                                <select
                                    value={minutos}
                                    onChange={(e) => setMinutos(parseInt(e.target.value))}
                                >
                                    {Array.from({ length: 60 }, (_, i) => (
                                        <option key={i} value={i}>{i.toString().padStart(2, '0')}m</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="rpm-hint">
                            Disponible: {disponibleFormateado}
                        </div>
                    </div>

                    <div className="rpm-progress-info">
                        <div className="rpm-progress-row">
                            <span className="rpm-label">Progreso actual:</span>
                            <span className="rpm-value">
                                {progresoActualFormateado} / {metaTotalFormateada}
                            </span>
                        </div>
                        {valorNumerico > 0 && (
                            <div className="rpm-progress-row rpm-new">
                                <span className="rpm-label">Nuevo progreso:</span>
                                <span className="rpm-value rpm-highlight">
                                    {progresoResultanteFormateado} / {metaTotalFormateada}
                                </span>
                            </div>
                        )}
                    </div>

                    {error && <div className="rpm-error">{error}</div>}

                    <div className="rpm-actions">
                        <button type="button" className="rpm-btn-ghost" onClick={handleClose}>
                            Cancelar
                        </button>
                        <button type="submit" className="rpm-btn-primary" disabled={!!error}>
                            <Plus size={16} />
                            Registrar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
