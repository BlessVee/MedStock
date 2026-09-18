import { Modal } from './Modal';
import { useTheme, PALETTES_LIGHT, PALETTES_DARK } from '../context/ThemeContext';

export function SettingsModal({ onClose }: { onClose: () => void }) {
  const { theme, paletteKeyLight, paletteKeyDark, setTheme, setPalette } = useTheme();

  return (
    <Modal onClose={onClose}>
      <div
        style={{
          padding: '20px 22px',
          borderBottom: '1px solid var(--border)',
          fontSize: 16,
          fontWeight: 800,
        }}
      >
        Settings
      </div>
      <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div>
          <label
            style={{
              display: 'block',
              fontSize: 12,
              fontWeight: 600,
              color: 'var(--text-muted)',
              marginBottom: 8,
            }}
          >
            Appearance
          </label>
          <div
            style={{
              display: 'flex',
              border: '1px solid var(--border)',
              borderRadius: 100,
              overflow: 'hidden',
              background: 'var(--surface-alt)',
              width: 'fit-content',
            }}
          >
            <button
              onClick={() => setTheme('light')}
              style={{
                flex: 1,
                padding: '6px 14px',
                whiteSpace: 'nowrap',
                border: 'none',
                background: theme === 'light' ? 'var(--primary)' : 'var(--surface)',
                color: theme === 'light' ? 'var(--on-primary)' : 'var(--text-muted)',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Light
            </button>
            <button
              onClick={() => setTheme('dark')}
              style={{
                flex: 1,
                padding: '6px 14px',
                whiteSpace: 'nowrap',
                border: 'none',
                background: theme === 'dark' ? 'var(--primary)' : 'var(--surface)',
                color: theme === 'dark' ? 'var(--on-primary)' : 'var(--text-muted)',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Dark
            </button>
          </div>
        </div>

        <PaletteRow
          label="Color palette — Light theme"
          palettes={PALETTES_LIGHT}
          selectedKey={paletteKeyLight}
          onSelect={(key) => setPalette('light', key)}
        />
        <PaletteRow
          label="Color palette — Dark theme"
          palettes={PALETTES_DARK}
          selectedKey={paletteKeyDark}
          onSelect={(key) => setPalette('dark', key)}
        />

        <div style={{ fontSize: 12, color: 'var(--text-faint)' }}>
          Preferences are saved to this browser and reapplied next time you open MedStock.
        </div>
      </div>
      <div
        style={{
          padding: '16px 22px',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          justifyContent: 'flex-end',
        }}
      >
        <button className="btn btn-primary" onClick={onClose}>
          Done
        </button>
      </div>
    </Modal>
  );
}

function PaletteRow({
  label,
  palettes,
  selectedKey,
  onSelect,
}: {
  label: string;
  palettes: typeof PALETTES_LIGHT;
  selectedKey: string;
  onSelect: (key: string) => void;
}) {
  return (
    <div>
      <label
        style={{
          display: 'block',
          fontSize: 12,
          fontWeight: 600,
          color: 'var(--text-muted)',
          marginBottom: 8,
        }}
      >
        {label} (10 combinations)
      </label>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {palettes.map((p) => (
          <button
            key={p.key}
            title={p.name}
            onClick={() => onSelect(p.key)}
            style={{
              width: 52,
              height: 36,
              borderRadius: 8,
              background: p.vars.bg,
              border: `2px solid ${selectedKey === p.key ? p.vars.primary : p.vars.border}`,
              boxShadow: selectedKey === p.key ? `0 0 0 2px ${p.vars.primary} inset` : 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'flex-end',
              padding: 5,
            }}
          >
            <span
              style={{
                width: 12,
                height: 12,
                borderRadius: 100,
                background: p.vars.primary,
                display: 'block',
              }}
            />
          </button>
        ))}
      </div>
    </div>
  );
}
