import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth.js';

export function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">
        Skip to content
      </a>

      <header className="topbar">
        <div className="topbar__inner">
          <Link to="/" className="wordmark" aria-label="Talea home">
            <span className="wordmark__mark" aria-hidden="true" />
            <span>
              Talea
              <span className="wordmark__arabic" lang="ar" dir="rtl">
                طليعة
              </span>
            </span>
          </Link>

          <nav className="nav" aria-label="Main">
            <NavLink to="/" end>
              Catalogue
            </NavLink>
            {user && <NavLink to="/tracker">My tracker</NavLink>}
            {user?.role === 'admin' && <NavLink to="/admin">Admin</NavLink>}
          </nav>

          <div className="topbar__account">
            {user ? (
              <>
                <span className="account-chip" title={user.email}>
                  {user.name}
                  <span className="account-chip__role">{user.role}</span>
                </span>
                <button type="button" className="btn btn--ghost btn--small" onClick={handleLogout}>
                  Sign out
                </button>
              </>
            ) : (
              <Link className="btn btn--primary btn--small" to="/login">
                Sign in
              </Link>
            )}
          </div>
        </div>
      </header>

      <main id="main" className="page">
        <Outlet />
      </main>

      <footer className="footer">
        <p>
          Talea is a coursework prototype. Listings are synthetic; nothing here is a real
          opportunity and no applications are submitted.
        </p>
      </footer>
    </div>
  );
}
