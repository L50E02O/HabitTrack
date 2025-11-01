export interface ILogroUsuario{
    id_logro_usuario: string;
    id_perfil: string;
    id_logro: string;
    fecha_obtenido: Date;
}

export interface CreateILogroUsuario{
    id_perfil: string;
    id_logro: string;
    fecha_obtenido: Date;
}

export interface UpdateILogroUsuario{
    id_perfil?: string;
    id_logro?: string;
    fecha_obtenido?: Date;
}