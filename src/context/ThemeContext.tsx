import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

export interface PaletteVars {
  bg: string;
  surface: string;
  surfaceAlt: string;
  border: string;
  text: string;
  textMuted: string;
  primary: string;
  primaryHover: string;
  onPrimary: string;
  primarySoft: string;
}

export interface Palette {
  key: string;
  name: string;
  vars: PaletteVars;
}

export const PALETTES_LIGHT: Palette[] = [
  {
    key: 'teal',
    name: 'Teal / Cool White',
    vars: {
      bg: '#f3f6f6',
      surface: '#ffffff',
      surfaceAlt: '#eef4f3',
      border: '#dde8e7',
      text: '#16211f',
      textMuted: '#5c7472',
      primary: '#0f6e6e',
      primaryHover: '#0b5757',
      onPrimary: '#ffffff',
      primarySoft: '#e5f2f1',
    },
  },
  {
    key: 'crimson',
    name: 'Red / Off-White',
    vars: {
      bg: '#faf7f5',
      surface: '#ffffff',
      surfaceAlt: '#f6f0ee',
      border: '#ecdedb',
      text: '#241a18',
      textMuted: '#7a6560',
      primary: '#b3261e',
      primaryHover: '#8f1e18',
      onPrimary: '#ffffff',
      primarySoft: '#fbe9e8',
    },
  },
  {
    key: 'indigo',
    name: 'Indigo / Cloud',
    vars: {
      bg: '#f5f5fb',
      surface: '#ffffff',
      surfaceAlt: '#efeffa',
      border: '#e0e0f1',
      text: '#1e1b3a',
      textMuted: '#6a679a',
      primary: '#4338ca',
      primaryHover: '#3730a3',
      onPrimary: '#ffffff',
      primarySoft: '#e9e7fb',
    },
  },
  {
    key: 'forest',
    name: 'Forest / Ivory',
    vars: {
      bg: '#f8f7f0',
      surface: '#ffffff',
      surfaceAlt: '#f1efe2',
      border: '#e3e0cf',
      text: '#202318',
      textMuted: '#6b7259',
      primary: '#15803d',
      primaryHover: '#116430',
      onPrimary: '#ffffff',
      primarySoft: '#e2f4e8',
    },
  },
  {
    key: 'amber',
    name: 'Amber / Sand',
    vars: {
      bg: '#faf6ee',
      surface: '#ffffff',
      surfaceAlt: '#f4ecda',
      border: '#e9dcc0',
      text: '#2a2013',
      textMuted: '#857556',
      primary: '#b45309',
      primaryHover: '#92400e',
      onPrimary: '#ffffff',
      primarySoft: '#fdecd2',
    },
  },
  {
    key: 'slate',
    name: 'Slate / Pure White',
    vars: {
      bg: '#f5f6f7',
      surface: '#ffffff',
      surfaceAlt: '#eef0f2',
      border: '#dde1e4',
      text: '#1a2024',
      textMuted: '#5f6b71',
      primary: '#334155',
      primaryHover: '#1e293b',
      onPrimary: '#ffffff',
      primarySoft: '#e6e9ec',
    },
  },
  {
    key: 'rose',
    name: 'Rose / Blush White',
    vars: {
      bg: '#fbf5f6',
      surface: '#ffffff',
      surfaceAlt: '#f7ebee',
      border: '#ecd8dd',
      text: '#29171b',
      textMuted: '#8a616a',
      primary: '#be123c',
      primaryHover: '#9f1239',
      onPrimary: '#ffffff',
      primarySoft: '#fce7ea',
    },
  },
  {
    key: 'cyan',
    name: 'Cyan / Mist',
    vars: {
      bg: '#f3f8f9',
      surface: '#ffffff',
      surfaceAlt: '#e9f3f5',
      border: '#d8e9ec',
      text: '#142225',
      textMuted: '#547278',
      primary: '#0e7490',
      primaryHover: '#155e75',
      onPrimary: '#ffffff',
      primarySoft: '#e0f2f6',
    },
  },
  {
    key: 'purple',
    name: 'Purple / Lilac White',
    vars: {
      bg: '#f8f5fb',
      surface: '#ffffff',
      surfaceAlt: '#f0e9f7',
      border: '#e2d5ef',
      text: '#241a2e',
      textMuted: '#7a6690',
      primary: '#7e22ce',
      primaryHover: '#6b21a8',
      onPrimary: '#ffffff',
      primarySoft: '#f1e6fb',
    },
  },
  {
    key: 'blue',
    name: 'Blue / Frost',
    vars: {
      bg: '#f3f6fa',
      surface: '#ffffff',
      surfaceAlt: '#eaf0f8',
      border: '#d9e4f0',
      text: '#16212e',
      textMuted: '#55697f',
      primary: '#1d5fae',
      primaryHover: '#164a89',
      onPrimary: '#ffffff',
      primarySoft: '#e3edf9',
    },
  },
];

export const PALETTES_DARK: Palette[] = [
  {
    key: 'teal',
    name: 'Teal / Ink',
    vars: {
      bg: '#0e1514',
      surface: '#161f1e',
      surfaceAlt: '#1b2624',
      border: '#263433',
      text: '#e2ecea',
      textMuted: '#8ba5a2',
      primary: '#2dd4bf',
      primaryHover: '#5eead4',
      onPrimary: '#06231f',
      primarySoft: 'rgba(45,212,191,.14)',
    },
  },
  {
    key: 'crimson',
    name: 'Red / Charcoal',
    vars: {
      bg: '#17110f',
      surface: '#221715',
      surfaceAlt: '#2a1c19',
      border: '#3a2723',
      text: '#f3e6e3',
      textMuted: '#b08d87',
      primary: '#f87171',
      primaryHover: '#fca5a5',
      onPrimary: '#2c0705',
      primarySoft: 'rgba(248,113,113,.16)',
    },
  },
  {
    key: 'indigo',
    name: 'Indigo / Midnight',
    vars: {
      bg: '#12111f',
      surface: '#181729',
      surfaceAlt: '#1e1d33',
      border: '#2b2a48',
      text: '#e6e4f7',
      textMuted: '#9694c2',
      primary: '#818cf8',
      primaryHover: '#a5b4fc',
      onPrimary: '#1e1b4b',
      primarySoft: 'rgba(129,140,248,.16)',
    },
  },
  {
    key: 'forest',
    name: 'Forest / Pine Black',
    vars: {
      bg: '#0e1510',
      surface: '#151f17',
      surfaceAlt: '#1a261c',
      border: '#263a28',
      text: '#e3ede4',
      textMuted: '#85a68e',
      primary: '#4ade80',
      primaryHover: '#86efac',
      onPrimary: '#062712',
      primarySoft: 'rgba(74,222,128,.16)',
    },
  },
  {
    key: 'amber',
    name: 'Amber / Espresso',
    vars: {
      bg: '#17130c',
      surface: '#221c12',
      surfaceAlt: '#2a2216',
      border: '#3c301d',
      text: '#f2e9d8',
      textMuted: '#b39d78',
      primary: '#fbbf24',
      primaryHover: '#fcd34d',
      onPrimary: '#3a2504',
      primarySoft: 'rgba(251,191,36,.16)',
    },
  },
  {
    key: 'slate',
    name: 'Slate / Graphite',
    vars: {
      bg: '#12151a',
      surface: '#191d23',
      surfaceAlt: '#1f242b',
      border: '#2c323a',
      text: '#e5e9ec',
      textMuted: '#93a0aa',
      primary: '#94a3b8',
      primaryHover: '#cbd5e1',
      onPrimary: '#0f172a',
      primarySoft: 'rgba(148,163,184,.16)',
    },
  },
  {
    key: 'rose',
    name: 'Rose / Plum Black',
    vars: {
      bg: '#170f12',
      surface: '#221419',
      surfaceAlt: '#2a181f',
      border: '#3c202a',
      text: '#f3e2e7',
      textMuted: '#b28792',
      primary: '#fb7185',
      primaryHover: '#fda4af',
      onPrimary: '#450a1a',
      primarySoft: 'rgba(251,113,133,.16)',
    },
  },
  {
    key: 'cyan',
    name: 'Cyan / Deep Sea',
    vars: {
      bg: '#0c1517',
      surface: '#131f22',
      surfaceAlt: '#17262a',
      border: '#223a3e',
      text: '#dfeef0',
      textMuted: '#82a7ac',
      primary: '#22d3ee',
      primaryHover: '#67e8f9',
      onPrimary: '#062a30',
      primarySoft: 'rgba(34,211,238,.16)',
    },
  },
  {
    key: 'purple',
    name: 'Purple / Eggplant',
    vars: {
      bg: '#140f1a',
      surface: '#1c1526',
      surfaceAlt: '#23192f',
      border: '#332345',
      text: '#ece4f6',
      textMuted: '#a390bd',
      primary: '#c084fc',
      primaryHover: '#d8b4fe',
      onPrimary: '#2e1065',
      primarySoft: 'rgba(192,132,252,.16)',
    },
  },
  {
    key: 'blue',
    name: 'Blue / Deep Navy',
    vars: {
      bg: '#0d131c',
      surface: '#141c28',
      surfaceAlt: '#19222f',
      border: '#253346',
      text: '#e2e9f2',
      textMuted: '#8496ac',
      primary: '#60a5fa',
      primaryHover: '#93c5fd',
      onPrimary: '#0d2543',
      primarySoft: 'rgba(96,165,250,.16)',
    },
  },
];

const LS_KEY = 'medstock_prefs_v1';

interface Prefs {
  theme: 'light' | 'dark';
  paletteKeyLight: string;
  paletteKeyDark: string;
}

function loadPrefs(): Prefs {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) {
      const p = JSON.parse(raw) as Partial<Prefs>;
      return {
        theme: p.theme === 'dark' ? 'dark' : 'light',
        paletteKeyLight: p.paletteKeyLight ?? 'teal',
        paletteKeyDark: p.paletteKeyDark ?? 'teal',
      };
    }
  } catch {
    // ignore malformed/blocked storage
  }
  return { theme: 'light', paletteKeyLight: 'teal', paletteKeyDark: 'teal' };
}

interface ThemeContextValue extends Prefs {
  paletteVars: PaletteVars;
  setTheme: (t: 'light' | 'dark') => void;
  setPalette: (themeKey: 'light' | 'dark', paletteKey: string) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefs] = useState<Prefs>(loadPrefs);

  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(prefs));
    } catch {
      // ignore blocked storage
    }
  }, [prefs]);

  const paletteVars = useMemo(() => {
    const list = prefs.theme === 'light' ? PALETTES_LIGHT : PALETTES_DARK;
    const key = prefs.theme === 'light' ? prefs.paletteKeyLight : prefs.paletteKeyDark;
    return (list.find((p) => p.key === key) ?? list[0]).vars;
  }, [prefs]);

  const value: ThemeContextValue = {
    ...prefs,
    paletteVars,
    setTheme: (theme) => setPrefs((p) => ({ ...p, theme })),
    setPalette: (themeKey, paletteKey) =>
      setPrefs((p) =>
        themeKey === 'light'
          ? { ...p, paletteKeyLight: paletteKey }
          : { ...p, paletteKeyDark: paletteKey },
      ),
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
