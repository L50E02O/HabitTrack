// Estructura REAL de la base de datos según Supabase
export interface IRecordatorio {
    id_recordatorio: string;      // UUID, PK
    id_perfil: string;             // UUID, FK
    id_habito: string;             // UUID, FK
    mensaje: string;               // text
    activo: boolean;               // bool
    intervalo_recordar: string;    // time
}

export interface CreateIRecordatorio {
    id_perfil: string;
    id_habito: string;
    mensaje?: string;
    activo?: boolean;
    intervalo_recordar?: string;
}

export interface UpdateIRecordatorio {
    id_perfil?: string;
    id_habito?: string;
    mensaje?: string;
    activo?: boolean;
    intervalo_recordar?: string;
}