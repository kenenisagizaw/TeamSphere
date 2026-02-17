import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowRight, LogIn, MessageCircle, ShieldCheck } from "lucide-react";
import LoginForm from "../components/auth/LoginForm";
import { useAuth } from "../context/AuthContext";

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (payload: { email: string; password: string }) => {
    setLoading(true);
    setError(null);
    try {
      await login(payload);
      const redirectTo =
        (location.state as { from?: string } | null)?.from || "/dashboard";
      navigate(redirectTo, { replace: true });
    } catch {
      setError("Invalid email or password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-sky-50 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-sky-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
      </div>

      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl flex overflow-hidden relative z-10">
        <div className="hidden lg:flex lg:w-1/2 bg-linear-to-br from-slate-900 via-slate-800 to-blue-800 p-10 text-white flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-10">
              <div className="bg-white/15 p-2.5 rounded-lg">
                <MessageCircle size={26} className="text-white" />
              </div>
              <span className="text-2xl font-bold">ChatSpace</span>
            </div>
            <h1 className="text-4xl font-bold mb-4">Welcome back</h1>
            <p className="text-blue-100 text-lg">
              Pick up where you left off. Your channels and workspaces are ready.
            </p>
          </div>
          <div className="bg-white/10 rounded-xl p-4">
            <div className="flex items-center gap-2 text-blue-100">
              <ShieldCheck size={18} />
              <span className="text-sm">Secure access with token-based auth</span>
            </div>
          </div>
        </div>

        <div className="w-full lg:w-1/2 p-8 md:p-12">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="bg-linear-to-r from-blue-600 to-indigo-600 p-2 rounded-lg">
              <MessageCircle className="text-white" size={24} />
            </div>
            <span className="text-xl font-bold text-gray-800">ChatSpace</span>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <LogIn className="text-blue-600" size={22} />
              Sign in
            </h2>
            <p className="text-gray-500">
              Enter your credentials to access your workspace.
            </p>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 text-sm">
              {error}
            </div>
          )}

          <LoginForm onSubmit={handleSubmit} loading={loading} />

          <div className="mt-8 text-center text-sm text-gray-500">
            Don&apos;t have an account?{" "}
            <button
              onClick={() => navigate("/register")}
              className="text-blue-600 hover:text-blue-700 font-medium inline-flex items-center gap-1"
              type="button"
            >
              Create one
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
