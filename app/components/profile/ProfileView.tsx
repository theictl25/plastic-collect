import { CalendarDays, Edit3, LogOut, Mail, Phone, Save, ShieldCheck, UserRound, X } from 'lucide-react';
import { useState, type FormEvent, type ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { Card } from '../common/Card';
import { useApp } from '../../context/AppContext';
import { supabase } from '../../lib/supabase.client';

export function ProfileView() {
  const { profile, points, saveProfile } = useApp();
  const navigate = useNavigate();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const joined = profile?.joinedAt ? new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }).format(new Date(profile.joinedAt)) : '—';

  async function signOut() {
    setIsSigningOut(true);
    const { error } = await supabase.auth.signOut();
    if (error) {
      setIsSigningOut(false);
      return;
    }
    navigate('/login', { replace: true });
  }

  function startEditing() {
    setDisplayName(profile?.displayName || '');
    setPhone(profile?.phone || '');
    setAvatarUrl(profile?.avatarUrl || '');
    setIsEditing(true);
  }

  async function submitProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    const saved = await saveProfile({ displayName, phone, avatarUrl });
    setIsSaving(false);
    if (saved) setIsEditing(false);
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div><p className="text-sm font-semibold text-gp">MY ACCOUNT</p><h2 className="text-2xl font-bold text-gray-900">Profile</h2><p className="text-sm text-gp-gray mt-1">Details for your Green Point account</p></div>
      <Card className="overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-gp-d via-gp to-emerald-400" />
        <div className="px-5 pb-6">
          <div className="-mt-11 w-22 h-22 w-[88px] h-[88px] rounded-3xl bg-white p-1 shadow-lg">
            <div className="w-full h-full rounded-[20px] bg-gp-l text-gp font-bold text-3xl grid place-items-center overflow-hidden">
              {profile?.avatarUrl ? <img src={profile.avatarUrl} alt="" className="w-full h-full object-cover" /> : profile?.displayName?.slice(0, 1).toUpperCase() || <UserRound />}
            </div>
          </div>
          <div className="mt-3"><h3 className="text-xl font-bold text-gray-900">{profile?.displayName || 'Green Point Member'}</h3><p className="text-sm text-gp-gray">{profile?.email || 'No email available'}</p></div>
          <div className="mt-5 grid grid-cols-2 gap-3"><div className="rounded-xl bg-gp-l p-4"><div className="text-xs text-gp-gray">Available points</div><div className="text-2xl font-bold text-gp mt-1">{points}</div></div><div className="rounded-xl bg-gray-50 p-4"><div className="text-xs text-gp-gray">Member since</div><div className="text-sm font-bold text-gray-800 mt-2">{joined}</div></div></div>
        </div>
      </Card>
      <Card className="p-5">
        <div className="flex items-center justify-between gap-3"><h3 className="font-bold text-gray-900">Account information</h3>{!isEditing && <button onClick={startEditing} className="text-sm font-semibold text-gp hover:underline inline-flex items-center gap-1 cursor-pointer"><Edit3 className="w-3.5 h-3.5" />Edit profile</button>}</div>
        {isEditing ? <form onSubmit={(event) => void submitProfile(event)} className="mt-4 space-y-4">
          <Field label="Full name" value={displayName} onChange={setDisplayName} placeholder="Your full name" required />
          <Field label="Phone" value={phone} onChange={setPhone} placeholder="Optional phone number" type="tel" />
          <Field label="Profile image URL" value={avatarUrl} onChange={setAvatarUrl} placeholder="https://example.com/photo.jpg" type="url" />
          <p className="text-xs text-gp-gray">Email is managed by your sign-in provider and cannot be changed here.</p>
          <div className="flex gap-2"><button type="button" onClick={() => setIsEditing(false)} disabled={isSaving} className="flex-1 h-11 rounded-xl border border-gray-200 text-sm font-semibold text-gp-gray hover:bg-gray-50 inline-flex justify-center items-center gap-1.5 cursor-pointer"><X className="w-4 h-4" />Cancel</button><button type="submit" disabled={isSaving} className="flex-1 h-11 rounded-xl bg-gp text-white hover:bg-gp-d text-sm font-semibold inline-flex justify-center items-center gap-1.5 cursor-pointer disabled:opacity-50"><Save className="w-4 h-4" />{isSaving ? 'Saving…' : 'Save changes'}</button></div>
        </form> : <div className="mt-3 divide-y divide-gray-100"><Detail icon={<UserRound />} label="Full name" value={profile?.displayName || '—'} /><Detail icon={<Mail />} label="Email" value={profile?.email || '—'} /><Detail icon={<Phone />} label="Phone" value={profile?.phone || 'Not provided'} /><Detail icon={<CalendarDays />} label="Joined" value={joined} /></div>}
      </Card>
      <button onClick={() => void signOut()} disabled={isSigningOut} className="w-full h-12 rounded-xl border border-red-200 bg-white text-red-700 hover:bg-red-50 font-semibold text-sm inline-flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer"><LogOut className="w-4 h-4" />{isSigningOut ? 'Signing out…' : 'Log out'}</button>
      <p className="flex items-center justify-center gap-1.5 text-xs text-gp-gray"><ShieldCheck className="w-3.5 h-3.5 text-gp" />Your information is visible only to your account.</p>
    </div>
  );
}

function Detail({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return <div className="py-3.5 flex items-center gap-3"><span className="w-9 h-9 rounded-xl bg-gray-50 text-gp grid place-items-center">{icon}</span><div className="min-w-0"><div className="text-xs text-gp-gray">{label}</div><div className="text-sm font-semibold text-gray-900 truncate">{value}</div></div></div>;
}

function Field({ label, value, onChange, placeholder, required, type = 'text' }: { label: string; value: string; onChange: (value: string) => void; placeholder: string; required?: boolean; type?: string }) {
  return <label className="block"><span className="block mb-1.5 text-sm font-semibold text-gray-700">{label}</span><input type={type} required={required} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="w-full h-11 rounded-xl border border-gray-200 px-3 text-sm outline-none focus:border-gp focus:ring-4 focus:ring-gp/10" /></label>;
}
