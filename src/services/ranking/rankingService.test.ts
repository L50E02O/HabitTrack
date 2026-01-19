import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
    obtenerRankingCompleto,
    obtenerEstadisticasUsuario,
    obtenerTopUsuarios,
    obtenerUsuariosCercanos
} from './rankingService';
import { supabase } from '../../config/supabase';

// Mock de Supabase
vi.mock('../../config/supabase', () => ({
    supabase: {
        from: vi.fn(),
    },
}));

// Mock de rangos
vi.mock('../../core/constants/rangos', () => ({
    obtenerRangoPorPuntos: vi.fn((puntos: number) => ({
        nombre: puntos >= 1000 ? 'Maestro' : puntos >= 500 ? 'Experto' : 'Principiante',
        color: '#4a90e2',
        nivel: puntos >= 1000 ? 3 : puntos >= 500 ? 2 : 1,
        puntosMinimos: puntos >= 1000 ? 1000 : puntos >= 500 ? 500 : 0,
        puntosMaximos: puntos >= 1000 ? 1999 : puntos >= 500 ? 999 : 499,
        icono: 'Star',
    })),
    obtenerSiguienteRango: vi.fn((rangoActual: any) => {
        if (rangoActual.nivel === 1) {
            return {
                nombre: 'Aprendiz',
                color: '#6B8E23',
                nivel: 2,
                puntosMinimos: 100,
                puntosMaximos: 249,
                icono: 'Sprout',
            };
        }
        if (rangoActual.nivel === 2) {
            return {
                nombre: 'Comprometido',
                color: '#FF6B35',
                nivel: 3,
                puntosMinimos: 250,
                puntosMaximos: 499,
                icono: 'Flame',
            };
        }
        return null; // Ya está en el rango máximo
    }),
    calcularProgresoRango: vi.fn((puntos: number, rango: any) => {
        if (rango.puntosMaximos === Infinity) return 100;
        const puntosEnRango = puntos - rango.puntosMinimos;
        const rangoTotal = rango.puntosMaximos - rango.puntosMinimos + 1;
        return Math.min(100, Math.round((puntosEnRango / rangoTotal) * 100));
    }),
    puntosFaltantesParaSiguienteRango: vi.fn((puntos: number, siguienteRango: any) => {
        if (!siguienteRango) return 0;
        return Math.max(0, siguienteRango.puntosMinimos - puntos);
    }),
}));

describe('RankingService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('obtenerRankingCompleto', () => {
        it('debería obtener ranking completo con límite por defecto de 50', async () => {
            const mockUsuarios = [
                { id: '1', nombre: 'Usuario 1', puntos: 1000, foto_perfil: null },
                { id: '2', nombre: 'Usuario 2', puntos: 800, foto_perfil: null },
                { id: '3', nombre: 'Usuario 3', puntos: 500, foto_perfil: null },
            ];

            const mockQuery = {
                select: vi.fn().mockReturnThis(),
                order: vi.fn().mockReturnThis(),
                limit: vi.fn().mockResolvedValue({
                    data: mockUsuarios,
                    error: null,
                }),
            };

            (supabase.from as any) = vi.fn().mockReturnValue(mockQuery);

            const resultado = await obtenerRankingCompleto();

            expect(supabase.from).toHaveBeenCalledWith('perfil');
            expect(mockQuery.select).toHaveBeenCalledWith('id, nombre, puntos, foto_perfil');
            expect(mockQuery.order).toHaveBeenCalledWith('puntos', { ascending: false });
            expect(mockQuery.limit).toHaveBeenCalledWith(50);
            expect(resultado).toHaveLength(3);
            expect(resultado[0].posicion).toBe(1);
            expect(resultado[0].puntos).toBe(1000);
        });

        it('debería limitar a máximo 100 usuarios aunque se pase un límite mayor', async () => {
            const mockUsuarios = Array.from({ length: 100 }, (_, i) => ({
                id: `user-${i}`,
                nombre: `Usuario ${i}`,
                puntos: 1000 - i,
                foto_perfil: null,
            }));

            const mockQuery = {
                select: vi.fn().mockReturnThis(),
                order: vi.fn().mockReturnThis(),
                limit: vi.fn().mockResolvedValue({
                    data: mockUsuarios,
                    error: null,
                }),
            };

            (supabase.from as any) = vi.fn().mockReturnValue(mockQuery);

            const resultado = await obtenerRankingCompleto(200);

            expect(mockQuery.limit).toHaveBeenCalledWith(100);
            expect(resultado).toHaveLength(100);
        });

        it('debería usar el límite especificado si es menor a 100', async () => {
            const mockUsuarios = [
                { id: '1', nombre: 'Usuario 1', puntos: 1000, foto_perfil: null },
                { id: '2', nombre: 'Usuario 2', puntos: 800, foto_perfil: null },
            ];

            const mockQuery = {
                select: vi.fn().mockReturnThis(),
                order: vi.fn().mockReturnThis(),
                limit: vi.fn().mockResolvedValue({
                    data: mockUsuarios,
                    error: null,
                }),
            };

            (supabase.from as any) = vi.fn().mockReturnValue(mockQuery);

            const resultado = await obtenerRankingCompleto(5);

            expect(mockQuery.limit).toHaveBeenCalledWith(5);
            expect(resultado).toHaveLength(2);
        });

        it('debería mapear correctamente los datos al formato IUsuarioRanking', async () => {
            const mockUsuarios = [
                { id: '1', nombre: 'Usuario 1', puntos: 1000, foto_perfil: 'url1' },
                { id: '2', nombre: 'Usuario 2', puntos: 500, foto_perfil: null },
            ];

            const mockQuery = {
                select: vi.fn().mockReturnThis(),
                order: vi.fn().mockReturnThis(),
                limit: vi.fn().mockResolvedValue({
                    data: mockUsuarios,
                    error: null,
                }),
            };

            (supabase.from as any) = vi.fn().mockReturnValue(mockQuery);

            const resultado = await obtenerRankingCompleto();

            expect(resultado[0]).toEqual({
                id: '1',
                nombre: 'Usuario 1',
                puntos: 1000,
                posicion: 1,
                rango: expect.objectContaining({
                    nombre: expect.any(String),
                    color: expect.any(String),
                    nivel: expect.any(Number),
                }),
                foto_perfil: 'url1',
            });
        });

        it('debería manejar usuarios sin puntos (default 0)', async () => {
            const mockUsuarios = [
                { id: '1', nombre: 'Usuario 1', puntos: null, foto_perfil: null },
            ];

            const mockQuery = {
                select: vi.fn().mockReturnThis(),
                order: vi.fn().mockReturnThis(),
                limit: vi.fn().mockResolvedValue({
                    data: mockUsuarios,
                    error: null,
                }),
            };

            (supabase.from as any) = vi.fn().mockReturnValue(mockQuery);

            const resultado = await obtenerRankingCompleto();

            expect(resultado[0].puntos).toBe(0);
        });

        it('debería lanzar error si Supabase retorna error', async () => {
            const mockError = { message: 'Error de base de datos', code: 'PGRST116' };

            const mockQuery = {
                select: vi.fn().mockReturnThis(),
                order: vi.fn().mockReturnThis(),
                limit: vi.fn().mockResolvedValue({
                    data: null,
                    error: mockError,
                }),
            };

            (supabase.from as any) = vi.fn().mockReturnValue(mockQuery);

            await expect(obtenerRankingCompleto()).rejects.toEqual(mockError);
        });

        it('debería retornar array vacío si no hay datos', async () => {
            const mockQuery = {
                select: vi.fn().mockReturnThis(),
                order: vi.fn().mockReturnThis(),
                limit: vi.fn().mockResolvedValue({
                    data: [],
                    error: null,
                }),
            };

            (supabase.from as any) = vi.fn().mockReturnValue(mockQuery);

            const resultado = await obtenerRankingCompleto();

            expect(resultado).toEqual([]);
        });
    });

    describe('obtenerEstadisticasUsuario', () => {
        it('debería obtener estadísticas correctas del usuario', async () => {
            const userId = 'user-1';
            const mockUsuario = { puntos: 750 };

            const mockCountQuery = {
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                maybeSingle: vi.fn().mockResolvedValue({
                    data: mockUsuario,
                    error: null,
                }),
            };

            // Mock para la query de conteo con gt (usuarios con más puntos)
            // Esta query se llama así: select('id', { count: 'exact', head: true }).gt('puntos', puntos)
            const mockCountAbove = {
                gt: vi.fn().mockResolvedValue({
                    count: 5,
                    error: null,
                }),
            };

            // Mock para la query de conteo total (sin gt)
            // Esta query se llama así: select('id', { count: 'exact', head: true })
            // NOTA: En Supabase, cuando usas count: 'exact' con head: true, retorna directamente { count, error }
            // No necesita .maybeSingle() ni ningún otro método, retorna la promesa directamente
            const mockCountTotalPromise = Promise.resolve({
                count: 20,
                error: null,
            });

            // Contador para distinguir entre las dos llamadas a select con count
            // Primera: select('id', { count: 'exact', head: true }).gt() - usuarios con más puntos
            // Segunda: select('id', { count: 'exact', head: true }) - total usuarios
            let countQueryCallCount = 0;

            // Helper: Crear mock de query de conteo
            const createCountQueryMock = (callNumber: number) => {
                if (callNumber === 1) {
                    return mockCountAbove;
                }
                return mockCountTotalPromise;
            };

            // Helper: Crear mock de select
            const createSelectMock = (fields: string, options?: any) => {
                if (fields === 'puntos' && !options) {
                    return mockCountQuery;
                }
                
                if (options && options.count === 'exact' && options.head === true && fields === 'id') {
                    countQueryCallCount++;
                    return createCountQueryMock(countQueryCallCount);
                }
                
                return mockCountQuery;
            };

            (supabase.from as any) = vi.fn((table: string) => {
                if (table === 'perfil') {
                    return {
                        select: vi.fn(createSelectMock),
                    };
                }
                return {};
            });

            const resultado = await obtenerEstadisticasUsuario(userId);

            expect(resultado).toHaveProperty('tuPosicion', 6); // 5 usuarios arriba + 1
            expect(resultado).toHaveProperty('totalUsuarios', 20);
            expect(resultado).toHaveProperty('rangoActual');
            expect(resultado).toHaveProperty('siguienteRango');
            expect(resultado).toHaveProperty('progresoRango');
            expect(resultado).toHaveProperty('puntosParaSiguienteRango');
        });

        it('debería manejar usuario sin puntos', async () => {
            const userId = 'user-1';

            const mockCountQuery = {
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                maybeSingle: vi.fn().mockResolvedValue({
                    data: null,
                    error: null,
                }),
            };

            // Mock para la query de conteo con gt (usuarios con más puntos)
            // Esta query se llama así: select('id', { count: 'exact', head: true }).gt('puntos', puntos)
            const mockCountAbove = {
                gt: vi.fn().mockResolvedValue({
                    count: 0,
                    error: null,
                }),
            };

            // Mock para la query de conteo total (sin gt)
            // Esta query se llama así: select('id', { count: 'exact', head: true })
            const mockCountTotal = {
                maybeSingle: vi.fn().mockResolvedValue({
                    count: 10,
                    error: null,
                }),
            };

            // Contador para distinguir entre las dos llamadas a select con count
            // Primera: select('id', { count: 'exact', head: true }).gt() - usuarios con más puntos
            // Segunda: select('id', { count: 'exact', head: true }) - total usuarios
            let countQueryCallCount = 0;

            // Helper: Crear mock de query de conteo
            const createCountQueryMock = (callNumber: number) => {
                if (callNumber === 1) {
                    return mockCountAbove;
                }
                return mockCountTotal;
            };

            // Helper: Crear mock de select
            const createSelectMock = (fields: string, options?: any) => {
                if (fields === 'puntos' && !options) {
                    return mockCountQuery;
                }
                
                if (options && options.count === 'exact' && options.head === true && fields === 'id') {
                    countQueryCallCount++;
                    return createCountQueryMock(countQueryCallCount);
                }
                
                return mockCountQuery;
            };

            (supabase.from as any) = vi.fn((table: string) => {
                if (table === 'perfil') {
                    return {
                        select: vi.fn(createSelectMock),
                    };
                }
                return {};
            });

            const resultado = await obtenerEstadisticasUsuario(userId);

            expect(resultado.tuPosicion).toBe(1); // Sin puntos, está último
        });
    });

    describe('obtenerTopUsuarios', () => {
        it('debería llamar a obtenerRankingCompleto con el límite especificado', async () => {
            const mockUsuarios = [
                { id: '1', nombre: 'Usuario 1', puntos: 1000, foto_perfil: null },
            ];

            const mockQuery = {
                select: vi.fn().mockReturnThis(),
                order: vi.fn().mockReturnThis(),
                limit: vi.fn().mockResolvedValue({
                    data: mockUsuarios,
                    error: null,
                }),
            };

            (supabase.from as any) = vi.fn().mockReturnValue(mockQuery);

            const resultado = await obtenerTopUsuarios(10);

            expect(mockQuery.limit).toHaveBeenCalledWith(10);
            expect(resultado).toHaveLength(1);
        });

        it('debería usar límite por defecto de 10 si no se especifica', async () => {
            const mockUsuarios = [
                { id: '1', nombre: 'Usuario 1', puntos: 1000, foto_perfil: null },
            ];

            const mockQuery = {
                select: vi.fn().mockReturnThis(),
                order: vi.fn().mockReturnThis(),
                limit: vi.fn().mockResolvedValue({
                    data: mockUsuarios,
                    error: null,
                }),
            };

            (supabase.from as any) = vi.fn().mockReturnValue(mockQuery);

            await obtenerTopUsuarios();

            expect(mockQuery.limit).toHaveBeenCalledWith(10);
        });
    });

    describe('obtenerUsuariosCercanos', () => {
        it('debería obtener usuarios cercanos arriba y abajo', async () => {
            const userId = 'user-5';
            const mockUsuario = { puntos: 500 };

            const mockUsuarioQuery = {
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                maybeSingle: vi.fn().mockResolvedValue({
                    data: mockUsuario,
                    error: null,
                }),
            };

            const mockArriba = [
                { id: 'user-3', nombre: 'Usuario 3', puntos: 700, foto_perfil: null },
                { id: 'user-4', nombre: 'Usuario 4', puntos: 600, foto_perfil: null },
            ];

            const mockAbajo = [
                { id: 'user-5', nombre: 'Usuario 5', puntos: 500, foto_perfil: null },
                { id: 'user-6', nombre: 'Usuario 6', puntos: 400, foto_perfil: null },
            ];

            const mockArribaQuery = {
                select: vi.fn().mockReturnThis(),
                gt: vi.fn().mockReturnThis(),
                order: vi.fn().mockReturnThis(),
                limit: vi.fn().mockResolvedValue({
                    data: mockArriba,
                    error: null,
                }),
            };

            const mockAbajoQuery = {
                select: vi.fn().mockReturnThis(),
                lte: vi.fn().mockReturnThis(),
                order: vi.fn().mockReturnThis(),
                limit: vi.fn().mockResolvedValue({
                    data: mockAbajo,
                    error: null,
                }),
            };

            const mockCountQuery = {
                select: vi.fn().mockReturnThis(),
                gt: vi.fn().mockResolvedValue({
                    count: 2,
                    error: null,
                }),
            };

            // Helper: Crear mock según número de llamada
            const createMockByCallCount = (count: number) => {
                if (count === 1) {
                    return {
                        select: vi.fn(() => ({
                            eq: vi.fn(() => mockUsuarioQuery),
                        })),
                    };
                }
                if (count === 2) {
                    return mockArribaQuery;
                }
                if (count === 3) {
                    return mockAbajoQuery;
                }
                return mockCountQuery;
            };

            let callCount = 0;
            (supabase.from as any) = vi.fn((table: string) => {
                if (table === 'perfil') {
                    callCount++;
                    return createMockByCallCount(callCount);
                }
                return {};
            });

            const resultado = await obtenerUsuariosCercanos(userId, 2);

            expect(resultado).toHaveLength(4); // 2 arriba + 2 abajo
            expect(resultado[0].puntos).toBeGreaterThanOrEqual(resultado[1].puntos);
        });

        it('debería retornar array vacío si no hay usuarios', async () => {
            const userId = 'user-1';
            const mockUsuario = { puntos: 500 };

            const mockUsuarioQuery = {
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                maybeSingle: vi.fn().mockResolvedValue({
                    data: mockUsuario,
                    error: null,
                }),
            };

            const mockArribaQuery = {
                select: vi.fn().mockReturnThis(),
                gt: vi.fn().mockReturnThis(),
                order: vi.fn().mockReturnThis(),
                limit: vi.fn().mockResolvedValue({
                    data: [],
                    error: null,
                }),
            };

            const mockAbajoQuery = {
                select: vi.fn().mockReturnThis(),
                lte: vi.fn().mockReturnThis(),
                order: vi.fn().mockReturnThis(),
                limit: vi.fn().mockResolvedValue({
                    data: [],
                    error: null,
                }),
            };

            // Helper: Crear mock según número de llamada
            const createMockByCallCount = (count: number) => {
                if (count === 1) {
                    return {
                        select: vi.fn(() => ({
                            eq: vi.fn(() => mockUsuarioQuery),
                        })),
                    };
                }
                if (count === 2) {
                    return mockArribaQuery;
                }
                return mockAbajoQuery;
            };

            let callCount = 0;
            (supabase.from as any) = vi.fn((table: string) => {
                if (table === 'perfil') {
                    callCount++;
                    return createMockByCallCount(callCount);
                }
                return {};
            });

            const resultado = await obtenerUsuariosCercanos(userId, 2);

            expect(resultado).toEqual([]);
        });
    });
});

