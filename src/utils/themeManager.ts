export type SavantixTheme = 'dark' | 'light';

export const THEME_STORAGE_KEY = 'savantix_theme';

export function getSavedTheme(): SavantixTheme {
  if (typeof window === 'undefined') return 'dark';
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === 'light' || saved === 'dark') return saved;
  } catch {}
  return 'dark';
}

export function applyTheme(theme: SavantixTheme): void {
  if (typeof document === 'undefined') return;
  document.documentElement.setAttribute('data-theme', theme);
  document.documentElement.style.colorScheme = theme;
  const metaTheme = document.querySelector('meta[name="theme-color"]');
  if (metaTheme) {
    metaTheme.setAttribute('content', theme === 'dark' ? '#090a0c' : '#f4f3ef');
  }
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {}
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('savantix:theme-changed', { detail: { theme } }));
  }
}

export function toggleTheme(): SavantixTheme {
  const next: SavantixTheme = getSavedTheme() === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  return next;
}
