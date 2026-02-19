import { ArrowRight, MessageCircle, UserPlus } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import RegisterForm from "../components/auth/RegisterForm";
import { useAuth } from "../context/AuthContext";

const RegisterPage = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async (payload: {
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
      setError("Unable to create account. Please try again.");
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
            <h1 className="text-4xl font-bold mb-4">Build your space</h1>
            <p className="text-blue-100 text-lg">
              Create an account to organize channels, teams, and conversations.
            </p>
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
              <UserPlus className="text-blue-600" size={22} />
              Create account
            </h2>
            <p className="text-gray-500">
              Start collaborating in minutes. It only takes a few details.
            </p>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 text-sm">
              {error}
            </div>
          )}

          <RegisterForm onSubmit={handleRegister} loading={loading} />

          <div className="mt-8 text-center text-sm text-gray-500">
            Already have an account?{" "}
            <button
              onClick={() => navigate("/login")}
              className="text-blue-600 hover:text-blue-700 font-medium inline-flex items-center gap-1"
              type="button"
            >
              Sign in
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
