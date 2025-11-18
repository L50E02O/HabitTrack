import { describe, it, expect, vi, beforeEach } from 'vitest';
import { actualizarRachaMaximaEnPerfil } from './rachaAutoService';
import { supabase } from '../../config/supabase';

vi.mock('../../config/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

describe('actualizarRachaMaximaEnPerfil', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debe calcular la racha máxima entre TODOS los hábitos del usuario', async () => {
    const mockFrom = vi.fn().mockImplementation((table) => {
      if (table === 'habito') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: [
                { id_habito: 'habito-1' },
                { id_habito: 'habito-2' },
                { id_habito: 'habito-3' },
              ],
              error: null,
            }),
          }),
        };
      } else if (table === 'registro_intervalo') {
        return {
          select: vi.fn().mockReturnValue({
            in: vi.fn().mockResolvedValue({
              data: [
                { id_registro: 'reg-1', id_habito: 'habito-1' },
                { id_registro: 'reg-2', id_habito: 'habito-2' },
                { id_registro: 'reg-3', id_habito: 'habito-3' },
              ],
              error: null,
            }),
          }),
        };
      } else if (table === 'racha') {
        return {
          select: vi.fn().mockReturnValue({
            in: vi.fn().mockResolvedValue({
              data: [
                { dias_consecutivos: 10 }, // Hábito 1: 10 días
                { dias_consecutivos: 25 }, // Hábito 2: 25 días ← LA MÁS ALTA
                { dias_consecutivos: 7 },  // Hábito 3: 7 días
              ],
              error: null,
            }),
          }),
        };
      } else if (table === 'perfil') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { racha_maxima: 20 }, // Racha anterior: 20
                error: null,
              }),
            }),
          }),
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: { racha_maxima: 25 },
              error: null,
            }),
          }),
        };
      }
      return {};
    });
    (supabase.from as any) = mockFrom;

    // Llamar con racha actual de 15 días
    // Pero el usuario tiene otra racha de 25 días, así que debe usar 25
    await actualizarRachaMaximaEnPerfil('user-123', 15);

    // Verificar que se llamó a las tablas correctas
    expect(mockFrom).toHaveBeenCalledWith('habito');
    expect(mockFrom).toHaveBeenCalledWith('registro_intervalo');
    expect(mockFrom).toHaveBeenCalledWith('racha');
    expect(mockFrom).toHaveBeenCalledWith('perfil');
  });

  it('debe actualizar con la racha actual si es mayor que todas las demás', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const mockFrom = vi.fn().mockImplementation((table) => {
      if (table === 'habito') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: [{ id_habito: 'habito-1' }],
              error: null,
            }),
          }),
        };
      } else if (table === 'registro_intervalo') {
        return {
          select: vi.fn().mockReturnValue({
            in: vi.fn().mockResolvedValue({
              data: [{ id_registro: 'reg-1', id_habito: 'habito-1' }],
              error: null,
            }),
          }),
        };
      } else if (table === 'racha') {
        return {
          select: vi.fn().mockReturnValue({
            in: vi.fn().mockResolvedValue({
              data: [
                { dias_consecutivos: 10 }, // Racha existente: 10 días
              ],
              error: null,
            }),
          }),
        };
      } else if (table === 'perfil') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { racha_maxima: 5 },
                error: null,
              }),
            }),
          }),
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: { racha_maxima: 30 },
              error: null,
            }),
          }),
        };
      }
      return {};
    });
    (supabase.from as any) = mockFrom;

    // Racha actual: 30 días (mayor que las existentes de 10 días)
    await actualizarRachaMaximaEnPerfil('user-123', 30);

    // Debe actualizar a 30
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('5 → 30')
    );
    consoleSpy.mockRestore();
  });

  it('NO debe actualizar si ninguna racha supera el récord actual en perfil', async () => {
    const mockUpdate = vi.fn();
    const mockFrom = vi.fn().mockImplementation((table) => {
      if (table === 'habito') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: [{ id_habito: 'habito-1' }],
              error: null,
            }),
          }),
        };
      } else if (table === 'registro_intervalo') {
        return {
          select: vi.fn().mockReturnValue({
            in: vi.fn().mockResolvedValue({
              data: [{ id_registro: 'reg-1' }],
              error: null,
            }),
          }),
        };
      } else if (table === 'racha') {
        return {
          select: vi.fn().mockReturnValue({
            in: vi.fn().mockResolvedValue({
              data: [{ dias_consecutivos: 10 }],
              error: null,
            }),
          }),
        };
      } else if (table === 'perfil') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { racha_maxima: 50 }, // Récord actual: 50
                error: null,
              }),
            }),
          }),
          update: mockUpdate.mockReturnValue({
            eq: vi.fn().mockResolvedValue({ data: {}, error: null }),
          }),
        };
      }
      return {};
    });
    (supabase.from as any) = mockFrom;

    // Racha actual: 15, rachas existentes: 10, récord: 50
    // Máximo entre todas: 15, no supera 50
    await actualizarRachaMaximaEnPerfil('user-123', 15);

    // NO debe actualizar
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('debe usar la racha actual si el usuario no tiene hábitos', async () => {
    const mockFrom = vi.fn().mockImplementation((table) => {
      if (table === 'habito') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: [], // Sin hábitos
              error: null,
            }),
          }),
        };
      } else if (table === 'perfil') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { racha_maxima: 0 },
                error: null,
              }),
            }),
          }),
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: { racha_maxima: 5 },
              error: null,
            }),
          }),
        };
      }
      return {};
    });
    (supabase.from as any) = mockFrom;

    await actualizarRachaMaximaEnPerfil('user-123', 5);

    // Debe actualizar con la racha actual (5)
    expect(mockFrom).toHaveBeenCalledWith('perfil');
  });

  it('debe manejar errores sin lanzar excepciones', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const mockFrom = vi.fn().mockImplementation((table) => {
      if (table === 'habito') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: null,
              error: new Error('Database error'),
            }),
          }),
        };
      }
      return {};
    });
    (supabase.from as any) = mockFrom;

    // No debe lanzar error
    await expect(actualizarRachaMaximaEnPerfil('user-123', 10)).resolves.not.toThrow();

    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
