import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
    obtenerRankingCompleto,
    obtenerEstadisticasUsuario,
    obtenerTopUsuarios,
    obtenerUsuariosCercanos
} from './rankingService';
import { supabase } from '../../config/supabase';
import { obtenerRangoPorPuntos } from '../../core/constants/rangos';

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
    })),
}));

describe('RankingService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('obtenerRankingCompleto', () => {
        it('debería obtener ranking completo con límite por defecto de 100', async () => {
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
            expect(mockQuery.limit).toHaveBeenCalledWith(100);
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

            const mockCountAbove = {
                select: vi.fn().mockReturnThis(),
                gt: vi.fn().mockResolvedValue({
                    count: 5,
                    error: null,
                }),
            };

            const mockCountTotal = {
                select: vi.fn().mockReturnThis(),
                maybeSingle: vi.fn().mockResolvedValue({
                    count: 20,
                    error: null,
                }),
            };

            (supabase.from as any) = vi.fn((table: string) => {
                if (table === 'perfil') {
                    const query = {
                        select: vi.fn((fields: string) => {
                            if (fields === 'puntos') {
                                return mockCountQuery;
                            }
                            if (fields === 'id') {
                                return mockCountTotal;
                            }
                            return mockCountAbove;
                        }),
                    };
                    return query;
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

            const mockCountAbove = {
                select: vi.fn().mockReturnThis(),
                gt: vi.fn().mockResolvedValue({
                    count: 0,
                    error: null,
                }),
            };

            const mockCountTotal = {
                select: vi.fn().mockReturnThis(),
                maybeSingle: vi.fn().mockResolvedValue({
                    count: 10,
                    error: null,
                }),
            };

            (supabase.from as any) = vi.fn((table: string) => {
                if (table === 'perfil') {
                    const query = {
                        select: vi.fn((fields: string) => {
                            if (fields === 'puntos') {
                                return mockCountQuery;
                            }
                            if (fields === 'id') {
                                return mockCountTotal;
                            }
                            return mockCountAbove;
                        }),
                    };
                    return query;
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

            let callCount = 0;
            (supabase.from as any) = vi.fn((table: string) => {
                if (table === 'perfil') {
                    callCount++;
                    if (callCount === 1) {
                        // Primera llamada: obtener puntos del usuario
                        return {
                            select: vi.fn(() => ({
                                eq: vi.fn(() => mockUsuarioQuery),
                            })),
                        };
                    } else if (callCount === 2) {
                        // Segunda llamada: usuarios arriba
                        return mockArribaQuery;
                    } else if (callCount === 3) {
                        // Tercera llamada: usuarios abajo
                        return mockAbajoQuery;
                    } else {
                        // Cuarta llamada: count para posición
                        return mockCountQuery;
                    }
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

            let callCount = 0;
            (supabase.from as any) = vi.fn((table: string) => {
                if (table === 'perfil') {
                    callCount++;
                    if (callCount === 1) {
                        return {
                            select: vi.fn(() => ({
                                eq: vi.fn(() => mockUsuarioQuery),
                            })),
                        };
                    } else if (callCount === 2) {
                        return mockArribaQuery;
                    } else {
                        return mockAbajoQuery;
                    }
                }
                return {};
            });

            const resultado = await obtenerUsuariosCercanos(userId, 2);

            expect(resultado).toEqual([]);
        });
    });
});

