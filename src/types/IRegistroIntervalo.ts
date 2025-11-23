export interface IRegistroIntervalo {
    id_registro: string;
    id_habito: string;
    fecha: Date;
    cumplido: boolean;
    puntos: number;
    progreso: number;
    fecha_inicio_intervalo?: Date | null;
    fecha_fin_intervalo?: Date | null;
}

export interface CreateIRegistroIntervalo {
    id_habito: string;
    fecha: Date;
    cumplido: boolean;
    puntos: number;
    progreso: number;
    fecha_inicio_intervalo?: Date | null;
    fecha_fin_intervalo?: Date | null;
}

export interface UpdateIRegistroIntervalo {
    id_habito?: string;
    fecha?: Date;
    cumplido?: boolean;
    puntos?: number;
    progreso?: number;
    fecha_inicio_intervalo?: Date | null;
    fecha_fin_intervalo?: Date | null;
}