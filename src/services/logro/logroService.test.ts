import { describe, it, expect, vi, beforeEach } from "vitest";
import { supabase } from "../../config/supabase";
import { createLogro, getAllLogros, getLogroById, updateLogro, deleteLogro } from "./logroService";

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

describe("LogroService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deberia crear un logro correctamente", async () => {
    const mockLogro = {
      id_logro: "1",
      nombre_logro: "Primera racha",
      descripcion: "Completa tu primera racha de 7 días",
      icono: "http://example.com/icon.png",
      criterio_racha: 7,
    };

    (supabase.from as any).mockReturnValue({
      insert: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: mockLogro, error: null }),
    });

    const result = await createLogro(mockLogro);
    expect(result).toEqual(mockLogro);
  });

  it("deberia obtener todos los logros correctamente", async () => {
    const mockLogros = [
      { id_logro: "1", nombre_logro: "Primera racha", criterio_racha: 7 },
      { id_logro: "2", nombre_logro: "Racha maestra", criterio_racha: 30 },
    ];

    (supabase.from as any).mockReturnValue({
      select: vi.fn().mockResolvedValue({ data: mockLogros, error: null }),
    });

    const result = await getAllLogros();
    expect(result).toEqual(mockLogros);
  });

  it("deberia obtener un logro por id correctamente", async () => {
    const mockLogro = { id_logro: "1", nombre_logro: "Primera racha", criterio_racha: 7 };

    (supabase.from as any).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: mockLogro, error: null }),
    });

    const result = await getLogroById("1");
    expect(result).toEqual(mockLogro);
  });

  it("deberia actualizar un logro correctamente", async () => {
    (supabase.from as any).mockReturnValue({
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    });

    await expect(updateLogro("1", { criterio_racha: 10 })).resolves.toBeUndefined();
  });

  it("deberia eliminar un logro correctamente", async () => {
    (supabase.from as any).mockReturnValue({
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ data: null, error: null }),
    });

    await expect(deleteLogro("1")).resolves.toBeUndefined();
  });
});
