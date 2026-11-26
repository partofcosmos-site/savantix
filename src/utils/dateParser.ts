// Flexible human date parser for Savantix Attendance Bulk Entry
// Supports ISO (2026-11-12), DD/MM/YYYY (12/11/2026), DD-MM-YYYY (12-11-2026),
// and natural dates (12 Nov 2026, Nov 12 2026, November 12, 2026).

const MONTH_MAP: Record<string, number> = {
  jan: 1, january: 1,
  feb: 2, february: 2,
  mar: 3, march: 3,
  apr: 4, april: 4,
  may: 5,
  jun: 6, june: 6,
  jul: 7, july: 7,
  aug: 8, august: 8,
  sep: 9, sept: 9, september: 9,
  oct: 10, october: 10,
  nov: 11, november: 11,
  dec: 12, december: 12,
};

function toValidIso(year: number, month: number, day: number): string | null {
  if (year < 2000 || year > 2099 || month < 1 || month > 12 || day < 1 || day > 31) return null;
  const dt = new Date(Date.UTC(year, month - 1, day));
  if (
    dt.getUTCFullYear() !== year ||
    dt.getUTCMonth() !== month - 1 ||
    dt.getUTCDate() !== day
  ) {
    return null;
  }
  const mm = String(month).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return `${year}-${mm}-${dd}`;
}

export function parseFlexibleAbsenceDates(raw: string): string[] {
  if (!raw || !raw.trim()) return [];
  const found = new Set<string>();

  // 1. ISO YYYY-MM-DD
  for (const m of raw.matchAll(/\b(20\d{2})-(\d{1,2})-(\d{1,2})\b/g)) {
    const iso = toValidIso(Number(m[1]), Number(m[2]), Number(m[3]));
    if (iso) found.add(iso);
  }

  // 2. DD/MM/YYYY or DD-MM-YYYY (Indian/UK standard)
  for (const m of raw.matchAll(/\b(\d{1,2})[/-](\d{1,2})[/-](20\d{2})\b/g)) {
    const iso = toValidIso(Number(m[3]), Number(m[2]), Number(m[1]));
    if (iso) found.add(iso);
  }

  // 3. DD Mon YYYY (e.g., 12 Nov 2026, 4 November 2026)
  for (const m of raw.matchAll(/\b(\d{1,2})\s+([A-Za-z]{3,9}),?\s+(20\d{2})\b/g)) {
    const mon = MONTH_MAP[m[2].toLowerCase()];
    if (mon) {
      const iso = toValidIso(Number(m[3]), mon, Number(m[1]));
      if (iso) found.add(iso);
    }
  }

  // 4. Mon DD, YYYY (e.g., Nov 12 2026, November 12, 2026)
  for (const m of raw.matchAll(/\b([A-Za-z]{3,9})\s+(\d{1,2}),?\s+(20\d{2})\b/g)) {
    const mon = MONTH_MAP[m[1].toLowerCase()];
    if (mon) {
      const iso = toValidIso(Number(m[3]), mon, Number(m[2]));
      if (iso) found.add(iso);
    }
  }

  return Array.from(found).sort();
}
