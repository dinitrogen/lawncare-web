export type ThemeName = 'light' | 'dark';

export interface ThemeOption {
  name: ThemeName;
  label: string;
  icon: string;
}

export const THEME_OPTIONS: ThemeOption[] = [
  { name: 'light', label: 'Light', icon: 'light_mode' },
  { name: 'dark', label: 'Dark', icon: 'dark_mode' },
];
