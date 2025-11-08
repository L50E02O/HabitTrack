export interface IPerfil {
    id: string;
    nombre: string;
    foto_perfil?: string;
    puntos: number;
    protectores_racha: number;
}

export interface UpdateIPerfil {
    nombre?: string;
    foto_perfil?: string;
    puntos?: number;
    protectores_racha?: number;
}

// NO es necesrario un CreateIPerfil porque el id se genera automáticamente al crear un nuevo perfil