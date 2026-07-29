import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  BookOpen,
  Bell,
  Calendar,
  Check,
  ChevronRight,
  Clock,
  Copy,
  Download,
  ExternalLink,
  FileText,
  Link2,
  LogOut,
  Plus,
  RefreshCw,
  Trash2,
  Users,
} from 'lucide-react';
import type { BookingEvent, Gender, IdType, Pilgrim } from './types';
import { useAuth } from './AuthContext';
import AuthForms from './AuthForms';
import { eventsApi, pilgrimsApi } from './api';
import { extractTextFromFile } from './ocr';
import { parseDocumentText } from './parser';
import { generateConsoleScript, generateUserscript } from './autofill';
import MonitorTab from './MonitorTab';
import './index.css';

type Tab = 'dashboard' | 'pilgrims' | 'fill' | 'monitor' | 'help';

const OFFICIAL_LINKS = [
  { label: 'Dashboard', url: 'https://ttdevasthanams.ap.gov.in/home/dashboard' },
  { label: 'Special Entry Darshan', url: 'https://ttdevasthanams.ap.gov.in/home/dashboard' },
  { label: 'Accommodation', url: 'https://ttdevasthanams.ap.gov.in/home/dashboard' },
  { label: 'Seva / e-DIP', url: 'https://ttdevasthanams.ap.gov.in/home/dashboard' },
  { label: 'Transaction History', url: 'https://ttdevasthanams.ap.gov.in/home/dashboard' },
];

export default function App() {
  const { user, loading: authLoading, logout } = useAuth();
  const [tab, setTab] = useState<Tab>('dashboard');
  const [pilgrims, setPilgrims] = useState<Pilgrim[]>([]);
  const [events, setEvents] = useState<BookingEvent[]>([]);
  const [now, setNow] = useState(new Date());
  const [ocrBusy, setOcrBusy] = useState(false);
  const [ocrError, setOcrError] = useState('');

  const refresh = async () => {
    if (!user) return;
    try {
      const [pList, eList] = await Promise.all([pilgrimsApi.list(), eventsApi.list()]);
      setPilgrims(pList);
      setEvents(eList);
    } catch (err: any) {
      console.error('Refresh error', err);
    }
  };

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    refresh();
  }, [user]);

  const nextEvent = useMemo(() => {
    const future = events
      .filter((e) => new Date(e.datetime) > now)
      .sort((a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime());
    return future[0];
  }, [events, now]);

  const countdown = useMemo(() => {
    if (!nextEvent) return '';
    const diff = new Date(nextEvent.datetime).getTime() - now.getTime();
    if (diff <= 0) return 'Releasing now';
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    const seconds = Math.floor((diff / 1000) % 60);
    const parts: string[] = [];
    if (days) parts.push(`${days}d`);
    if (hours || days) parts.push(`${hours}h`);
    parts.push(`${minutes}m`);
    parts.push(`${seconds}s`);
    return parts.join(' ');
  }, [nextEvent, now]);

  useEffect(() => {
    if (nextEvent) {
      const diff = new Date(nextEvent.datetime).getTime() - now.getTime();
      if (diff <= 1000 && diff > 0) {
        beep();
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('TTD booking window is open', { body: nextEvent.title });
        }
      }
    }
  }, [nextEvent, now]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500">
        Loading…
      </div>
    );
  }

  if (!user) {
    return <AuthForms />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <header className="bg-indigo-600 text-white shadow">
        <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-lg">
              <BookOpen size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold">TTD Booking Assistant</h1>
              <p className="text-xs text-indigo-100">Plan faster. Book manually.</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <nav className="hidden md:flex gap-2">
              <NavButton active={tab === 'dashboard'} onClick={() => setTab('dashboard')} label="Dashboard" icon={<Clock size={18} />} />
              <NavButton active={tab === 'pilgrims'} onClick={() => setTab('pilgrims')} label="Pilgrims" icon={<Users size={18} />} />
              <NavButton active={tab === 'fill'} onClick={() => setTab('fill')} label="Quick Fill" icon={<FileText size={18} />} />
              <NavButton active={tab === 'monitor'} onClick={() => setTab('monitor')} label="Monitor" icon={<Bell size={18} />} />
              <NavButton active={tab === 'help'} onClick={() => setTab('help')} label="Help" icon={<AlertCircle size={18} />} />
            </nav>
            <div className="flex items-center gap-2">
              <span className="text-xs text-indigo-100 hidden sm:inline">{user.username}</span>
              <button onClick={logout} className="p-2 rounded-lg bg-white/10 hover:bg-white/20" title="Sign out">
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        {tab === 'dashboard' && <DashboardTab events={events} nextEvent={nextEvent} countdown={countdown} onChange={refresh} now={now} />}
        {tab === 'pilgrims' && <PilgrimsTab pilgrims={pilgrims} onChange={refresh} ocrBusy={ocrBusy} setOcrBusy={setOcrBusy} ocrError={ocrError} setOcrError={setOcrError} />}
        {tab === 'fill' && <FillTab pilgrims={pilgrims} />}
        {tab === 'monitor' && <MonitorTab />}
        {tab === 'help' && <HelpTab />}
      </main>

      <footer className="text-center py-6 text-sm text-slate-500">
        This is an independent helper. It does not book tickets automatically and is not affiliated with TTD.
      </footer>
    </div>
  );
}

function NavButton({ active, onClick, label, icon }: { active: boolean; onClick: () => void; label: string; icon: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition ${active ? 'bg-white text-indigo-700' : 'text-white hover:bg-white/10'}`}
    >
      {icon}
      {label}
    </button>
  );
}

function DashboardTab({
  events,
  nextEvent,
  countdown,
  onChange,
  now,
}: {
  events: BookingEvent[];
  nextEvent?: BookingEvent;
  countdown: string;
  onChange: () => void;
  now: Date;
}) {
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [datetime, setDatetime] = useState('');
  const [url, setUrl] = useState('https://ttdevasthanams.ap.gov.in/home/dashboard');
  const [note, setNote] = useState('');

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !datetime) return;
    await eventsApi.create({ title, datetime, url, note });
    onChange();
    setTitle('');
    setDatetime('');
    setUrl('https://ttdevasthanams.ap.gov.in/home/dashboard');
    setNote('');
    setShowForm(false);
  };

  const remove = async (id: string) => {
    await eventsApi.remove(id);
    onChange();
  };

  return (
    <div className="space-y-6">
      <section className="grid md:grid-cols-3 gap-4">
        <div className="md:col-span-2 bg-gradient-to-br from-indigo-600 to-violet-600 text-white rounded-2xl p-6 shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-indigo-100 text-sm font-medium">Next release</p>
              <h2 className="text-2xl font-bold mt-1">{nextEvent ? nextEvent.title : 'No upcoming events'}</h2>
              {nextEvent && <p className="text-indigo-100 text-sm mt-1">{new Date(nextEvent.datetime).toLocaleString()}</p>}
            </div>
            <Clock size={40} className="text-white/40" />
          </div>
          <div className="mt-6">
            <div className="text-4xl font-mono font-bold tracking-wider">{countdown || '--'}</div>
            {nextEvent && (
              <a
                href={nextEvent.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-white text-indigo-700 rounded-lg font-semibold hover:bg-indigo-50"
              >
                Open official site <ExternalLink size={16} />
              </a>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow border border-slate-200">
          <h3 className="font-semibold mb-3 flex items-center gap-2"><Link2 size={18} /> Quick links</h3>
          <div className="space-y-2">
            {OFFICIAL_LINKS.map((l) => (
              <a key={l.label} href={l.url} target="_blank" rel="noreferrer" className="flex items-center justify-between p-2 rounded hover:bg-slate-100 text-sm text-slate-700">
                {l.label}
                <ChevronRight size={14} className="text-slate-400" />
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white rounded-2xl shadow border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-lg flex items-center gap-2"><Calendar size={20} /> Release schedule</h3>
          <button onClick={() => setShowForm((s) => !s)} className="flex items-center gap-2 text-sm px-3 py-1.5 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
            <Plus size={16} /> Add event
          </button>
        </div>

        {showForm && (
          <form onSubmit={add} className="grid md:grid-cols-5 gap-3 mb-4 p-4 bg-slate-50 rounded-xl">
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Event title" className="md:col-span-2 px-3 py-2 rounded border border-slate-300" />
            <input type="datetime-local" value={datetime} onChange={(e) => setDatetime(e.target.value)} className="px-3 py-2 rounded border border-slate-300" />
            <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Official URL" className="md:col-span-2 px-3 py-2 rounded border border-slate-300" />
            <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note" className="md:col-span-3 px-3 py-2 rounded border border-slate-300" />
            <div className="md:col-span-2 flex gap-2">
              <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700">Save</button>
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-200 rounded-md hover:bg-slate-300">Cancel</button>
            </div>
          </form>
        )}

        <div className="space-y-2">
          {events.length === 0 && <p className="text-slate-500 text-sm">No events yet. Add a release date when TTD announces the next quota.</p>}
          {events.map((ev) => {
            const isPast = new Date(ev.datetime) < now;
            return (
              <div key={ev.id} className={`flex items-center justify-between p-3 rounded-lg border ${isPast ? 'bg-slate-50 border-slate-200 opacity-70' : 'bg-white border-slate-200'}`}>
                <div>
                  <p className="font-medium">{ev.title}</p>
                  <p className="text-xs text-slate-500">{new Date(ev.datetime).toLocaleString()} {ev.note ? `• ${ev.note}` : ''}</p>
                </div>
                <button onClick={() => remove(ev.id)} className="text-red-500 hover:bg-red-50 p-2 rounded">
                  <Trash2 size={16} />
                </button>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function PilgrimsTab({
  pilgrims,
  onChange,
  ocrBusy,
  setOcrBusy,
  ocrError,
  setOcrError,
}: {
  pilgrims: Pilgrim[];
  onChange: () => void;
  ocrBusy: boolean;
  setOcrBusy: (v: boolean) => void;
  ocrError: string;
  setOcrError: (v: string) => void;
}) {
  const [form, setForm] = useState<Partial<Pilgrim>>({
    name: '',
    age: '',
    gender: 'Male',
    mobile: '',
    idType: 'Aadhaar',
    idNumber: '',
    relation: 'Self',
    note: '',
  });
  const [preview, setPreview] = useState('');
  const [extracted, setExtracted] = useState('');

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type.startsWith('image/')) setPreview(URL.createObjectURL(file));
    else setPreview('');
    setOcrBusy(true);
    setOcrError('');
    setExtracted('');
    try {
      const text = await extractTextFromFile(file);
      setExtracted(text);
      const parsed = parseDocumentText(text);
      setForm((prev) => ({ ...prev, ...parsed }));
    } catch (err: any) {
      setOcrError(err?.message || 'Could not read document. Try a clearer photo.');
    } finally {
      setOcrBusy(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.idNumber) return;
    const pilgrim: Pilgrim = {
      id: crypto.randomUUID(),
      name: form.name || '',
      age: form.age || '',
      gender: (form.gender as Gender) || 'Male',
      mobile: form.mobile || '',
      idType: (form.idType as IdType) || 'Aadhaar',
      idNumber: form.idNumber || '',
      relation: form.relation || 'Self',
      note: form.note || '',
      docUrl: preview,
    };
    await pilgrimsApi.create(pilgrim);
    onChange();
    setForm({ name: '', age: '', gender: 'Male', mobile: '', idType: 'Aadhaar', idNumber: '', relation: 'Self', note: '' });
    setPreview('');
    setExtracted('');
  };

  const remove = async (id: string) => {
    await pilgrimsApi.remove(id);
    onChange();
  };

  const updateField = (key: keyof Pilgrim, value: string) => setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <div className="bg-white rounded-2xl shadow border border-slate-200 p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><Plus size={20} /> Add pilgrim</h2>
        <p className="text-sm text-slate-500 mb-4">Upload a clear photo or PDF of an ID card to auto-fill details. Always review before saving.</p>

        <label className="block mb-4">
          <span className="text-sm font-medium">Upload ID / Aadhaar (image or PDF)</span>
          <input type="file" accept="image/*,.pdf" onChange={handleFile} className="mt-1 block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" />
          {ocrBusy && <p className="text-xs text-indigo-600 mt-2 flex items-center gap-1"><RefreshCw size={12} className="animate-spin" /> Reading document…</p>}
          {ocrError && <p className="text-xs text-red-600 mt-2 flex items-center gap-1"><AlertCircle size={12} /> {ocrError}</p>}
        </label>

        <form onSubmit={submit} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Input label="Full name" value={form.name || ''} onChange={(v) => updateField('name', v)} />
            <Input label="Age" value={form.age || ''} onChange={(v) => updateField('age', v)} />
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <Select label="Gender" value={form.gender || 'Male'} options={['Male', 'Female', 'Other']} onChange={(v) => updateField('gender', v)} />
            <Input label="Mobile" value={form.mobile || ''} onChange={(v) => updateField('mobile', v)} />
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <Select label="ID type" value={form.idType || 'Aadhaar'} options={['Aadhaar', 'PAN', 'Passport', 'Voter ID', 'Driving License', 'Other']} onChange={(v) => updateField('idType', v as IdType)} />
            <Input label="ID number" value={form.idNumber || ''} onChange={(v) => updateField('idNumber', v)} />
          </div>
          <Input label="Relation to primary pilgrim" value={form.relation || ''} onChange={(v) => updateField('relation', v)} />
          <Input label="Note" value={form.note || ''} onChange={(v) => updateField('note', v)} />
          <button type="submit" className="w-full py-2.5 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700">Save pilgrim</button>
        </form>

        {extracted && (
          <div className="mt-4 p-3 bg-slate-50 rounded-lg text-xs text-slate-600">
            <p className="font-medium mb-1">Extracted text preview:</p>
            <pre className="whitespace-pre-wrap max-h-32 overflow-auto">{extracted}</pre>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow border border-slate-200 p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><Users size={20} /> Saved pilgrims</h2>
        {pilgrims.length === 0 && <p className="text-slate-500 text-sm">No pilgrims saved yet.</p>}
        <div className="space-y-3 max-h-[500px] overflow-auto pr-1">
          {pilgrims.map((p) => (
            <div key={p.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-start justify-between">
              <div>
                <p className="font-semibold">{p.name}</p>
                <p className="text-xs text-slate-500">{p.age ? `${p.age} yrs` : ''} {p.gender} • {p.idType}: {p.idNumber}</p>
                <p className="text-xs text-slate-500">{p.mobile} • {p.relation}</p>
              </div>
              <button onClick={() => remove(p.id)} className="text-red-500 hover:bg-red-50 p-2 rounded"><Trash2 size={16} /></button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function FillTab({ pilgrims }: { pilgrims: Pilgrim[] }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState('');

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else if (next.size < 6) next.add(id);
      return next;
    });
  };

  const selectedPilgrims = pilgrims.filter((p) => selected.has(p.id)).slice(0, 6);

  const copy = (type: 'script' | 'userscript') => {
    const text = type === 'script' ? generateConsoleScript(selectedPilgrims) : generateUserscript(selectedPilgrims);
    navigator.clipboard.writeText(text).then(() => {
      setCopied(type);
      setTimeout(() => setCopied(''), 2000);
    });
  };

  return (
    <div className="space-y-6">
      <section className="bg-white rounded-2xl shadow border border-slate-200 p-6">
        <h2 className="text-lg font-semibold mb-2">Quick form fill</h2>
        <p className="text-sm text-slate-500 mb-4">Select up to 6 pilgrims, then copy the filler script and paste it into the browser console on the official TTD booking page.</p>

        <div className="space-y-2 mb-4">
          {pilgrims.length === 0 && <p className="text-slate-500 text-sm">Save pilgrims first in the Pilgrims tab.</p>}
          {pilgrims.map((p) => (
            <label key={p.id} className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50">
              <input type="checkbox" checked={selected.has(p.id)} onChange={() => toggle(p.id)} className="w-4 h-4 text-indigo-600 rounded" />
              <div className="flex-1">
                <p className="font-medium">{p.name}</p>
                <p className="text-xs text-slate-500">{p.idType}: {p.idNumber}</p>
              </div>
            </label>
          ))}
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => copy('script')}
            disabled={selectedPilgrims.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            {copied === 'script' ? <Check size={16} /> : <Copy size={16} />}
            Copy console script
          </button>
          <button
            onClick={() => copy('userscript')}
            disabled={selectedPilgrims.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50"
          >
            {copied === 'userscript' ? <Check size={16} /> : <Download size={16} />}
            Copy Tampermonkey script
          </button>
        </div>
      </section>

      <section className="bg-indigo-50 rounded-2xl p-6 border border-indigo-100">
        <h3 className="font-semibold mb-2">How to use</h3>
        <ol className="list-decimal list-inside text-sm text-slate-700 space-y-2">
          <li>Open the official TTD site and navigate to the booking form.</li>
          <li>Open browser developer tools (F12) and switch to the Console tab.</li>
          <li>Paste the <strong>console script</strong> and press Enter. The form fields will be filled with the selected pilgrim details.</li>
          <li>Review every field, then manually click the Submit/Pay button.</li>
          <li>For a permanent helper, install the <strong>Tampermonkey</strong> extension, create a new script, and paste the userscript.</li>
        </ol>
      </section>
    </div>
  );
}

function HelpTab() {
  return (
    <div className="bg-white rounded-2xl shadow border border-slate-200 p-6 space-y-4">
      <h2 className="text-lg font-semibold">How this helper works</h2>
      <p className="text-slate-600 text-sm">
        This is a local, client-side dashboard. It stores your pilgrim details in your browser so you can fill TTD forms quickly and keep track of ticket release times.
      </p>
      <ul className="list-disc list-inside text-sm text-slate-600 space-y-1">
        <li>Upload an ID photo/PDF and the app tries to read the text (OCR). Always verify the extracted values.</li>
        <li>Add each pilgrim once, then re-use the details on the TTD booking site.</li>
        <li>Add ticket release events to get a live countdown and optional notification.</li>
        <li>Use the console/userscript filler on the official TTD page to populate forms fast.</li>
      </ul>
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
        <strong>Important:</strong> This tool does not automate the final booking step. You must review the form and click the official Submit/Pay button yourself. It is not affiliated with TTD.
      </div>
    </div>
  );
}

function Input({ label, value, onChange }: { label: string; value: string; onChange: (val: string) => void }) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-slate-700">{label}</label>
      <input id={id} value={value} onChange={(e) => onChange(e.target.value)} className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
    </div>
  );
}

function Select({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (val: string) => void }) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-slate-700">{label}</label>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)} className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500">
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    </div>
  );
}

function useId() {
  const ref = useRef('id-' + Math.random().toString(36).slice(2));
  return ref.current;
}

function beep() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    osc.start();
    osc.stop(ctx.currentTime + 0.2);
  } catch {}
}
