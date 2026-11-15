import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { LISTING_TYPE_LABELS, eligibilityHint } from '@talea/shared';
import type { ListingDto } from '@talea/shared';
import { ApiError, api } from '../api.js';
import { useAuth } from '../auth.js';
import { DeadlinePill } from '../components/DeadlinePill.js';
import { eligibilityHintText, eligibilityText, formatDate } from '../lib/labels.js';
import { organisationProfile } from '../lib/organisations.js';

export function ListingPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [listing, setListing] = useState<ListingDto | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'missing' | 'error'>('loading');
  const [error, setError] = useState('');
  const [tracked, setTracked] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    let active = true;
    setStatus('loading');

    api
      .listing(id)
      .then((result) => {
        if (!active) return;
        setListing(result.listing);
        setStatus('ready');
      })
      .catch((caught) => {
        if (!active) return;
        if (caught instanceof ApiError && caught.status === 404) {
          setStatus('missing');
        } else {
          setError(caught instanceof Error ? caught.message : 'Could not load that listing.');
          setStatus('error');
        }
      });

    return () => {
      active = false;
    };
  }, [id]);

  useEffect(() => {
    if (!user || !id) {
      setTracked(false);
      return;
    }
    let active = true;
    api
      .tracker()
      .then((result) => {
        if (active) setTracked(result.items.some((entry) => entry.listingId === id));
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [user, id]);

  const handleSave = async () => {
    if (!listing) return;
    if (!user) {
      navigate(`/login?next=/listings/${listing.id}`);
      return;
    }
    setSaving(true);
    try {
      await api.track(listing.id);
      setTracked(true);
    } catch (caught) {
      if (caught instanceof ApiError && caught.code === 'ALREADY_TRACKED') {
        setTracked(true);
      } else {
        setError(caught instanceof Error ? caught.message : 'Could not save that listing.');
      }
    } finally {
      setSaving(false);
    }
  };

  if (status === 'loading') return <p className="loading">Loading…</p>;

  if (status === 'missing') {
    return (
      <div className="empty-state">
        <h1>Listing not found</h1>
        <p>It may have been removed or archived.</p>
        <Link className="btn btn--primary" to="/">
          Back to the catalogue
        </Link>
      </div>
    );
  }

  if (status === 'error' || !listing) {
    return (
      <div className="callout callout--error" role="alert">
        {error || 'Could not load that listing.'}
      </div>
    );
  }

  const hint = eligibilityHint(listing.eligibilityYears, user?.academicYear ?? null);
  const organisation = organisationProfile(listing.organisation);

  return (
    <>
      <Link className="back-link" to="/">
        ← All opportunities
      </Link>

      <article className="detail">
        <header className="detail__head">
          {organisation ? (
            <a
              className="detail__org detail__org--link"
              href={organisation.website}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${listing.organisation} — official website, opens in a new tab`}
            >
              <img
                className="detail__logo"
                src={organisation.logo}
                alt=""
                width={34}
                height={34}
                decoding="async"
              />
              <span className="detail__org-text">
                <span>{listing.organisation}</span>
                <span className="detail__org-cta">
                  Visit the official website{' '}
                  <span className="detail__org-arrow" aria-hidden="true">
                    ↗
                  </span>
                </span>
              </span>
            </a>
          ) : (
            <p className="detail__org">{listing.organisation}</p>
          )}
          <h1 className="detail__title">{listing.title}</h1>
          <div className="card__meta">
            <span className="pill pill--type">{LISTING_TYPE_LABELS[listing.type]}</span>
            <span>{listing.city}</span>
            <DeadlinePill deadline={listing.deadline} />
          </div>
        </header>

        <p className="prose">{listing.description}</p>

        <aside className="side-panel" aria-label="Deadline, eligibility and tracker">
          <div className="side-panel__row">
            <span className="side-panel__label">Deadline</span>
            <span>{formatDate(listing.deadline)}</span>
          </div>

          <div className="side-panel__row">
            <span className="side-panel__label">Eligible years</span>
            <span>{eligibilityText(listing.eligibilityYears)}</span>
            <span className={`pill pill--${hint}`}>{eligibilityHintText(hint, listing.eligibilityYears)}</span>
          </div>

          <div className="side-panel__row">
            <span className="side-panel__label">Type</span>
            <span>{LISTING_TYPE_LABELS[listing.type]}</span>
          </div>

          <div className="side-panel__action">
            {tracked ? (
              <Link className="btn btn--ghost" to="/tracker">
                In your tracker — open it
              </Link>
            ) : (
              <button type="button" className="btn btn--clay" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving…' : 'Save to tracker'}
              </button>
            )}
          </div>

          <p className="field__hint">
            Talea does not submit applications. You apply on the organisation's own site and record
            the progress here.
          </p>
        </aside>
      </article>
    </>
  );
}
