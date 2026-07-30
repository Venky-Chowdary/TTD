import { useEffect, useState } from 'react';
import { Bell, Check, Copy, Globe, RefreshCw, ShieldAlert } from 'lucide-react';
import { availabilityApi } from './api';

const DEFAULT_KEYWORDS = 'Available,Book Now,Select,Open,Quota,Slots,Proceed,SED,Darshan,Seva,Accommodation';

export default function MonitorTab() {
  const [releaseTime, setReleaseTime] = useState('');
  const [keywords, setKeywords] = useState(DEFAULT_KEYWORDS);
  const [copied, setCopied] = useState(false);

  const [url, setUrl] = useState('https://ttdevasthanams.ap.gov.in/home/dashboard');
  const [intervalSec, setIntervalSec] = useState(30);
  const [auto, setAuto] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const script = generateMonitorScript({ releaseTime, keywords });

  const copy = () => {
    navigator.clipboard.writeText(script).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const check = async () => {
    setBusy(true);
    setError('');
    try {
      const list = keywords.split(',').map((k) => k.trim()).filter(Boolean);
      const res = await availabilityApi.check({ url, keywords: list });
      setResult(res);
    } catch (err: any) {
      setError(err.message || 'Check failed');
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (!auto) return;
    const t = setInterval(check, Math.max(5, intervalSec) * 1000);
    return () => clearInterval(t);
  }, [auto, intervalSec, url, keywords]);

  return (
    <div className="space-y-6">
      <section className="bg-white rounded-2xl shadow border border-slate-200 p-6">
        <h2 className="text-lg font-semibold mb-2 flex items-center gap-2"><Globe size={20} /> Real-time availability check</h2>
        <p className="text-sm text-slate-500 mb-4">
          The backend fetches the official TTD page and scans it for availability keywords. Use it for quick checks, or turn on auto-refresh.
        </p>

        <div className="grid md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">TTD page URL</label>
            <input value={url} onChange={(e) => setUrl(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-300" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Keywords</label>
            <input value={keywords} onChange={(e) => setKeywords(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-300" />
            <p className="text-xs text-slate-500 mt-1">Comma-separated.</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 mb-4">
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={auto} onChange={(e) => setAuto(e.target.checked)} className="rounded" />
            Auto-refresh every
          </label>
          <input
            type="number"
            min={5}
            value={intervalSec}
            onChange={(e) => setIntervalSec(parseInt(e.target.value || '5', 10))}
            className="w-20 px-2 py-1 rounded-lg border border-slate-300"
          />
          <span className="text-sm text-slate-600">seconds</span>
        </div>

        <div className="flex gap-3 mb-4">
          <button
            onClick={check}
            disabled={busy}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            {busy ? <RefreshCw size={16} className="animate-spin" /> : <Globe size={16} />}
            Check now
          </button>
        </div>

        {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

        {result && (
          <div className={`p-4 rounded-xl border ${result.available ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}>
            <p className="font-semibold flex items-center gap-2">
              {result.available ? 'Availability signal detected' : 'No availability signal'}
              <span className="text-xs font-normal text-slate-500">{result.checked_at ? new Date(result.checked_at).toLocaleString() : ''}</span>
            </p>
            {result.error ? (
              <p className="text-sm text-red-600 mt-1">Error: {result.error}</p>
            ) : (
              <p className="text-sm text-slate-600 mt-1">
                Status {result.status_code} • matched: {result.matched?.join(', ') || 'none'}
              </p>
            )}
          </div>
        )}
      </section>

      <section className="bg-white rounded-2xl shadow border border-slate-200 p-6">
        <h2 className="text-lg font-semibold mb-2 flex items-center gap-2"><Bell size={20} /> Browser availability monitor</h2>
        <p className="text-sm text-slate-500 mb-4">
          Install this Tampermonkey script on the official TTD booking page. It watches the rendered page and beeps/notifies the moment availability keywords appear.
        </p>

        <div className="grid md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Release time</label>
            <input
              type="datetime-local"
              value={releaseTime}
              onChange={(e) => setReleaseTime(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300"
            />
            <p className="text-xs text-slate-500 mt-1">The page will auto-refresh 10 seconds before this time.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Watch keywords</label>
            <input
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300"
            />
            <p className="text-xs text-slate-500 mt-1">Comma-separated. Alerts when any keyword appears after a page change.</p>
          </div>
        </div>

        <button
          onClick={copy}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          {copied ? <Check size={16} /> : <Copy size={16} />}
          {copied ? 'Copied' : 'Copy Tampermonkey monitor script'}
        </button>
      </section>

      <section className="bg-amber-50 rounded-2xl p-6 border border-amber-200">
        <h3 className="font-semibold flex items-center gap-2 mb-2"><ShieldAlert size={18} /> How it works</h3>
        <ul className="list-disc list-inside text-sm text-slate-700 space-y-1">
          <li>The server check reads the public TTD page and looks for keywords. Some TTD pages are dynamic, so a positive result is a strong signal but not a guarantee.</li>
          <li>The Tampermonkey script runs on the official TTD website tabs you install it on and watches the rendered DOM for changes.</li>
          <li>Beeps and shows a desktop notification when a keyword is found.</li>
          <li>Auto-refreshes right before release time so you are not staring at a stale page.</li>
          <li>It never clicks Book/Pay for you. You still confirm the booking manually.</li>
        </ul>
      </section>
    </div>
  );
}

function generateMonitorScript({ releaseTime, keywords }: { releaseTime: string; keywords: string }) {
  const list = keywords
    .split(',')
    .map((k) => k.trim())
    .filter(Boolean)
    .map((k) => k.toLowerCase());

  return `// ==UserScript==
// @name         TTD Availability Monitor
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  Watch official TTD pages and alert immediately when ticket availability appears
// @match        https://ttdevasthanams.ap.gov.in/*
// @match        https://tirupatibalaji.ap.gov.in/*
// @grant        none
// ==/UserScript==

(function() {
  'use strict';

  const KEYWORDS = ${JSON.stringify(list)};
  const RELEASE_TIME = ${JSON.stringify(releaseTime)};
  let notified = false;
  let lastText = '';

  function beep() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.value = 1200;
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } catch (e) {}
  }

  function notify(title, body) {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body, requireInteraction: true });
    } else {
      alert(title + '\\n' + body);
    }
  }

  function scan(reason) {
    const text = document.body ? document.body.innerText || '' : '';
    const lower = text.toLowerCase();
    const hits = KEYWORDS.filter((k) => lower.includes(k));
    const changed = text !== lastText;
    if (changed) lastText = text;

    if (hits.length && !notified) {
      notified = true;
      beep();
      notify('TTD availability alert', 'Detected: ' + hits.join(', ') + ' (' + reason + ')');
      console.log('[TTD Monitor] hits:', hits, 'reason:', reason);
    }
  }

  function requestNotify() {
    if ('Notification' in window && Notification.permission !== 'denied') {
      Notification.requestPermission();
    }
  }

  function addPanel() {
    if (document.getElementById('ttd-monitor-panel')) return;
    const panel = document.createElement('div');
    panel.id = 'ttd-monitor-panel';
    panel.style.cssText = 'position:fixed;bottom:16px;right:16px;z-index:99999;width:260px;background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:12px;box-shadow:0 10px 25px rgba(0,0,0,.15);font-family:sans-serif;font-size:13px;color:#1e293b;';
    const title = document.createElement('div');
    title.textContent = 'TTD Monitor';
    title.style.cssText = 'font-weight:600;margin-bottom:6px;';
    panel.appendChild(title);

    const status = document.createElement('div');
    status.id = 'ttd-monitor-status';
    status.textContent = 'Watching page…';
    status.style.cssText = 'color:#64748b;margin-bottom:8px;';
    panel.appendChild(status);

    const btn = document.createElement('button');
    btn.textContent = 'Reset alert';
    btn.style.cssText = 'padding:6px 10px;background:#4f46e5;color:#fff;border:none;border-radius:6px;cursor:pointer;';
    btn.addEventListener('click', () => { notified = false; status.textContent = 'Watching page…'; });
    panel.appendChild(btn);

    document.body.appendChild(panel);
  }

  function scheduleRefresh() {
    if (!RELEASE_TIME) return;
    const release = new Date(RELEASE_TIME).getTime();
    const now = Date.now();
    const diff = release - now;
    if (diff <= 0) return;
    const refreshAt = diff - 10000; // refresh 10 seconds before
    if (refreshAt > 86400000) return; // ignore if more than a day away
    setTimeout(() => {
      console.log('[TTD Monitor] Refreshing before release');
      window.location.reload();
    }, Math.max(0, refreshAt));
  }

  function start() {
    requestNotify();
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => { addPanel(); });
    } else {
      addPanel();
    }

    const observer = new MutationObserver((mutations) => {
      const status = document.getElementById('ttd-monitor-status');
      if (status) status.textContent = 'Page changed, scanning…';
      scan('mutation');
    });

    const target = document.body || document.documentElement;
    if (target) {
      observer.observe(target, { childList: true, subtree: true, attributes: true, characterData: true });
    }

    setInterval(() => scan('interval'), 500);
    scheduleRefresh();
    scan('initial');
  }

  start();
})();
`;
}
