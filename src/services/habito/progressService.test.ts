import { describe, it, expect, vi, beforeEach } from "vitest";
import { supabase } from "../../config/supabase";
import { recordHabitProgress, getHabitCurrentProgress } from "./progressService";

// Helper para crear mocks de cadenas Supabase con todos los métodos necesarios
const createChainableMock = (resolvedValue: any = null) => {
  const chain = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    gt: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lt: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    offset: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: resolvedValue, error: null }),
    maybeSingle: vi.fn().mockResolvedValue({ data: resolvedValue, error: null }),
  };
  return chain;
};

vi.mock("../../config/supabase", () => ({
  supabase: {
    from: vi.fn(() => createChainableMock()),
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
      const fromMock = vi.mocked(supabase.from);

      // 1. obtenerProgresoActual: select().eq().maybeSingle()
      fromMock.mockReturnValueOnce(createChainableMock({
        id_registro_intervalo: "reg1",
        progreso: 0
      }) as any);

      // 2. guardarRegistroProgreso: insert().select().single()
      fromMock.mockReturnValueOnce(createChainableMock({
        id_registro_intervalo: "new-reg-id"
      }) as any);

      // 3. actualizarPuntosUsuario (get): select().eq().single()
      fromMock.mockReturnValueOnce(createChainableMock({
        puntos: 100
      }) as any);

      // 4. actualizarPuntosUsuario (update): update().eq()
      fromMock.mockReturnValueOnce(createChainableMock() as any);

      const result = await recordHabitProgress("habit1", "user1", "diario", 5, "facil");

      expect(result.success).toBe(true);
      expect(result.pointsAdded).toBe(3); // Fácil = 3 puntos
      expect(result.newProgress).toBe(1);
    });

    it("deberia registrar progreso y calcular puntos por dificultad (medio)", async () => {
      const fromMock = vi.mocked(supabase.from);

      fromMock.mockReturnValueOnce(createChainableMock({
        id_registro_intervalo: "reg1",
        progreso: 0
      }) as any);

      fromMock.mockReturnValueOnce(createChainableMock({
        id_registro_intervalo: "new-reg-id"
      }) as any);

      fromMock.mockReturnValueOnce(createChainableMock({
        puntos: 100
      }) as any);

      fromMock.mockReturnValueOnce(createChainableMock() as any);

      const result = await recordHabitProgress("habit1", "user1", "diario", 5, "medio");

      expect(result.success).toBe(true);
      expect(result.pointsAdded).toBe(5); // Medio = 5 puntos
      expect(result.newProgress).toBe(1);
    });

    it("deberia registrar progreso y calcular puntos por dificultad (dificil)", async () => {
      const fromMock = vi.mocked(supabase.from);

      fromMock.mockReturnValueOnce(createChainableMock({
        id_registro_intervalo: "reg1",
        progreso: 0
      }) as any);

      fromMock.mockReturnValueOnce(createChainableMock({
        id_registro_intervalo: "new-reg-id"
      }) as any);

      fromMock.mockReturnValueOnce(createChainableMock({
        puntos: 100
      }) as any);

      fromMock.mockReturnValueOnce(createChainableMock() as any);

      const result = await recordHabitProgress("habit1", "user1", "diario", 5, "dificil");

      expect(result.success).toBe(true);
      expect(result.pointsAdded).toBe(8); // Difícil = 8 puntos
      expect(result.newProgress).toBe(1);
    });

    it("deberia doblar los puntos cuando se completa el hábito (facil)", async () => {
      const fromMock = vi.mocked(supabase.from);

      // Meta de 1, entonces al primer avance se completa
      fromMock.mockReturnValueOnce(createChainableMock({
        id_registro_intervalo: "reg1",
        progreso: 0
      }) as any);

      fromMock.mockReturnValueOnce(createChainableMock({
        id_registro_intervalo: "new-reg-id"
      }) as any);

      fromMock.mockReturnValueOnce(createChainableMock({
        puntos: 100
      }) as any);

      fromMock.mockReturnValueOnce(createChainableMock() as any);

      const result = await recordHabitProgress("habit1", "user1", "diario", 1, "facil");

      expect(result.isComplete).toBe(true);
      expect(result.pointsAdded).toBe(6); // Fácil * 2 = 3 * 2 = 6 puntos
    });

    it("deberia doblar los puntos cuando se completa el hábito (dificil)", async () => {
      const fromMock = vi.mocked(supabase.from);

      // Meta de 1, entonces al primer avance se completa
      fromMock.mockReturnValueOnce(createChainableMock({
        id_registro_intervalo: "reg1",
        progreso: 0
      }) as any);

      fromMock.mockReturnValueOnce(createChainableMock({
        id_registro_intervalo: "new-reg-id"
      }) as any);

      fromMock.mockReturnValueOnce(createChainableMock({
        puntos: 100
      }) as any);

      fromMock.mockReturnValueOnce(createChainableMock() as any);

      const result = await recordHabitProgress("habit1", "user1", "diario", 1, "dificil");

      expect(result.isComplete).toBe(true);
      expect(result.pointsAdded).toBe(16); // Difícil * 2 = 8 * 2 = 16 puntos
    });

    it("deberia retornar error si se intenta superar la meta", async () => {
      const fromMock = vi.mocked(supabase.from);

      // Ya hay 5 registros (meta = 5), entonces está completo
      fromMock.mockReturnValueOnce(createChainableMock({
        id_registro_intervalo: "reg1",
        progreso: 5
      }) as any);

      const result = await recordHabitProgress("habit1", "user1", "semanal", 5, "medio");

      expect(result.success).toBe(false);
      expect(result.message).toContain("Ya completaste");
      expect(result.isComplete).toBe(true);
    });

    it("deberia ajustar el progreso automaticamente si falta menos de 1 para la meta", async () => {
      const fromMock = vi.mocked(supabase.from);

      // Progreso actual 1.2, meta 2.0. Falta 0.8.
      fromMock.mockReturnValueOnce(createChainableMock({
        id_registro_intervalo: "reg1",
        progreso: 1.2
      }) as any);

      // Mock para guardarRegistroProgreso
      fromMock.mockReturnValueOnce(createChainableMock({
        id_registro_intervalo: "new-reg-id"
      }) as any);

      // Mock para actualizarPuntosUsuario (get)
      fromMock.mockReturnValueOnce(createChainableMock({
        puntos: 100
      }) as any);

      // Mock para actualizarPuntosUsuario (update)
      fromMock.mockReturnValueOnce(createChainableMock() as any);

      // Intentamos avanzar con cantidad 1 (por defecto)
      const result = await recordHabitProgress("habit1", "user1", "diario", 2, "medio", 1);

      expect(result.success).toBe(true);
      expect(result.newProgress).toBe(2); // Se ajustó de 1.2 + 1 = 2.2 a 2.0
      expect(result.isComplete).toBe(true);
      expect(result.pointsAdded).toBe(10); // Medio * 2 = 5 * 2 = 10 puntos (completado)
    });
  });

  describe("getHabitCurrentProgress", () => {
    it("deberia obtener el progreso actual del hábito", async () => {
      const fromMock = vi.mocked(supabase.from);

      fromMock.mockReturnValueOnce(createChainableMock({
        progreso: 3
      }) as any);

      const result = await getHabitCurrentProgress("habit1", "diario");

      expect(result).toBe(3);
    });

    it("deberia retornar 0 si no hay registros", async () => {
      const fromMock = vi.mocked(supabase.from);

      fromMock.mockReturnValueOnce(createChainableMock(null) as any);

      const result = await getHabitCurrentProgress("habit1", "diario");

      expect(result).toBe(0);
    });
  });
});
