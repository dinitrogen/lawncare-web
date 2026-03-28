import { Injectable, signal, effect } from '@angular/core';
import { ThemeName } from '../models/theme.model';

const STORAGE_KEY = 'lawncare-theme';
const VALID_THEMES: ThemeName[] = ['light', 'dark'];

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly _theme = signal<ThemeName>(this.loadTheme());
  readonly theme = this._theme.asReadonly();

  constructor() {
    document.documentElement.setAttribute('data-theme', this._theme());

    effect(() => {
      const theme = this._theme();
      document.documentElement.setAttribute('data-theme', theme);
      try {
        localStorage.setItem(STORAGE_KEY, theme);
      } catch {
        // localStorage unavailable
      }
    });
  }

  setTheme(theme: ThemeName): void {
    if (VALID_THEMES.includes(theme)) {
      this._theme.set(theme);
    }
  }

  private loadTheme(): ThemeName {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as ThemeName | null;
      if (stored && VALID_THEMES.includes(stored)) return stored;
    } catch {
      // localStorage unavailable
    }
    return 'light';
  }
}
