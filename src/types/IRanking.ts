export interface IRango {
    nombre: string;
    puntosMinimos: number;
    puntosMaximos: number;
    icono: string;
    color: string;
    nivel: number;
}

export interface IUsuarioRanking {
    id: string;
    nombre: string;
    puntos: number;
    posicion: number;
    rango: IRango;
    foto_perfil?: string;
}

export interface IEstadisticasRanking {
    totalUsuarios: number;
    tuPosicion: number;
    puntosParaSiguienteRango: number;
    rangoActual: IRango;
    siguienteRango: IRango | null;
    progresoRango: number; // Porcentaje 0-100
}
