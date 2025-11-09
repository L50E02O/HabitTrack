import { describe, it, expect, vi, beforeEach } from "vitest";
import { supabase } from "../../config/supabase";
import { createPerfil, getAllPerfils, getPerfilById, updatePerfil, deletePerfil } from "./perfilService";

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

describe("PerfilService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deberia crear un perfil correctamente", async () => {
    const mockPerfil = {
      id: "user1",
      nombre: "Juan Pérez",
      foto_perfil: "https://example.com/foto.jpg",
      puntos: 0,
      protectores_racha:0 ,
    };

    (supabase.from as any).mockReturnValue({
      insert: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: mockPerfil, error: null }),
    });

    const result = await createPerfil(mockPerfil);
    expect(result).toEqual(mockPerfil);
  });

  it("deberia obtener todos los perfiles correctamente", async () => {
    const mockPerfiles = [
      { id: "user1", nombre: "Juan Pérez", puntos: 100 },
      { id: "user2", nombre: "María García", puntos: 200 },
    ];

    (supabase.from as any).mockReturnValue({
      select: vi.fn().mockResolvedValue({ data: mockPerfiles, error: null }),
    });

    const result = await getAllPerfils();
    expect(result).toEqual(mockPerfiles);
  });

  it("deberia obtener un perfil por id correctamente", async () => {
    const mockPerfil = { id: "user1", nombre: "Juan Pérez", puntos: 100 };

    (supabase.from as any).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: mockPerfil, error: null }),
    });

    const result = await getPerfilById("user1");
    expect(result).toEqual(mockPerfil);
  });

  it("deberia actualizar un perfil correctamente", async () => {
    (supabase.from as any).mockReturnValue({
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    });

    await expect(updatePerfil("user1", { nombre: "Juan Carlos Pérez" })).resolves.toBeUndefined();
  });

  it("deberia eliminar un perfil correctamente", async () => {
    (supabase.from as any).mockReturnValue({
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ data: null, error: null }),
    });

    await expect(deletePerfil("user1")).resolves.toBeUndefined();
  });
});
