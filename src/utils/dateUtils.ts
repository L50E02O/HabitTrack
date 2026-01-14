/**
 * Convierte una fecha a string en formato YYYY-MM-DD usando la hora local.
 */
export function toDateString(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
}

/**
 * Calcula las fechas de inicio y fin de un período según el intervalo de meta.
 */
export function getPeriodDates(intervaloMeta: string | null, fechaBase?: Date): { inicio: Date; fin: Date } | null {
    const fecha = fechaBase || new Date();
    fecha.setHours(0, 0, 0, 0);

    if (intervaloMeta === "semanal") {
        // Inicio: Lunes de la semana actual
        const inicio = new Date(fecha);
        const diaSemana = inicio.getDay(); // 0 = Domingo, 1 = Lunes, ..., 6 = Sábado
        const diasDesdeLunes = diaSemana === 0 ? 6 : diaSemana - 1; // Si es domingo, retroceder 6 días
        inicio.setDate(inicio.getDate() - diasDesdeLunes);

        // Fin: Domingo de la misma semana (6 días después del lunes)
        const fin = new Date(inicio);
        fin.setDate(fin.getDate() + 6);
        fin.setHours(23, 59, 59, 999);
        return { inicio, fin };
    }

    if (intervaloMeta === "mensual") {
        // Inicio: Primer día del mes actual
        const inicio = new Date(fecha);
        inicio.setDate(1);

        // Fin: Último día del mes actual
        const fin = new Date(inicio);
        fin.setMonth(fin.getMonth() + 1);
        fin.setDate(0); // Último día del mes anterior
        fin.setHours(23, 59, 59, 999);
        return { inicio, fin };
    }

    // diario
    if (intervaloMeta === "diario") {
        const inicio = new Date(fecha);
        const fin = new Date(fecha);
        fin.setHours(23, 59, 59, 999);
        return { inicio, fin };
    }

    return null;
}
