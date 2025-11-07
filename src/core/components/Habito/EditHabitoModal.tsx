import { useState } from 'react';
import { X, Save } from 'lucide-react';
import { updateHabito } from '../../../services/habito/habitoService';
import type { IHabito, UpdateIHabito } from '../../../types/IHabito';
import './CreateHabitoModal.css';

type Props = {
    habito: IHabito;
    open: boolean;
    onClose: () => void;
    onUpdated: (h: IHabito) => void;
};

export default function EditHabitoModal({ habito, open, onClose, onUpdated }: Props) {
    const [nombre_habito, setNombre] = useState(habito.nombre_habito);
    const [descripcion, setDescripcion] = useState(habito.descripcion);
    const [categoria, setCategoria] = useState<string>(habito.categoria);
    const [intervalo_meta, setIntervalo] = useState<string>(habito.intervalo_meta);
    const [meta_repeticion, setMeta] = useState<number>(habito.meta_repeticion);
    const [dificultad, setDificultad] = useState<string>(habito.dificultad);
    const [activo, setActivo] = useState(habito.activo);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!open) return null;

    const reset = () => {
        setNombre(habito.nombre_habito);
        setDescripcion(habito.descripcion);
        setCategoria(habito.categoria);
        setIntervalo(habito.intervalo_meta);
        setMeta(habito.meta_repeticion);
        setDificultad(habito.dificultad);
        setActivo(habito.activo);
        setError(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);
        try {
            // Calcular puntos base según dificultad
            let puntosBase = 5;
            if (dificultad === 'facil') puntosBase = 3;
            else if (dificultad === 'medio') puntosBase = 5;
            else if (dificultad === 'dificil') puntosBase = 8;

            const updatePayload: UpdateIHabito = {
                nombre_habito,
                descripcion,
                categoria,
                intervalo_meta,
                meta_repeticion,
                dificultad,
                puntos: puntosBase,
                activo,
            };
            
            await updateHabito(habito.id_habito, updatePayload);
            
            // Crear el objeto actualizado
            const updatedHabito: IHabito = {
                ...habito,
                ...updatePayload,
            };
            
            onUpdated(updatedHabito);
            reset();
            onClose();
        } catch (err: any) {
            setError(err?.message || 'No se pudo actualizar el hábito');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="modalOverlay" role="dialog" aria-modal="true">
            <div className="modalCard">
                <div className="modalHeader">
                    <h3>Editar Hábito</h3>
                    <button className="iconBtn" onClick={() => { reset(); onClose(); }} aria-label="Cerrar">
                        <X size={18} />
                    </button>
                </div>

                <form className="form" onSubmit={handleSubmit}>
                    <div className="field">
                        <label>Nombre</label>
                        <input
                            type="text"
                            value={nombre_habito}
                            onChange={(e) => setNombre(e.target.value)}
                            placeholder="Ej. Beber 2L de agua"
                            required
                        />
                    </div>

                    <div className="field">
                        <label>Descripción</label>
                        <textarea
                            value={descripcion}
                            onChange={(e) => setDescripcion(e.target.value)}
                            placeholder="Descripción breve del hábito"
                            rows={3}
                        />
                    </div>

                    <div className="row">
                        <div className="field">
                            <label htmlFor="categoria">Categoría</label>
                            <select id="categoria" title="Categoría" value={categoria} onChange={(e) => setCategoria(e.target.value)}>
                                <option value="salud">Salud</option>
                                <option value="ejercicio">Ejercicio</option>
                                <option value="estudio">Estudio</option>
                                <option value="trabajo">Trabajo</option>
                                <option value="alimentacion">Alimentación</option>
                                <option value="otro">Otro</option>
                            </select>
                        </div>

                        <div className="field">
                            <label htmlFor="intervalo">Intervalo</label>
                            <select id="intervalo" title="Intervalo" value={intervalo_meta} onChange={(e) => setIntervalo(e.target.value)}>
                                <option value="diario">Diario</option>
                                <option value="semanal">Semanal</option>
                                <option value="mensual">Mensual</option>
                            </select>
                        </div>

                        <div className="field">
                            <label htmlFor="meta">Meta</label>
                            <input
                                id="meta"
                                title="Meta"
                                type="number"
                                min={1}
                                value={meta_repeticion}
                                onChange={(e) => setMeta(parseInt(e.target.value || '1', 10))}
                                required
                            />
                        </div>

                        <div className="field">
                            <label htmlFor="dificultad">Dificultad</label>
                            <select id="dificultad" title="Dificultad" value={dificultad} onChange={(e) => setDificultad(e.target.value)}>
                                <option value="facil">Fácil (3 pts)</option>
                                <option value="medio">Medio (5 pts)</option>
                                <option value="dificil">Difícil (8 pts)</option>
                            </select>
                        </div>
                    </div>

                    <div className="field checkboxField">
                        <label>
                            <input
                                type="checkbox"
                                checked={activo}
                                onChange={(e) => setActivo(e.target.checked)}
                            />
                            Hábito activo
                        </label>
                    </div>

                    {error && <div className="errorMsg">{error}</div>}

                    <div className="actions">
                        <button type="button" className="btnGhost" onClick={() => { reset(); onClose(); }}>
                            Cancelar
                        </button>
                        <button type="submit" className="btnPrimary" disabled={submitting}>
                            <Save size={16} /> {submitting ? 'Guardando…' : 'Guardar Cambios'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
