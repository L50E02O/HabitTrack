export interface IRacha{
    id_racha: string;
    id_registro_intervalo: string;
    inicio_recha: Date;
    fin_racha: Date;
    dias_consecutivos: number;
    racha_activa: boolean;
}

export interface CreateIRacha{
    id_registro_intervalo: string;
    inicio_recha: Date;
    fin_racha: Date;
    dias_consecutivos: number;
    racha_activa: boolean;
}

export interface UpdateIRacha{
    id_registro_intervalo?: string;
    inicio_recha?: Date;
    fin_racha?: Date;
    dias_consecutivos?: number;
    racha_activa?: boolean;
}