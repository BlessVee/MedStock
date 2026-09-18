import { useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { useTheme } from './context/ThemeContext';
import { DataProvider } from './context/DataContext';
import { Sidebar } from './components/Sidebar';
import { SettingsModal } from './components/SettingsModal';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Medicines } from './pages/Medicines';
import { Batches } from './pages/Batches';
import { MedicineDetail } from './pages/MedicineDetail';
import { Ledger } from './pages/Ledger';
import { Archive } from './pages/Archive';
import { Categories } from './pages/Categories';

function AppShell() {
  const { theme, paletteVars } = useTheme();
  const [settingsOpen, setSettingsOpen] = useState(false);

  const rootStyle: React.CSSProperties & Record<string, string> = {
    display: 'flex',
    height: '100vh',
    width: '100%',
    overflow: 'hidden',
    '--bg': paletteVars.bg,
    '--surface': paletteVars.surface,
    '--surface-alt': paletteVars.surfaceAlt,
    '--surface-hover': paletteVars.surfaceAlt,
    '--border': paletteVars.border,
    '--border-strong': paletteVars.border,
    '--text': paletteVars.text,
    '--text-muted': paletteVars.textMuted,
    '--text-faint': paletteVars.textMuted,
    '--primary': paletteVars.primary,
    '--primary-hover': paletteVars.primaryHover,
    '--on-primary': paletteVars.onPrimary,
    '--primary-soft': paletteVars.primarySoft,
    background: paletteVars.bg,
    color: paletteVars.text,
  };

  return (
    <DataProvider>
      <div data-theme={theme} style={rootStyle}>
        <Sidebar onOpenSettings={() => setSettingsOpen(true)} />
        <main style={{ flex: 1, overflowY: 'auto', minWidth: 0 }}>
          <div style={{ padding: '26px 32px 60px', maxWidth: 1400 }}>
            <ErrorBoundary label="this page">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/medicines" element={<Medicines />} />
                <Route path="/medicines/:id" element={<MedicineDetail />} />
                <Route path="/batches" element={<Batches />} />
                <Route path="/ledger" element={<Ledger />} />
                <Route path="/categories" element={<Categories />} />
                <Route path="/archive" element={<Archive />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </ErrorBoundary>
          </div>
        </main>
        {settingsOpen && <SettingsModal onClose={() => setSettingsOpen(false)} />}
      </div>
    </DataProvider>
  );
}

export default function App() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        Loading…
      </div>
    );
  }

  if (!session) return <Login />;

  return <AppShell />;
}
