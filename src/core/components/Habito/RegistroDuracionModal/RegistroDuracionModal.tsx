import { useState } from 'react';
import { X, Plus, Clock } from 'lucide-react';
import { isValidTimeFormat, parseTimeToNumber, numberToTimeFormat } from '../../../../utils/habitTypeUtils';
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
    const [tiempo, setTiempo] = useState<string>('');
    const [error, setError] = useState<string>('');

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Validación: formato válido HH:MM
        if (!isValidTimeFormat(tiempo)) {
            setError('Formato inválido. Usa HH:MM (ej. 1:30)');
            return;
        }

        // Convertir a número según la unidad del hábito
        let valor: number;
        try {
            valor = parseTimeToNumber(tiempo, unidadMedida);
        } catch (err) {
            setError('Error al procesar el tiempo ingresado');
            return;
        }

        // Validación: no puede ser 00:00
        if (valor === 0) {
            setError('El tiempo debe ser mayor a 00:00');
            return;
        }

        // Validación: no puede ser mayor a la meta total
        if (valor > metaTotal) {
            const metaFormateada = numberToTimeFormat(metaTotal, unidadMedida);
            setError(`El valor no puede ser mayor a la meta (${metaFormateada})`);
            return;
        }

        // Validación: la suma no puede exceder la meta
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

        // Todo válido, enviar
        onSubmit(valor);
        setTiempo('');
        setError('');
    };

    const handleClose = () => {
        setTiempo('');
        setError('');
        onClose();
    };

    // Calcular progreso resultante si el tiempo es válido
    let progresoResultante = progresoActual;
    let valorNumerico = 0;
    if (isValidTimeFormat(tiempo)) {
        try {
            valorNumerico = parseTimeToNumber(tiempo, unidadMedida);
            progresoResultante = progresoActual + valorNumerico;
        } catch {
            // Ignorar errores de conversión
        }
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
                        <label htmlFor="tiempo">
                            Tiempo (HH:MM)
                        </label>
                        <input
                            id="tiempo"
                            type="text"
                            value={tiempo}
                            onChange={(e) => setTiempo(e.target.value)}
                            placeholder="Ej. 1:30"
                            autoFocus
                            required
                        />
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
                        {isValidTimeFormat(tiempo) && valorNumerico > 0 && (
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
                        <button type="submit" className="rpm-btn-primary">
                            <Plus size={16} />
                            Registrar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
