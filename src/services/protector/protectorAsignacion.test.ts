import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  asignarProtectorAHabito,
  quitarProtectorDeHabito,
  getProtectoresPorHabito,
} from './protectorService';
import { supabase } from '../../config/supabase';

vi.mock('../../config/supabase', () => ({
  supabase: {
    rpc: vi.fn(),
    from: vi.fn(),
  },
}));

describe('protectorService - Asignación de protectores', () => {
  const userId = 'test-user-123';
  const habitoId = 'test-habit-456';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('asignarProtectorAHabito', () => {
    it('debe asignar un protector exitosamente', async () => {
      const mockResponse = {
        success: true,
        message: 'Protector asignado exitosamente',
        protectores_asignados: 1,
      };

      vi.mocked(supabase.rpc).mockResolvedValue({
        data: mockResponse,
        error: null,
      } as any);

      const resultado = await asignarProtectorAHabito(userId, habitoId, 1);

      expect(supabase.rpc).toHaveBeenCalledWith('asignar_protector_a_habito', {
        p_user_id: userId,
        p_habito_id: habitoId,
        p_cantidad: 1,
      });

      expect(resultado).toEqual(mockResponse);
      expect(resultado.success).toBe(true);
    });

    it('debe manejar error de protectores insuficientes', async () => {
      const mockResponse = {
        success: false,
        message: 'No tienes suficientes protectores disponibles',
      };

      vi.mocked(supabase.rpc).mockResolvedValue({
        data: mockResponse,
        error: null,
      } as any);

      const resultado = await asignarProtectorAHabito(userId, habitoId, 5);

      expect(resultado.success).toBe(false);
      expect(resultado.message).toContain('No tienes suficientes protectores');
    });

    it('debe asignar múltiples protectores', async () => {
      const mockResponse = {
        success: true,
        message: 'Protector asignado exitosamente',
        protectores_asignados: 3,
      };

      vi.mocked(supabase.rpc).mockResolvedValue({
        data: mockResponse,
        error: null,
      } as any);

      const resultado = await asignarProtectorAHabito(userId, habitoId, 3);

      expect(supabase.rpc).toHaveBeenCalledWith('asignar_protector_a_habito', {
        p_user_id: userId,
        p_habito_id: habitoId,
        p_cantidad: 3,
      });

      expect(resultado.protectoresAsignados).toBe(3);
    });

    it('debe manejar errores de red', async () => {
      vi.mocked(supabase.rpc).mockResolvedValue({
        data: null,
        error: { message: 'Network error' },
      } as any);

      const resultado = await asignarProtectorAHabito(userId, habitoId, 1);

      expect(resultado.success).toBe(false);
      expect(resultado.message).toContain('Error al asignar protector');
    });
  });

  describe('quitarProtectorDeHabito', () => {
    it('debe quitar un protector exitosamente', async () => {
      const mockResponse = {
        success: true,
        message: 'Protector removido exitosamente',
        protectores_asignados: 2,
      };

      vi.mocked(supabase.rpc).mockResolvedValue({
        data: mockResponse,
        error: null,
      } as any);

      const resultado = await quitarProtectorDeHabito(userId, habitoId, 1);

      expect(supabase.rpc).toHaveBeenCalledWith('quitar_protector_de_habito', {
        p_user_id: userId,
        p_habito_id: habitoId,
        p_cantidad: 1,
      });

      expect(resultado).toEqual(mockResponse);
      expect(resultado.success).toBe(true);
    });

    it('debe manejar error cuando no hay protectores asignados', async () => {
      const mockResponse = {
        success: false,
        message: 'No hay suficientes protectores asignados a este hábito',
      };

      vi.mocked(supabase.rpc).mockResolvedValue({
        data: mockResponse,
        error: null,
      } as any);

      const resultado = await quitarProtectorDeHabito(userId, habitoId, 1);

      expect(resultado.success).toBe(false);
      expect(resultado.message).toContain('No hay suficientes protectores');
    });

    it('debe quitar múltiples protectores', async () => {
      const mockResponse = {
        success: true,
        message: 'Protector removido exitosamente',
        protectores_asignados: 0,
      };

      vi.mocked(supabase.rpc).mockResolvedValue({
        data: mockResponse,
        error: null,
      } as any);

      const resultado = await quitarProtectorDeHabito(userId, habitoId, 3);

      expect(supabase.rpc).toHaveBeenCalledWith('quitar_protector_de_habito', {
        p_user_id: userId,
        p_habito_id: habitoId,
        p_cantidad: 3,
      });

      expect(resultado.protectoresAsignados).toBe(0);
    });
  });

  describe('getProtectoresPorHabito', () => {
    it('debe obtener protectores asignados exitosamente', async () => {
      vi.mocked(supabase.rpc).mockResolvedValue({
        data: 3,
        error: null,
      } as any);

      const resultado = await getProtectoresPorHabito(userId, habitoId);

      expect(supabase.rpc).toHaveBeenCalledWith('obtener_protectores_de_habito', {
        p_user_id: userId,
        p_habito_id: habitoId,
      });

      expect(resultado).toBe(3);
    });

    it('debe retornar 0 cuando no hay protectores', async () => {
      vi.mocked(supabase.rpc).mockResolvedValue({
        data: 0,
        error: null,
      } as any);

      const resultado = await getProtectoresPorHabito(userId, habitoId);

      expect(resultado).toBe(0);
    });

    it('debe usar fallback en caso de error de RPC', async () => {
      // Error en RPC
      vi.mocked(supabase.rpc).mockResolvedValue({
        data: null,
        error: { message: 'RPC error' },
      } as any);

      // Mock fallback de from().select()
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { protectores_asignados: 2 },
                error: null,
              }),
            }),
          }),
        }),
      });

      vi.mocked(supabase.from).mockImplementation(mockFrom as any);

      const resultado = await getProtectoresPorHabito(userId, habitoId);

      expect(resultado).toBe(2);
    });

    it('debe retornar 0 si el fallback también falla', async () => {
      // Error en RPC
      vi.mocked(supabase.rpc).mockResolvedValue({
        data: null,
        error: { message: 'RPC error' },
      } as any);

      // Error en fallback
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: { message: 'DB error' },
              }),
            }),
          }),
        }),
      });

      vi.mocked(supabase.from).mockImplementation(mockFrom as any);

      const resultado = await getProtectoresPorHabito(userId, habitoId);

      expect(resultado).toBe(0);
    });
  });

  describe('Integración de funciones', () => {
    it('debe asignar y luego quitar protectores correctamente', async () => {
      // Asignar 2 protectores
      vi.mocked(supabase.rpc).mockResolvedValueOnce({
        data: {
          success: true,
          message: 'Protector asignado exitosamente',
          protectores_asignados: 2,
        },
        error: null,
      } as any);

      const asignacion = await asignarProtectorAHabito(userId, habitoId, 2);
      expect(asignacion.success).toBe(true);
      expect(asignacion.protectoresAsignados).toBe(2);

      // Quitar 1 protector
      vi.mocked(supabase.rpc).mockResolvedValueOnce({
        data: {
          success: true,
          message: 'Protector removido exitosamente',
          protectores_asignados: 1,
        },
        error: null,
      } as any);

      const remocion = await quitarProtectorDeHabito(userId, habitoId, 1);
      expect(remocion.success).toBe(true);
      expect(remocion.protectoresAsignados).toBe(1);
    });
  });
});
