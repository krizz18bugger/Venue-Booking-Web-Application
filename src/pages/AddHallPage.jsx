import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Info, Maximize, Settings, Users, ShieldAlert, CreditCard, FileText, Loader2 } from 'lucide-react';
import { hallsAPI } from '../services/api';

const FEATURES_LIST = [
  'Air Conditioning', 'Parking', 'Catering', 'Sound System',
  'Projector', 'WiFi', 'Stage', 'Generator Backup',
  'Bridal Room', 'Open Air', 'Lift', 'Catering Kitchen',
];

const AddHallPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('basic');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Form state
  const [form, setForm] = useState({
    name: '', location: '', address: '', price: '', status: 'Active',
    selectedFeatures: [],
    seating: '', dining: '', standing: '',
    hallStyle: 'Theatre', length: '', width: '', height: '',
    alcohol: 'Not allowed', smoking: 'Not allowed', music: '',
    advancePercent: '30', cancellationPolicy: '',
    agreeTerms: false,
    tradeLicense: null, fireNoc: null
  });

  const set = (key, val) => setForm(p => ({ ...p, [key]: val }));
  const toggleFeature = (f) => set('selectedFeatures',
    form.selectedFeatures.includes(f)
      ? form.selectedFeatures.filter(x => x !== f)
      : [...form.selectedFeatures, f]
  );

  const handleFileChange = (e, field) => {
    if (e.target.files && e.target.files[0]) {
      set(field, e.target.files[0]);
    }
  };

  const tabs = [
    { id: 'basic',      label: 'Basic Info',         icon: <Info size={16} /> },
    { id: 'dimensions', label: 'Type & Dimensions',  icon: <Maximize size={16} /> },
    { id: 'features',   label: 'Features',           icon: <Settings size={16} /> },
    { id: 'capacity',   label: 'Capacity',           icon: <Users size={16} /> },
    { id: 'rules',      label: 'Rules',              icon: <ShieldAlert size={16} /> },
    { id: 'payment',    label: 'Payment Rules',      icon: <CreditCard size={16} /> },
    { id: 'legal',      label: 'Legal',              icon: <FileText size={16} /> },
  ];

  const handleSave = async () => {
    if (!form.name || !form.location || !form.price) {
      setError('Hall name, location, and price are required.');
      setActiveTab('basic');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await hallsAPI.create({
        name: form.name,
        location: form.location,
        address: form.address,
        status: form.status,
        price: parseFloat(form.price),
        features: form.selectedFeatures,
        capacity: {
          seating: parseInt(form.seating) || 0,
          dining: parseInt(form.dining) || 0,
          standing: parseInt(form.standing) || 0,
        },
        rules: [
          form.alcohol && `Alcohol: ${form.alcohol}`,
          form.smoking && `Smoking: ${form.smoking}`,
          form.music,
        ].filter(Boolean),
        payment_rules: {
          advance: parseInt(form.advancePercent) || 30,
          cancellation_policy: form.cancellationPolicy,
        },
      });
      setSuccess(true);
      setTimeout(() => navigate('/halls'), 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save hall. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'basic': return (
        <div className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-2 gap-6">
            <div className="col-span-2 md:col-span-1">
              <label className="label">Hall Name *</label>
              <input type="text" className="input" placeholder="e.g. Grand Orchid Banquet"
                value={form.name} onChange={e => set('name', e.target.value)} />
            </div>
            <div className="col-span-2 md:col-span-1">
              <label className="label">Location / Area *</label>
              <input type="text" className="input" placeholder="e.g. Downtown, Metro City"
                value={form.location} onChange={e => set('location', e.target.value)} />
            </div>
            <div className="col-span-2">
              <label className="label">Full Address</label>
              <textarea className="input h-24 resize-none" placeholder="Enter complete address..."
                value={form.address} onChange={e => set('address', e.target.value)} />
            </div>
            <div>
              <label className="label">Status</label>
              <select className="input text-slate-300" value={form.status} onChange={e => set('status', e.target.value)}>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Pending">Pending</option>
              </select>
            </div>
          </div>
        </div>
      );
      case 'dimensions': return (
        <div className="space-y-6 animate-fade-in">
          <div>
            <label className="label mb-3">Hall Style</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {['Theatre', 'Cluster', 'U-Shape', 'Banquet'].map(style => (
                <div key={style} onClick={() => set('hallStyle', style)} className={`border rounded-xl p-4 cursor-pointer transition-colors text-center ${
                  form.hallStyle === style ? 'border-brand-500 bg-brand-500/10' : 'border-white/10 hover:border-brand-500 hover:bg-brand-500/10'
                }`}>
                  <div className={`w-12 h-12 rounded-lg mx-auto mb-2 flex items-center justify-center ${form.hallStyle === style ? 'bg-brand-500 text-white' : 'bg-surface-600 text-slate-400'}`}>
                    <Maximize size={24} />
                  </div>
                  <span className="text-sm font-medium text-white">{style}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="divider" />
          <h3 className="section-title">Dimensions (ft)</h3>
          <div className="grid grid-cols-3 gap-6">
            <div><label className="label">Length</label><input type="number" className="input" placeholder="100" value={form.length} onChange={e => set('length', e.target.value)} /></div>
            <div><label className="label">Width</label><input type="number" className="input" placeholder="80" value={form.width} onChange={e => set('width', e.target.value)} /></div>
            <div><label className="label">Height</label><input type="number" className="input" placeholder="20" value={form.height} onChange={e => set('height', e.target.value)} /></div>
          </div>
        </div>
      );
      case 'features': return (
        <div className="space-y-6 animate-fade-in">
          <p className="text-slate-400 text-sm">Select all features available at your venue:</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {FEATURES_LIST.map(f => (
              <label key={f} className={`flex items-center gap-3 cursor-pointer group p-3 rounded-xl border transition-all duration-200 ${
                form.selectedFeatures.includes(f)
                  ? 'border-brand-500/50 bg-brand-500/10 text-white'
                  : 'border-white/5 hover:border-white/20 text-slate-400 hover:text-slate-200'
              }`}>
                <input type="checkbox" className="w-4 h-4 accent-brand-500"
                  checked={form.selectedFeatures.includes(f)}
                  onChange={() => toggleFeature(f)} />
                <span className="text-sm font-medium">{f}</span>
              </label>
            ))}
          </div>
          {form.selectedFeatures.length > 0 && (
            <p className="text-xs text-brand-400">{form.selectedFeatures.length} feature(s) selected</p>
          )}
        </div>
      );
      case 'capacity': return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">
          <div className="card p-6 border border-brand-500/30 bg-gradient-to-br from-surface-800 to-surface-700">
            <h3 className="section-title mb-4">Seating</h3>
            <label className="label">Max Seated Guests</label>
            <input type="number" className="input" placeholder="500"
              value={form.seating} onChange={e => set('seating', e.target.value)} />
          </div>
          <div className="card p-6 border border-brand-500/30 bg-gradient-to-br from-surface-800 to-surface-700">
            <h3 className="section-title mb-4">Dining</h3>
            <label className="label">Dining Capacity</label>
            <input type="number" className="input" placeholder="300"
              value={form.dining} onChange={e => set('dining', e.target.value)} />
          </div>
          <div className="card p-6 border border-brand-500/30 bg-gradient-to-br from-surface-800 to-surface-700">
            <h3 className="section-title mb-4">Standing</h3>
            <label className="label">Floating / Standing</label>
            <input type="number" className="input" placeholder="800"
              value={form.standing} onChange={e => set('standing', e.target.value)} />
          </div>
        </div>
      );
      case 'rules': return (
        <div className="space-y-6 animate-fade-in max-w-2xl">
          <div>
            <label className="label">Alcohol Policy</label>
            <select className="input" value={form.alcohol} onChange={e => set('alcohol', e.target.value)}>
              <option>Not allowed</option>
              <option>Allowed with license</option>
              <option>Allowed</option>
            </select>
          </div>
          <div>
            <label className="label">Smoking Policy</label>
            <select className="input" value={form.smoking} onChange={e => set('smoking', e.target.value)}>
              <option>Not allowed</option>
              <option>Designated areas only</option>
              <option>Allowed</option>
            </select>
          </div>
          <div>
            <label className="label">Music / Noise Rules</label>
            <textarea className="input h-24 resize-none" placeholder="e.g. Loud music till 10:30 PM as per city norms."
              value={form.music} onChange={e => set('music', e.target.value)} />
          </div>
        </div>
      );
      case 'payment': return (
        <div className="grid grid-cols-2 gap-6 animate-fade-in">
          <div>
            <label className="label">Base Rental Fee (₹ / per day) *</label>
            <input type="number" className="input text-accent-emerald font-bold" placeholder="50000"
              value={form.price} onChange={e => set('price', e.target.value)} />
          </div>
          <div>
            <label className="label">Advance Payment Required (%)</label>
            <input type="number" className="input" placeholder="30"
              value={form.advancePercent} onChange={e => set('advancePercent', e.target.value)} />
          </div>
          <div className="col-span-2">
            <label className="label">Cancellation & Refund Policy</label>
            <textarea className="input h-24 resize-none" placeholder="Describe your cancellation policy..."
              value={form.cancellationPolicy} onChange={e => set('cancellationPolicy', e.target.value)} />
          </div>
        </div>
      );
      case 'legal': return (
        <div className="space-y-8 animate-fade-in max-w-2xl">
          <div>
            <label className="label mb-2">Upload Trade License</label>
            <label className="border-2 border-dashed border-white/20 rounded-xl p-8 text-center bg-surface-800/50 hover:bg-surface-700/50 transition-colors cursor-pointer block">
              <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png" onChange={e => handleFileChange(e, 'tradeLicense')} />
              {form.tradeLicense ? (
                <div className="text-brand-300 font-medium">Selected: {form.tradeLicense.name}</div>
              ) : (
                <>
                  <div className="text-brand-400 mb-2 font-medium">Click to upload or drag and drop</div>
                  <div className="text-xs text-slate-400">PDF, JPG up to 10MB</div>
                </>
              )}
            </label>
          </div>
          <div>
            <label className="label mb-2">Upload Fire NOC</label>
            <label className="border-2 border-dashed border-white/20 rounded-xl p-8 text-center bg-surface-800/50 hover:bg-surface-700/50 transition-colors cursor-pointer block">
              <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png" onChange={e => handleFileChange(e, 'fireNoc')} />
              {form.fireNoc ? (
                <div className="text-brand-300 font-medium">Selected: {form.fireNoc.name}</div>
              ) : (
                <>
                  <div className="text-brand-400 mb-2 font-medium">Click to upload or drag and drop</div>
                  <div className="text-xs text-slate-400">PDF, JPG up to 10MB</div>
                </>
              )}
            </label>
          </div>
          <div className="p-4 bg-brand-500/10 border border-brand-500/30 rounded-lg">
            <label className="flex items-start gap-3 cursor-pointer text-slate-300">
              <input type="checkbox" className="w-5 h-5 rounded mt-0.5 accent-brand-500"
                checked={form.agreeTerms} onChange={e => set('agreeTerms', e.target.checked)} />
              <span className="text-sm">I agree to the Terms & Conditions and declare all provided information is accurate and legally valid.</span>
            </label>
          </div>
        </div>
      );
      default: return null;
    }
  };

  return (
    <div className="animate-fade-in pb-10">
      <button onClick={() => navigate('/halls')}
        className="flex items-center gap-2 text-brand-400 hover:text-brand-300 font-medium mb-6 hover:-translate-x-1 transition-transform">
        <ArrowLeft size={20} /> Back to Halls
      </button>

      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-white mb-2">Add New Hall</h1>
          <p className="text-slate-400">Fill out the details below to publish a new venue.</p>
        </div>
        <div className="flex gap-3">
          <button className="btn-secondary" onClick={() => navigate('/halls')}>Cancel</button>
          <button className="btn-primary flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed" onClick={handleSave} disabled={saving || !form.agreeTerms}>
            {saving ? <><Loader2 size={16} className="animate-spin" /> Saving...</> : <><Save size={18} /> Save Hall</>}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-accent-rose/10 border border-accent-rose/20 text-accent-rose text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-6 p-4 rounded-xl bg-accent-emerald/10 border border-accent-emerald/20 text-accent-emerald text-sm font-medium">
          ✅ Hall created successfully! Redirecting...
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Vertical Tabs */}
        <div className="w-full lg:w-64 flex-shrink-0">
          <div className="card p-2 sticky top-24 glass">
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeTab === tab.id ? 'bg-brand-600 text-white shadow-glow-sm' : 'text-slate-400 hover:bg-surface-600 hover:text-white'
                }`}>
                <div className={activeTab === tab.id ? 'text-white' : 'text-slate-500'}>{tab.icon}</div>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 min-w-0">
          <div className="card p-8 glass min-h-[500px]">
            <h2 className="text-xl font-bold text-white mb-6 border-b border-white/5 pb-4 flex items-center gap-3">
              {tabs.find(t => t.id === activeTab)?.icon}
              {tabs.find(t => t.id === activeTab)?.label}
            </h2>
            {renderContent()}
          </div>
          <div className="flex justify-between mt-6">
            <button
              className={`btn-secondary ${activeTab === tabs[0].id ? 'invisible' : ''}`}
              onClick={() => setActiveTab(tabs[tabs.findIndex(t => t.id === activeTab) - 1]?.id)}
            >← Previous</button>
            <button
              className={`btn-primary ${activeTab === tabs[tabs.length - 1].id ? 'invisible' : ''}`}
              onClick={() => setActiveTab(tabs[tabs.findIndex(t => t.id === activeTab) + 1]?.id)}
            >Next →</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddHallPage;
