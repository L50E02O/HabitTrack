export const CATEGORIAS = [
    { id: 'salud', nombre: 'Salud' },
    { id: 'ejercicio', nombre: 'Ejercicio' },
    { id: 'estudio', nombre: 'Estudio' },
    { id: 'trabajo', nombre: 'Trabajo' },
    { id: 'alimentacion', nombre: 'Alimentación' },
    { id: 'otro', nombre: 'Otro' },
];

export const HABITOS_POR_CATEGORIA: Record<string, Array<{ nombre: string; unidadMedida: string }>> = {
    salud: [
        { nombre: 'Tomar vitaminas', unidadMedida: 'dosis' },
        { nombre: 'Dormir 8 horas', unidadMedida: 'horas' },
        { nombre: 'Meditar', unidadMedida: 'minutos' },
        { nombre: 'Cuidado de piel', unidadMedida: 'sesiones' },
    ],
    ejercicio: [
        { nombre: 'Correr', unidadMedida: 'minutos' },
        { nombre: 'Nadar', unidadMedida: 'minutos' },
        { nombre: 'Saltar la cuerda', unidadMedida: 'minutos' },
        { nombre: 'Ciclismo', unidadMedida: 'minutos' },
        { nombre: 'Pesas', unidadMedida: 'minutos' },
        { nombre: 'Yoga', unidadMedida: 'minutos' },
    ],
    estudio: [
        { nombre: 'Leer', unidadMedida: 'minutos' },
        { nombre: 'Hacer tareas', unidadMedida: 'minutos' },
        { nombre: 'Aprender idioma', unidadMedida: 'minutos' },
        { nombre: 'Cursos online', unidadMedida: 'minutos' },
    ],
    trabajo: [
        { nombre: 'Trabajar en proyecto', unidadMedida: 'horas' },
        { nombre: 'Reuniones', unidadMedida: 'horas' },
        { nombre: 'Productividad', unidadMedida: 'horas' },
    ],
    alimentacion: [
        { nombre: 'Beber agua', unidadMedida: 'litros' },
        { nombre: 'Comer frutas', unidadMedida: 'porciones' },
        { nombre: 'Comer verduras', unidadMedida: 'porciones' },
        { nombre: 'Desayunar saludable', unidadMedida: 'días' },
    ],
    otro: [
        { nombre: 'Lectura personal', unidadMedida: 'minutos' },
        { nombre: 'Networking', unidadMedida: 'sesiones' },
        { nombre: 'Hobby personal', unidadMedida: 'horas' },
        { nombre: 'Repeticiones de ejercicio', unidadMedida: 'repetición' },
    ],
};

export const UNIQUE_UNIDADES = Array.from(
    new Set(
        Object.values(HABITOS_POR_CATEGORIA)
            .flat()
            .map(h => h.unidadMedida)
    )
).sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

