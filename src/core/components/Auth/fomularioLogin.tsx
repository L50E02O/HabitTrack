import React, { useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { User, Lock } from "lucide-react";
import styles from "./formularioLogin.module.css";

type FormularioLoginProps = {
  onSubmit: (email: string, password: string) => void;
};

const FormularioLogin: React.FC<FormularioLoginProps> = ({ onSubmit }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const navigate = useNavigate();

  const handleForgot = () => {
    navigate('/forgot-password');
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault(); // evita recargar la página
    onSubmit(email, password); // llama al padre con los datos
  };

  return (
    <form onSubmit={handleSubmit} className={styles.loginForm}>
      <div className={styles.inputGroup}>
        <label htmlFor="email" className={styles.label}>Correo electrónico</label>
        <div className={styles.inputWrapper}>
          <User className={styles.inputIcon} size={20} />
          <input
            className={styles.input}
            type="email"
            id="email"
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
            className={styles.input}
            type="password"
            id="password"
            placeholder="contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
      </div>

      <div className={styles.rememberContainer}>
        <label className={styles.rememberLabel}>
          <input
            type="checkbox"
            className={styles.rememberCheckbox}
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
          />
          Recuérdame
        </label>
        <a onClick={handleForgot} role="button" tabIndex={0} className={styles.forgotLink}>
          ¿Olvidaste tu contraseña?
        </a>
      </div>

      <button type="submit" className={styles.botonLogin}>Iniciar Sesión</button>
    </form>
  );
};

export default FormularioLogin;
