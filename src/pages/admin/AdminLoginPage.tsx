import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Lock, Mail, ShieldCheck } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const AdminLoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await login(form.email, form.password);
      if (result.user.role !== "admin") {
        setError("This portal is restricted to administrators.");
        setLoading(false);
        return;
      }
      navigate("/admin", { replace: true });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#180d3d] flex flex-col">
      {/* Top brand strip */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 relative overflow-hidden">
        <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-brand-primaryLight/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-brand-red/20 blur-3xl" />

        <div className="relative w-full max-w-md">
          <div className="mb-8 flex flex-col items-center text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20">
              <ShieldCheck className="h-8 w-8 text-white" />
            </div>
            <h1 className="mt-4 text-2xl font-bold tracking-tight text-white">
              Administrator Portal
            </h1>
            <p className="mt-1 text-sm text-white/70">
              Exploits University Alumni Connect
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white p-6 shadow-2xl sm:p-8">
            <h2 className="text-lg font-semibold text-gray-900">Admin Sign In</h2>
            <p className="mt-1 text-sm text-gray-500">
              Access analytics, academic structure and system management.
            </p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Admin Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    required
                    placeholder="name@exploits.ac.mw"
                    className="h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    required
                    placeholder="••••••••"
                    className="h-10 w-full rounded-md border border-input bg-background pl-9 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-md bg-brand-primary py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-primaryLight disabled:opacity-60"
              >
                {loading ? "Signing in…" : "Sign In to Admin"}
              </button>
            </form>

            <p className="mt-5 text-center text-xs text-gray-500">
              Trouble signing in? Contact the Exploits University IT helpdesk.
            </p>
          </div>

          <p className="mt-6 text-center text-sm text-white/60">
            Not an administrator?{" "}
            <Link
              to="/login"
              className="font-medium text-white underline-offset-4 hover:underline"
            >
              Student &amp; alumni sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminLoginPage;