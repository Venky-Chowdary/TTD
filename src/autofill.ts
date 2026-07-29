import type { Pilgrim } from './types';

export function generateConsoleScript(pilgrims: Pilgrim[]): string {
  const code = `(${autofill.toString()})(${JSON.stringify(pilgrims)});`;
  return code;
}

export function generateUserscript(pilgrims: Pilgrim[]): string {
  return `// ==UserScript==
// @name         TTD Booking Assistant
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Pre-fill TTD booking forms with your saved pilgrim details
// @match        https://ttdevasthanams.ap.gov.in/*
// @match        https://tirupatibalaji.ap.gov.in/*
// @grant        none
// ==/UserScript==

(function() {
  const pilgrims = ${JSON.stringify(pilgrims)};

  function addPanel() {
    if (document.getElementById('ttd-helper-panel')) return;
    const panel = document.createElement('div');
    panel.id = 'ttd-helper-panel';
    panel.style.cssText = 'position:fixed;bottom:16px;right:16px;width:220px;background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:12px;box-shadow:0 10px 25px rgba(0,0,0,.15);z-index:99999;font-family:sans-serif;font-size:14px;color:#1e293b;';
    const title = document.createElement('div');
    title.textContent = 'TTD Helper';
    title.style.cssText = 'font-weight:600;margin-bottom:8px;';
    panel.appendChild(title);

    const btn = document.createElement('button');
    btn.textContent = 'Fill this form';
    btn.style.cssText = 'width:100%;padding:8px 12px;background:#4f46e5;color:#fff;border:none;border-radius:6px;cursor:pointer;';
    btn.addEventListener('click', () => { ${autofill.toString()}(pilgrims); });
    panel.appendChild(btn);

    const note = document.createElement('div');
    note.textContent = 'Click only after the booking form is visible.';
    note.style.cssText = 'font-size:12px;color:#64748b;margin-top:8px;';
    panel.appendChild(note);

    document.body.appendChild(panel);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', addPanel);
  } else {
    addPanel();
  }
})();
`;
}

function autofill(pilgrims: Pilgrim[]) {
  if (!pilgrims || !pilgrims.length) {
    alert('No pilgrims saved. Add pilgrims in the TTD Assistant app first.');
    return;
  }

  const inputs = Array.from(document.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>('input, select, textarea')).filter(
    (el) => !el.hasAttribute('readonly') && !el.disabled
  );

  const getLabel = (el: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement) => {
    const parts: string[] = [];
    parts.push(el.id || '', el.name || '', (el as any).placeholder || '', el.getAttribute('aria-label') || '');
    const labels = el.labels ? Array.from(el.labels).map((l) => l.innerText) : [];
    if ((el as any).closest) {
      const parent = (el as any).closest('label, .form-group, .md-input-container, [class*="input"], [class*="field"]');
      if (parent) labels.push(parent.innerText);
    }
    return parts.concat(labels).join(' ').toLowerCase();
  };

  const matchers = [
    { key: 'name', re: /name|pilgrim|devotee|full name|first name|given name/i },
    { key: 'age', re: /age|years/i },
    { key: 'gender', re: /gender|sex/i },
    { key: 'mobile', re: /mobile|phone|cell|contact|phone number/i },
    { key: 'idNumber', re: /aadhaar|id number|identity number|passport|voter|pan|uid|id proof number|aadhar/i },
    { key: 'idType', re: /id type|proof|identity type|id proof|select id/i },
  ];

  const counters: Record<string, number> = {};

  const setValue = (el: any, value: string) => {
    if (!value) return;
    if (el.tagName === 'SELECT') {
      const opts = Array.from(el.options) as HTMLOptionElement[];
      const match = opts.find((o) => o.text.toLowerCase().includes(value.toLowerCase()) || o.value.toLowerCase().includes(value.toLowerCase()));
      if (match) {
        el.value = match.value;
      }
    } else {
      el.value = value;
    }
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    el.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true }));
  };

  let filled = 0;
  for (const el of inputs) {
    const text = getLabel(el);
    for (const m of matchers) {
      if (m.re.test(text)) {
        const idx = counters[m.key] || 0;
        const pilgrim = pilgrims[idx];
        if (pilgrim && (pilgrim as any)[m.key]) {
          setValue(el, (pilgrim as any)[m.key]);
          counters[m.key] = idx + 1;
          filled++;
        }
        break;
      }
    }
  }

  if (filled === 0) {
    alert('Could not find matching TTD form fields on this page.');
  } else {
    alert('Prefilled ' + filled + ' field(s). Review before submitting.');
  }
}
