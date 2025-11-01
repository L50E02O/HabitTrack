import { describe, it, expect, vi, beforeEach } from "vitest";
import { supabase } from "../../config/supabase";
import { createLogroUsuario, getAllLogrosUsuario, getLogroUsuarioById, updateLogroUsuario, deleteLogroUsuario } from "./logroUsuarioService";

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

describe("LogroUsuarioService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deberia crear un logro de usuario correctamente", async () => {
    const mockLogroUsuario = {
      id_logro_usuario: "1",
      id_perfil: "user1",
      id_logro: "logro1",
      fecha_obtenido: new Date(),
    };

    (supabase.from as any).mockReturnValue({
      insert: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: mockLogroUsuario, error: null }),
    });

    const result = await createLogroUsuario(mockLogroUsuario);
    expect(result).toEqual(mockLogroUsuario);
  });

  it("deberia obtener todos los logros de usuario correctamente", async () => {
    const mockLogrosUsuario = [
      { id_logro_usuario: "1", id_perfil: "user1" },
      { id_logro_usuario: "2", id_perfil: "user2" },
    ];

    (supabase.from as any).mockReturnValue({
      select: vi.fn().mockResolvedValue({ data: mockLogrosUsuario, error: null }),
    });

    const result = await getAllLogrosUsuario();
    expect(result).toEqual(mockLogrosUsuario);
  });

  it("deberia obtener un logro de usuario por id correctamente", async () => {
    const mockLogroUsuario = { id_logro_usuario: "1", id_perfil: "user1" };

    (supabase.from as any).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: mockLogroUsuario, error: null }),
    });

    const result = await getLogroUsuarioById("1");
    expect(result).toEqual(mockLogroUsuario);
  });

  it("deberia actualizar un logro de usuario correctamente", async () => {
    (supabase.from as any).mockReturnValue({
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    });

    await expect(updateLogroUsuario("1", { id_logro: "logro2" })).resolves.toBeUndefined();
  });

  it("deberia eliminar un logro de usuario correctamente", async () => {
    (supabase.from as any).mockReturnValue({
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ data: null, error: null }),
    });

    await expect(deleteLogroUsuario("1")).resolves.toBeUndefined();
  });
});
