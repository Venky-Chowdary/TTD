import type { BookingEvent, Pilgrim } from './types';

const PILGRIMS_KEY = 'ttd-pilgrims';
const EVENTS_KEY = 'ttd-events';

export function loadPilgrims(): Pilgrim[] {
  try {
    const raw = localStorage.getItem(PILGRIMS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

export function savePilgrims(pilgrims: Pilgrim[]) {
  localStorage.setItem(PILGRIMS_KEY, JSON.stringify(pilgrims));
}

export function loadEvents(): BookingEvent[] {
  try {
    const raw = localStorage.getItem(EVENTS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return getDefaultEvents();
}

export function saveEvents(events: BookingEvent[]) {
  localStorage.setItem(EVENTS_KEY, JSON.stringify(events));
}

function getDefaultEvents(): BookingEvent[] {
  const today = new Date().toISOString().split('T')[0];
  return [
    { id: '1', title: 'Special Entry Darshan Release', datetime: `${today}T09:00`, url: 'https://ttdevasthanams.ap.gov.in/home/dashboard', note: 'Quota release time varies; update the date when announced.' },
    { id: '2', title: 'Accommodation Quota Release', datetime: `${today}T15:00`, url: 'https://ttdevasthanams.ap.gov.in/home/dashboard', note: 'Update date when new quota is announced.' },
  ];
}
