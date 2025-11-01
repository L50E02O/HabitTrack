export interface ILogro {
    id_logro: string;
    nombre_logro: string;
    descripcion: string;
    icono: string;
    criterio_racha: number;
}

export interface CreateILogro{
    nombre_logro: string;
    descripcion: string;
    icono: string;
    criterio_racha: number;
}

export interface UpdateILogro{
    nombre_logro?: string;
    descripcion?: string;
    icono?: string;
    criterio_racha?: number;
}