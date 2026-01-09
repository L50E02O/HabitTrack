import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import CreateHabitoModal from "./CreateHabitoModal.tsx";
import * as habitoService from "../../../../services/habito/habitoService";

vi.mock("../../../../services/habito/habitoService", () => ({
  createHabito: vi.fn(),
}));

describe("CreateHabitoModal - Dificultad", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deberia mostrar selector de dificultad con opciones", () => {
    const mockOnCreated = vi.fn();
    const mockOnClose = vi.fn();

    render(
      <CreateHabitoModal
        userId="user1"
        open={true}
        onClose={mockOnClose}
        onCreated={mockOnCreated}
      />
    );

    const dificultadSelect = screen.getByTitle("Dificultad");
    expect(dificultadSelect).toBeInTheDocument();

    // Verificar opciones
    const options = screen.getAllByRole("option");
    const dificultadOptions = options.filter(
      (opt) =>
        opt.textContent?.includes("Fácil") ||
        opt.textContent?.includes("Medio") ||
        opt.textContent?.includes("Difícil")
    );

    expect(dificultadOptions.length).toBeGreaterThanOrEqual(3);
    expect(screen.getByText("Fácil (3 pts)")).toBeInTheDocument();
    expect(screen.getByText("Medio (5 pts)")).toBeInTheDocument();
    expect(screen.getByText("Difícil (8 pts)")).toBeInTheDocument();
  });

  it("deberia tener medio como dificultad por defecto", () => {
    const mockOnCreated = vi.fn();
    const mockOnClose = vi.fn();

    render(
      <CreateHabitoModal
        userId="user1"
        open={true}
        onClose={mockOnClose}
        onCreated={mockOnCreated}
      />
    );

    const dificultadSelect = screen.getByTitle("Dificultad") as HTMLSelectElement;
    expect(dificultadSelect.value).toBe("medio");
  });

  it("deberia permitir cambiar la dificultad", () => {
    const mockOnCreated = vi.fn();
    const mockOnClose = vi.fn();

    render(
      <CreateHabitoModal
        userId="user1"
        open={true}
        onClose={mockOnClose}
        onCreated={mockOnCreated}
      />
    );

    const dificultadSelect = screen.getByTitle("Dificultad") as HTMLSelectElement;
    fireEvent.change(dificultadSelect, { target: { value: "facil" } });

    expect(dificultadSelect.value).toBe("facil");

    fireEvent.change(dificultadSelect, { target: { value: "dificil" } });
    expect(dificultadSelect.value).toBe("dificil");
  });

  it("deberia crear hábito con dificultad facil y puntos correctos", async () => {
    const mockHabito = {
      id_habito: "1",
      id_perfil: "user1",
      nombre_habito: "Leer",
      descripcion: "Leer 30 minutos",
      categoria: "estudio",
      intervalo_meta: "diario",
      meta_repeticion: 1,
      fecha_creacion: new Date(),
      activo: true,
      dificultad: "facil",
      puntos: 3,
      unidad_medida: "minutos",
    };

    vi.mocked(habitoService.createHabito).mockResolvedValue(mockHabito);

    const mockOnCreated = vi.fn();
    const mockOnClose = vi.fn();

    render(
      <CreateHabitoModal
        userId="user1"
        open={true}
        onClose={mockOnClose}
        onCreated={mockOnCreated}
      />
    );

    // Llenar formulario
    const nombreInput = screen.getByPlaceholderText("Ej. Beber 2L de agua");
    fireEvent.change(nombreInput, { target: { value: "Leer" } });

    const dificultadSelect = screen.getByTitle("Dificultad");
    fireEvent.change(dificultadSelect, { target: { value: "facil" } });

    const createButton = screen.getByRole("button", { name: /Crear Hábito/i });
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(habitoService.createHabito).toHaveBeenCalledWith(
        expect.objectContaining({
          nombre_habito: "Leer",
          dificultad: "facil",
          puntos: 3,
          unidad_medida: expect.any(String),
        })
      );
    });
  });

  it("deberia crear hábito con dificultad dificil y puntos correctos", async () => {
    const mockHabito = {
      id_habito: "1",
      id_perfil: "user1",
      nombre_habito: "Entrenar",
      descripcion: "Entrenar 2 horas",
      categoria: "ejercicio",
      intervalo_meta: "diario",
      meta_repeticion: 1,
      fecha_creacion: new Date(),
      activo: true,
      dificultad: "dificil",
      puntos: 8,
      unidad_medida: "minutos",
    };

    vi.mocked(habitoService.createHabito).mockResolvedValue(mockHabito);

    const mockOnCreated = vi.fn();
    const mockOnClose = vi.fn();

    render(
      <CreateHabitoModal
        userId="user1"
        open={true}
        onClose={mockOnClose}
        onCreated={mockOnCreated}
      />
    );

    // Llenar formulario
    const nombreInput = screen.getByPlaceholderText("Ej. Beber 2L de agua");
    fireEvent.change(nombreInput, { target: { value: "Entrenar" } });

    const dificultadSelect = screen.getByTitle("Dificultad");
    fireEvent.change(dificultadSelect, { target: { value: "dificil" } });

    const createButton = screen.getByRole("button", { name: /Crear Hábito/i });
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(habitoService.createHabito).toHaveBeenCalledWith(
        expect.objectContaining({
          nombre_habito: "Entrenar",
          dificultad: "dificil",
          puntos: 8,
          unidad_medida: expect.any(String),
        })
      );
    });
  });

  it("deberia resetear la dificultad al cerrar el modal", async () => {
    const mockOnCreated = vi.fn();
    const mockOnClose = vi.fn();

    const { rerender } = render(
      <CreateHabitoModal
        userId="user1"
        open={true}
        onClose={mockOnClose}
        onCreated={mockOnCreated}
      />
    );

    // Cambiar dificultad
    const dificultadSelect = screen.getByTitle("Dificultad") as HTMLSelectElement;
    fireEvent.change(dificultadSelect, { target: { value: "facil" } });
    expect(dificultadSelect.value).toBe("facil");

    // Hacer click en cancelar
    const cancelButton = screen.getByRole("button", { name: /Cancelar/i });
    fireEvent.click(cancelButton);

    // Cerrar modal
    rerender(
      <CreateHabitoModal
        userId="user1"
        open={false}
        onClose={mockOnClose}
        onCreated={mockOnCreated}
      />
    );

    // Reabrir modal
    rerender(
      <CreateHabitoModal
        userId="user1"
        open={true}
        onClose={mockOnClose}
        onCreated={mockOnCreated}
      />
    );

    // Verificar que está en default (medio)
    const dificultadSelectNew = screen.getByTitle("Dificultad") as HTMLSelectElement;
    expect(dificultadSelectNew.value).toBe("medio");
  });
  it("deberia actualizar nombre y unidad al seleccionar un hábito predefinido", () => {
    const mockOnCreated = vi.fn();
    const mockOnClose = vi.fn();

    render(
      <CreateHabitoModal
        userId="user1"
        open={true}
        onClose={mockOnClose}
        onCreated={mockOnCreated}
      />
    );

    // Seleccionamos categoría salud
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
