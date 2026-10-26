import { useEffect, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { supabase } from '../../lib/supabase.client';

export function AuthGate({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!active) return;
      if (!data.session?.user || data.session.user.is_anonymous) navigate('/login', { replace: true });
      else setReady(true);
    };
    void checkSession();
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user || session.user.is_anonymous) navigate('/login', { replace: true });
      else setReady(true);
    });
    return () => { active = false; subscription.subscription.unsubscribe(); };
  }, [navigate]);

  if (!ready) return <div className="min-h-screen bg-gp-bg grid place-items-center"><div className="w-9 h-9 rounded-full border-4 border-gp-l border-t-gp animate-spin" /></div>;
  return <>{children}</>;
}
