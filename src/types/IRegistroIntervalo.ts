export interface IRegistroIntervalo {
    id_registro: string;
    id_habito: string;
    fecha: Date;
    cumplido: boolean;
    notas: string;
    puntos: number;
}

export interface CreateIRegistroIntervalo {
    id_habito: string;
    fecha: Date;
    cumplido: boolean;
    notas: string;
    puntos: number;
}

export interface UpdateIRegistroIntervalo {
    id_habito?: string;
    fecha?: Date;
    cumplido?: boolean;
    notas?: string;
    puntos?: number;
}