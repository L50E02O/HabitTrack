import { describe, it, expect, vi, beforeEach } from "vitest";
import { supabase } from "../../config/supabase";
import { recordHabitProgress, getHabitCurrentProgress } from "./progressService";

vi.mock("../../config/supabase", () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      single: vi.fn(),
    })),
  },
}));

vi.mock("../../utils/progressResetUtils", () => ({
  shouldResetProgress: vi.fn(() => false),
}));

vi.mock("../racha/rachaAutoService", () => ({
  updateRachaOnHabitCompletion: vi.fn(() => Promise.resolve({
    success: true,
    racha: null,
    diasConsecutivos: 0,
    message: "",
    isNewRacha: false,
  })),
  checkAndDeactivateExpiredRachas: vi.fn(() => Promise.resolve()),
}));

describe("ProgressService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("recordHabitProgress", () => {
    it("deberia registrar progreso y calcular puntos por dificultad (facil)", async () => {
      // Mock para obtenerProgresoActual - cuenta registros
      vi.mocked(supabase.from).mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [], error: null }), // Sin registros previos
      } as any);

      // Mock para guardarRegistroProgreso - insert
      vi.mocked(supabase.from).mockReturnValueOnce({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ 
          data: { id_registro_intervalo: "new-reg-id" }, 
          error: null 
        }),
      } as any);

      // Mock para actualizarPuntosUsuario - primero obtiene puntos actuales
      vi.mocked(supabase.from).mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ 
          data: { puntos: 100 }, 
          error: null 
        }),
      } as any);

      // Mock para actualizarPuntosUsuario - después actualiza puntos
      vi.mocked(supabase.from).mockReturnValueOnce({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: null, error: null }),
      } as any);

      const result = await recordHabitProgress("habit1", "user1", "diario", 5, "facil");

      expect(result.success).toBe(true);
      expect(result.pointsAdded).toBe(3); // Fácil = 3 puntos (meta=5, no completa)
      expect(result.newProgress).toBe(1);
    });

    it("deberia registrar progreso y calcular puntos por dificultad (medio)", async () => {
      // Mock para obtenerProgresoActual
      vi.mocked(supabase.from).mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      } as any);

      // Mock para guardarRegistroProgreso
      vi.mocked(supabase.from).mockReturnValueOnce({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ 
          data: { id_registro_intervalo: "new-reg-id" }, 
          error: null 
        }),
      } as any);

      // Mock para actualizarPuntosUsuario - primero obtiene puntos actuales
      vi.mocked(supabase.from).mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ 
          data: { puntos: 100 }, 
          error: null 
        }),
      } as any);

      // Mock para actualizarPuntosUsuario - después actualiza puntos
      vi.mocked(supabase.from).mockReturnValueOnce({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: null, error: null }),
      } as any);

      const result = await recordHabitProgress("habit1", "user1", "diario", 5, "medio");

      expect(result.success).toBe(true);
      expect(result.pointsAdded).toBe(5); // Medio = 5 puntos (meta=5, no completa)
      expect(result.newProgress).toBe(1);
    });

    it("deberia registrar progreso y calcular puntos por dificultad (dificil)", async () => {
      // Mock para obtenerProgresoActual
      vi.mocked(supabase.from).mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      } as any);

      // Mock para guardarRegistroProgreso
      vi.mocked(supabase.from).mockReturnValueOnce({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ 
          data: { id_registro_intervalo: "new-reg-id" }, 
          error: null 
        }),
      } as any);

      // Mock para actualizarPuntosUsuario - primero obtiene puntos actuales
      vi.mocked(supabase.from).mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ 
          data: { puntos: 100 }, 
          error: null 
        }),
      } as any);

      // Mock para actualizarPuntosUsuario - después actualiza puntos
      vi.mocked(supabase.from).mockReturnValueOnce({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: null, error: null }),
      } as any);

      const result = await recordHabitProgress("habit1", "user1", "diario", 5, "dificil");

      expect(result.success).toBe(true);
      expect(result.pointsAdded).toBe(8); // Difícil = 8 puntos (meta=5, no completa)
      expect(result.newProgress).toBe(1);
    });

    it("deberia doblar los puntos cuando se completa el hábito (facil)", async () => {
      // Mock para obtenerProgresoActual
      vi.mocked(supabase.from).mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      } as any);

      // Mock para guardarRegistroProgreso
      vi.mocked(supabase.from).mockReturnValueOnce({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ 
          data: { id_registro_intervalo: "new-reg-id" }, 
          error: null 
        }),
      } as any);

      // Mock para actualizarPuntosUsuario - primero obtiene puntos actuales
      vi.mocked(supabase.from).mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ 
          data: { puntos: 100 }, 
          error: null 
        }),
      } as any);

      // Mock para actualizarPuntosUsuario - después actualiza puntos
      vi.mocked(supabase.from).mockReturnValueOnce({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: null, error: null }),
      } as any);

      // Meta de 1, entonces al primer avance se completa
      const result = await recordHabitProgress("habit1", "user1", "diario", 1, "facil");

      expect(result.isComplete).toBe(true);
      expect(result.pointsAdded).toBe(6); // Fácil * 2 = 3 * 2 = 6 puntos
    });

    it("deberia doblar los puntos cuando se completa el hábito (dificil)", async () => {
      // Mock para obtenerProgresoActual
      vi.mocked(supabase.from).mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      } as any);

      // Mock para guardarRegistroProgreso
      vi.mocked(supabase.from).mockReturnValueOnce({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ 
          data: { id_registro_intervalo: "new-reg-id" }, 
          error: null 
        }),
      } as any);

      // Mock para actualizarPuntosUsuario - primero obtiene puntos actuales
      vi.mocked(supabase.from).mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ 
          data: { puntos: 100 }, 
          error: null 
        }),
      } as any);

      // Mock para actualizarPuntosUsuario - después actualiza puntos
      vi.mocked(supabase.from).mockReturnValueOnce({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: null, error: null }),
      } as any);

      // Meta de 1, entonces al primer avance se completa
      const result = await recordHabitProgress("habit1", "user1", "diario", 1, "dificil");

      expect(result.isComplete).toBe(true);
      expect(result.pointsAdded).toBe(16); // Difícil * 2 = 8 * 2 = 16 puntos
    });

    it("deberia retornar error si se intenta superar la meta", async () => {
      // Ya hay 5 registros (meta = 5), entonces está completo
      const mockRegistros = Array(5).fill({
        id_habito: "habit1",
        fecha: new Date().toISOString(),
      });

      // Mock para obtenerProgresoActual - devuelve 5 registros (completo)
      vi.mocked(supabase.from).mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockRegistros, error: null }),
      } as any);

      const result = await recordHabitProgress("habit1", "user1", "semanal", 5, "medio");

      expect(result.success).toBe(false);
      expect(result.message).toContain("Ya completaste");
      expect(result.isComplete).toBe(true);
    });
  });

  describe("getHabitCurrentProgress", () => {
    it("deberia obtener el progreso actual del hábito", async () => {
      const mockRegistros = [
        { id_registro: "reg1", fecha: new Date().toISOString() },
        { id_registro: "reg2", fecha: new Date().toISOString() },
        { id_registro: "reg3", fecha: new Date().toISOString() },
      ];

      vi.mocked(supabase.from).mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockResolvedValue({ data: mockRegistros, error: null }),
      } as any);

      const result = await getHabitCurrentProgress("habit1", "diario");

      expect(result).toBe(3);
    });

    it("deberia retornar 0 si no hay registros", async () => {
      vi.mocked(supabase.from).mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockResolvedValue({ data: [], error: null }),
      } as any);

      const result = await getHabitCurrentProgress("habit1", "diario");

      expect(result).toBe(0);
    });
  });
});
