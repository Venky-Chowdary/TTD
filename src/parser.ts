import type { Gender, Pilgrim } from './types';

export function parseDocumentText(text: string): Partial<Pilgrim> {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const joined = lines.join(' ');

  const aadhaarMatch = joined.match(/\b(\d{4}\s?\d{4}\s?\d{4})\b/);
  const dobMatch = joined.match(/\b(\d{2}[\/\-]\d{2}[\/\-]\d{4})\b/);
  const genderMatch = joined.match(/\b(Male|Female|Transgender|M|F)\b/i);

  const parsed: Partial<Pilgrim> = {};

  if (aadhaarMatch) {
    parsed.idNumber = aadhaarMatch[1].replace(/\s/g, '');
    parsed.idType = 'Aadhaar';
  } else {
    const panMatch = joined.match(/\b([A-Z]{5}\d{4}[A-Z])\b/);
    if (panMatch) {
      parsed.idNumber = panMatch[1];
      parsed.idType = 'PAN';
    }
  }

  if (dobMatch) {
    parsed.age = String(computeAge(dobMatch[1]));
  }

  if (genderMatch) {
    parsed.gender = normalizeGender(genderMatch[1]) as Gender;
  }

  const name = findName(lines, joined);
  if (name) parsed.name = name;

  return parsed;
}

function normalizeGender(value: string): string {
  const v = value.toUpperCase();
  if (v === 'M' || v === 'MALE') return 'Male';
  if (v === 'F' || v === 'FEMALE') return 'Female';
  return 'Other';
}

function computeAge(dob: string): number {
  const sep = dob.includes('/') ? '/' : '-';
  const [d, m, y] = dob.split(sep).map(Number);
  const birth = new Date(y, m - 1, d);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const monthDiff = now.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) {
    age--;
  }
  return Math.max(0, age);
}

function findName(lines: string[], joined: string): string | undefined {
  // Explicit label
  const explicit = joined.match(/Name[:\s]+([A-Z][A-Za-z\s]+?)(?=\s+(?:DOB|Date|Sex|Gender|Aadhaar|Father|\d{2}[\/\-]))/i);
  if (explicit) {
    const n = explicit[1].trim();
    if (n.length > 2 && n.length < 50) return n;
  }

  const exclude = /GOVERNMENT|AADHAAR|INDIA|UNIQUE|IDENTIFICATION|MINISTRY|ADDRESS|MOBILE|PHONE|EMAIL|PIN|UID|VID|DOB|SEX|GENDER|FATHER|MOTHER|HUSBAND|WIFE/i;
  for (const line of lines) {
    const trimmed = line.replace(/[^A-Za-z\s]/g, '').trim();
    if (trimmed.length > 3 && trimmed.length < 40 && /^[A-Z][A-Z\s]+$/.test(trimmed) && !exclude.test(trimmed)) {
      return trimmed.replace(/\s+/g, ' ').trim();
    }
  }
  return undefined;
}
