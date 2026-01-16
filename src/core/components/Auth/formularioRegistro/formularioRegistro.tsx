import { useState, FormEvent } from "react";
import { User, Mail, Lock } from "lucide-react";
import styles from "./formularioRegistro.module.css";

type RegistroPayload = {
  email: string;
  password: string;
  nombre: string;
};

type FormularioRegistroProps = {
  onSubmit: (payload: RegistroPayload) => Promise<void> | void;
};

export default function FormularioRegistro({ onSubmit }: FormularioRegistroProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nombre, setNombre] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validaciones 
    if (!email) return setError("El email es obligatorio.");
    if (!password || password.length < 6)
      return setError("La contraseña debe tener al menos 6 caracteres.");
    if (!nombre) return setError("El nombre es obligatorio.");

    const payload: RegistroPayload = {
      email,
      password,
      nombre
    };

    try {
      setLoading(true);
      await onSubmit(payload);
    } catch (err: any) {
      setError(err?.message || "Error al registrar usuario");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className={styles.registerForm}>
      {error && (
        <div className={styles.error} role="alert">
          {error}
        </div>
      )}

      <div className={styles.inputGroup}>
        <label htmlFor="nombre" className={styles.label}>Nombre</label>
        <div className={styles.inputWrapper}>
          <User className={styles.inputIcon} size={20} />
          <input
            id="nombre"
            type="text"
            className={styles.input}
            placeholder="Tu nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
          />
        </div>
      </div>

      <div className={styles.inputGroup}>
        <label htmlFor="email" className={styles.label}>Correo electrónico</label>
        <div className={styles.inputWrapper}>
          <Mail className={styles.inputIcon} size={20} />
          <input
            id="email"
            type="email"
            className={styles.input}
            placeholder="tucorreo@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
      </div>

      <div className={styles.inputGroup}>
        <label htmlFor="password" className={styles.label}>Contraseña</label>
        <div className={styles.inputWrapper}>
          <Lock className={styles.inputIcon} size={20} />
          <input
            id="password"
            type="password"
            className={styles.input}
            placeholder="contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
        </div>
      </div>

      <button type="submit" className={styles.botonRegistro} disabled={loading}>
        {loading ? "Registrando..." : "Registrarse"}
      </button>
    </form>
  );
};