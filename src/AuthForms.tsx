import { useState } from 'react';
import { Lock, LogIn, User, UserPlus } from 'lucide-react';
import { useAuth } from './AuthContext';

export default function AuthForms() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const { login, register } = useAuth();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password.');
      return;
    }
    setBusy(true);
    try {
      if (mode === 'login') await login(username, password);
      else await register(username, password);
    } catch (err: any) {
      setError(err?.message || 'Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600 text-white mb-4 shadow-lg">
            <LogIn size={28} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">TTD Booking Assistant</h1>
          <p className="text-sm text-slate-500 mt-1">Save pilgrims, track releases, and pre-fill TTD forms faster.</p>
        </div>

        <div className="flex rounded-xl bg-slate-100 p-1 mb-6">
          <button
            type="button"
            onClick={() => { setMode('login'); setError(''); }}
            className={`flex-1 py-2.5 text-sm font-semibold rounded-lg flex items-center justify-center gap-2 transition ${mode === 'login' ? 'bg-white text-indigo-700 shadow' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <User size={16} /> Sign in
          </button>
          <button
            type="button"
            onClick={() => { setMode('register'); setError(''); }}
            className={`flex-1 py-2.5 text-sm font-semibold rounded-lg flex items-center justify-center gap-2 transition ${mode === 'register' ? 'bg-white text-indigo-700 shadow' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <UserPlus size={16} /> Register
          </button>
        </div>

        <form onSubmit={submit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
            <div className="relative">
              <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <div className="relative">
              <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>}

          <button
            disabled={busy}
            className="w-full py-2.5 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
          >
            {busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        <p className="mt-6 text-xs text-slate-500 text-center leading-relaxed">
          No credit card or payment details are stored. The final booking must be completed manually on the official TTD site.
        </p>
      </div>
    </div>
  );
}
