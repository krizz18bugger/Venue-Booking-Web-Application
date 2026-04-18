import React, { useEffect, useState } from 'react';
import { User, Mail, Phone, MapPin, Camera, Lock, Save, Loader2, AlertTriangle, CheckCircle, CalendarDays, IndianRupee } from 'lucide-react';
import { customerAPI } from '../../services/api';
import { useApp } from '../../context/AppContext';

export default function ProfilePage() {
  const { profile, fetchProfile } = useApp();

  const [form,     setForm]     = useState({ name: '', phone: '', city: '', profile_pic: '' });
  const [pwForm,   setPwForm]   = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [saving,   setSaving]   = useState(false);
  const [savingPw, setSavingPw] = useState(false);
  const [msg,      setMsg]      = useState('');
  const [err,      setErr]      = useState('');
  const [pwMsg,    setPwMsg]    = useState('');
  const [pwErr,    setPwErr]    = useState('');

  useEffect(() => {
    if (profile) {
      setForm({ name: profile.name || '', phone: profile.phone || '', city: profile.city || '', profile_pic: profile.profile_pic || '' });
    }
  }, [profile]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true); setMsg(''); setErr('');
    try {
      await customerAPI.updateProfile(form);
      await fetchProfile();
      setMsg('Profile updated successfully!');
    } catch (error) {
      setErr(error.response?.data?.message || 'Failed to update profile.');
    } finally { setSaving(false); }
  };

  const handlePwChange = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) { setPwErr('Passwords do not match.'); return; }
    if (pwForm.newPassword.length < 6) { setPwErr('New password must be at least 6 characters.'); return; }
    setSavingPw(true); setPwMsg(''); setPwErr('');
    try {
      await customerAPI.changePassword({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      setPwMsg('Password changed successfully!');
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      setPwErr(error.response?.data?.message || 'Failed to change password.');
    } finally { setSavingPw(false); }
  };

  const stats = [
    { label: 'Total Bookings',  value: profile?.total_bookings ?? 0, icon: CalendarDays, color: 'bg-brand-600' },
    { label: 'Upcoming Events', value: profile?.upcoming_events ?? 0, icon: CalendarDays, color: 'bg-accent-cyan' },
    { label: 'Total Spent',     value: `₹${Number(profile?.total_spent || 0).toLocaleString('en-IN')}`, icon: IndianRupee, color: 'bg-accent-emerald' },
  ];

  return (
    <div className="min-h-screen bg-surface-900 py-8">
      <div className="max-w-2xl mx-auto px-4 space-y-6">
        <div>
          <h1 className="text-2xl font-extrabold text-white">My Profile</h1>
          <p className="text-slate-400 text-sm mt-1">Manage your account details and preferences</p>
        </div>

        {/* Avatar + Stats */}
        <div className="card p-6">
          <div className="flex items-center gap-5">
            <div className="relative">
              {form.profile_pic ? (
                <img src={form.profile_pic} alt="Avatar"
                  className="w-20 h-20 rounded-2xl object-cover border-2 border-brand-500/40"
                  onError={e => { e.target.style.display = 'none'; }}
                />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-brand-600/20 border-2 border-brand-500/30 flex items-center justify-center text-brand-300 text-3xl font-bold">
                  {form.name?.[0]?.toUpperCase() || 'U'}
                </div>
              )}
            </div>
            <div>
              <p className="text-xl font-bold text-white">{profile?.name || '—'}</p>
              <p className="text-slate-400 text-sm">{profile?.email}</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mt-5">
            {stats.map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="p-3 rounded-xl bg-surface-700/50 border border-white/5 text-center">
                <div className={`w-8 h-8 rounded-lg ${color} flex items-center justify-center mx-auto mb-2`}>
                  <Icon size={15} className="text-white"/>
                </div>
                <p className="text-white font-bold text-base">{value}</p>
                <p className="text-slate-500 text-xs mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Edit Profile */}
        <div className="card p-6">
          <h2 className="text-lg font-bold text-white mb-5 flex items-center gap-2"><User size={18}/> Personal Information</h2>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="label">Full Name</label>
              <div className="relative">
                <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"/>
                <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  className="input pl-9" placeholder="Your full name" required/>
              </div>
            </div>
            <div>
              <label className="label">Email (read-only)</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"/>
                <input value={profile?.email || ''} readOnly className="input pl-9 opacity-60 cursor-not-allowed"/>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Phone</label>
                <div className="relative">
                  <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"/>
                  <input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                    className="input pl-9" placeholder="+91 9876543210"/>
                </div>
              </div>
              <div>
                <label className="label">City</label>
                <div className="relative">
                  <MapPin size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"/>
                  <input value={form.city} onChange={e => setForm(p => ({ ...p, city: e.target.value }))}
                    className="input pl-9" placeholder="Your city"/>
                </div>
              </div>
            </div>
            <div>
              <label className="label">Profile Picture URL</label>
              <div className="relative">
                <Camera size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"/>
                <input value={form.profile_pic} onChange={e => setForm(p => ({ ...p, profile_pic: e.target.value }))}
                  className="input pl-9" placeholder="https://…"/>
              </div>
            </div>

            {msg && <div className="flex items-center gap-2 text-accent-emerald text-sm"><CheckCircle size={14}/>{msg}</div>}
            {err && <div className="flex items-center gap-2 text-accent-rose text-sm"><AlertTriangle size={14}/>{err}</div>}

            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? <Loader2 size={15} className="animate-spin"/> : <Save size={15}/>} Save Changes
            </button>
          </form>
        </div>

        {/* Change Password */}
        <div className="card p-6">
          <h2 className="text-lg font-bold text-white mb-5 flex items-center gap-2"><Lock size={18}/> Change Password</h2>
          <form onSubmit={handlePwChange} className="space-y-4">
            {['currentPassword', 'newPassword', 'confirmPassword'].map((key) => (
              <div key={key}>
                <label className="label">
                  {key === 'currentPassword' ? 'Current Password' : key === 'newPassword' ? 'New Password' : 'Confirm New Password'}
                </label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"/>
                  <input type="password" value={pwForm[key]}
                    onChange={e => setPwForm(p => ({ ...p, [key]: e.target.value }))}
                    className="input pl-9" placeholder="••••••••" required/>
                </div>
              </div>
            ))}
            {pwMsg && <div className="flex items-center gap-2 text-accent-emerald text-sm"><CheckCircle size={14}/>{pwMsg}</div>}
            {pwErr && <div className="flex items-center gap-2 text-accent-rose text-sm"><AlertTriangle size={14}/>{pwErr}</div>}
            <button type="submit" disabled={savingPw} className="btn-secondary">
              {savingPw ? <Loader2 size={15} className="animate-spin"/> : <Lock size={15}/>} Update Password
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
