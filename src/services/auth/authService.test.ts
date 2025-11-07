import { describe, it, expect, vi, beforeEach } from "vitest";
import { supabase } from "../../config/supabase";
import { signUp, signIn, signOut } from "./authService";

vi.mock("../../config/supabase", () => ({
  supabase: {
    auth: {
      signUp: vi.fn(),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
    },
  },
}));

describe("AuthService", ()=>{

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deberia registrar a un usuario correctamente", async ()=>{
    (supabase.auth.signUp as any).mockResolvedValue({
      data: { user: { id: "123", email: "prueba@gmail.com"} },
      error: null,
    });

    const response = await signUp("prueba@gmail.com", "password123");

    expect(response.user?.email).toBe("prueba@gmail.com");
    expect(supabase.auth.signUp).toHaveBeenCalledWith({
      email: "prueba@gmail.com",
      password: "password123",
      options: expect.objectContaining({
        emailRedirectTo: expect.any(String),
      }),
    });
  });

  it("deberia iniciar sesion correctamente", async ()=>{
    (supabase.auth.signInWithPassword as any).mockResolvedValue({
      data: { user: { id: "123", email: "prueba@gmail.com"} },
      error: null,
    });

    const response = await signIn("prueba@gmail.com", "password123");

    expect(response.user?.email).toBe("prueba@gmail.com");
    expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: "prueba@gmail.com",
      password: "password123",
    });
  });

  it("deberia cerrar sesion correctamente", async ()=>{
    (supabase.auth.signOut as any).mockResolvedValue({ error: null });
    const response = await signOut();

    expect(response).toBe(true);
    expect(supabase.auth.signOut).toHaveBeenCalled();
  });


});

