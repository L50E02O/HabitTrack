import { describe, it, expect, vi, beforeEach } from "vitest";
import { supabase } from "../../config/supabase";
import { createRegistroIntervalo, getAllRegistrosIntervalo, getRegistroIntervaloById, updateRegistroIntervalo, deleteRegistroIntervalo } from "./registroIntervaloService";

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

describe("RegistroIntervaloService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deberia crear un registro de intervalo correctamente", async () => {
    const mockRegistro = {
      id_habito: "habito1",
      fecha: new Date(),
      cumplido: true,
      puntos: 10,
      progreso: 1,
    };

    (supabase.from as any).mockReturnValue({
      insert: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: mockRegistro, error: null }),
    });

    const result = await createRegistroIntervalo(mockRegistro);
    expect(result).toEqual(mockRegistro);
  });

  it("deberia obtener todos los registros de intervalo correctamente", async () => {
    const mockRegistros = [
      { id_registro: "1", cumplido: true },
      { id_registro: "2", cumplido: false },
    ];

    (supabase.from as any).mockReturnValue({
      select: vi.fn().mockResolvedValue({ data: mockRegistros, error: null }),
    });

    const result = await getAllRegistrosIntervalo();
    expect(result).toEqual(mockRegistros);
  });

  it("deberia obtener un registro de intervalo por id correctamente", async () => {
    const mockRegistro = { id_registro: "1", cumplido: true };

    (supabase.from as any).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: mockRegistro, error: null }),
    });

    const result = await getRegistroIntervaloById("1");
    expect(result).toEqual(mockRegistro);
  });

  it("deberia actualizar un registro de intervalo correctamente", async () => {
    (supabase.from as any).mockReturnValue({
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    });

    await expect(updateRegistroIntervalo("1", { cumplido: true })).resolves.toBeUndefined();
  });

  it("deberia eliminar un registro de intervalo correctamente", async () => {
    (supabase.from as any).mockReturnValue({
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ data: null, error: null }),
    });

    await expect(deleteRegistroIntervalo("1")).resolves.toBeUndefined();
  });
});
