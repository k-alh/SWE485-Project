import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ALLOWED_TRANSITIONS,
  LISTING_TYPE_LABELS,
  TRACKER_STATUSES,
  TRACKER_STATUS_LABELS,
  deadlineStatus,
} from '@talea/shared';
import type { TrackerEntryDto, TrackerStatus } from '@talea/shared';
import { api } from '../api.js';
import { useAuth } from '../auth.js';
import { DeadlinePill } from '../components/DeadlinePill.js';

export function TrackerPage() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<TrackerEntryDto[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = useState('');
  const [busyEntryId, setBusyEntryId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    api
      .tracker()
      .then((result) => {
        if (!active) return;
        setEntries(result.items);
        setStatus('ready');
      })
      .catch((caught) => {
        if (!active) return;
        setError(caught instanceof Error ? caught.message : 'Could not load your tracker.');
        setStatus('error');
      });
    return () => {
      active = false;
    };
  }, []);

  const move = async (entry: TrackerEntryDto, to: TrackerStatus) => {
    setBusyEntryId(entry.id);
    setError('');
    try {
      const result = await api.transition(entry.id, to);
      setEntries((previous) =>
        previous.map((item) => (item.id === result.entry.id ? result.entry : item)),
      );
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not update that entry.');
    } finally {
      setBusyEntryId(null);
    }
  };

  const total = entries.length;

  return (
    <>
      <section className="hero">
        <span className="hero__kicker">My tracker</span>
        <h1 className="hero__title">Where each application stands.</h1>
        <p className="hero__lede">
          Move an entry forward one stage at a time. Rejected is an exit — it cannot be reopened.
        </p>
      </section>

      {error && (
        <div className="callout callout--error" role="alert" style={{ marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      {status === 'loading' && <p className="loading">Loading your tracker…</p>}

      {status === 'error' && (
        <div className="callout callout--error" role="alert">
          {error}
        </div>
      )}

      {status === 'ready' && total === 0 && (
        <div className="empty-state">
          <h2>Your tracker is empty</h2>
          <p>Save an opportunity from the catalogue and it will appear here.</p>
          <Link className="btn btn--primary" to="/">
            Browse opportunities
          </Link>
        </div>
      )}

      {status === 'ready' && total > 0 && (
        <div className="pipeline">
          {TRACKER_STATUSES.map((column) => {
            const columnEntries = entries.filter((entry) => entry.status === column);
            return (
              <section className="column" key={column} aria-labelledby={`col-${column}`}>
                <div className="column__head">
                  <h2 className="column__title" id={`col-${column}`}>
                    {TRACKER_STATUS_LABELS[column]}
                  </h2>
                  <span className="column__count">{columnEntries.length}</span>
                </div>

                {columnEntries.length === 0 && <p className="column__empty">Nothing here yet.</p>}

                {columnEntries.map((entry) => {
                  const nextStatuses = ALLOWED_TRANSITIONS[entry.status];
                  const closed = deadlineStatus(entry.listing.deadline) === 'closed';
                  return (
                    <article className="entry" key={entry.id}>
                      <span className="entry__org">{entry.listing.organisation}</span>
                      <Link className="entry__title" to={`/listings/${entry.listing.id}`}>
                        {entry.listing.title}
                      </Link>
                      <div className="card__meta">
                        <span>{LISTING_TYPE_LABELS[entry.listing.type]}</span>
                        {closed ? (
                          <span className="pill pill--closed">Closed</span>
                        ) : (
                          <DeadlinePill deadline={entry.listing.deadline} />
                        )}
                      </div>

                      {nextStatuses.length > 0 && (
                        <div className="entry__actions">
                          {nextStatuses.map((next) => (
                            <button
                              key={next}
                              type="button"
                              className={
                                next === 'rejected'
                                  ? 'btn btn--danger btn--small'
                                  : 'btn btn--ghost btn--small'
                              }
                              onClick={() => move(entry, next)}
                              disabled={busyEntryId === entry.id}
                            >
                              {next === 'rejected' ? 'Rejected' : `Move to ${TRACKER_STATUS_LABELS[next]}`}
                            </button>
                          ))}
                        </div>
                      )}

                      {nextStatuses.length === 0 && (
                        <p className="field__hint">Closed outcome. No further moves.</p>
                      )}
                    </article>
                  );
                })}
              </section>
            );
          })}
        </div>
      )}

      {user && (
        <p className="field__hint" style={{ marginTop: '1.5rem' }}>
          Signed in as {user.name}
          {user.academicYear ? ` · ${user.academicYear === 'graduate' ? 'Graduate' : `Year ${user.academicYear}`}` : ''}
        </p>
      )}
    </>
  );
}
