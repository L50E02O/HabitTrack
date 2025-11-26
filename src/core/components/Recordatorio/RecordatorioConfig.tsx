import { useState } from 'react';
import { Bell } from 'lucide-react';
import { supabase } from '../../../config/supabase';
import { solicitarPermisoNotificaciones } from '../../../services/recordatorio/notificacionService';
import './RecordatorioConfig.css';

interface RecordatorioConfigProps {
    habitoId: string;
    nombreHabito: string;
    onClose: () => void;
}

export default function RecordatorioConfig({ habitoId, nombreHabito, onClose }: RecordatorioConfigProps) {
    const [hora, setHora] = useState('09:00');
    const [activo, setActivo] = useState(true);
    const [mensajeRecordatorio, setMensajeRecordatorio] = useState(`Es hora de: ${nombreHabito}`);
    const [guardando, setGuardando] = useState(false);
    const [mensaje, setMensaje] = useState<{ texto: string; tipo: 'success' | 'error' } | null>(null);

    const handleGuardar = async () => {
        setGuardando(true);
        setMensaje(null);

        try {
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                throw new Error('Usuario no autenticado');
            }

            // Convertir hora local a UTC
            // Crear fecha con la hora seleccionada en zona horaria local
            const [horas, minutos] = hora.split(':');
            const fechaLocal = new Date();
            fechaLocal.setHours(parseInt(horas), parseInt(minutos), 0, 0);

            // Obtener la hora en UTC
            const horaUTC = fechaLocal.toISOString().substring(11, 19); // HH:MM:SS en UTC

            console.log(`Hora local seleccionada: ${hora}:00`);
            console.log(`Hora UTC a guardar: ${horaUTC}`);

            // Crear recordatorio usando la estructura REAL de la base de datos
            const { data, error } = await supabase
                .from('recordatorio')
                .insert({
                    id_habito: habitoId,
                    id_perfil: user.id,
                    mensaje: mensajeRecordatorio,
                    activo: activo,
                    intervalo_recordar: horaUTC, // Guardamos en UTC
                })
                .select()
                .single();

            if (error) {
                console.error('Error de Supabase:', error);
                throw error;
            }

            console.log('Recordatorio creado:', data);
            
            // Solicitar permisos de notificaciones si no los tiene
            try {
                const permiso = await solicitarPermisoNotificaciones();
                if (permiso === 'granted') {
                    console.log('Permisos de notificaciones otorgados');
                } else if (permiso === 'denied') {
                    console.warn('Permisos de notificaciones denegados');
                    setMensaje({ 
                        texto: `Recordatorio guardado, pero las notificaciones están deshabilitadas. Actívalas en la configuración del navegador.`, 
                        tipo: 'success' 
                    });
                }
            } catch (error) {
                console.warn('Error solicitando permisos de notificaciones:', error);
            }

            setMensaje({ texto: `Recordatorio guardado para las ${hora} (hora local)`, tipo: 'success' });
            console.log(`Recordatorio configurado para ${nombreHabito} a las ${hora} (hora local) / ${horaUTC} (UTC)`);

            setTimeout(() => {
                onClose();
            }, 2000);
        } catch (error: any) {
            console.error('Error al guardar recordatorio:', error);
            setMensaje({
                texto: `Error: ${error.message || 'Error al guardar recordatorio'}`,
                tipo: 'error'
            });
        } finally {
            setGuardando(false);
        }
    };

    return (
        <div className="recordatorio-overlay" onClick={onClose}>
            <div className="recordatorio-modal" onClick={(e) => e.stopPropagation()}>
                <div className="recordatorio-header">
                    <Bell size={24} />
                    <h2>Configurar Recordatorio</h2>
                </div>

                <div className="recordatorio-body">
                    <p className="habito-nombre">Hábito: <strong>{nombreHabito}</strong></p>

                    <div className="form-group">
                        <label htmlFor="mensaje">Mensaje del recordatorio:</label>
                        <input
                            type="text"
                            id="mensaje"
                            value={mensajeRecordatorio}
                            onChange={(e) => setMensajeRecordatorio(e.target.value)}
                            className="text-input"
                            placeholder="Ej: Es hora de hacer ejercicio"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="hora">Hora del recordatorio:</label>
                        <input
                            type="time"
                            id="hora"
                            value={hora}
                            onChange={(e) => setHora(e.target.value)}
                            className="time-input"
                        />
                    </div>

                    <div className="form-group checkbox-group">
                        <label>
                            <input
                                type="checkbox"
                                checked={activo}
                                onChange={(e) => setActivo(e.target.checked)}
                            />
                            <span>Activar recordatorio diario por email</span>
                        </label>
                    </div>

                    <div className="info-box">
                        <p>📧 Recibirás un email recordatorio todos los días a las <strong>{hora}</strong> en tu correo registrado.</p>
                    </div>

                    {mensaje && (
                        <div className={`mensaje ${mensaje.tipo}`}>
                            {mensaje.texto}
                        </div>
                    )}
                </div>

                <div className="recordatorio-footer">
                    <button onClick={onClose} className="btn-cancelar" disabled={guardando}>
                        Cancelar
                    </button>
                    <button onClick={handleGuardar} className="btn-guardar" disabled={guardando}>
                        {guardando ? 'Guardando...' : 'Guardar'}
                    </button>
                </div>
            </div>
        </div>
    );
}
