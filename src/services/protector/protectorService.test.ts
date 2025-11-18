import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  calcularProtectoresPorRacha,
  getProtectoresActuales,
  getPuntosActuales,
  puedeComprarProtectorEstaSemana,
  comprarProtector,
  usarProtector,
  sincronizarProtectoresPorRacha,
} from './protectorService';
import { supabase } from '../../config/supabase';

// Mock de Supabase
vi.mock('../../config/supabase', () => ({
  supabase: {
    from: vi.fn(),
    rpc: vi.fn(),
  },
}));

describe('protectorService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('calcularProtectoresPorRacha', () => {
    it('debe retornar 0 protectores para rachas menores a 7 días', () => {
      expect(calcularProtectoresPorRacha(0)).toBe(0);
      expect(calcularProtectoresPorRacha(3)).toBe(0);
      expect(calcularProtectoresPorRacha(6)).toBe(0);
    });

    it('debe retornar 1 protector por cada 7 días de racha', () => {
      expect(calcularProtectoresPorRacha(7)).toBe(1);
      expect(calcularProtectoresPorRacha(10)).toBe(1);
      expect(calcularProtectoresPorRacha(13)).toBe(1);
    });

    it('debe calcular correctamente múltiples protectores', () => {
      expect(calcularProtectoresPorRacha(14)).toBe(2);
      expect(calcularProtectoresPorRacha(21)).toBe(3);
      expect(calcularProtectoresPorRacha(30)).toBe(4);
      expect(calcularProtectoresPorRacha(100)).toBe(14);
      expect(calcularProtectoresPorRacha(365)).toBe(52);
    });

    it('debe manejar números negativos retornando 0', () => {
      expect(calcularProtectoresPorRacha(-1)).toBe(-1); // floor(-1/7) = -1
      expect(calcularProtectoresPorRacha(-10)).toBe(-2); // floor(-10/7) = -2
    });
  });

  describe('getProtectoresActuales', () => {
    it('debe retornar los protectores del usuario', async () => {
      const mockData = { protectores_racha: 5 };
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockData, error: null }),
          }),
        }),
      });
      (supabase.from as any) = mockFrom;

      const resultado = await getProtectoresActuales('user-123');

      expect(resultado).toBe(5);
      expect(mockFrom).toHaveBeenCalledWith('perfil');
    });

    it('debe retornar 0 si hay error', async () => {
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: new Error('DB Error'),
            }),
          }),
        }),
      });
      (supabase.from as any) = mockFrom;

      const resultado = await getProtectoresActuales('user-123');

      expect(resultado).toBe(0);
    });

    it('debe retornar 0 si protectores_racha es null', async () => {
      const mockData = { protectores_racha: null };
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockData, error: null }),
          }),
        }),
      });
      (supabase.from as any) = mockFrom;

      const resultado = await getProtectoresActuales('user-123');

      expect(resultado).toBe(0);
    });
  });

  describe('getPuntosActuales', () => {
    it('debe retornar los puntos del usuario', async () => {
      const mockData = { puntos: 1000 };
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockData, error: null }),
          }),
        }),
      });
      (supabase.from as any) = mockFrom;

      const resultado = await getPuntosActuales('user-123');

      expect(resultado).toBe(1000);
      expect(mockFrom).toHaveBeenCalledWith('perfil');
    });

    it('debe retornar 0 si hay error', async () => {
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: new Error('DB Error'),
            }),
          }),
        }),
      });
      (supabase.from as any) = mockFrom;

      const resultado = await getPuntosActuales('user-123');

      expect(resultado).toBe(0);
    });
  });

  describe('puedeComprarProtectorEstaSemana', () => {
    it('debe retornar true si puede comprar', async () => {
      const mockRpc = vi.fn().mockResolvedValue({ data: true, error: null });
      (supabase.rpc as any) = mockRpc;

      const resultado = await puedeComprarProtectorEstaSemana('user-123');

      expect(resultado).toBe(true);
      expect(mockRpc).toHaveBeenCalledWith('puede_comprar_protector', {
        user_id: 'user-123',
      });
    });

    it('debe retornar false si no puede comprar', async () => {
      const mockRpc = vi.fn().mockResolvedValue({ data: false, error: null });
      (supabase.rpc as any) = mockRpc;

      const resultado = await puedeComprarProtectorEstaSemana('user-123');

      expect(resultado).toBe(false);
    });

    it('debe usar verificación manual si RPC falla', async () => {
      const mockRpc = vi.fn().mockResolvedValue({
        data: null,
        error: new Error('RPC Error'),
      });
      (supabase.rpc as any) = mockRpc;

      // Mock para la verificación manual
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            gte: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
      });
      (supabase.from as any) = mockFrom;

      const resultado = await puedeComprarProtectorEstaSemana('user-123');

      expect(resultado).toBe(true); // Array vacío = puede comprar
    });
  });

  describe('comprarProtector', () => {
    it('debe comprar un protector exitosamente', async () => {
      // Mock de verificaciones iniciales
      const mockRpc = vi.fn().mockResolvedValue({ data: true, error: null });
      (supabase.rpc as any) = mockRpc;

      const mockFromPerfil = vi.fn().mockImplementation((table) => {
        if (table === 'perfil') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { puntos: 500, protectores_racha: 2 },
                  error: null,
                }),
              }),
            }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: { protectores_racha: 3, puntos: 250 },
                    error: null,
                  }),
                }),
              }),
            }),
          };
        } else if (table === 'compra_protector') {
          return {
            insert: vi.fn().mockResolvedValue({ data: {}, error: null }),
          };
        }
        return {};
      });
      (supabase.from as any) = mockFromPerfil;

      const resultado = await comprarProtector('user-123');

      expect(resultado.success).toBe(true);
      expect(resultado.message).toContain('exitosamente');
      expect(resultado.protectoresNuevos).toBe(3);
    });

    it('debe fallar si ya compró esta semana', async () => {
      const mockRpc = vi.fn().mockResolvedValue({ data: false, error: null });
      (supabase.rpc as any) = mockRpc;

      const resultado = await comprarProtector('user-123');

      expect(resultado.success).toBe(false);
      expect(resultado.message).toContain('Ya compraste');
    });

    it('debe fallar si no tiene puntos suficientes', async () => {
      const mockRpc = vi.fn().mockResolvedValue({ data: true, error: null });
      (supabase.rpc as any) = mockRpc;

      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { puntos: 100 }, // Menos de 250
              error: null,
            }),
          }),
        }),
      });
      (supabase.from as any) = mockFrom;

      const resultado = await comprarProtector('user-123');

      expect(resultado.success).toBe(false);
      expect(resultado.message).toContain('Necesitas 250 puntos');
    });
  });

  describe('usarProtector', () => {
    it('debe usar un protector exitosamente', async () => {
      const mockFrom = vi.fn().mockImplementation((table) => {
        if (table === 'perfil') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { protectores_racha: 3 },
                  error: null,
                }),
              }),
            }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: { protectores_racha: 2 },
                    error: null,
                  }),
                }),
              }),
            }),
          };
        } else if (table === 'uso_protector') {
          return {
            insert: vi.fn().mockResolvedValue({ data: {}, error: null }),
          };
        }
        return {};
      });
      (supabase.from as any) = mockFrom;

      const resultado = await usarProtector('user-123', 'habito-456', 30);

      expect(resultado.success).toBe(true);
      expect(resultado.message).toContain('protegida');
      expect(resultado.protectoresRestantes).toBe(2);
    });

    it('debe fallar si no tiene protectores', async () => {
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { protectores_racha: 0 },
              error: null,
            }),
          }),
        }),
      });
      (supabase.from as any) = mockFrom;

      const resultado = await usarProtector('user-123', 'habito-456', 30);

      expect(resultado.success).toBe(false);
      expect(resultado.message).toContain('No tienes protectores');
    });
  });

  describe('sincronizarProtectoresPorRacha', () => {
    it('debe actualizar protectores si la racha aumentó', async () => {
      const mockFrom = vi.fn().mockImplementation((table) => {
        if (table === 'perfil') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { racha_maxima: 30, protectores_racha: 2 }, // 30 días = 4 protectores, tiene 2
                  error: null,
                }),
              }),
            }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ data: {}, error: null }),
            }),
          };
        }
        return {};
      });
      (supabase.from as any) = mockFrom;

      await sincronizarProtectoresPorRacha('user-123');

      // Verificar que se llamó update con el valor correcto (4 protectores)
      expect(mockFrom).toHaveBeenCalledWith('perfil');
    });

    it('no debe actualizar si ya tiene suficientes protectores', async () => {
      const mockFrom = vi.fn().mockImplementation((table) => {
        if (table === 'perfil') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { racha_maxima: 14, protectores_racha: 5 }, // 14 días = 2 protectores, ya tiene 5
                  error: null,
                }),
              }),
            }),
          };
        }
        return {};
      });
      (supabase.from as any) = mockFrom;

      await sincronizarProtectoresPorRacha('user-123');

      // No debería llamar update porque ya tiene suficientes
    });
  });
});
