import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import EditHabitoModal from "./EditHabitoModal.tsx";
import * as habitoService from "../../../../services/habito/habitoService";
import type { IHabito } from "../../../../types/IHabito";

vi.mock("../../../../services/habito/habitoService", () => ({
  updateHabito: vi.fn(),
}));

describe("EditHabitoModal - Dificultad", () => {
  const mockHabito: IHabito = {
    id_habito: "1",
    id_perfil: "user1",
    nombre_habito: "Correr",
    descripcion: "Correr 5km",
    categoria: "ejercicio",
    intervalo_meta: "diario",
    meta_repeticion: 5,
    fecha_creacion: new Date(),
    activo: true,
    dificultad: "medio",
    puntos: 5,
    unidad_medida: "minutos",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deberia mostrar selector de dificultad con opciones", () => {
    const mockOnUpdated = vi.fn();
    const mockOnClose = vi.fn();

    render(
      <EditHabitoModal
        habito={mockHabito}
        open={true}
        onClose={mockOnClose}
        onUpdated={mockOnUpdated}
      />
    );

    const dificultadSelect = screen.getByTitle("Dificultad");
    expect(dificultadSelect).toBeInTheDocument();

    // Verificar opciones
    expect(screen.getByText("Fácil (3 pts)")).toBeInTheDocument();
    expect(screen.getByText("Medio (5 pts)")).toBeInTheDocument();
    expect(screen.getByText("Difícil (8 pts)")).toBeInTheDocument();
  });

  it("deberia cargar la dificultad actual del hábito", () => {
    const mockOnUpdated = vi.fn();
    const mockOnClose = vi.fn();

    render(
      <EditHabitoModal
        habito={mockHabito}
        open={true}
        onClose={mockOnClose}
        onUpdated={mockOnUpdated}
      />
    );

    const dificultadSelect = screen.getByTitle("Dificultad") as HTMLSelectElement;
    expect(dificultadSelect.value).toBe("medio");
  });

  it("deberia permitir cambiar la dificultad", () => {
    const mockOnUpdated = vi.fn();
    const mockOnClose = vi.fn();

    render(
      <EditHabitoModal
        habito={mockHabito}
        open={true}
        onClose={mockOnClose}
        onUpdated={mockOnUpdated}
      />
    );

    const dificultadSelect = screen.getByTitle("Dificultad") as HTMLSelectElement;
    fireEvent.change(dificultadSelect, { target: { value: "facil" } });

    expect(dificultadSelect.value).toBe("facil");

    fireEvent.change(dificultadSelect, { target: { value: "dificil" } });
    expect(dificultadSelect.value).toBe("dificil");
  });

  it("deberia actualizar hábito con nueva dificultad facil", async () => {
    vi.mocked(habitoService.updateHabito).mockResolvedValue(undefined);

    const mockOnUpdated = vi.fn();
    const mockOnClose = vi.fn();

    render(
      <EditHabitoModal
        habito={mockHabito}
        open={true}
        onClose={mockOnClose}
        onUpdated={mockOnUpdated}
      />
    );

    const dificultadSelect = screen.getByTitle("Dificultad");
    fireEvent.change(dificultadSelect, { target: { value: "facil" } });

    const saveButton = screen.getByRole("button", { name: /Guardar Cambios/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(habitoService.updateHabito).toHaveBeenCalledWith(
        "1",
        expect.objectContaining({
          dificultad: "facil",
          puntos: 3,
        })
      );
    });
  });

  it("deberia actualizar hábito con nueva dificultad dificil", async () => {
    vi.mocked(habitoService.updateHabito).mockResolvedValue(undefined);

    const mockOnUpdated = vi.fn();
    const mockOnClose = vi.fn();

    render(
      <EditHabitoModal
        habito={mockHabito}
        open={true}
        onClose={mockOnClose}
        onUpdated={mockOnUpdated}
      />
    );

    const dificultadSelect = screen.getByTitle("Dificultad");
    fireEvent.change(dificultadSelect, { target: { value: "dificil" } });

    const saveButton = screen.getByRole("button", { name: /Guardar Cambios/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(habitoService.updateHabito).toHaveBeenCalledWith(
        "1",
        expect.objectContaining({
          dificultad: "dificil",
          puntos: 8,
        })
      );
    });
  });

  it("deberia resetear dificultad al cancelar", async () => {
    const mockOnUpdated = vi.fn();
    const mockOnClose = vi.fn();

    render(
      <EditHabitoModal
        habito={mockHabito}
        open={true}
        onClose={mockOnClose}
        onUpdated={mockOnUpdated}
      />
    );

    // Cambiar dificultad
    const dificultadSelect = screen.getByTitle("Dificultad") as HTMLSelectElement;
    fireEvent.change(dificultadSelect, { target: { value: "facil" } });
    expect(dificultadSelect.value).toBe("facil");

    // Hacer click en cancelar
    const cancelButton = screen.getByRole("button", { name: /Cancelar/i });
    fireEvent.click(cancelButton);

    // Verificar que mockOnClose fue llamado
    expect(mockOnClose).toHaveBeenCalled();
  });

  it("deberia mantener otros campos al cambiar dificultad", async () => {
    vi.mocked(habitoService.updateHabito).mockResolvedValue(undefined);

    const mockOnUpdated = vi.fn();
    const mockOnClose = vi.fn();

    render(
      <EditHabitoModal
        habito={mockHabito}
        open={true}
        onClose={mockOnClose}
        onUpdated={mockOnUpdated}
      />
    );

    const dificultadSelect = screen.getByTitle("Dificultad");
    fireEvent.change(dificultadSelect, { target: { value: "facil" } });

    const saveButton = screen.getByRole("button", { name: /Guardar Cambios/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(habitoService.updateHabito).toHaveBeenCalledWith(
        "1",
        expect.objectContaining({
          nombre_habito: "Correr",
          descripcion: "Correr 5km",
          categoria: "ejercicio",
          intervalo_meta: "diario",
          meta_repeticion: 5,
          activo: true,
          dificultad: "facil",
          puntos: 3,
        })
      );
    });
  });

  it("deberia llamar onUpdated con hábito actualizado", async () => {
    vi.mocked(habitoService.updateHabito).mockResolvedValue(undefined);

    const mockOnUpdated = vi.fn();
    const mockOnClose = vi.fn();

    render(
      <EditHabitoModal
        habito={mockHabito}
        open={true}
        onClose={mockOnClose}
        onUpdated={mockOnUpdated}
      />
    );

    const dificultadSelect = screen.getByTitle("Dificultad");
    fireEvent.change(dificultadSelect, { target: { value: "dificil" } });

    const saveButton = screen.getByRole("button", { name: /Guardar Cambios/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockOnUpdated).toHaveBeenCalledWith(
        expect.objectContaining({
          dificultad: "dificil",
          puntos: 8,
        })
      );
    });
  });

  it("deberia actualizar nombre y unidad al seleccionar un hábito predefinido", () => {
    const mockOnUpdated = vi.fn();
    const mockOnClose = vi.fn();

    render(
      <EditHabitoModal
        habito={mockHabito}
        open={true}
        onClose={mockOnClose}
        onUpdated={mockOnUpdated}
      />
    );

    // Cambiamos a categoría salud para tener hábitos con diferentes unidades
    const categoriaSelect = screen.getByTitle("Categoría") as HTMLSelectElement;
    fireEvent.change(categoriaSelect, { target: { value: "salud" } });

    // Seleccionamos "Tomar vitaminas" (unidad: dosis)
    const predefinedSelect = screen.getByTitle("Hábito predefinido") as HTMLSelectElement;
    fireEvent.change(predefinedSelect, { target: { value: "Tomar vitaminas" } });

    expect(screen.getByDisplayValue("Tomar vitaminas")).toBeInTheDocument();
    const unidadSelect = screen.getByTitle("Unidad de medida") as HTMLSelectElement;
    expect(unidadSelect.value).toBe("dosis");
  });
});
