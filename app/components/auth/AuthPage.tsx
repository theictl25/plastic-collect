import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { ArrowRight, CheckCircle2, Eye, EyeOff, Leaf, LockKeyhole, Mail, Recycle, Sparkles } from 'lucide-react';
import { supabase } from '../../lib/supabase.client';

type AuthMode = 'login' | 'register';

interface AuthPageProps {
  mode: AuthMode;
}

export function AuthPage({ mode }: AuthPageProps) {
  const navigate = useNavigate();
  const isRegister = mode === 'register';
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (mounted && data.session?.user && !data.session.user.is_anonymous) navigate('/', { replace: true });
    });
    return () => { mounted = false; };
  }, [navigate]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setMessage('');
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
        if (data.session) {
          navigate('/', { replace: true });
        } else {
          setMessage('สร้างบัญชีแล้ว กรุณาตรวจสอบอีเมลเพื่อยืนยันก่อนเข้าสู่ระบบ');
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
        navigate('/', { replace: true });
      }
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : 'ไม่สามารถดำเนินการได้ โปรดลองใหม่');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function signInWithGoogle() {
    setError('');
    setIsSubmitting(true);
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
    if (oauthError) {
      setError(
        oauthError.message.includes('provider is not enabled')
          ? 'ยังไม่ได้เปิดใช้งาน Google Sign-In ใน Supabase โปรดตั้งค่า Google provider ก่อน'
          : oauthError.message
      );
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f6faf7] p-4 sm:p-7 lg:p-10 flex items-center justify-center">
      <section className="w-full max-w-6xl min-h-[650px] bg-white rounded-[2rem] shadow-2xl shadow-emerald-950/10 overflow-hidden grid lg:grid-cols-[1.05fr_.95fr] border border-emerald-100">
        <aside className="relative overflow-hidden bg-[#0c3826] px-7 py-8 sm:p-12 text-white flex flex-col">
          <div className="absolute -top-32 -right-24 w-72 h-72 rounded-full bg-emerald-400/20" />
          <div className="absolute -bottom-36 -left-20 w-80 h-80 rounded-full border-[32px] border-emerald-300/10" />
          <div className="relative flex items-center gap-3">
            <span className="w-11 h-11 rounded-2xl bg-white text-gp grid place-items-center shadow-lg"><Recycle className="w-6 h-6" /></span>
            <div><div className="font-bold text-xl tracking-tight">Green Point</div><div className="text-xs text-emerald-100/70">Recycle for a Better Tomorrow</div></div>
          </div>

          <div className="relative my-auto py-12 max-w-md">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/25 bg-white/10 px-3 py-1.5 text-xs font-semibold text-emerald-100">
              <Sparkles className="w-3.5 h-3.5" /> Your sustainable journey starts here
            </div>
            <h1 className="mt-6 text-4xl sm:text-5xl font-bold leading-[1.08] tracking-tight">Recycle today.<br /><span className="text-emerald-300">Earn tomorrow.</span></h1>
            <p className="mt-5 text-emerald-50/75 leading-relaxed">Every bottle you recycle becomes points, rewards, and a cleaner community.</p>
            <div className="mt-9 grid grid-cols-3 gap-3">
              {[['12.5 kg', 'recycled'], ['320', 'points earned'], ['8×', 'green visits']].map(([value, label]) => <div key={label} className="rounded-2xl bg-white/10 border border-white/10 p-3"><div className="font-bold text-lg">{value}</div><div className="mt-0.5 text-[10px] text-emerald-100/65">{label}</div></div>)}
            </div>
          </div>

          <div className="relative flex items-center gap-2 text-xs text-emerald-100/70"><Leaf className="w-4 h-4 text-emerald-300" /> One small habit. A real difference.</div>
        </aside>

        <div className="px-6 py-9 sm:px-12 sm:py-12 flex flex-col justify-center">
          <div className="max-w-md w-full mx-auto">
            <p className="text-sm font-semibold text-gp">WELCOME TO GREEN POINT</p>
            <h2 className="mt-2 text-3xl font-bold text-gray-900 tracking-tight">{isRegister ? 'Create your account' : 'Welcome back'}</h2>
            <p className="mt-2 text-sm text-gp-gray">{isRegister ? 'Start turning good habits into meaningful rewards.' : 'Sign in to continue your recycling journey.'}</p>

            <button type="button" onClick={() => void signInWithGoogle()} disabled={isSubmitting} className="mt-7 w-full h-12 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-sm font-semibold text-gray-700 inline-flex items-center justify-center gap-3 transition disabled:opacity-50 cursor-pointer">
              <span className="font-bold text-[19px] leading-none text-[#4285F4]">G</span> Continue with Google
            </button>
            <div className="my-6 flex items-center gap-3 text-xs text-gp-gray"><span className="h-px flex-1 bg-gray-100" />or continue with email<span className="h-px flex-1 bg-gray-100" /></div>

            <form onSubmit={submit} className="space-y-4">
              {isRegister && <label className="block"><span className="mb-1.5 block text-sm font-semibold text-gray-700">Your name</span><div className="relative"><input required value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Noy Phommasone" className="w-full h-12 rounded-xl border border-gray-200 px-4 outline-none focus:border-gp focus:ring-4 focus:ring-gp/10 text-sm" /></div></label>}
              <label className="block"><span className="mb-1.5 block text-sm font-semibold text-gray-700">Email address</span><div className="relative"><Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gp-gray" /><input required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" className="w-full h-12 rounded-xl border border-gray-200 pl-11 pr-4 outline-none focus:border-gp focus:ring-4 focus:ring-gp/10 text-sm" /></div></label>
              <label className="block"><span className="mb-1.5 block text-sm font-semibold text-gray-700">Password</span><div className="relative"><LockKeyhole className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gp-gray" /><input required minLength={6} type={showPassword ? 'text' : 'password'} autoComplete={isRegister ? 'new-password' : 'current-password'} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 6 characters" className="w-full h-12 rounded-xl border border-gray-200 pl-11 pr-11 outline-none focus:border-gp focus:ring-4 focus:ring-gp/10 text-sm" /><button type="button" onClick={() => setShowPassword((visible) => !visible)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-gp-gray hover:text-gp cursor-pointer" aria-label="Toggle password visibility">{showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button></div></label>

              {error && <p role="alert" className="rounded-xl bg-red-50 px-3.5 py-3 text-sm text-red-700">{error}</p>}
              {message && <p className="rounded-xl bg-emerald-50 px-3.5 py-3 text-sm text-gp flex gap-2"><CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />{message}</p>}
              <button disabled={isSubmitting} type="submit" className="w-full h-12 rounded-xl bg-gp hover:bg-gp-d text-white font-semibold text-sm shadow-lg shadow-emerald-800/20 transition disabled:opacity-50 cursor-pointer inline-flex items-center justify-center gap-2">{isSubmitting ? 'Please wait…' : isRegister ? 'Create account' : 'Sign in'} <ArrowRight className="w-4 h-4" /></button>
            </form>

            <p className="mt-7 text-center text-sm text-gp-gray">{isRegister ? 'Already have an account?' : 'New to Green Point?'} <button type="button" onClick={() => navigate(isRegister ? '/login' : '/register')} className="font-bold text-gp hover:underline cursor-pointer">{isRegister ? 'Sign in' : 'Create an account'}</button></p>
          </div>
        </div>
      </section>
    </main>
  );
}
