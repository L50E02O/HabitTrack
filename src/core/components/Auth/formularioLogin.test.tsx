import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import FormularioLogin from "./fomularioLogin";

describe("FormularioLogin", () => {
    describe("Renderizado inicial", () => {
        it("debería renderizar todos los campos del formulario", () => {
            const mockOnSubmit = vi.fn();
            render(<FormularioLogin onSubmit={mockOnSubmit} />);

            // Verificar que los labels están presentes
            expect(screen.getByText("Correo electrónico")).toBeInTheDocument();
            expect(screen.getByText("Contraseña")).toBeInTheDocument();

            // Verificar que los inputs están presentes
            expect(screen.getByPlaceholderText("tucorreo@email.com")).toBeInTheDocument();
            expect(screen.getByPlaceholderText("contraseña")).toBeInTheDocument();

            // Verificar que el checkbox "Recuérdame" está presente
            expect(screen.getByLabelText("Recuérdame")).toBeInTheDocument();

            // Verificar que el botón de submit está presente
            expect(screen.getByRole("button", { name: "Iniciar Sesión" })).toBeInTheDocument();
        });

        it("debería renderizar el enlace de 'Olvidaste tu contraseña'", () => {
            const mockOnSubmit = vi.fn();
            render(<FormularioLogin onSubmit={mockOnSubmit} />);

            const forgotLink = screen.getByText("¿Olvidaste tu contraseña?");
            expect(forgotLink).toBeInTheDocument();
            expect(forgotLink).toHaveAttribute("href", "/forgot-password");
        });

        it("debería tener los campos vacíos inicialmente", () => {
            const mockOnSubmit = vi.fn();
            render(<FormularioLogin onSubmit={mockOnSubmit} />);

            const emailInput = screen.getByPlaceholderText("tucorreo@email.com") as HTMLInputElement;
            const passwordInput = screen.getByPlaceholderText("contraseña") as HTMLInputElement;

            expect(emailInput.value).toBe("");
            expect(passwordInput.value).toBe("");
        });

        it("debería tener el checkbox 'Recuérdame' desmarcado inicialmente", () => {
            const mockOnSubmit = vi.fn();
            render(<FormularioLogin onSubmit={mockOnSubmit} />);

            const checkbox = screen.getByRole("checkbox") as HTMLInputElement;
            expect(checkbox.checked).toBe(false);
        });
    });

    describe("Interacción con los campos", () => {
        it("debería permitir escribir en el campo de email", () => {
            const mockOnSubmit = vi.fn();
            render(<FormularioLogin onSubmit={mockOnSubmit} />);

            const emailInput = screen.getByPlaceholderText("tucorreo@email.com") as HTMLInputElement;
            
            fireEvent.change(emailInput, { target: { value: "usuario@test.com" } });
            
            expect(emailInput.value).toBe("usuario@test.com");
        });

        it("debería permitir escribir en el campo de contraseña", () => {
            const mockOnSubmit = vi.fn();
            render(<FormularioLogin onSubmit={mockOnSubmit} />);

            const passwordInput = screen.getByPlaceholderText("contraseña") as HTMLInputElement;
            
            fireEvent.change(passwordInput, { target: { value: "miPassword123" } });
            
            expect(passwordInput.value).toBe("miPassword123");
        });

        it("debería permitir marcar y desmarcar el checkbox 'Recuérdame'", () => {
            const mockOnSubmit = vi.fn();
            render(<FormularioLogin onSubmit={mockOnSubmit} />);

            const checkbox = screen.getByRole("checkbox") as HTMLInputElement;
            
            // Marcar el checkbox
            fireEvent.click(checkbox);
            expect(checkbox.checked).toBe(true);
            
            // Desmarcar el checkbox
            fireEvent.click(checkbox);
            expect(checkbox.checked).toBe(false);
        });

        it("debería ocultar la contraseña por defecto (type='password')", () => {
            const mockOnSubmit = vi.fn();
            render(<FormularioLogin onSubmit={mockOnSubmit} />);

            const passwordInput = screen.getByPlaceholderText("contraseña") as HTMLInputElement;
            
            expect(passwordInput.type).toBe("password");
        });
    });

    describe("Validación del formulario", () => {
        it("debería tener el atributo 'required' en el campo de email", () => {
            const mockOnSubmit = vi.fn();
            render(<FormularioLogin onSubmit={mockOnSubmit} />);

            const emailInput = screen.getByPlaceholderText("tucorreo@email.com");
            
            expect(emailInput).toBeRequired();
        });

        it("debería tener el atributo 'required' en el campo de contraseña", () => {
            const mockOnSubmit = vi.fn();
            render(<FormularioLogin onSubmit={mockOnSubmit} />);

            const passwordInput = screen.getByPlaceholderText("contraseña");
            
            expect(passwordInput).toBeRequired();
        });

        it("debería tener type='email' en el campo de email", () => {
            const mockOnSubmit = vi.fn();
            render(<FormularioLogin onSubmit={mockOnSubmit} />);

            const emailInput = screen.getByPlaceholderText("tucorreo@email.com") as HTMLInputElement;
            
            expect(emailInput.type).toBe("email");
        });
    });

    describe("Envío del formulario", () => {
        it("debería llamar a onSubmit con email y password cuando el formulario es válido", async () => {
            const mockOnSubmit = vi.fn();
            render(<FormularioLogin onSubmit={mockOnSubmit} />);

            const emailInput = screen.getByPlaceholderText("tucorreo@email.com");
            const passwordInput = screen.getByPlaceholderText("contraseña");
            const submitButton = screen.getByRole("button", { name: "Iniciar Sesión" });

            // Llenar el formulario
            fireEvent.change(emailInput, { target: { value: "test@example.com" } });
            fireEvent.change(passwordInput, { target: { value: "password123" } });

            // Enviar el formulario
            fireEvent.click(submitButton);

            await waitFor(() => {
            expect(mockOnSubmit).toHaveBeenCalledTimes(1);
            expect(mockOnSubmit).toHaveBeenCalledWith("test@example.com", "password123");
            });
        });

        it("no debería llamar a onSubmit si el formulario está vacío", () => {
            const mockOnSubmit = vi.fn();
            render(<FormularioLogin onSubmit={mockOnSubmit} />);

            const submitButton = screen.getByRole("button", { name: "Iniciar Sesión" });

            // Intentar enviar el formulario vacío
            fireEvent.click(submitButton);

            // onSubmit no debería ser llamado debido a la validación HTML5
            expect(mockOnSubmit).not.toHaveBeenCalled();
        });

        it("debería mantener los valores en los campos después de un envío fallido", async () => {
            const mockOnSubmit = vi.fn();
            render(<FormularioLogin onSubmit={mockOnSubmit} />);

            const emailInput = screen.getByPlaceholderText("tucorreo@email.com") as HTMLInputElement;
            const passwordInput = screen.getByPlaceholderText("contraseña") as HTMLInputElement;
            const submitButton = screen.getByRole("button", { name: "Iniciar Sesión" });

            // Llenar el formulario
            fireEvent.change(emailInput, { target: { value: "test@example.com" } });
            fireEvent.change(passwordInput, { target: { value: "password123" } });

            // Enviar el formulario
            fireEvent.click(submitButton);

            // Los valores deberían permanecer
            expect(emailInput.value).toBe("test@example.com");
            expect(passwordInput.value).toBe("password123");
        });
    });

    describe("Iconos", () => {
        it("debería renderizar los iconos de Lucide React", () => {
            const mockOnSubmit = vi.fn();
            const { container } = render(<FormularioLogin onSubmit={mockOnSubmit} />);

            // Verificar que los iconos SVG están presentes
            const svgIcons = container.querySelectorAll("svg");
            expect(svgIcons.length).toBeGreaterThanOrEqual(2);
        });
    });
});
