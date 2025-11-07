import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  updateRachaOnHabitCompletion, 
  // getRachaActivaByHabito, // No usado en tests
  getDiasRachaByHabito,
  getRachasMultiplesHabitos,
  // checkAndDeactivateExpiredRachas // No usado en tests
} from './rachaAutoService';

// Mock de Supabase
const mockSupabase = {
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => ({
            limit: vi.fn(() => ({
              data: [],
              error: null
            }))
          }))
        }))
      }))
    })),
    insert: vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn(() => ({
          data: null,
          error: null
        }))
      }))
    })),
    update: vi.fn(() => ({
      eq: vi.fn(() => ({
        data: null,
        error: null
      }))
    }))
  }))
};

vi.mock('../../config/supabase', () => ({
  supabase: mockSupabase
}));

describe('rachaAutoService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('updateRachaOnHabitCompletion', () => {
    it('debería crear una nueva racha cuando no existe una activa', async () => {
      // Arrange
      const mockRegistroId = 'registro-123';
      const mockHabitoId = 'habito-123';
      const mockIntervalo = 'diario';

      // Mock para no encontrar rachas activas
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn(() => ({
                limit: vi.fn(() => Promise.resolve({
                  data: [],
                  error: null
                }))
              }))
            }))
          }))
        }))
      });

      // Mock para registros recientes
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              gte: vi.fn(() => ({
                order: vi.fn(() => Promise.resolve({
                  data: [],
                  error: null
                }))
              }))
            }))
          }))
        }))
      });

      // Mock para crear nueva racha
      const mockNuevaRacha = {
        id_racha: 'racha-123',
        id_registro_intervalo: mockRegistroId,
        inicio_recha: new Date(),
        fin_racha: new Date(),
        dias_consecutivos: 1,
        racha_activa: true
      };

      mockSupabase.from.mockReturnValueOnce({
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: mockNuevaRacha,
              error: null
            }))
          }))
        }))
      });

      // Act
      const result = await updateRachaOnHabitCompletion(
        mockRegistroId,
        mockHabitoId,
        mockIntervalo
      );

      // Assert
      expect(result.success).toBe(true);
      expect(result.isNewRacha).toBe(true);
      expect(result.diasConsecutivos).toBe(1);
      expect(result.message).toContain('Nueva racha iniciada');
    });

    it('debería manejar errores de base de datos graciosamente', async () => {
      // Arrange
      const mockError = new Error('Database error');
      
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn(() => ({
                limit: vi.fn(() => Promise.resolve({
                  data: null,
                  error: mockError
                }))
              }))
            }))
          }))
        }))
      });

      // Act
      const result = await updateRachaOnHabitCompletion(
        'registro-123',
        'habito-123',
        'diario'
      );

      // Assert
      expect(result.success).toBe(false);
      expect(result.diasConsecutivos).toBe(0);
      expect(result.message).toBe('Error al actualizar racha');
    });
  });

  describe('getDiasRachaByHabito', () => {
    it('debería retornar 0 cuando no hay racha activa', async () => {
      // Arrange
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn(() => ({
                limit: vi.fn(() => Promise.resolve({
                  data: [],
                  error: null
                }))
              }))
            }))
          }))
        }))
      });

      // Act
      const dias = await getDiasRachaByHabito('habito-123');

      // Assert
      expect(dias).toBe(0);
    });

    it('debería retornar los días correctos cuando hay racha activa', async () => {
      // Arrange
      const mockRacha = {
        id_racha: 'racha-123',
        dias_consecutivos: 5,
        racha_activa: true
      };

      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn(() => ({
                limit: vi.fn(() => Promise.resolve({
                  data: [mockRacha],
                  error: null
                }))
              }))
            }))
          }))
        }))
      });

      // Act
      const dias = await getDiasRachaByHabito('habito-123');

      // Assert
      expect(dias).toBe(5);
    });
  });

  describe('getRachasMultiplesHabitos', () => {
    it('debería retornar un objeto vacío para array vacío', async () => {
      // Act
      const rachas = await getRachasMultiplesHabitos([]);

      // Assert
      expect(rachas).toEqual({});
    });

    it('debería inicializar todos los hábitos con 0 y actualizar los que tienen racha', async () => {
      // Arrange
      const habitoIds = ['habito-1', 'habito-2', 'habito-3'];
      const mockRachas = [
        {
          dias_consecutivos: 3,
          registro_intervalo: { id_habito: 'habito-1' }
        },
        {
          dias_consecutivos: 7,
          registro_intervalo: { id_habito: 'habito-3' }
        }
      ];

      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn(() => ({
          in: vi.fn(() => ({
            eq: vi.fn(() => Promise.resolve({
              data: mockRachas,
              error: null
            }))
          }))
        }))
      });

      // Act
      const rachas = await getRachasMultiplesHabitos(habitoIds);

      // Assert
      expect(rachas).toEqual({
        'habito-1': 3,
        'habito-2': 0,
        'habito-3': 7
      });
    });

    it('debería manejar errores retornando todos los hábitos en 0', async () => {
      // Arrange
      const habitoIds = ['habito-1', 'habito-2'];
      const mockError = new Error('Database error');

      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn(() => ({
          in: vi.fn(() => ({
            eq: vi.fn(() => Promise.resolve({
              data: null,
              error: mockError
            }))
          }))
        }))
      });

      // Act
      const rachas = await getRachasMultiplesHabitos(habitoIds);

      // Assert
      expect(rachas).toEqual({
        'habito-1': 0,
        'habito-2': 0
      });
    });
  });
});