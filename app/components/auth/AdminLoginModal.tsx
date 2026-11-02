import { useEffect, useRef, useState, type FormEvent } from "react";
import { useNavigate } from "react-router";
import { AlertCircle, Eye, EyeOff, ShieldCheck, X } from "lucide-react";
import { isCurrentUserAdmin } from "../../lib/admin.client";
import { createEphemeralClient, supabase } from "../../lib/supabase.client";

interface Props {
  open: boolean;
  onClose: () => void;
}

// Convert Supabase errors to a clear message for the user.
function friendlyMessage(message: string) {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials"))
    return "ອີເມວ ຫຼື ລະຫັດຜ່ານບໍ່ຖືກຕ້ອງ";
  if (m.includes("email not confirmed")) return "ອີເມວນີ້ຍັງບໍ່ໄດ້ຢືນຢັນ";
  if (m.includes("rate limit") || m.includes("too many"))
    return "ລອງຫຼາຍເກີນໄປ. ກະລຸນາລໍຖ້າແລ້ວລອງໃໝ່";
  if (m.includes("network") || m.includes("fetch"))
    return "ບໍ່ສາມາດເຊື່ອມຕໍ່ໄດ້. ກະລຸນາກວດອິນເຕີເນັດ";
  return "ບໍ່ສາມາດເຂົ້າລະບົບໄດ້. ກະລຸນາລອງໃໝ່";
}

export function AdminLoginModal({ open, onClose }: Props) {
  const navigate = useNavigate();
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Reset the form each time the dialog opens.
  useEffect(() => {
    if (!open) return;
    setError("");
    setPassword("");
    setShowPassword(false);
    emailRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;
    setError("");
    setIsSubmitting(true);

    const probe = createEphemeralClient();

    // 1) Verify email/password with an isolated client.
    const { data, error: signInError } = await probe.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (signInError || !data.session) {
      setError(friendlyMessage(signInError?.message ?? ""));
      setPassword("");
      setIsSubmitting(false);
      passwordRef.current?.focus();
      return;
    }

    // 2) Check admin permissions with the isolated client.
    let allowed = false;
    try {
      allowed = await isCurrentUserAdmin(probe);
    } catch {
      await probe.auth.signOut({ scope: "local" });
      setError("ກວດສອບສິດບໍ່ສຳເລັດ. ກະລຸນາລອງໃໝ່");
      setPassword("");
      setIsSubmitting(false);
      return;
    }

    // 3) Do not alter the main session for a non-admin account.
    if (!allowed) {
      await probe.auth.signOut({ scope: "local" });
      setError("ບັນຊີນີ້ບໍ່ມີສິດເຂົ້າເຖິງໜ້າຜູ້ດູແລລະບົບ");
      setPassword("");
      setIsSubmitting(false);
      emailRef.current?.focus();
      return;
    }

    // 4) Move an approved admin session into the main client.
    const { error: setError2 } = await supabase.auth.setSession({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
    });
    if (setError2) {
      setError("ເຂົ້າລະບົບບໍ່ສຳເລັດ. ກະລຸນາລອງໃໝ່");
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(false);
    onClose();
    navigate("/admin", { replace: true });
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-login-title"
    >
      <div
        className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-3 p-1.5 text-gray-400 hover:text-gray-700 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2 text-gp">
          <ShieldCheck className="w-5 h-5" />
          <span className="text-xs font-semibold tracking-wide">
            ADMIN PORTAL
          </span>
        </div>
        <h2
          id="admin-login-title"
          className="mt-2 text-xl font-bold text-gray-900"
        >
          Admin sign in
        </h2>
        <p className="mt-1 text-sm text-gp-gray">
          ໃຊ້ບັນຊີຜູ້ດູແລລະບົບເພື່ອດຳເນີນການຕໍ່
        </p>

        <form onSubmit={submit} className="mt-5 space-y-3">
          <input
            ref={emailRef}
            required
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError("");
            }}
            placeholder="admin@example.com"
            aria-invalid={!!error}
            className={`w-full h-11 rounded-xl border px-4 text-sm outline-none focus:ring-4 ${
              error
                ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                : "border-gray-200 focus:border-gp focus:ring-gp/10"
            }`}
          />
          <div className="relative">
            <input
              ref={passwordRef}
              required
              minLength={6}
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError("");
              }}
              placeholder="Password"
              aria-invalid={!!error}
              className={`w-full h-11 rounded-xl border pl-4 pr-11 text-sm outline-none focus:ring-4 ${
                error
                  ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                  : "border-gray-200 focus:border-gp focus:ring-gp/10"
              }`}
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
              className="flex items-start gap-2 rounded-xl bg-red-50 px-3.5 py-2.5 text-sm text-red-700"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-11 rounded-xl bg-gp hover:bg-gp-d text-white text-sm font-semibold transition disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? "Please wait…" : "Sign in as admin"}
          </button>
        </form>
      </div>
    </div>
  );
}
