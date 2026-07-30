import { useState } from 'react';
import { BookOpen, Calendar, Clock, ExternalLink, Hotel, Ticket, Users } from 'lucide-react';
import { eventsApi } from './api';

type Option = {
  id: string;
  title: string;
  description: string;
  price: string;
  releaseHint: string;
  url: string;
  icon: React.ReactNode;
};

const OPTIONS: Option[] = [
  {
    id: 'sed-300',
    title: 'Special Entry Darshan — ₹300',
    description: 'Paid quick darshan. A limited daily quota is released online; typically the fastest to sell out.',
    price: '₹300',
    releaseHint: 'Daily quota opens around 9:00 AM IST',
    url: 'https://ttdevasthanams.ap.gov.in/home/dashboard',
    icon: <Ticket size={22} />,
  },
  {
    id: 'sed-500',
    title: 'Special Entry Darshan — ₹500',
    description: 'Paid darshan with a slightly larger quota than the ₹300 category.',
    price: '₹500',
    releaseHint: 'Daily quota opens around 9:00 AM IST',
    url: 'https://ttdevasthanams.ap.gov.in/home/dashboard',
    icon: <Ticket size={22} />,
  },
  {
    id: 'sed-1000',
    title: 'Special Entry Darshan — ₹1000',
    description: 'Premium paid darshan. Often has a separate release schedule.',
    price: '₹1000',
    releaseHint: 'Check TTD announcements for release days',
    url: 'https://ttdevasthanams.ap.gov.in/home/dashboard',
    icon: <Ticket size={22} />,
  },
  {
    id: 'accommodation',
    title: 'Accommodation',
    description: 'TTD cottages, guest houses and choultries in Tirumala/Tirupati.',
    price: 'Varies',
    releaseHint: 'Releases open in advance; 60–90 days typical',
    url: 'https://ttdevasthanams.ap.gov.in/home/dashboard',
    icon: <Hotel size={22} />,
  },
  {
    id: 'seva',
    title: 'Seva / e-DIP',
    description: 'Arjitha sevas such as Suprabhata, Thomala, Archana, Sahasra Deepalankarana, Ekanta.',
    price: 'Varies',
    releaseHint: 'Monthly/quarterly lottery or announced release',
    url: 'https://ttdevasthanams.ap.gov.in/home/dashboard',
    icon: <BookOpen size={22} />,
  },
  {
    id: 'sarva',
    title: 'Sarva Darshan (Free)',
    description: 'Free general queue darshan. No paid ticket, but virtual queue / Divya Darshan tokens may be required.',
    price: 'Free',
    releaseHint: 'Ongoing; tokens released as per TTD schedule',
    url: 'https://ttdevasthanams.ap.gov.in/home/dashboard',
    icon: <Users size={22} />,
  },
];

export default function PossibilitiesTab({ onChange }: { onChange: () => void }) {
  const [selected, setSelected] = useState<string | null>(null);
  const [datetime, setDatetime] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  const open = (id: string) => {
    setSelected(id);
    setSaved(false);
    setNote('');
    const next = new Date();
    next.setHours(9, 0, 0, 0);
    if (next < new Date()) next.setDate(next.getDate() + 1);
    setDatetime(next.toISOString().slice(0, 16));
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const opt = OPTIONS.find((o) => o.id === selected);
    if (!opt || !datetime) return;
    setBusy(true);
    try {
      await eventsApi.create({
        title: opt.title,
        datetime,
        url: opt.url,
        note: note || opt.releaseHint,
      });
      setSaved(true);
      onChange();
      setTimeout(() => setSelected(null), 1200);
    } catch (err) {
      console.error(err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="bg-white rounded-2xl shadow border border-slate-200 p-6">
        <h2 className="text-lg font-semibold mb-2 flex items-center gap-2"><Ticket size={20} /> TTD booking possibilities</h2>
        <p className="text-sm text-slate-500 mb-6">
          These are the main TTD categories you can prepare for. Select one to add a release reminder to your dashboard.
        </p>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {OPTIONS.map((opt) => (
            <div key={opt.id} className="rounded-xl border border-slate-200 p-4 hover:shadow transition bg-slate-50">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2 text-indigo-700 font-semibold">
                  {opt.icon}
                  <span className="text-sm">{opt.title}</span>
                </div>
                <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full">{opt.price}</span>
              </div>
              <p className="text-xs text-slate-600 mb-3">{opt.description}</p>
              <div className="flex items-center gap-1 text-xs text-slate-500 mb-3">
                <Clock size={12} />
                {opt.releaseHint}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => open(opt.id)}
                  className="flex-1 px-3 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700"
                >
                  Set reminder
                </button>
                <a
                  href={opt.url}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-100"
                  title="Open official site"
                >
                  <ExternalLink size={16} />
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>

      {selected && (
        <section className="bg-white rounded-2xl shadow border border-slate-200 p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2"><Calendar size={18} /> Add reminder</h3>
          {saved ? (
            <p className="text-emerald-600 text-sm">Reminder saved to your dashboard.</p>
          ) : (
            <form onSubmit={save} className="grid md:grid-cols-2 gap-4">
              {(() => {
                const opt = OPTIONS.find((o) => o.id === selected)!;
                return (
                  <>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-slate-700">Event</label>
                      <p className="text-sm text-slate-600 mt-1">{opt.title}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Release date & time</label>
                      <input
                        type="datetime-local"
                        value={datetime}
                        onChange={(e) => setDatetime(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Note</label>
                      <input
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder={opt.releaseHint}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300"
                      />
                    </div>
                    <div className="md:col-span-2 flex gap-2">
                      <button
                        type="submit"
                        disabled={busy}
                        className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
                      >
                        {busy ? 'Saving…' : 'Save reminder'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelected(null)}
                        className="px-4 py-2 bg-slate-200 rounded-lg hover:bg-slate-300"
                      >
                        Cancel
                      </button>
                    </div>
                  </>
                );
              })()}
            </form>
          )}
        </section>
      )}
    </div>
  );
}
