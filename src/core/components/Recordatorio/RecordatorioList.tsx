import { useState, useEffect } from 'react';
import { Bell, Trash2, Edit2, Clock, Power } from 'lucide-react';
import { supabase } from '../../../config/supabase';
import {
    getRecordatoriosByPerfil,
    deleteRecordatorio,
    toggleRecordatorio,
    updateHoraRecordatorio,
    updateMensajeRecordatorio
} from '../../../services/recordatorio/recordatorioService';
import './RecordatorioList.css';

interface RecordatorioExtended {
    id_recordatorio: string;
    id_perfil: string;
    id_habito: string;
    mensaje: string;
    activo: boolean;
    intervalo_recordar: string;
    habito?: {
        nombre_habito: string;
        descripcion?: string;
    };
}

// Funciones de conversión de zona horaria
const convertirUTCALocal = (horaUTC: string): string => {
    // horaUTC viene como "HH:MM:SS" o "HH:MM"
    const [horas, minutos] = horaUTC.split(':');
    const fecha = new Date();
    fecha.setUTCHours(parseInt(horas), parseInt(minutos), 0, 0);

    const horaLocal = fecha.getHours().toString().padStart(2, '0');
    const minutoLocal = fecha.getMinutes().toString().padStart(2, '0');
    return `${horaLocal}:${minutoLocal}`;
};

const convertirLocalAUTC = (horaLocal: string): string => {
    // horaLocal viene como "HH:MM"
    const [horas, minutos] = horaLocal.split(':');
    const fecha = new Date();
    fecha.setHours(parseInt(horas), parseInt(minutos), 0, 0);

    const horaUTC = fecha.getUTCHours().toString().padStart(2, '0');
    const minutoUTC = fecha.getUTCMinutes().toString().padStart(2, '0');
    return `${horaUTC}:${minutoUTC}:00`;
};

export default function RecordatorioList() {
    const [recordatorios, setRecordatorios] = useState<RecordatorioExtended[]>([]);
    const [loading, setLoading] = useState(true);
    const [editando, setEditando] = useState<string | null>(null);
    const [mensajeTemp, setMensajeTemp] = useState('');
    const [horaTemp, setHoraTemp] = useState('');

    useEffect(() => {
        cargarRecordatorios();
    }, []);

    const cargarRecordatorios = async () => {
        try {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                throw new Error('Usuario no autenticado');
            }

            const data = await getRecordatoriosByPerfil(user.id) as RecordatorioExtended[];
            setRecordatorios(data);
        } catch (error) {
            console.error('Error cargando recordatorios:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleEliminar = async (id: string) => {
        if (!confirm('¿Estás seguro de eliminar este recordatorio?')) {
            return;
        }

        try {
            await deleteRecordatorio(id);
            setRecordatorios(prev => prev.filter(r => r.id_recordatorio !== id));
        } catch (error) {
            console.error('Error eliminando recordatorio:', error);
            alert('Error al eliminar recordatorio');
        }
    };

    const handleToggle = async (id: string, activo: boolean) => {
        try {
            await toggleRecordatorio(id, !activo);
            setRecordatorios(prev =>
                prev.map(r =>
                    r.id_recordatorio === id ? { ...r, activo: !activo } : r
                )
            );
        } catch (error) {
            console.error('Error actualizando recordatorio:', error);
            alert('Error al actualizar recordatorio');
        }
    };

    const handleEditar = (recordatorio: RecordatorioExtended) => {
        setEditando(recordatorio.id_recordatorio);
        setMensajeTemp(recordatorio.mensaje);
        // Convertir de UTC a hora local para mostrar
        const horaLocal = convertirUTCALocal(recordatorio.intervalo_recordar);
        setHoraTemp(horaLocal);
    };

    const handleGuardarEdicion = async (id: string) => {
        try {
            // Convertir hora local a UTC antes de guardar
            const horaUTC = convertirLocalAUTC(horaTemp);

            await updateMensajeRecordatorio(id, mensajeTemp);
            await updateHoraRecordatorio(id, horaUTC);

            setRecordatorios(prev =>
                prev.map(r =>
                    r.id_recordatorio === id
                        ? { ...r, mensaje: mensajeTemp, intervalo_recordar: horaUTC }
                        : r
                )
            );

            setEditando(null);
        } catch (error) {
            console.error('Error guardando cambios:', error);
            alert('Error al guardar cambios');
        }
    };

    const handleCancelarEdicion = () => {
        setEditando(null);
        setMensajeTemp('');
        setHoraTemp('');
    };

    const formatearHora = (intervalo: string) => {
        // Convertir de UTC a hora local para mostrar
        return convertirUTCALocal(intervalo);
    };

    if (loading) {
        return (
            <div className="recordatorio-list-container">
                <div className="loading-spinner">
                    <div className="spinner"></div>
                    <p>Cargando recordatorios...</p>
                </div>
            </div>
        );
    }

    if (recordatorios.length === 0) {
        return (
            <div className="recordatorio-list-container">
                <div className="empty-state">
                    <Bell size={64} strokeWidth={1} />
                    <h3>No tienes recordatorios</h3>
                    <p>Agrega recordatorios desde las opciones de cada hábito</p>
                </div>
            </div>
        );
    }

    return (
        <div className="recordatorio-list-container">
            <div className="recordatorio-list-header">
                <Bell size={24} />
                <h2>Mis Recordatorios ({recordatorios.length})</h2>
            </div>

            <div className="recordatorios-grid">
                {recordatorios.map((recordatorio) => (
                    <div
                        key={recordatorio.id_recordatorio}
                        className={`recordatorio-item ${!recordatorio.activo ? 'inactivo' : ''}`}
                    >
                        {editando === recordatorio.id_recordatorio ? (
                            // Modo edición
                            <div className="recordatorio-edit-mode">
                                <div className="edit-field">
                                    <label>Hábito:</label>
                                    <p className="habit-name-edit">{recordatorio.habito?.nombre_habito}</p>
                                </div>

                                <div className="edit-field">
                                    <label htmlFor="edit-mensaje">Mensaje:</label>
                                    <input
                                        id="edit-mensaje"
                                        type="text"
                                        value={mensajeTemp}
                                        onChange={(e) => setMensajeTemp(e.target.value)}
                                        className="edit-input"
                                        placeholder="Escribe el mensaje del recordatorio"
                                    />
                                </div>

                                <div className="edit-field">
                                    <label htmlFor="edit-hora">Hora:</label>
                                    <input
                                        id="edit-hora"
                                        type="time"
                                        value={horaTemp}
                                        onChange={(e) => setHoraTemp(e.target.value)}
                                        className="edit-input"
                                        title="Hora del recordatorio"
                                    />
                                </div>

                                <div className="edit-actions">
                                    <button
                                        onClick={() => handleGuardarEdicion(recordatorio.id_recordatorio)}
                                        className="btn-save"
                                    >
                                        Guardar
                                    </button>
                                    <button onClick={handleCancelarEdicion} className="btn-cancel">
                                        Cancelar
                                    </button>
                                </div>
                            </div>
                        ) : (
                            // Modo vista
                            <>
                                <div className="recordatorio-header-item">
                                    <div className="habit-badge">
                                        {recordatorio.habito?.nombre_habito || 'Hábito eliminado'}
                                    </div>
                                    <button
                                        onClick={() => handleToggle(recordatorio.id_recordatorio, recordatorio.activo)}
                                        className={`toggle-btn ${recordatorio.activo ? 'activo' : 'inactivo'}`}
                                        title={recordatorio.activo ? 'Desactivar' : 'Activar'}
                                    >
                                        <Power size={18} />
                                    </button>
                                </div>

                                <div className="recordatorio-body-item">
                                    <div className="mensaje-section">
                                        <Bell size={20} className="icon-mensaje" />
                                        <p className="mensaje-text">{recordatorio.mensaje}</p>
                                    </div>

                                    <div className="hora-section">
                                        <Clock size={18} />
                                        <span className="hora-text">
                                            {formatearHora(recordatorio.intervalo_recordar)}
                                        </span>
                                    </div>
                                </div>

                                <div className="recordatorio-footer-item">
                                    <button
                                        onClick={() => handleEditar(recordatorio)}
                                        className="btn-icon edit"
                                        title="Editar"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleEliminar(recordatorio.id_recordatorio)}
                                        className="btn-icon delete"
                                        title="Eliminar"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                ))}
            </div>

            <div className="recordatorio-list-footer">
                <p className="footer-info">
                    Los recordatorios se envien a la hora especifica en la barra de notificaciones del dispotivo 
                </p>
            </div>
        </div>
    );
}
