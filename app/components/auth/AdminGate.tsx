import { useEffect, useState, type ReactNode } from "react";
import { useNavigate } from "react-router";
import { supabase } from "../../lib/supabase.client";
import { isCurrentUserAdmin } from "../../lib/admin.client";

export function AdminGate({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    let active = true;
    void (async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session?.user || data.session.user.is_anonymous) {
        return navigate("/login", { replace: true });
      }
      try {
        if (await isCurrentUserAdmin()) {
          if (active) setAllowed(true);
        } else {
          navigate("/", { replace: true });
        }
      } catch {
        navigate("/login", { replace: true });
      }
    })();
    return () => {
      active = false;
    };
  }, [navigate]);

  return allowed ? (
    <>{children}</>
  ) : (
    <div className="min-h-screen bg-[#0f2a1d] grid place-items-center">
      <div className="w-9 h-9 rounded-full border-4 border-white/20 border-t-emerald-300 animate-spin" />
    </div>
  );
}
