import { describe, it, expect, vi, beforeEach } from "vitest";
import { supabase } from "../../config/supabase";
import { createRacha, getAllRachas, getRachaById, updateRacha, deleteRacha } from "./rachaService";

vi.mock("../../config/supabase", () => ({
  supabase: {
    from: vi.fn(() => ({
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(),
    })),
  },
}));

describe("RachaService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deberia crear una racha correctamente", async () => {
    const mockRacha = {
      id_racha: "1",
      id_registro_intervalo: "reg1",
      inicio_racha: new Date(),
      fin_racha: new Date(),
      dias_consecutivos: 5,
      racha_activa: true,
    };

    (supabase.from as any).mockReturnValue({
      insert: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: mockRacha, error: null }),
    });

    const result = await createRacha(mockRacha);
    expect(result).toEqual(mockRacha);
  });

  it("deberia obtener todas las rachas correctamente", async () => {
    const mockRachas = [
      { id_racha: "1", dias_consecutivos: 5 },
      { id_racha: "2", dias_consecutivos: 10 },
    ];

    (supabase.from as any).mockReturnValue({
      select: vi.fn().mockResolvedValue({ data: mockRachas, error: null }),
    });

    const result = await getAllRachas();
    expect(result).toEqual(mockRachas);
  });

  it("deberia obtener una racha por id correctamente", async () => {
    const mockRacha = { id_racha: "1", dias_consecutivos: 5 };

    (supabase.from as any).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: mockRacha, error: null }),
    });

    const result = await getRachaById("1");
    expect(result).toEqual(mockRacha);
  });

  it("deberia actualizar una racha correctamente", async () => {
    (supabase.from as any).mockReturnValue({
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    });

    await expect(updateRacha("1", { dias_consecutivos: 7 })).resolves.toBeUndefined();
  });

  it("deberia eliminar una racha correctamente", async () => {
    (supabase.from as any).mockReturnValue({
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ data: null, error: null }),
    });

    await expect(deleteRacha("1")).resolves.toBeUndefined();
  });
});
