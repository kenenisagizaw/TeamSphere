import { useState } from "react";
import { useNavigate } from "react-router-dom";
import LoginForm from "../components/auth/LoginForm";
import { useAuth } from "../context/AuthContext";

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (payload: { email: string; password: string }) => {
    setLoading(true);
    setError(null);
    try {
      await login(payload);
      navigate("/dashboard", { replace: true });
    } catch {
      setError("Login failed. Check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="auth">
      <div className="auth-tabs">
        <button className="active" type="button">
          Login
        </button>
        <button type="button" onClick={() => navigate("/register")}>
          Register
        </button>
      </div>
      {error && <div className="alert">{error}</div>}
      <LoginForm onSubmit={handleSubmit} loading={loading} />
    </section>
  );
};

export default LoginPage;
