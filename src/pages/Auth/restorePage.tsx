import React, { useState } from "react";
import { supabase } from "../../config/supabase";

const RestorePage: React.FC = () => {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);
        setError(null);

        if (!email || email.indexOf("@") === -1) {
            setError("Introduce un correo válido.");
            return;
        }

        setLoading(true);
        try {
            // Ajusta `redirectTo` a la ruta donde el usuario completará la nueva contraseña en tu app.
            // Dependiendo de la versión de supabase-js puede ser `supabase.auth.resetPasswordForEmail`
            // o `supabase.auth.api.resetPasswordForEmail`. Ajusta según tu cliente.
            const { error: supabaseError } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/new-password`,
            });

            if (supabaseError) {
                setError(supabaseError.message);
            } else {
                // Por privacidad no indicamos si el email existe o no.
                setMessage("Si existe una cuenta con ese correo, recibirás un email para restablecer la contraseña.");
                setEmail("");
            }
        } catch (err: any) {
            setError(err?.message ?? "Error inesperado");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: 420, margin: "4rem auto", padding: 24, border: "1px solid #e5e7eb", borderRadius: 8 }}>
            <h1 style={{ marginBottom: 12 }}>Restablecer contraseña</h1>
            <p style={{ marginBottom: 16, color: "#6b7280" }}>
                Introduce tu correo y te enviaremos un enlace para restablecer la contraseña.
            </p>

            <form onSubmit={handleSubmit}>
                <label style={{ display: "block", marginBottom: 8 }}>
                    Correo
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="tu@correo.com"
                        required
                        style={{
                            display: "block",
                            width: "100%",
                            padding: "8px 10px",
                            marginTop: 6,
                            borderRadius: 4,
                            border: "1px solid #d1d5db",
                        }}
                        disabled={loading}
                    />
                </label>

                <button
                    type="submit"
                    disabled={loading}
                    style={{
                        marginTop: 12,
                        padding: "10px 14px",
                        background: "#2563eb",
                        color: "white",
                        border: "none",
                        borderRadius: 6,
                        cursor: loading ? "not-allowed" : "pointer",
                    }}
                >
                    {loading ? "Enviando..." : "Enviar enlace"}
                </button>
            </form>

            {message && <p style={{ marginTop: 12, color: "#16a34a" }}>{message}</p>}
            {error && <p style={{ marginTop: 12, color: "#dc2626" }}>{error}</p>}
        </div>
    );
};

export default RestorePage;