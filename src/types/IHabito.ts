export interface IHabito{
    id_habito: string;
    id_perfil: string;
    nombre_habito: string;
    descripcion: string;
    categoria: string | "ejercicio" | "alimentacion" | "estudio" | "salud" | "trabajo" | "otro";
    intervalo_meta: string | "diario" | "semanal" | "mensual";
    meta_repeticion: number;
    unidad_medida: string;
    fecha_creacion: Date;
    activo: boolean;
    dificultad: string | "facil" | "medio" | "dificil";
    puntos: number;
}

export interface CreateIHabito{
    id_perfil: string;
    nombre_habito: string;
    descripcion: string;
    categoria: string | "ejercicio" | "alimentacion" | "estudio" | "salud" | "trabajo" | "otro";
    intervalo_meta: string | "diario" | "semanal" | "mensual";
    meta_repeticion: number;
    unidad_medida: string;
    fecha_creacion: Date;
    activo: boolean;
    dificultad: string | "facil" | "medio" | "dificil";
    puntos: number;
}

export interface UpdateIHabito{
    id_perfil?: string;
    nombre_habito?: string;
    descripcion?: string;
    categoria?: string | "ejercicio" | "alimentacion" | "estudio" | "salud" | "trabajo" | "otro";
    intervalo_meta?: string | "diario" | "semanal" | "mensual";
    meta_repeticion?: number;
    unidad_medida?: string;
    fecha_creacion?: Date;
    activo?: boolean;
    dificultad?: string | "facil" | "medio" | "dificil";
    puntos?: number;
}