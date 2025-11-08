import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import HabitCard from "./HabitCard";
import type { IHabito } from "../../../types/IHabito";

describe("HabitCard - Dificultad Badge", () => {
  const mockHabitoFacil: IHabito = {
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
  };

  const mockHabitoMedio: IHabito = {
    id_habito: "2",
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
  };

  const mockHabitoDificil: IHabito = {
    id_habito: "3",
    id_perfil: "user1",
    nombre_habito: "Entrenar",
    descripcion: "Entrenar 2 horas",
    categoria: "ejercicio",
    intervalo_meta: "diario",
    meta_repeticion: 2,
    fecha_creacion: new Date(),
    activo: true,
    dificultad: "dificil",
    puntos: 8,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deberia mostrar badge de dificultad facil", () => {
    render(<HabitCard habito={mockHabitoFacil} />);

    const badge = screen.getByText(/Fácil \(3 pts\)/i);
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass("dificultadBadge", "facil");
  });

  it("deberia mostrar badge de dificultad medio", () => {
    render(<HabitCard habito={mockHabitoMedio} />);

    const badge = screen.getByText(/Medio \(5 pts\)/i);
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass("dificultadBadge", "medio");
  });

  it("deberia mostrar badge de dificultad dificil", () => {
    render(<HabitCard habito={mockHabitoDificil} />);

    const badge = screen.getByText(/Difícil \(8 pts\)/i);
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass("dificultadBadge", "dificil");
  });

  it("deberia tener estilo correcto para dificultad facil", () => {
    render(<HabitCard habito={mockHabitoFacil} />);

    const badge = screen.getByText(/Fácil \(3 pts\)/i);
    expect(badge).toHaveClass("facil");
  });

  it("deberia tener estilo correcto para dificultad medio", () => {
    render(<HabitCard habito={mockHabitoMedio} />);

    const badge = screen.getByText(/Medio \(5 pts\)/i);
    expect(badge).toHaveClass("medio");
  });

  it("deberia tener estilo correcto para dificultad dificil", () => {
    render(<HabitCard habito={mockHabitoDificil} />);

    const badge = screen.getByText(/Difícil \(8 pts\)/i);
    expect(badge).toHaveClass("dificil");
  });

  it("deberia mostrar nombre del hábito además del badge", () => {
    render(<HabitCard habito={mockHabitoFacil} />);

    expect(screen.getByText("Leer")).toBeInTheDocument();
    expect(screen.getByText(/Fácil \(3 pts\)/i)).toBeInTheDocument();
  });

  it("deberia mostrar descripción además del badge", () => {
    render(<HabitCard habito={mockHabitoFacil} />);

    expect(screen.getByText("Leer 30 minutos")).toBeInTheDocument();
    expect(screen.getByText(/Fácil \(3 pts\)/i)).toBeInTheDocument();
  });

  it("deberia mostrar progreso (0/1) para hábito sin completar", () => {
    render(<HabitCard habito={mockHabitoFacil} weeklyCount={0} />);

    expect(screen.getByText("0/1")).toBeInTheDocument();
    expect(screen.getByText(/Fácil \(3 pts\)/i)).toBeInTheDocument();
  });

  it("deberia mostrar progreso (5/5) para hábito completado", () => {
    render(<HabitCard habito={mockHabitoMedio} weeklyCount={5} />);

    expect(screen.getByText("5/5")).toBeInTheDocument();
    expect(screen.getByText(/Medio \(5 pts\)/i)).toBeInTheDocument();
  });

  it("deberia mostrar botón Avanzar cuando no está completado", () => {
    const mockOnAdvance = vi.fn();
    render(
      <HabitCard
        habito={mockHabitoFacil}
        weeklyCount={0}
        onAdvance={mockOnAdvance}
      />
    );

    const advanceButton = screen.getByRole("button", { name: /Avanzar/i });
    expect(advanceButton).toBeInTheDocument();
    expect(screen.getByText(/Fácil \(3 pts\)/i)).toBeInTheDocument();
  });

  it("deberia mostrar botón completado cuando se alcanza la meta", () => {
    render(
      <HabitCard
        habito={mockHabitoFacil}
        weeklyCount={1}
      />
    );

    const completedButton = screen.getByRole("button", { name: /¡Completado!/i });
    expect(completedButton).toBeInTheDocument();
    expect(completedButton).toBeDisabled();
    expect(screen.getByText(/Fácil \(3 pts\)/i)).toBeInTheDocument();
  });

  it("deberia llamar onAdvance al hacer click en Avanzar", () => {
    const mockOnAdvance = vi.fn();
    render(
      <HabitCard
        habito={mockHabitoFacil}
        weeklyCount={0}
        onAdvance={mockOnAdvance}
      />
    );

    const advanceButton = screen.getByRole("button", { name: /Avanzar/i });
    fireEvent.click(advanceButton);

    expect(mockOnAdvance).toHaveBeenCalled();
  });

  it("deberia mostrar badge incluso cuando hay racha", () => {
    render(
      <HabitCard
        habito={mockHabitoMedio}
        weeklyCount={3}
        streakDays={5}
      />
    );

    expect(screen.getByText(/Medio \(5 pts\)/i)).toBeInTheDocument();
    expect(screen.getByText("Racha de 5 días")).toBeInTheDocument();
  });

  it("deberia mostrar badge con menú de opciones", () => {
    const mockOnEdit = vi.fn();
    const mockOnDelete = vi.fn();

    render(
      <HabitCard
        habito={mockHabitoDificil}
        weeklyCount={0}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    // Badge debe estar visible
    expect(screen.getByText(/Difícil \(8 pts\)/i)).toBeInTheDocument();

    // Menú debe estar accesible
    const menuButton = screen.getByRole("button", { name: /Opciones/i });
    expect(menuButton).toBeInTheDocument();
  });

  it("deberia mantener badge visible con diferentes categorías", () => {
    const habitoConCategoria = {
      ...mockHabitoFacil,
      categoria: "ejercicio" as const,
    };

    render(<HabitCard habito={habitoConCategoria} />);

    expect(screen.getByText(/Fácil \(3 pts\)/i)).toBeInTheDocument();
  });
});
