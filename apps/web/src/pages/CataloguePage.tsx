import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ListingDto } from '@talea/shared';
import { ApiError, api } from '../api.js';
import { useAuth } from '../auth.js';
import { ListingCard } from '../components/ListingCard.js';

const CITIES = [
  'Riyadh',
  'Jeddah',
  'Dammam',
  'Khobar',
  'Dhahran',
  'Makkah',
  'Madinah',
  'Abha',
  'Tabuk',
  'Hail',
  'Buraidah',
  'Jubail',
  'Yanbu',
  'NEOM',
];

type DeadlineFilter = '' | 'open' | 'closing_soon' | 'closed';
type TypeFilter = '' | 'coop' | 'gdp';

const DEADLINE_CHIPS: Array<{ value: DeadlineFilter; label: string }> = [
  { value: '', label: 'All' },
  { value: 'open', label: 'Open' },
  { value: 'closing_soon', label: 'Closing soon' },
  { value: 'closed', label: 'Closed' },
];

export function CataloguePage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [type, setType] = useState<TypeFilter>('');
  const [city, setCity] = useState('');
  const [deadlineFilter, setDeadlineFilter] = useState<DeadlineFilter>('');

  const [items, setItems] = useState<ListingDto[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = useState('');

  const [tracked, setTracked] = useState<Record<string, boolean>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 250);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    let active = true;
    setStatus('loading');

    api
      .listings({
        q: debouncedQuery || undefined,
        type: type || undefined,
        city: city || undefined,
        deadlineStatus: deadlineFilter || undefined,
      })
      .then((result) => {
        if (!active) return;
        setItems(result.items);
        setStatus('ready');
      })
      .catch((caught: unknown) => {
        if (!active) return;
        setError(caught instanceof Error ? caught.message : 'Could not load listings.');
        setStatus('error');
      });

    return () => {
      active = false;
    };
  }, [debouncedQuery, type, city, deadlineFilter]);

  useEffect(() => {
    if (!user) {
      setTracked({});
      return;
    }
    let active = true;
    api
      .tracker()
      .then((result) => {
        if (!active) return;
        setTracked(Object.fromEntries(result.items.map((entry) => [entry.listingId, true])));
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [user]);

  const handleSave = async (listing: ListingDto) => {
    if (!user) {
      navigate('/login?next=/');
      return;
    }
    setSavingId(listing.id);
    setSaveError('');
    try {
      await api.track(listing.id);
      setTracked((previous) => ({ ...previous, [listing.id]: true }));
    } catch (caught) {
      if (caught instanceof ApiError && caught.code === 'ALREADY_TRACKED') {
        setTracked((previous) => ({ ...previous, [listing.id]: true }));
      } else {
        setSaveError(caught instanceof Error ? caught.message : 'Could not save that listing.');
      }
    } finally {
      setSavingId(null);
    }
  };

  return (
    <>
      <section className="hero">
        <span className="hero__kicker">CO-OP and graduate development</span>
        <h1 className="hero__title">Every opportunity, one place to track it.</h1>
        <p className="hero__lede">
          Browse what is open now, save what fits your year, and move each application through
          saved, applied, interview and offer — without a spreadsheet.
        </p>
      </section>

      <section className="filters" aria-label="Filter listings">
        <div className="filters__row">
          <div className="search">
            <label className="field__label" htmlFor="search">
              Search
            </label>
            <input
              id="search"
              className="input"
              type="search"
              placeholder="Role, organisation or city"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>

          <div>
            <label className="field__label" htmlFor="type-filter">
              Type
            </label>
            <select
              id="type-filter"
              className="select"
              value={type}
              onChange={(event) => setType(event.target.value as TypeFilter)}
            >
              <option value="">All types</option>
              <option value="coop">CO-OP</option>
              <option value="gdp">GDP</option>
            </select>
          </div>

          <div>
            <label className="field__label" htmlFor="city-filter">
              City
            </label>
            <select
              id="city-filter"
              className="select"
              value={city}
              onChange={(event) => setCity(event.target.value)}
            >
              <option value="">All cities</option>
              {CITIES.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="chips" role="group" aria-label="Deadline status">
          {DEADLINE_CHIPS.map((chip) => (
            <button
              key={chip.value}
              type="button"
              className={`chip${deadlineFilter === chip.value ? ' chip--active' : ''}`}
              aria-pressed={deadlineFilter === chip.value}
              onClick={() => setDeadlineFilter(chip.value)}
            >
              {chip.label}
            </button>
          ))}
        </div>
      </section>

      {saveError && (
        <div className="callout callout--error" role="alert" style={{ marginBottom: '1rem' }}>
          {saveError}
        </div>
      )}

      <div className="results-line">
        <span>
          {status === 'ready' ? `${items.length} ${items.length === 1 ? 'opportunity' : 'opportunities'}` : 'Loading'}
        </span>
        {!user && <span>Sign in to save and track</span>}
      </div>

      {status === 'loading' && <p className="loading">Loading opportunities…</p>}

      {status === 'error' && (
        <div className="callout callout--error" role="alert">
          {error}
        </div>
      )}

      {status === 'ready' && items.length === 0 && (
        <div className="empty-state">
          <h2>Nothing matches those filters</h2>
          <p>Try a different city, type or deadline window.</p>
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => {
              setQuery('');
              setType('');
              setCity('');
              setDeadlineFilter('');
            }}
          >
            Clear filters
          </button>
        </div>
      )}

      {status === 'ready' && items.length > 0 && (
        <div className="grid">
          {items.map((listing) => (
            <ListingCard
              key={listing.id}
              listing={listing}
              user={user}
              tracked={Boolean(tracked[listing.id])}
              saving={savingId === listing.id}
              onSave={handleSave}
            />
          ))}
        </div>
      )}
    </>
  );
}
