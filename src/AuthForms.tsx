import { useState } from 'react';
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
    setBusy(true);
    try {
      if (mode === 'login') await login(username, password);
      else await register(username, password);
    } catch (err: any) {
      setError(err?.message || 'Something went wrong');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow border border-slate-200 p-8">
        <h1 className="text-2xl font-bold text-center text-indigo-700 mb-2">TTD Booking Assistant</h1>
        <p className="text-center text-slate-500 text-sm mb-6">Sign in to save pilgrims across devices</p>
        <div className="flex rounded-lg bg-slate-100 p-1 mb-6">
          <button
            type="button"
            onClick={() => setMode('login')}
            className={`flex-1 py-2 text-sm font-medium rounded-md ${mode === 'login' ? 'bg-white text-indigo-700 shadow' : 'text-slate-500'}`}
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => setMode('register')}
            className={`flex-1 py-2 text-sm font-medium rounded-md ${mode === 'register' ? 'bg-white text-indigo-700 shadow' : 'text-slate-500'}`}
          >
            Register
          </button>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">Username</label>
            <input value={username} onChange={(e) => setUsername(e.target.value)} className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button disabled={busy} className="w-full py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50">
            {busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
          </button>
        </form>
        <p className="mt-4 text-xs text-slate-500 text-center">
          No credit card or payment details are stored.
        </p>
      </div>
    </div>
  );
}
