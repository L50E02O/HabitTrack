import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from "vitest";
import { useNavigate } from 'react-router-dom';

vi.mock('react-router-dom', () => ({
  useNavigate: vi.fn(),
}));
import RegistroPage from "./registroPage";
import { signUp } from "../../services/auth/authService";
import { createPerfil } from "../../services/perfil/perfilService";

// Mocks de servicios
vi.mock("../../services/auth/authService", () => ({
  signUp: vi.fn(),
}));
vi.mock("../../services/perfil/perfilService", () => ({
  createPerfil: vi.fn(),
}));

// Mock del formulario de registro para poder disparar onSubmit fácilmente
const mockOnSubmitTriggerTestId = "mock-formulario-registro";
vi.mock("../../core/components/Auth/formularioRegistro", () => ({
  __esModule: true,
  default: ({ onSubmit }: { onSubmit: (p: { email: string; password: string; nombre: string }) => void }) => (
    <div data-testid={mockOnSubmitTriggerTestId}>
      <button onClick={() => onSubmit({ email: "test@example.com", password: "password123", nombre: "Juan" })}>
        Enviar registro (mock)
      </button>
    </div>
  ),
}));

const signUpMock = signUp as unknown as Mock;
const createPerfilMock = createPerfil as unknown as Mock;

describe("RegistroPage", () => {
    const originalAlert = window.alert;

    beforeEach(() => {
        vi.clearAllMocks();
        window.alert = vi.fn();
    });

    afterEach(() => {
        window.alert = originalAlert;
    });

    it("renderiza título, subtítulo, formulario mock y enlace de footer", () => {
    const mockNavigate = vi.fn();
    const useNavigateMock = useNavigate as unknown as Mock;
    useNavigateMock.mockReturnValue(mockNavigate);

    render(<RegistroPage />);

    expect(screen.getByRole("heading", { name: /crea tu cuenta/i })).toBeInTheDocument();
    expect(screen.getByText(/únete para empezar a construir hábitos saludables\./i)).toBeInTheDocument();
    expect(screen.getByTestId(mockOnSubmitTriggerTestId)).toBeInTheDocument();

    const footerLink = screen.getByText(/inicia sesión/i);
    fireEvent.click(footerLink);
    expect(mockNavigate).toHaveBeenCalledWith('/login');
    });

    it("flujo exitoso: registra en auth, crea perfil y muestra alerta", async () => {
        signUpMock.mockResolvedValue({ user: { id: "uid_123" } });
        createPerfilMock.mockResolvedValue(undefined);

        render(<RegistroPage />);

        fireEvent.click(screen.getByText(/enviar registro \(mock\)/i));

        await waitFor(() => {
        expect(signUpMock).toHaveBeenCalledWith("test@example.com", "password123");
        });

        expect(createPerfilMock).toHaveBeenCalledWith({ id: "uid_123", nombre: "Juan", puntos: 0, protectores_racha: 0});
        expect(window.alert).toHaveBeenCalledWith(
        "Por favor, revisa tu correo electrónico para verificar tu cuenta."
        );
    });

    it("muestra estado de carga mientras procesa y vuelve a mostrar el formulario al finalizar", async () => {
        let resolveSignUp: (v: unknown) => void;
        const signUpPromise = new Promise((res) => { resolveSignUp = res; });
        // @ts-ignore
        signUpMock.mockReturnValue(signUpPromise);
        createPerfilMock.mockResolvedValue(undefined);

        render(<RegistroPage />);

        fireEvent.click(screen.getByText(/enviar registro \(mock\)/i));

        // Debe mostrarse el indicador de carga y ocultarse el formulario
        expect(screen.getByText(/registrando\.\.\./i)).toBeInTheDocument();

        // Completar signUp
        // @ts-ignore
        resolveSignUp({ user: { id: "uid_loading" } });

        await waitFor(() => {
        // El formulario vuelve a mostrarse
        expect(screen.getByTestId(mockOnSubmitTriggerTestId)).toBeInTheDocument();
        });
    });

    it("muestra error si signUp no devuelve usuario", async () => {
        signUpMock.mockResolvedValue({});

        render(<RegistroPage />);
        fireEvent.click(screen.getByText(/enviar registro \(mock\)/i));

        const alert = await screen.findByRole("alert");
        expect(alert).toHaveTextContent("No se obtuvo el usuario tras el registro");
    });

    it("muestra error si falla signUp y no llama a createPerfil", async () => {
        signUpMock.mockRejectedValue(new Error("falló auth"));

        render(<RegistroPage />);
        fireEvent.click(screen.getByText(/enviar registro \(mock\)/i));

        const alert = await screen.findByRole("alert");
        expect(alert).toHaveTextContent("falló auth");
        expect(createPerfilMock).not.toHaveBeenCalled();
    });
});
