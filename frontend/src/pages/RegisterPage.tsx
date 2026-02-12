import { useState } from "react";
import { useNavigate } from "react-router-dom";
import RegisterForm from "../components/auth/RegisterForm";
import { useAuth } from "../context/AuthContext";

const RegisterPage = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (payload: {
    name: string;
    email: string;
    password: string;
  }) => {
    setLoading(true);
    setError(null);
    try {
      await register(payload);
      navigate("/dashboard", { replace: true });
    } catch {
      setError("Registration failed. Try a different email.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="auth">
      <div className="auth-tabs">
        <button type="button" onClick={() => navigate("/login")}>
          Login
        </button>
        <button className="active" type="button">
          Register
        </button>
      </div>
      {error && <div className="alert">{error}</div>}
      <RegisterForm onSubmit={handleSubmit} loading={loading} />
    </section>
  );
};

export default RegisterPage;
