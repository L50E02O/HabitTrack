import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { createHabito } from '../../../services/habito/habitoService';
import type { IHabito, CreateIHabito } from '../../../types/IHabito';
import './CreateHabitoModal.css';

// Definir hábitos predefinidos por categoría con su unidad de medida
const HABITOS_POR_CATEGORIA: Record<string, Array<{ nombre: string; unidadMedida: string }>> = {
    salud: [
        { nombre: 'Tomar vitaminas', unidadMedida: 'dosis' },
        { nombre: 'Dormir 8 horas', unidadMedida: 'horas' },
        { nombre: 'Meditar', unidadMedida: 'minutos' },
        { nombre: 'Cuidado de piel', unidadMedida: 'sesiones' },
    ],
    ejercicio: [
        { nombre: 'Correr', unidadMedida: 'minutos' },
        { nombre: 'Nadar', unidadMedida: 'minutos' },
        { nombre: 'Saltar la cuerda', unidadMedida: 'minutos' },
        { nombre: 'Ciclismo', unidadMedida: 'minutos' },
        { nombre: 'Pesas', unidadMedida: 'minutos' },
        { nombre: 'Yoga', unidadMedida: 'minutos' },
    ],
    estudio: [
        { nombre: 'Leer', unidadMedida: 'minutos' },
        { nombre: 'Hacer tareas', unidadMedida: 'minutos' },
        { nombre: 'Aprender idioma', unidadMedida: 'minutos' },
        { nombre: 'Cursos online', unidadMedida: 'minutos' },
    ],
    trabajo: [
        { nombre: 'Trabajar en proyecto', unidadMedida: 'horas' },
        { nombre: 'Reuniones', unidadMedida: 'horas' },
        { nombre: 'Productividad', unidadMedida: 'horas' },
    ],
    alimentacion: [
        { nombre: 'Beber agua', unidadMedida: 'litros' },
        { nombre: 'Comer frutas', unidadMedida: 'porciones' },
        { nombre: 'Comer verduras', unidadMedida: 'porciones' },
        { nombre: 'Desayunar saludable', unidadMedida: 'días' },
    ],
    otro: [
        { nombre: 'Lectura personal', unidadMedida: 'minutos' },
        { nombre: 'Networking', unidadMedida: 'sesiones' },
        { nombre: 'Hobby personal', unidadMedida: 'horas' },
    ],
};

type Props = {
    userId: string;
    open: boolean;
    onClose: () => void;
    onCreated: (h: IHabito) => void;
    habitosActuales?: number;
};

export default function CreateHabitoModal({ userId, open, onClose, onCreated, habitosActuales = 0 }: Props) {
    const [nombre_habito, setNombre] = useState('');
    const [descripcion, setDescripcion] = useState('');
    const [categoria, setCategoria] = useState<string>('salud');
    const [intervalo_meta, setIntervalo] = useState<string>('semanal');
    const [meta_repeticion, setMeta] = useState<number>(7);
    const [dificultad, setDificultad] = useState<string>('medio');
    const [unidadMedida, setUnidadMedida] = useState<string>('minutos');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!open) return null;

    // Validar límite de 9 hábitos
    const LIMITE_HABITOS = 9;
    const puedeCrearMas = habitosActuales < LIMITE_HABITOS;

    const reset = () => {
        setNombre('');
        setDescripcion('');
        setCategoria('salud');
        setIntervalo('semanal');
        setMeta(7);
        setDificultad('medio');
        setUnidadMedida('minutos');
        setError(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);

        // Validar límite de 9 hábitos
        if (!puedeCrearMas) {
            setError(`Has alcanzado el límite máximo de ${LIMITE_HABITOS} hábitos. Elimina alguno para crear uno nuevo.`);
            setSubmitting(false);
            return;
        }

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

                {!puedeCrearMas ? (
                    <div className="form">
                        <div className="errorMsg">
                            <strong>Límite alcanzado</strong>
                            <p>Solo puedes tener un máximo de {LIMITE_HABITOS} hábitos (3 filas × 3 columnas).</p>
                            <p>Elimina un hábito existente para crear uno nuevo.</p>
                        </div>
                        <div className="actions">
                            <button type="button" className="btnPrimary" onClick={() => { reset(); onClose(); }}>
                                Entendido
                            </button>
                        </div>
                    </div>
                ) : (
                <form className="form" onSubmit={handleSubmit}>
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
                        <label htmlFor="habitoPredefinido">Selecciona un hábito predefinido (opcional)</label>
                        <select 
                            id="habitoPredefinido" 
                            title="Hábito predefinido"
                            defaultValue=""
                            onChange={(e) => {
                                if (e.target.value) {
                                    const habito = HABITOS_POR_CATEGORIA[categoria]?.find(h => h.nombre === e.target.value);
                                    if (habito) {
                                        setNombre(habito.nombre);
                                        setUnidadMedida(habito.unidadMedida);
                                        e.target.value = '';
                                    }
                                }
                            }}
                        >
                            <option value="">-- Elige un hábito --</option>
                            {HABITOS_POR_CATEGORIA[categoria]?.map((habito, idx) => (
                                <option key={idx} value={habito.nombre}>
                                    {habito.nombre} ({habito.unidadMedida})
                                </option>
                            ))}
                        </select>
                    </div>

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
                            <label htmlFor="intervalo">Intervalo</label>
                            <select id="intervalo" title="Intervalo" value={intervalo_meta} onChange={(e) => setIntervalo(e.target.value)}>
                                <option value="diario">Diario</option>
                                <option value="semanal">Semanal</option>
                                <option value="mensual">Mensual</option>
                            </select>
                        </div>

                        <div className="field">
                            <label htmlFor="meta">Meta (máx. 365)</label>
                            <input
                                id="meta"
                                title="Meta"
                                type="number"
                                min={1}
                                max={365}
                                value={meta_repeticion}
                                onChange={(e) => {
                                    const value = parseInt(e.target.value || '1', 10);
                                    setMeta(Math.min(365, Math.max(1, value)));
                                }}
                                required
                            />
                        </div>

                        <div className="field">
                            <label htmlFor="unidadMedida">Unidad de Medida</label>
                            <input
                                id="unidadMedida"
                                title="Unidad de medida"
                                type="text"
                                value={unidadMedida}
                                onChange={(e) => setUnidadMedida(e.target.value)}
                                placeholder="Ej. minutos, km, porciones"
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
                )}
            </div>
        </div>
    );
}
