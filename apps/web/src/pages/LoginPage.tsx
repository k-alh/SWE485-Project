import { useState } from 'react';
import type { FormEvent } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import type { AcademicYear } from '@talea/shared';
import { useAuth } from '../auth.js';

type Mode = 'signin' | 'register';

const YEAR_OPTIONS: Array<{ value: AcademicYear; label: string }> = [
  { value: 3, label: 'Year 3' },
  { value: 4, label: 'Year 4' },
  { value: 5, label: 'Year 5' },
  { value: 'graduate', label: 'Graduate' },
];

export function LoginPage() {
  const { user, login, register } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = params.get('next') ?? '/';

  const [mode, setMode] = useState<Mode>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [academicYear, setAcademicYear] = useState<AcademicYear>(4);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to={next} replace />;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      if (mode === 'signin') {
        await login(email, password);
      } else {
        await register({ name, email, password, academicYear });
      }
      navigate(next, { replace: true });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not sign you in.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div>
          <h1 style={{ fontSize: '1.7rem' }}>Talea</h1>
          <p className="panel__note">CO-OP and graduate development, tracked in one place.</p>
        </div>

        <div className="auth-tabs" role="tablist" aria-label="Sign in or create an account">
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'signin'}
            className={`auth-tab${mode === 'signin' ? ' auth-tab--active' : ''}`}
            onClick={() => {
              setMode('signin');
              setError('');
            }}
          >
            Sign in
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'register'}
            className={`auth-tab${mode === 'register' ? ' auth-tab--active' : ''}`}
            onClick={() => {
              setMode('register');
              setError('');
            }}
          >
            Create account
          </button>
        </div>

        <form className="form" onSubmit={handleSubmit} noValidate>
          {mode === 'register' && (
            <div className="form__row">
              <label className="field__label" htmlFor="name">
                Full name
              </label>
              <input
                id="name"
                className="input"
                value={name}
                autoComplete="name"
                onChange={(event) => setName(event.target.value)}
                required
              />
            </div>
          )}

          <div className="form__row">
            <label className="field__label" htmlFor="email">
              University email
            </label>
            <input
              id="email"
              className="input"
              type="email"
              value={email}
              autoComplete="email"
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>

          <div className="form__row">
            <label className="field__label" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              className="input"
              type="password"
              value={password}
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              onChange={(event) => setPassword(event.target.value)}
              aria-describedby={mode === 'register' ? 'password-hint' : undefined}
              required
            />
            {mode === 'register' && (
              <span className="field__hint" id="password-hint">
                At least 8 characters.
              </span>
            )}
          </div>

          {mode === 'register' && (
            <div className="form__row">
              <label className="field__label" htmlFor="year">
                Academic year
              </label>
              <select
                id="year"
                className="select"
                value={String(academicYear)}
                onChange={(event) =>
                  setAcademicYear(
                    event.target.value === 'graduate' ? 'graduate' : (Number(event.target.value) as AcademicYear),
                  )
                }
              >
                {YEAR_OPTIONS.map((option) => (
                  <option key={String(option.value)} value={String(option.value)}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {error && (
            <div className="callout callout--error" role="alert">
              {error}
            </div>
          )}

          <button type="submit" className="btn btn--clay btn--block" disabled={busy}>
            {busy ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        <p className="demo-hint">
          Demo accounts: <code>student@talea.test</code> / <code>student12345</code> ·{' '}
          <code>admin@talea.test</code> / <code>admin12345</code>
        </p>
      </div>
    </div>
  );
}
