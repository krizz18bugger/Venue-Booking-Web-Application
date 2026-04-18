import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Eye, EyeOff, Loader2, ShieldCheck, User, Users } from 'lucide-react';
import { authAPI } from '../services/api';
import { useApp } from '../context/AppContext';

const tabs = [
  { key: 'customer-login',    label: 'Customer Login',    icon: User },
  { key: 'customer-register', label: 'Register',          icon: Users },
  { key: 'owner-login',       label: 'Hall Owner',        icon: Building2 },
  { key: 'admin-login',       label: 'Admin',             icon: ShieldCheck },
];

export default function AuthPage() {
  const navigate  = useNavigate();
  const { login } = useApp();
  const [tab,     setTab]     = useState('customer-login');
  const [form,    setForm]    = useState({ name:'', email:'', password:'', confirmPassword:'', phone:'', city:'' });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    setForm(p => ({ ...p, [e.target.name]: e.target.value }));
    setError(''); setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    setLoading(true);
    try {
      let res;
      if (tab === 'customer-login') {
        res = await authAPI.customerLogin({ email: form.email, password: form.password });
        login(res.data.token, res.data.user);
        navigate('/venues');
      } else if (tab === 'customer-register') {
        if (form.password !== form.confirmPassword) { setError('Passwords do not match'); setLoading(false); return; }
        res = await authAPI.customerRegister({ name: form.name, email: form.email, password: form.password, phone: form.phone, city: form.city });
        login(res.data.token, res.data.user);
        navigate('/venues');
      } else if (tab === 'owner-login') {
        res = await authAPI.login({ email: form.email, password: form.password });
        login(res.data.token, res.data.user);
        navigate('/halls');
      } else if (tab === 'admin-login') {
        res = await authAPI.adminLogin({ email: form.email, password: form.password });
        login(res.data.token, res.data.user);
        navigate('/admin');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const switchTab = (t) => { setTab(t); setError(''); setSuccess(''); };

  const isRegister = tab === 'customer-register';

  return (
    <div className="min-h-screen bg-surface-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background glows */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-brand-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[40%] h-[40%] rounded-full bg-accent-violet/10 blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-brand shadow-glow mb-4">
            <Building2 size={30} className="text-white" />
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">VenueBook</h1>
          <p className="text-slate-400 mt-1 text-sm">India's Trusted Venue Booking Platform</p>
        </div>

        {/* Tab bar */}
        <div className="grid grid-cols-4 gap-1 mb-4 p-1 bg-surface-800/60 rounded-xl border border-white/5">
          {tabs.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => switchTab(key)}
              className={`flex flex-col items-center gap-1 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                tab === key
                  ? 'bg-brand-600 text-white shadow-glow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon size={15} />
              <span className="leading-tight text-center">{label}</span>
            </button>
          ))}
        </div>

        {/* Card */}
        <div className="card glass p-8 border border-white/10 shadow-2xl animate-slide-up">
          <h2 className="text-xl font-bold text-white mb-6">
            {tab === 'customer-login'    ? 'Welcome Back'         :
             tab === 'customer-register' ? 'Create Account'       :
             tab === 'owner-login'       ? 'Owner Login'          :
                                          'Admin Login'}
          </h2>

          {error   && <div className="mb-4 p-3 rounded-lg bg-accent-rose/10 border border-accent-rose/20 text-accent-rose text-sm">{error}</div>}
          {success && <div className="mb-4 p-3 rounded-lg bg-accent-emerald/10 border border-accent-emerald/20 text-accent-emerald text-sm">{success}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <div>
                <label className="label">Full Name</label>
                <input name="name" value={form.name} onChange={handleChange} className="input" placeholder="Your name" required />
              </div>
            )}

            <div>
              <label className="label">Email Address</label>
              <input name="email" type="email" value={form.email} onChange={handleChange} className="input" placeholder="you@example.com" required />
            </div>

            {isRegister && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Phone</label>
                  <input name="phone" value={form.phone} onChange={handleChange} className="input" placeholder="+91 XXXXX XXXXX" />
                </div>
                <div>
                  <label className="label">City</label>
                  <input name="city" value={form.city} onChange={handleChange} className="input" placeholder="Chennai" />
                </div>
              </div>
            )}

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input
                  name="password" type={showPwd ? 'text' : 'password'}
                  value={form.password} onChange={handleChange}
                  className="input pr-10" placeholder="••••••••" required
                />
                <button type="button" onClick={() => setShowPwd(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                  {showPwd ? <EyeOff size={16}/> : <Eye size={16}/>}
                </button>
              </div>
            </div>

            {isRegister && (
              <div>
                <label className="label">Confirm Password</label>
                <input
                  name="confirmPassword" type="password"
                  value={form.confirmPassword} onChange={handleChange}
                  className="input" placeholder="••••••••" required
                />
              </div>
            )}

            <button type="submit" disabled={loading} className="w-full btn-primary justify-center py-3 text-base mt-2">
              {loading
                ? <><Loader2 size={18} className="animate-spin" /> Please wait...</>
                : isRegister ? 'Create Account' : 'Sign In'}
            </button>
          </form>

          {/* Demo credentials */}
          {tab !== 'customer-register' && (
            <div className="mt-5 p-3 rounded-xl bg-surface-700/50 border border-white/5">
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-2">Demo Credentials</p>
              {tab === 'customer-login' && <>
                <p className="text-xs text-slate-300">📧 <span className="text-brand-300">customer@venueapp.com</span></p>
                <p className="text-xs text-slate-300 mt-0.5">🔑 <span className="text-brand-300">password123</span></p>
              </>}
              {tab === 'owner-login' && <>
                <p className="text-xs text-slate-300">📧 <span className="text-brand-300">owner@venueapp.com</span></p>
                <p className="text-xs text-slate-300 mt-0.5">🔑 <span className="text-brand-300">password123</span></p>
              </>}
              {tab === 'admin-login' && <>
                <p className="text-xs text-slate-300">📧 <span className="text-brand-300">admin@venueapp.com</span></p>
                <p className="text-xs text-slate-300 mt-0.5">🔑 <span className="text-brand-300">admin123</span></p>
              </>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
