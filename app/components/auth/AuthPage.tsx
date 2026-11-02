import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router";
import { supabase } from "../../lib/supabase.client";
import { isCurrentUserAdmin } from "../../lib/admin.client";
import { AdminLoginModal } from "./AdminLoginModal";
import { Eye, EyeOff, Recycle } from "lucide-react";

interface AuthPageProps {
  mode: "login" | "register";
}

export function AuthPage({ mode }: AuthPageProps) {
  const navigate = useNavigate();
  const isRegister = mode === "register";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [adminOpen, setAdminOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Redirect authenticated users away from the authentication screen.
  useEffect(() => {
    let mounted = true;
    void supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted || !data.session?.user || data.session.user.is_anonymous)
        return;
      const allowed = await isCurrentUserAdmin();
      navigate(allowed ? "/admin" : "/", { replace: true });
    });
    return () => {
      mounted = false;
    };
  }, [navigate]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    setIsSubmitting(true);
    try {
      if (isRegister) {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { display_name: name.trim() },
            emailRedirectTo: window.location.origin,
          },
        });
        if (signUpError) throw signUpError;
        if (data.session) navigate("/", { replace: true });
        else
          setMessage(
            "ສ້າງບັນຊີແລ້ວ. ກະລຸນາກວດອີເມວເພື່ອຢືນຢັນກ່ອນເຂົ້າລະບົບ",
          );
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
        navigate("/", { replace: true });
      }
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "ບໍ່ສາມາດດຳເນີນການໄດ້. ກະລຸນາລອງໃໝ່",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f6faf7] p-4 flex items-center justify-center">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center text-center">
          <span className="w-12 h-12 rounded-2xl bg-gp text-white grid place-items-center shadow-lg">
            <Recycle className="w-6 h-6" />
          </span>
          <h1 className="mt-4 text-2xl font-bold text-gray-900">Green Point</h1>
          <p className="mt-1 text-sm text-gp-gray">
            {isRegister ? "ສ້າງບັນຊີໃໝ່" : "ເຂົ້າລະບົບເພື່ອເລີ່ມສະສົມຄະແນນ"}
          </p>
        </div>

        <form
          onSubmit={submit}
          className="mt-7 space-y-3 rounded-2xl bg-white p-6 shadow-xl shadow-emerald-950/5 border border-emerald-100"
        >
          {isRegister && (
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ຊື່ຂອງທ່ານ"
              className="w-full h-11 rounded-xl border border-gray-200 px-4 text-sm outline-none focus:border-gp focus:ring-4 focus:ring-gp/10"
            />
          )}
          <input
            required
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full h-11 rounded-xl border border-gray-200 px-4 text-sm outline-none focus:border-gp focus:ring-4 focus:ring-gp/10"
          />
          <div className="relative">
            <input
              required
              minLength={6}
              type={showPassword ? "text" : "password"}
              autoComplete={isRegister ? "new-password" : "current-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full h-11 rounded-xl border border-gray-200 pl-4 pr-11 text-sm outline-none focus:border-gp focus:ring-4 focus:ring-gp/10"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-gp-gray hover:text-gp cursor-pointer"
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>

          {error && (
            <p
              role="alert"
              className="rounded-xl bg-red-50 px-3.5 py-2.5 text-sm text-red-700"
            >
              {error}
            </p>
          )}
          {message && (
            <p className="rounded-xl bg-emerald-50 px-3.5 py-2.5 text-sm text-gp">
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-11 rounded-xl bg-gp hover:bg-gp-d text-white text-sm font-semibold transition disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting
              ? "Please wait…"
              : isRegister
                ? "Create account"
                : "Sign in"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-gp-gray">
          {isRegister ? "ມີບັນຊີແລ້ວ?" : "ຍັງບໍ່ມີບັນຊີ?"}{" "}
          <button
            type="button"
            onClick={() => navigate(isRegister ? "/login" : "/register")}
            className="font-bold text-gp hover:underline cursor-pointer"
          >
            {isRegister ? "Sign in" : "Create an account"}
          </button>
        </p>

        <div className="mt-8 text-center">
          <button
            type="button"
            onClick={() => setAdminOpen(true)}
            className="text-xs text-gray-400 hover:text-gp cursor-pointer"
          >
            Admin login
          </button>
        </div>
      </div>

      <AdminLoginModal open={adminOpen} onClose={() => setAdminOpen(false)} />
    </main>
  );
}
