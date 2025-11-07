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
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      single: vi.fn(),
    })),
  },
}));

vi.mock("../../utils/progressResetUtils", () => ({
  shouldResetProgress: vi.fn(() => false),
}));

describe("ProgressService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("recordHabitProgress", () => {
    it("deberia registrar progreso y calcular puntos por dificultad (facil)", async () => {
      const mockHabito = {
        id_habito: "habit1",
        fecha: new Date().toISOString(),
        puntos: 0,
        cumplido: false,
        id_registro: "reg1",
      };

      const mockPerfil = {
        id: "user1",
        puntos: 100,
      };

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({ data: [mockHabito], error: null }),
          single: vi.fn().mockResolvedValue({ data: mockPerfil, error: null }),
        }),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: [mockHabito], error: null }),
        single: vi.fn().mockResolvedValue({ data: mockPerfil, error: null }),
      } as any);

      const result = await recordHabitProgress("habit1", "user1", "diario", 5, "facil");

      expect(result.success).toBe(true);
      expect(result.pointsAdded).toBe(3); // Fácil = 3 puntos (meta=5, no completa)
      expect(result.newProgress).toBe(1);
    });

    it("deberia registrar progreso y calcular puntos por dificultad (medio)", async () => {
      const mockHabito = {
        id_habito: "habit1",
        fecha: new Date().toISOString(),
        puntos: 0,
        cumplido: false,
        id_registro: "reg1",
      };

      const mockPerfil = {
        id: "user1",
        puntos: 100,
      };

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({ data: [mockHabito], error: null }),
          single: vi.fn().mockResolvedValue({ data: mockPerfil, error: null }),
        }),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: [mockHabito], error: null }),
        single: vi.fn().mockResolvedValue({ data: mockPerfil, error: null }),
      } as any);

      const result = await recordHabitProgress("habit1", "user1", "diario", 5, "medio");

      expect(result.success).toBe(true);
      expect(result.pointsAdded).toBe(5); // Medio = 5 puntos (meta=5, no completa)
      expect(result.newProgress).toBe(1);
    });

    it("deberia registrar progreso y calcular puntos por dificultad (dificil)", async () => {
      const mockHabito = {
        id_habito: "habit1",
        fecha: new Date().toISOString(),
        puntos: 0,
        cumplido: false,
        id_registro: "reg1",
      };

      const mockPerfil = {
        id: "user1",
        puntos: 100,
      };

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({ data: [mockHabito], error: null }),
          single: vi.fn().mockResolvedValue({ data: mockPerfil, error: null }),
        }),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: [mockHabito], error: null }),
        single: vi.fn().mockResolvedValue({ data: mockPerfil, error: null }),
      } as any);

      const result = await recordHabitProgress("habit1", "user1", "diario", 5, "dificil");

      expect(result.success).toBe(true);
      expect(result.pointsAdded).toBe(8); // Difícil = 8 puntos (meta=5, no completa)
      expect(result.newProgress).toBe(1);
    });

    it("deberia doblar los puntos cuando se completa el hábito (facil)", async () => {
      const mockHabito = {
        id_habito: "habit1",
        fecha: new Date().toISOString(),
        puntos: 0,
        cumplido: false,
        id_registro: "reg1",
      };

      const mockPerfil = {
        id: "user1",
        puntos: 100,
      };

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({ data: [mockHabito], error: null }),
          single: vi.fn().mockResolvedValue({ data: mockPerfil, error: null }),
        }),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: [mockHabito], error: null }),
        single: vi.fn().mockResolvedValue({ data: mockPerfil, error: null }),
      } as any);

      // Meta de 1, entonces al primer avance se completa
      const result = await recordHabitProgress("habit1", "user1", "diario", 1, "facil");

      expect(result.isComplete).toBe(true);
      expect(result.pointsAdded).toBe(6); // Fácil * 2 = 3 * 2 = 6 puntos
    });

    it("deberia doblar los puntos cuando se completa el hábito (dificil)", async () => {
      const mockHabito = {
        id_habito: "habit1",
        fecha: new Date().toISOString(),
        puntos: 0,
        cumplido: false,
        id_registro: "reg1",
      };

      const mockPerfil = {
        id: "user1",
        puntos: 100,
      };

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({ data: [mockHabito], error: null }),
          single: vi.fn().mockResolvedValue({ data: mockPerfil, error: null }),
        }),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: [mockHabito], error: null }),
        single: vi.fn().mockResolvedValue({ data: mockPerfil, error: null }),
      } as any);

      // Meta de 1, entonces al primer avance se completa
      const result = await recordHabitProgress("habit1", "user1", "diario", 1, "dificil");

      expect(result.isComplete).toBe(true);
      expect(result.pointsAdded).toBe(16); // Difícil * 2 = 8 * 2 = 16 puntos
    });

    it("deberia retornar error si se intenta superar la meta", async () => {
      const mockHabito = {
        id_habito: "habit1",
        fecha: new Date().toISOString(),
        puntos: 5, // Ya completó (meta = 5)
        cumplido: true,
        id_registro: "reg1",
      };

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({ data: [mockHabito], error: null }),
        }),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: [mockHabito], error: null }),
      } as any);

      const result = await recordHabitProgress("habit1", "user1", "semanal", 5, "medio");

      expect(result.success).toBe(false);
      expect(result.message).toContain("Ya completaste");
      expect(result.isComplete).toBe(true);
    });
  });

  describe("getHabitCurrentProgress", () => {
    it("deberia obtener el progreso actual del hábito", async () => {
      const mockRegistro = {
        id_registro: "reg1",
        puntos: 3,
        fecha: new Date().toISOString(),
      };

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({ data: [mockRegistro], error: null }),
        }),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: [mockRegistro], error: null }),
      } as any);

      const result = await getHabitCurrentProgress("habit1", "diario");

      expect(result).toBe(3);
    });

    it("deberia retornar 0 si no hay registros", async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: [], error: null }),
      } as any);

      const result = await getHabitCurrentProgress("habit1", "diario");

      expect(result).toBe(0);
    });
  });
});
