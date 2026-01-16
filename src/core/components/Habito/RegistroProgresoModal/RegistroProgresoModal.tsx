import { useState } from 'react';
import { X, Plus } from 'lucide-react';
import './RegistroProgresoModal.css';

type Props = {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (cantidad: number) => void;
    metaTotal: number;
    progresoActual: number;
    unidadMedida: string;
    nombreHabito: string;
};

export default function RegistroProgresoModal({
    isOpen,
    onClose,
    onSubmit,
    metaTotal,
    progresoActual,
    unidadMedida,
    nombreHabito
}: Props) {
    const [cantidad, setCantidad] = useState<string>('');
    const [error, setError] = useState<string>('');

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        const valor = parseFloat(cantidad);

        // Validación: debe ser un número válido
        if (isNaN(valor)) {
            setError('Por favor ingresa un número válido');
            return;
        }

        // Validación: debe ser mayor a 0
        if (valor <= 0) {
            setError('El valor debe ser mayor a 0');
            return;
        }

        // Validación: no puede ser mayor a la meta total
        if (valor > metaTotal) {
            setError(`El valor no puede ser mayor a la meta (${metaTotal} ${unidadMedida})`);
            return;
        }

        // Validación: la suma no puede exceder la meta
        const nuevoProgreso = progresoActual + valor;
        if (nuevoProgreso > metaTotal) {
            const disponible = metaTotal - progresoActual;
            setError(
                `Solo puedes agregar hasta ${disponible.toFixed(2)} ${unidadMedida} (llegarías a ${nuevoProgreso.toFixed(2)}/${metaTotal})`
            );
            return;
        }

        // Todo válido, enviar
        onSubmit(valor);
        setCantidad('');
        setError('');
    };

    const handleClose = () => {
        setCantidad('');
        setError('');
        onClose();
    };

    const progresoResultante = progresoActual + (parseFloat(cantidad) || 0);
    const disponible = metaTotal - progresoActual;

    return (
        <div className="rpm-overlay" onClick={handleClose}>
            <div className="rpm-card" onClick={(e) => e.stopPropagation()}>
                <div className="rpm-header">
                    <h3>Registro Manual</h3>
                    <button className="rpm-close-btn" onClick={handleClose} aria-label="Cerrar">
                        <X size={18} />
                    </button>
                </div>

                <div className="rpm-habit-name">{nombreHabito}</div>

                <form onSubmit={handleSubmit} className="rpm-form">
                    <div className="rpm-field">
                        <label htmlFor="cantidad">
                            Cantidad ({unidadMedida})
                        </label>
                        <input
                            id="cantidad"
                            type="number"
                            step="0.01"
                            min="0.01"
                            max={disponible}
                            value={cantidad}
                            onChange={(e) => setCantidad(e.target.value)}
                            placeholder={`Ej. 2.5`}
                            autoFocus
                            required
                        />
                        <div className="rpm-hint">
                            Disponible: {disponible.toFixed(2)} {unidadMedida}
                        </div>
                    </div>

                    <div className="rpm-progress-info">
                        <div className="rpm-progress-row">
                            <span className="rpm-label">Progreso actual:</span>
                            <span className="rpm-value">
                                {progresoActual.toFixed(2)} / {metaTotal} {unidadMedida}
                            </span>
                        </div>
                        {cantidad && !isNaN(parseFloat(cantidad)) && parseFloat(cantidad) > 0 && (
                            <div className="rpm-progress-row rpm-new">
                                <span className="rpm-label">Nuevo progreso:</span>
                                <span className="rpm-value rpm-highlight">
                                    {progresoResultante.toFixed(2)} / {metaTotal} {unidadMedida}
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
