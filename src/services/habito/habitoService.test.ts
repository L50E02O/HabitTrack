import { describe, it, expect, vi, beforeEach } from "vitest";
import { supabase } from "../../config/supabase";
import { createHabito, getAllHabitos, getHabitoById, updateHabito, deleteHabito } from "./habitoService";

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

describe("HabitoService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deberia crear un habito correctamente", async () => {
    const mockHabito = {
      id_habito: "1",
      id_perfil: "user1",
      nombre_habito: "Correr",
      descripcion: "Correr 5km",
      categoria: "ejercicio",
      intervalo_meta: "diario",
      meta_repeticion: 1,
      fecha_creacion: new Date(),
      activo: true,
      dificultad: "medio",
      puntos: 10,
      unidad_medida: "minutos",
    };

    (supabase.from as any).mockReturnValue({
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: mockHabito, error: null }),
    });

    const result = await createHabito(mockHabito);
    expect(result).toEqual(mockHabito);
  });

  it("deberia obtener todos los habitos correctamente", async () => {
    const mockHabitos = [
      { id_habito: "1", nombre_habito: "Correr", puntos: 10, unidad_medida: "minutos" },
      { id_habito: "2", nombre_habito: "Leer", puntos: 5, unidad_medida: "minutos" },
    ];

    (supabase.from as any).mockReturnValue({
      select: vi.fn().mockResolvedValue({ data: mockHabitos, error: null }),
    });

    const result = await getAllHabitos();
    expect(result).toEqual(mockHabitos);
  });

  it("deberia obtener un habito por id correctamente", async () => {
    const mockHabito = { id_habito: "1", nombre_habito: "Correr", puntos: 10, unidad_medida: "minutos" };

    (supabase.from as any).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: mockHabito, error: null }),
    });

    const result = await getHabitoById("1");
    expect(result).toEqual(mockHabito);
  });

  it("deberia actualizar un habito correctamente", async () => {
    (supabase.from as any).mockReturnValue({
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
      select: vi.fn().mockReturnThis(),
    });

    await expect(updateHabito("1", { nombre_habito: "Correr 10km" })).resolves.toBeUndefined();
  });

  it("deberia eliminar un habito correctamente", async () => {
    (supabase.from as any).mockReturnValue({
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ data: null, error: null }),
    });

    await expect(deleteHabito("1")).resolves.toBeUndefined();
  });
});
