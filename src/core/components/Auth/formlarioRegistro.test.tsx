import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import FormularioRegistro from "./formularioRegistro";

describe("FormularioRegistro", () => {
    const typeIn = (selectorText: string, value: string) => {
        const el = screen.getByPlaceholderText(selectorText) as HTMLInputElement;
        fireEvent.change(el, { target: { value } });
        return el;
    };

    it("renderiza campos y botón", () => {
        render(<FormularioRegistro onSubmit={vi.fn()} />);

        expect(screen.getByLabelText("Nombre")).toBeInTheDocument();
        expect(screen.getByLabelText("Correo electrónico")).toBeInTheDocument();
        expect(screen.getByLabelText("Contraseña")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Registrarse" })).toBeInTheDocument();
    });

    it("muestra error si el email está vacío y no llama onSubmit", () => {
        const onSubmit = vi.fn();
        render(<FormularioRegistro onSubmit={onSubmit} />);

        typeIn("Tu nombre", "Juan");
        typeIn("contraseña", "123456");

        fireEvent.click(screen.getByRole("button", { name: "Registrarse" }));

        expect(screen.getByRole("alert")).toHaveTextContent("El email es obligatorio.");
        expect(onSubmit).not.toHaveBeenCalled();
    });

    it("muestra error si la contraseña tiene menos de 6 caracteres y no llama onSubmit", () => {
        const onSubmit = vi.fn();
        render(<FormularioRegistro onSubmit={onSubmit} />);

        typeIn("Tu nombre", "Juan");
        typeIn("tucorreo@email.com", "test@example.com");
        typeIn("contraseña", "123"); // < 6

        fireEvent.click(screen.getByRole("button", { name: "Registrarse" }));

        expect(screen.getByRole("alert")).toHaveTextContent(
        "La contraseña debe tener al menos 6 caracteres."
        );
        expect(onSubmit).not.toHaveBeenCalled();
    });

    it("muestra error si el nombre está vacío y no llama onSubmit", () => {
        const onSubmit = vi.fn();
        render(<FormularioRegistro onSubmit={onSubmit} />);

        typeIn("tucorreo@email.com", "test@example.com");
        typeIn("contraseña", "123456");

        fireEvent.click(screen.getByRole("button", { name: "Registrarse" }));

        expect(screen.getByRole("alert")).toHaveTextContent("El nombre es obligatorio.");
        expect(onSubmit).not.toHaveBeenCalled();
    });

    it("llama a onSubmit con el payload correcto cuando el formulario es válido", async () => {
        const onSubmit = vi.fn().mockResolvedValue(undefined);
        render(<FormularioRegistro onSubmit={onSubmit} />);

        typeIn("Tu nombre", "Juan");
        typeIn("tucorreo@email.com", "test@example.com");
        typeIn("contraseña", "password123");

        fireEvent.click(screen.getByRole("button", { name: "Registrarse" }));

        await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledTimes(1);
        expect(onSubmit).toHaveBeenCalledWith({
            nombre: "Juan",
            email: "test@example.com",
            password: "password123",
        });
        });
    });

    it("muestra estado de carga y deshabilita el botón mientras se registra", async () => {
        const onSubmit = vi.fn().mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 50))
        );

        render(<FormularioRegistro onSubmit={onSubmit} />);

        typeIn("Tu nombre", "Juan");
        typeIn("tucorreo@email.com", "test@example.com");
        typeIn("contraseña", "password123");

        const button = screen.getByRole("button", { name: "Registrarse" });
        fireEvent.click(button);

        // Durante la petición
        expect(screen.getByRole("button", { name: "Registrando..." })).toBeDisabled();

        // Después de resolver
        await waitFor(() => {
        expect(screen.getByRole("button", { name: "Registrarse" })).not.toBeDisabled();
        });
    });

    it("muestra el error proveniente de onSubmit cuando falla", async () => {
        const onSubmit = vi.fn().mockRejectedValue(new Error("Servidor caído"));
        render(<FormularioRegistro onSubmit={onSubmit} />);

        typeIn("Tu nombre", "Juan");
        typeIn("tucorreo@email.com", "test@example.com");
        typeIn("contraseña", "password123");

        fireEvent.click(screen.getByRole("button", { name: "Registrarse" }));

        expect(await screen.findByRole("alert")).toHaveTextContent("Servidor caído");
    });

    it("asegura asociaciones de accesibilidad entre labels e inputs", () => {
        render(<FormularioRegistro onSubmit={vi.fn()} />);

        expect(screen.getByLabelText("Nombre")).toHaveAttribute("id", "nombre");
        expect(screen.getByLabelText("Correo electrónico")).toHaveAttribute("id", "email");
        expect(screen.getByLabelText("Contraseña")).toHaveAttribute("id", "password");
    });
});

