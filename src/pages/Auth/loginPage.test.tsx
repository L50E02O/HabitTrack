import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import LoginPage from "./loginPage";
import { useNavigate } from "react-router-dom";
import { signIn } from "../../services/auth/authService";

// Mock de react-router-dom
vi.mock("react-router-dom", () => ({
  useNavigate: vi.fn(),
}));

// Mock del servicio de autenticación
vi.mock("../../services/auth/authService", () => ({
  signIn: vi.fn(),
}));

// Mock del formulario de login para disparar onSubmit fácilmente
const mockFormTestId = "mock-formulario-login";
vi.mock("../../core/components/Auth/fomularioLogin", () => ({
  __esModule: true,
  default: ({ onSubmit }: { onSubmit: (email: string, password: string) => void }) => (
    <div data-testid={mockFormTestId}>
      <button onClick={() => onSubmit("test@example.com", "password123")}>
        Enviar login (mock)
      </button>
    </div>
  ),
}));

const signInMock = signIn as unknown as Mock;
const useNavigateMock = useNavigate as unknown as Mock;

describe("LoginPage", () => {
	const mockNavigate = vi.fn();

	beforeEach(() => {
		vi.clearAllMocks();
		useNavigateMock.mockReturnValue(mockNavigate);
	});

	it("renderiza título, subtítulo, formulario mock y enlace de footer", () => {
		render(<LoginPage />);

		expect(screen.getByRole("heading", { name: /bienvenido/i })).toBeInTheDocument();
		expect(screen.getByText(/inicia sesión para continuar tu progreso\./i)).toBeInTheDocument();
		expect(screen.getByTestId(mockFormTestId)).toBeInTheDocument();

	// El componente ahora usa un <a> sin href y navega por onClick
	const footerLink = screen.getByText(/regístrate aquí/i);
	// Simular click y verificar que se llamó a navigate
	fireEvent.click(footerLink);
	expect(mockNavigate).toHaveBeenCalledWith("/registro");
	});

	it("flujo exitoso: inicia sesión y navega a la página principal", async () => {
		signInMock.mockResolvedValue({ user: { id: "uid_123", email: "test@example.com" } });

		render(<LoginPage />);

		fireEvent.click(screen.getByText(/enviar login \(mock\)/i));

		await waitFor(() => {
		expect(signInMock).toHaveBeenCalledWith("test@example.com", "password123");
		});

		expect(mockNavigate).toHaveBeenCalledWith("/dashboard");
	});

	it("muestra estado de carga mientras procesa y vuelve a mostrar el formulario al finalizar", async () => {
		let resolveSignIn: (v: unknown) => void;
		const signInPromise = new Promise((res) => { resolveSignIn = res; });
		signInMock.mockReturnValue(signInPromise);

		render(<LoginPage />);

		fireEvent.click(screen.getByText(/enviar login \(mock\)/i));

		// Debe mostrarse el indicador de carga
		expect(screen.getByText(/iniciando sesión\.\.\./i)).toBeInTheDocument();

		// Completar signIn
		// @ts-ignore
		resolveSignIn({ user: { id: "uid_loading" } });

		await waitFor(() => {
		// El formulario vuelve a mostrarse
		expect(screen.getByTestId(mockFormTestId)).toBeInTheDocument();
		});
	});

	it("muestra error si signIn no devuelve usuario", async () => {
		signInMock.mockResolvedValue({});

		render(<LoginPage />);
		fireEvent.click(screen.getByText(/enviar login \(mock\)/i));

		const alert = await screen.findByRole("alert");
		expect(alert).toHaveTextContent("No se pudo iniciar sesión. Revisa tus credenciales.");
	});

	it("muestra error si falla signIn y no navega", async () => {
		signInMock.mockRejectedValue(new Error("Credenciales inválidas"));

		render(<LoginPage />);
		fireEvent.click(screen.getByText(/enviar login \(mock\)/i));

		const alert = await screen.findByRole("alert");
		expect(alert).toHaveTextContent("Credenciales inválidas");
		expect(mockNavigate).not.toHaveBeenCalled();
	});

	it("muestra error genérico si signIn falla sin mensaje", async () => {
		signInMock.mockRejectedValue(new Error());

		render(<LoginPage />);
		fireEvent.click(screen.getByText(/enviar login \(mock\)/i));

		const alert = await screen.findByRole("alert");
		expect(alert).toHaveTextContent("Error al iniciar sesión");
		expect(mockNavigate).not.toHaveBeenCalled();
	});

	it("limpia el error al intentar nuevo login", async () => {
		// Primer intento: falla
		signInMock.mockRejectedValueOnce(new Error("Error 1"));

		render(<LoginPage />);
		fireEvent.click(screen.getByText(/enviar login \(mock\)/i));

		const alert1 = await screen.findByRole("alert");
		expect(alert1).toHaveTextContent("Error 1");

		// Segundo intento: éxito
		signInMock.mockResolvedValueOnce({ user: { id: "uid_123" } });
		fireEvent.click(screen.getByText(/enviar login \(mock\)/i));

		// El error debería desaparecer durante el loading
		await waitFor(() => {
		expect(screen.queryByRole("alert")).not.toBeInTheDocument();
		});
	});

	it("renderiza el icono en el contenedor", () => {
		render(<LoginPage />);

		// Verificar que el SVG del icono existe en el contenedor
		const svg = document.querySelector(".lucide-sprout");
		expect(svg).toBeInTheDocument();
	});
});
