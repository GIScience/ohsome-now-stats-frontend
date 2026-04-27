import { computed, Injectable, signal } from '@angular/core';

export type Theme = 'os' | 'light' | 'dark';

const ICONS: Record<Theme, string> = {
  os: 'desktop',
  light: 'sun',
  dark: 'bulb',
};

const LABELS: Record<Theme, string> = {
  os: 'OS Default',
  light: 'Light',
  dark: 'Dark',
};

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly STORAGE_KEY = 'ohsome-theme';
  private readonly osQuery = window.matchMedia('(prefers-color-scheme: dark)');

  private _theme = signal<Theme>('os');
  private _isDark = signal<boolean>(false);

  readonly theme = this._theme.asReadonly();
  /** True when the resolved theme is dark (accounts for OS default). */
  readonly isDark = this._isDark.asReadonly();
  readonly themeIcon = computed(() => ICONS[this._theme()]);
  readonly themeLabel = computed(() => LABELS[this._theme()]);

  readonly options: { value: Theme; label: string; icon: string }[] = [
    { value: 'os',    label: LABELS.os,    icon: ICONS.os },
    { value: 'light', label: LABELS.light, icon: ICONS.light },
    { value: 'dark',  label: LABELS.dark,  icon: ICONS.dark },
  ];

  constructor() {
    const saved = (localStorage.getItem(this.STORAGE_KEY) ?? 'os') as Theme;
    this._theme.set(saved);
    this.applyDataTheme();

    // Keep in sync when OS preference changes while in 'os' mode
    this.osQuery.addEventListener('change', () => {
      if (this._theme() === 'os') this.applyDataTheme();
    });
  }

  setTheme(theme: Theme): void {
    this._theme.set(theme);
    localStorage.setItem(this.STORAGE_KEY, theme);
    this.applyDataTheme();
  }

  private applyDataTheme(): void {
    const dark =
      this._theme() === 'dark' ||
      (this._theme() === 'os' && this.osQuery.matches);
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    this._isDark.set(dark);
  }
}
