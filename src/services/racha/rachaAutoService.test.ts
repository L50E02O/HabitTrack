import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  updateRachaOnHabitCompletion, 
  getDiasRachaByHabito,
  getRachasMultiplesHabitos,
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
          })),
          single: vi.fn(() => ({
            data: null,
            error: null
          }))
        })),
        order: vi.fn(() => ({
          limit: vi.fn(() => ({
            data: [],
            error: null
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
    it('debería crear una nueva racha cuando se completa el hábito', async () => {
      // Arrange
      const mockRegistroId = 'registro-123';
      const mockHabitoId = 'habito-123';
      const mockIntervalo = 'diario';
      const habitoCompletado = true;
      const metaRepeticion = 3;

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

      // Mock para obtener registros (para calcular períodos consecutivos)
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => ({
              limit: vi.fn(() => Promise.resolve({
                data: [
                  { fecha: new Date() }
                ],
                error: null
              }))
            }))
          }))
        }))
      });

      // Mock para crear nueva racha
      const mockNuevaRacha = {
        id_racha: 'racha-123',
        id_registro_intervalo: mockRegistroId,
        inicio_racha: new Date(),
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
        mockIntervalo,
        habitoCompletado,
        metaRepeticion
      );

      // Assert
      expect(result.success).toBe(true);
      expect(result.isNewRacha).toBe(true);
      expect(result.diasConsecutivos).toBeGreaterThanOrEqual(1);
    });

    it('debería manejar errores de base de datos graciosamente', async () => {
      // Arrange
      const mockError = new Error('Database error');

      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn(() => ({
                limit: vi.fn(() => Promise.reject(mockError))
              }))
            }))
          }))
        }))
      });

      // Act
      const result = await updateRachaOnHabitCompletion(
        'registro-123',
        'habito-123',
        'diario',
        true,
        3
      );

      // Assert
      expect(result.success).toBe(false);
      expect(result.diasConsecutivos).toBe(0);
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

  describe('Expiración de rachas por tiempo', () => {
    it('debería mantener racha diaria si pasó menos de 1 día', async () => {
      // Arrange
      const hace23Horas = new Date();
      hace23Horas.setHours(hace23Horas.getHours() - 23);
      
      const mockRachaActiva = {
        id_racha: 'racha-123',
        id_registro_intervalo: 'registro-123',
        inicio_racha: hace23Horas,
        fin_racha: hace23Horas,
        dias_consecutivos: 5,
        racha_activa: true
      };

      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn(() => ({
                limit: vi.fn(() => Promise.resolve({
                  data: [mockRachaActiva],
                  error: null
                }))
              }))
            }))
          }))
        }))
      });

      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => ({
              limit: vi.fn(() => Promise.resolve({
                data: [{ fecha: new Date() }],
                error: null
              }))
            }))
          }))
        }))
      });

      mockSupabase.from.mockReturnValueOnce({
        update: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({
            data: { ...mockRachaActiva, dias_consecutivos: 6 },
            error: null
          }))
        }))
      });

      // Act
      const result = await updateRachaOnHabitCompletion(
        'registro-123',
        'habito-123',
        'diario',
        true,
        3
      );

      // Assert
      expect(result.success).toBe(true);
      expect(result.isNewRacha).toBe(false); // Debe extender la racha existente
    });

    it('debería romper racha diaria si pasó más de 1 día', async () => {
      // Arrange
      const hace25Horas = new Date();
      hace25Horas.setHours(hace25Horas.getHours() - 25);
      
      const mockRachaVieja = {
        id_racha: 'racha-123',
        id_registro_intervalo: 'registro-123',
        inicio_racha: hace25Horas,
        fin_racha: hace25Horas,
        dias_consecutivos: 5,
        racha_activa: true
      };

      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn(() => ({
                limit: vi.fn(() => Promise.resolve({
                  data: [mockRachaVieja],
                  error: null
                }))
              }))
            }))
          }))
        }))
      });

      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => ({
              limit: vi.fn(() => Promise.resolve({
                data: [{ fecha: new Date() }],
                error: null
              }))
            }))
          }))
        }))
      });

      mockSupabase.from.mockReturnValueOnce({
        update: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({
            data: { ...mockRachaVieja, racha_activa: false },
            error: null
          }))
        }))
      });

      mockSupabase.from.mockReturnValueOnce({
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: {
                id_racha: 'racha-nueva',
                id_registro_intervalo: 'registro-123',
                inicio_racha: new Date(),
                fin_racha: new Date(),
                dias_consecutivos: 1,
                racha_activa: true
              },
              error: null
            }))
          }))
        }))
      });

      // Act
      const result = await updateRachaOnHabitCompletion(
        'registro-123',
        'habito-123',
        'diario',
        true,
        3
      );

      // Assert
      expect(result.success).toBe(true);
      expect(result.isNewRacha).toBe(true); // Debe crear una nueva racha
    });

    it('debería mantener racha semanal si pasó menos de 7 días', async () => {
      // Arrange
      const hace6Dias = new Date();
      hace6Dias.setDate(hace6Dias.getDate() - 6);
      
      const mockRachaActiva = {
        id_racha: 'racha-123',
        id_registro_intervalo: 'registro-123',
        inicio_racha: hace6Dias,
        fin_racha: hace6Dias,
        dias_consecutivos: 3,
        racha_activa: true
      };

      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn(() => ({
                limit: vi.fn(() => Promise.resolve({
                  data: [mockRachaActiva],
                  error: null
                }))
              }))
            }))
          }))
        }))
      });

      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => ({
              limit: vi.fn(() => Promise.resolve({
                data: [{ fecha: new Date() }],
                error: null
              }))
            }))
          }))
        }))
      });

      mockSupabase.from.mockReturnValueOnce({
        update: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({
            data: { ...mockRachaActiva, dias_consecutivos: 4 },
            error: null
          }))
        }))
      });

      // Act
      const result = await updateRachaOnHabitCompletion(
        'registro-123',
        'habito-123',
        'semanal',
        true,
        3
      );

      // Assert
      expect(result.success).toBe(true);
      expect(result.isNewRacha).toBe(false);
    });

    it('debería romper racha semanal si pasaron más de 7 días', async () => {
      // Arrange
      const hace8Dias = new Date();
      hace8Dias.setDate(hace8Dias.getDate() - 8);
      
      const mockRachaVieja = {
        id_racha: 'racha-123',
        id_registro_intervalo: 'registro-123',
        inicio_racha: hace8Dias,
        fin_racha: hace8Dias,
        dias_consecutivos: 3,
        racha_activa: true
      };

      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn(() => ({
                limit: vi.fn(() => Promise.resolve({
                  data: [mockRachaVieja],
                  error: null
                }))
              }))
            }))
          }))
        }))
      });

      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => ({
              limit: vi.fn(() => Promise.resolve({
                data: [{ fecha: new Date() }],
                error: null
              }))
            }))
          }))
        }))
      });

      mockSupabase.from.mockReturnValueOnce({
        update: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({
            data: { ...mockRachaVieja, racha_activa: false },
            error: null
          }))
        }))
      });

      mockSupabase.from.mockReturnValueOnce({
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: {
                id_racha: 'racha-nueva',
                id_registro_intervalo: 'registro-123',
                inicio_racha: new Date(),
                fin_racha: new Date(),
                dias_consecutivos: 1,
                racha_activa: true
              },
              error: null
            }))
          }))
        }))
      });

      // Act
      const result = await updateRachaOnHabitCompletion(
        'registro-123',
        'habito-123',
        'semanal',
        true,
        3
      );

      // Assert
      expect(result.success).toBe(true);
      expect(result.isNewRacha).toBe(true);
    });

    it('debería mantener racha mensual si pasaron menos de 31 días', async () => {
      // Arrange
      const hace30Dias = new Date();
      hace30Dias.setDate(hace30Dias.getDate() - 30);
      
      const mockRachaActiva = {
        id_racha: 'racha-123',
        id_registro_intervalo: 'registro-123',
        inicio_racha: hace30Dias,
        fin_racha: hace30Dias,
        dias_consecutivos: 2,
        racha_activa: true
      };

      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn(() => ({
                limit: vi.fn(() => Promise.resolve({
                  data: [mockRachaActiva],
                  error: null
                }))
              }))
            }))
          }))
        }))
      });

      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => ({
              limit: vi.fn(() => Promise.resolve({
                data: [{ fecha: new Date() }],
                error: null
              }))
            }))
          }))
        }))
      });

      mockSupabase.from.mockReturnValueOnce({
        update: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({
            data: { ...mockRachaActiva, dias_consecutivos: 3 },
            error: null
          }))
        }))
      });

      // Act
      const result = await updateRachaOnHabitCompletion(
        'registro-123',
        'habito-123',
        'mensual',
        true,
        3
      );

      // Assert
      expect(result.success).toBe(true);
      expect(result.isNewRacha).toBe(false);
    });

    it('debería romper racha mensual si pasaron más de 31 días', async () => {
      // Arrange
      const hace32Dias = new Date();
      hace32Dias.setDate(hace32Dias.getDate() - 32);
      
      const mockRachaVieja = {
        id_racha: 'racha-123',
        id_registro_intervalo: 'registro-123',
        inicio_racha: hace32Dias,
        fin_racha: hace32Dias,
        dias_consecutivos: 2,
        racha_activa: true
      };

      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn(() => ({
                limit: vi.fn(() => Promise.resolve({
                  data: [mockRachaVieja],
                  error: null
                }))
              }))
            }))
          }))
        }))
      });

      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => ({
              limit: vi.fn(() => Promise.resolve({
                data: [{ fecha: new Date() }],
                error: null
              }))
            }))
          }))
        }))
      });

      mockSupabase.from.mockReturnValueOnce({
        update: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({
            data: { ...mockRachaVieja, racha_activa: false },
            error: null
          }))
        }))
      });

      mockSupabase.from.mockReturnValueOnce({
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: {
                id_racha: 'racha-nueva',
                id_registro_intervalo: 'registro-123',
                inicio_racha: new Date(),
                fin_racha: new Date(),
                dias_consecutivos: 1,
                racha_activa: true
              },
              error: null
            }))
          }))
        }))
      });

      // Act
      const result = await updateRachaOnHabitCompletion(
        'registro-123',
        'habito-123',
        'mensual',
        true,
        3
      );

      // Assert
      expect(result.success).toBe(true);
      expect(result.isNewRacha).toBe(true);
    });
  });

  describe('getRachasMultiplesHabitos', () => {
    it('debería retornar un objeto vacío para array vacío', async () => {
      // Act
      const rachas = await getRachasMultiplesHabitos([]);

      // Assert
      expect(rachas).toEqual({});
    });

    it('debería calcular rachas según el tipo de intervalo', async () => {
      // Arrange
      const habitoIds = ['habito-1'];

      // Mock para obtener información del hábito
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: {
                meta_repeticion: 3,
                intervalo_meta: 'diario'
              },
              error: null
            }))
          }))
        }))
      });

      // Mock para obtener registros
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => ({
              limit: vi.fn(() => Promise.resolve({
                data: [
                  { fecha: new Date() },
                  { fecha: new Date() },
                  { fecha: new Date() }
                ],
                error: null
              }))
            }))
          }))
        }))
      });

      // Act
      const rachas = await getRachasMultiplesHabitos(habitoIds);

      // Assert
      expect(rachas).toHaveProperty('habito-1');
      expect(typeof rachas['habito-1']).toBe('number');
    });

    it('debería manejar errores retornando el hábito en 0', async () => {
      // Arrange
      const habitoIds = ['habito-1'];
      const mockError = new Error('Database error');

      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.reject(mockError))
          }))
        }))
      });

      // Act
      const rachas = await getRachasMultiplesHabitos(habitoIds);

      // Assert
      expect(rachas).toEqual({
        'habito-1': 0
      });
    });
  });
});