export interface IRecordatorio {
    id_recordatorio: string;
    id_perfil: string;
    id_habito: string;
    mensaje: string;
    activo: boolean;
    intervalo_recordatorio: string;
}

export interface CreateIRecordatorio {
    id_perfil: string;
    id_habito: string;
    mensaje: string;
    activo: boolean;
    intervalo_recordatorio: string;
}

export interface UpdateIRecordatorio {
    id_perfil?: string;
    id_habito?: string;
    mensaje?: string;
    activo?: boolean;
    intervalo_recordatorio?: string;
}