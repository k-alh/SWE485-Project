import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './auth.js';
import { Layout } from './components/Layout.js';
import { AdminPage } from './pages/AdminPage.js';
import { CataloguePage } from './pages/CataloguePage.js';
import { ListingPage } from './pages/ListingPage.js';
import { LoginPage } from './pages/LoginPage.js';
import { TrackerPage } from './pages/TrackerPage.js';

export function App() {
  const { user, loading } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<Layout />}>
        <Route index element={<CataloguePage />} />
        <Route path="listings/:id" element={<ListingPage />} />
        <Route
          path="tracker"
          element={
            loading ? null : user ? (
              <TrackerPage />
            ) : (
              <Navigate to="/login?next=/tracker" replace />
            )
          }
        />
        <Route
          path="admin"
          element={
            loading ? null : user?.role === 'admin' ? (
              <AdminPage />
            ) : (
              <Navigate to={user ? '/' : '/login?next=/admin'} replace />
            )
          }
        />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

function NotFoundPage() {
  return (
    <div className="empty-state">
      <h1>That page does not exist</h1>
      <p>The link may be out of date.</p>
      <a className="btn btn--primary" href="/">
        Back to the catalogue
      </a>
    </div>
  );
}
