import { useState, type FormEvent } from 'react';
import { signIn } from '../services/auth';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!email.trim() || !password) {
      setError('Enter your email and password.');
      return;
    }
    setSubmitting(true);
    try {
      await signIn(email.trim(), password);
    } catch {
      setError('Invalid email or password.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg)',
      }}
    >
      <form onSubmit={handleSubmit} className="card" style={{ width: 360, padding: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 22 }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 8,
              background: 'var(--primary)',
              color: 'var(--on-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 17,
              fontWeight: 800,
            }}
          >
            M
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-.01em' }}>MedStock</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="field">
            <label htmlFor="login-email">Email</label>
            <input
              id="login-email"
              type="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus
              autoComplete="username"
            />
          </div>
          <div className="field">
            <label htmlFor="login-password">Password</label>
            <input
              id="login-password"
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>
          {error && (
            <div style={{ fontSize: 12.5, color: 'var(--bad-text)' }} role="alert">
              {error}
            </div>
          )}
          <button
            type="submit"
            className="btn btn-primary"
            disabled={submitting}
            style={{ marginTop: 4 }}
          >
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
          <div className="faint" style={{ fontSize: 12, textAlign: 'center' }}>
            Ask an admin to create your account under Supabase Authentication.
          </div>
        </div>
      </form>
    </div>
  );
}
