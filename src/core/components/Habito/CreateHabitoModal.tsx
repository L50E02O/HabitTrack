import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { createHabito } from '../../../services/habito/habitoService';
import type { IHabito, CreateIHabito } from '../../../types/IHabito';
import './CreateHabitoModal.css';

type Props = {
    userId: string;
    open: boolean;
    onClose: () => void;
    onCreated: (h: IHabito) => void;
};

export default function CreateHabitoModal({ userId, open, onClose, onCreated }: Props) {
    const [nombre_habito, setNombre] = useState('');
    const [descripcion, setDescripcion] = useState('');
    const [categoria, setCategoria] = useState<string>('salud');
    const [intervalo_meta, setIntervalo] = useState<string>('semanal');
    const [meta_repeticion, setMeta] = useState<number>(7);
    const [dificultad, setDificultad] = useState<string>('medio');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!open) return null;

    const reset = () => {
        setNombre('');
        setDescripcion('');
        setCategoria('salud');
        setIntervalo('semanal');
        setMeta(7);
        setDificultad('medio');
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

            const payload: CreateIHabito = {
                id_perfil: userId,
                nombre_habito,
                descripcion,
                categoria,
                intervalo_meta,
                meta_repeticion,
                fecha_creacion: new Date(),
                activo: true,
                dificultad,
                puntos: puntosBase,
            };
            const created = await createHabito(payload);
            onCreated(created);
            reset();
            onClose();
        } catch (err: any) {
            setError(err?.message || 'No se pudo crear el hábito');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="modalOverlay" role="dialog" aria-modal="true">
            <div className="modalCard">
                <div className="modalHeader">
                    <h3>Crear Nuevo Hábito</h3>
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

                    {error && <div className="errorMsg">{error}</div>}

                    <div className="actions">
                        <button type="button" className="btnGhost" onClick={() => { reset(); onClose(); }}>
                            Cancelar
                        </button>
                        <button type="submit" className="btnPrimary" disabled={submitting}>
                            <Plus size={16} /> {submitting ? 'Creando…' : 'Crear Hábito'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
