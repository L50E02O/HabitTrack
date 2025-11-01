import { describe, it, expect, vi, beforeEach } from "vitest";
import { supabase } from "../../config/supabase";
import { createRecordatorio, getAllRecordatorios, getRecordatorioById, updateRecordatorio, deleteRecordatorio } from "./recordatorioService";

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

describe("RecordatorioService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deberia crear un recordatorio correctamente", async () => {
    const mockRecordatorio = {
      id_recordatorio: "1",
      id_perfil: "user1",
      id_habito: "habito1",
      mensaje: "Recuerda hacer ejercicio",
      activo: true,
      intervalo_recordatorio: "diario",
    };

    (supabase.from as any).mockReturnValue({
      insert: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: mockRecordatorio, error: null }),
    });

    const result = await createRecordatorio(mockRecordatorio);
    expect(result).toEqual(mockRecordatorio);
  });

  it("deberia obtener todos los recordatorios correctamente", async () => {
    const mockRecordatorios = [
      { id_recordatorio: "1", mensaje: "Ejercicio" },
      { id_recordatorio: "2", mensaje: "Leer" },
    ];

    (supabase.from as any).mockReturnValue({
      select: vi.fn().mockResolvedValue({ data: mockRecordatorios, error: null }),
    });

    const result = await getAllRecordatorios();
    expect(result).toEqual(mockRecordatorios);
  });

  it("deberia obtener un recordatorio por id correctamente", async () => {
    const mockRecordatorio = { id_recordatorio: "1", mensaje: "Ejercicio" };

    (supabase.from as any).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: mockRecordatorio, error: null }),
    });

    const result = await getRecordatorioById("1");
    expect(result).toEqual(mockRecordatorio);
  });

  it("deberia actualizar un recordatorio correctamente", async () => {
    (supabase.from as any).mockReturnValue({
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    });

    await expect(updateRecordatorio("1", { mensaje: "Nuevo mensaje" })).resolves.toBeUndefined();
  });

  it("deberia eliminar un recordatorio correctamente", async () => {
    (supabase.from as any).mockReturnValue({
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ data: null, error: null }),
    });

    await expect(deleteRecordatorio("1")).resolves.toBeUndefined();
  });
});
