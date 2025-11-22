import { describe, it, expect, vi, beforeEach } from 'vitest';
import { supabase } from '../../config/supabase';
import {
  verificarYDesbloquearLogros,
  obtenerLogrosUsuario,
  obtenerProgresoLogros,
  obtenerSiguienteLogro,
} from './logroAutoService';

// Mock de Supabase
vi.mock('../../config/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

describe('logroAutoService', () => {
  const mockIdPerfil = 'test-perfil-id';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('verificarYDesbloquearLogros', () => {
    it('debe desbloquear logros cuando el usuario alcanza el criterio de racha', async () => {
      const mockLogrosDisponibles = [
        { id_logro: '1', nombre_logro: 'Primera Semana', criterio_racha: 7, icono: '🔥' },
        { id_logro: '2', nombre_logro: 'Primer Mes', criterio_racha: 30, icono: '🏆' },
      ];

      const mockLogrosObtenidos = [];

      const mockPerfil = { protectores_racha: 0 };

      const mockSelect = vi.fn();
      const mockEq = vi.fn();
      const mockLte = vi.fn();
      const mockOrder = vi.fn();
      const mockInsert = vi.fn();
      const mockUpdate = vi.fn();
      const mockSingle = vi.fn();

      // Mock para obtener logros disponibles
      mockOrder.mockReturnValueOnce({
        data: mockLogrosDisponibles,
        error: null,
      });

      // Mock para obtener logros ya obtenidos
      mockEq.mockReturnValueOnce({
        data: mockLogrosObtenidos,
        error: null,
      });

      // Mock para obtener perfil
      mockSingle.mockReturnValueOnce({
        data: mockPerfil,
        error: null,
      });

      // Mock para insertar logros
      mockInsert.mockReturnValueOnce({
        error: null,
      });

      // Mock para actualizar protectores
      mockUpdate.mockReturnValueOnce({
        error: null,
      });

      (supabase.from as any).mockImplementation((table: string) => {
        if (table === 'logro') {
          return {
            select: vi.fn().mockReturnValue({
              lte: mockLte.mockReturnValue({
                order: mockOrder,
              }),
            }),
          };
        }
        if (table === 'logro_usuario') {
          return {
            select: vi.fn().mockReturnValue({
              eq: mockEq,
            }),
            insert: mockInsert,
          };
        }
        if (table === 'perfil') {
          return {
            select: vi.fn().mockReturnValue({
              eq: mockSingle,
            }),
            update: vi.fn().mockReturnValue({
              eq: mockUpdate,
            }),
          };
        }
        return {};
      });

      // Configurar mocks para la cadena de llamadas
      const logroChain = {
        select: vi.fn().mockReturnValue({
          lte: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: mockLogrosDisponibles,
              error: null,
            }),
          }),
        }),
      };

      const logroUsuarioChain = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: mockLogrosObtenidos,
            error: null,
          }),
        }),
        insert: vi.fn().mockResolvedValue({
          error: null,
        }),
      };

      const perfilChain = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockPerfil,
              error: null,
            }),
          }),
        }),
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            error: null,
          }),
        }),
      };

      (supabase.from as any).mockImplementation((table: string) => {
        if (table === 'logro') return logroChain;
        if (table === 'logro_usuario') return logroUsuarioChain;
        if (table === 'perfil') return perfilChain;
        return {};
      });

      const resultado = await verificarYDesbloquearLogros(mockIdPerfil, 30);

      expect(resultado.logrosNuevos).toHaveLength(2);
      expect(resultado.protectoresGanados).toBeGreaterThan(0);
      expect(resultado.mensaje).toContain('Primera Semana');
      expect(resultado.mensaje).toContain('Primer Mes');
    });

    it('debe actualizar logros cuando cambia racha_maxima', async () => {
      // Este test verifica que cuando se actualiza racha_maxima, se verifican los logros
      const mockLogrosDisponibles = [
        { id_logro: '3', nombre_logro: '50 Días', criterio_racha: 50, icono: '🎯' },
      ];

      const mockLogrosObtenidos = [
        { id_logro: '1' }, // Ya tiene el logro de 7 días
        { id_logro: '2' }, // Ya tiene el logro de 30 días
      ];

      const logroChain = {
        select: vi.fn().mockReturnValue({
          lte: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: mockLogrosDisponibles,
              error: null,
            }),
          }),
        }),
      };

      const logroUsuarioChain = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: mockLogrosObtenidos,
            error: null,
          }),
        }),
        insert: vi.fn().mockResolvedValue({
          error: null,
        }),
      };

      const perfilChain = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { protectores_racha: 10 },
              error: null,
            }),
          }),
        }),
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            error: null,
          }),
        }),
      };

      (supabase.from as any).mockImplementation((table: string) => {
        if (table === 'logro') return logroChain;
        if (table === 'logro_usuario') return logroUsuarioChain;
        if (table === 'perfil') return perfilChain;
        return {};
      });

      // Simular actualización de racha_maxima a 50 días
      const resultado = await verificarYDesbloquearLogros(mockIdPerfil, 50);

      expect(resultado.logrosNuevos).toHaveLength(1);
      expect(resultado.logrosNuevos[0].nombre_logro).toBe('50 Días');
    });

    it('no debe desbloquear logros si el usuario ya los tiene', async () => {
      const mockLogrosDisponibles = [
        { id_logro: '1', nombre_logro: 'Primera Semana', criterio_racha: 7, icono: '🔥' },
      ];

      const mockLogrosObtenidos = [{ id_logro: '1' }]; // Ya tiene este logro

      const logroChain = {
        select: vi.fn().mockReturnValue({
          lte: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: mockLogrosDisponibles,
              error: null,
            }),
          }),
        }),
      };

      const logroUsuarioChain = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: mockLogrosObtenidos,
            error: null,
          }),
        }),
        insert: vi.fn(),
      };

      const perfilChain = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { protectores_racha: 2 },
              error: null,
            }),
          }),
        }),
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            error: null,
          }),
        }),
      };

      (supabase.from as any).mockImplementation((table: string) => {
        if (table === 'logro') return logroChain;
        if (table === 'logro_usuario') return logroUsuarioChain;
        if (table === 'perfil') return perfilChain;
        return {};
      });

      const resultado = await verificarYDesbloquearLogros(mockIdPerfil, 10);

      expect(resultado.logrosNuevos).toHaveLength(0);
      expect(logroUsuarioChain.insert).not.toHaveBeenCalled();
    });
  });

  describe('obtenerLogrosUsuario', () => {
    it('debe obtener todos los logros del usuario', async () => {
      const mockLogros = [
        {
          id_logro_usuario: '1',
          id_perfil: mockIdPerfil,
          id_logro: '1',
          fecha_obtenido: new Date(),
          logro: {
            id_logro: '1',
            nombre_logro: 'Primera Semana',
            criterio_racha: 7,
            icono: '🔥',
          },
        },
      ];

      const chain = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: mockLogros,
              error: null,
            }),
          }),
        }),
      };

      (supabase.from as any).mockReturnValue(chain);

      const resultado = await obtenerLogrosUsuario(mockIdPerfil);

      expect(resultado).toEqual(mockLogros);
      expect(chain.select).toHaveBeenCalled();
    });
  });

  describe('obtenerProgresoLogros', () => {
    it('debe calcular correctamente el progreso de logros', async () => {
      const chain = {
        select: vi.fn().mockReturnValue({
          count: 'exact',
          head: true,
        }),
      };

      // Mock para total de logros
      (supabase.from as any).mockImplementationOnce(() => ({
        select: vi.fn().mockResolvedValue({
          count: 10,
          error: null,
        }),
      }));

      // Mock para logros del usuario
      (supabase.from as any).mockImplementationOnce(() => ({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            count: 5,
            error: null,
          }),
        }),
      }));

      const resultado = await obtenerProgresoLogros(mockIdPerfil);

      expect(resultado.logrosObtenidos).toBe(5);
      expect(resultado.logosTotales).toBe(10);
      expect(resultado.porcentaje).toBe(50);
    });
  });

  describe('obtenerSiguienteLogro', () => {
    it('debe obtener el siguiente logro que el usuario puede desbloquear', async () => {
      const mockSiguienteLogro = {
        id_logro: '3',
        nombre_logro: '50 Días',
        criterio_racha: 50,
        icono: '🎯',
      };

      const logroUsuarioChain = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [{ id_logro: '1' }, { id_logro: '2' }],
            error: null,
          }),
        }),
      };

      const logroChain = {
        select: vi.fn().mockReturnValue({
          gt: vi.fn().mockReturnValue({
            not: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                limit: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: mockSiguienteLogro,
                    error: null,
                  }),
                }),
              }),
            }),
          }),
        }),
      };

      (supabase.from as any).mockImplementation((table: string) => {
        if (table === 'logro_usuario') return logroUsuarioChain;
        if (table === 'logro') return logroChain;
        return {};
      });

      const resultado = await obtenerSiguienteLogro(mockIdPerfil, 30);

      expect(resultado).toEqual(mockSiguienteLogro);
    });

    it('debe retornar null si no hay más logros disponibles', async () => {
      const logroUsuarioChain = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }),
      };

      const logroChain = {
        select: vi.fn().mockReturnValue({
          gt: vi.fn().mockReturnValue({
            not: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                limit: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: null,
                    error: { code: 'PGRST116' }, // No rows returned
                  }),
                }),
              }),
            }),
          }),
        }),
      };

      (supabase.from as any).mockImplementation((table: string) => {
        if (table === 'logro_usuario') return logroUsuarioChain;
        if (table === 'logro') return logroChain;
        return {};
      });

      const resultado = await obtenerSiguienteLogro(mockIdPerfil, 1000);

      expect(resultado).toBeNull();
    });
  });
});

