import { Link } from 'react-router-dom';
import { LISTING_TYPE_LABELS, deadlineStatus, eligibilityHint } from '@talea/shared';
import type { ListingDto, PublicUser } from '@talea/shared';
import { DeadlinePill } from './DeadlinePill.js';
import { eligibilityHintText } from '../lib/labels.js';

interface ListingCardProps {
  listing: ListingDto;
  user: PublicUser | null;
  tracked: boolean;
  saving: boolean;
  onSave: (listing: ListingDto) => void;
}

export function ListingCard({ listing, user, tracked, saving, onSave }: ListingCardProps) {
  const closed = deadlineStatus(listing.deadline) === 'closed';
  const hint = eligibilityHint(listing.eligibilityYears, user?.academicYear ?? null);

  return (
    <article className={`card${closed ? ' card--closed' : ''}`}>
      <div className="card__top">
        <span className="card__org">{listing.organisation}</span>
        <DeadlinePill deadline={listing.deadline} />
      </div>

      <Link className="card__title" to={`/listings/${listing.id}`}>
        {listing.title}
      </Link>

      <div className="card__meta">
        <span className="pill pill--type">{LISTING_TYPE_LABELS[listing.type]}</span>
        <span>{listing.city}</span>
      </div>

      <div className="card__meta">
        <span className={`pill pill--${hint}`}>{eligibilityHintText(hint, listing.eligibilityYears)}</span>
      </div>

      <div className="card__foot">
        <Link className="btn btn--ghost btn--small" to={`/listings/${listing.id}`}>
          Details
        </Link>
        {tracked ? (
          <span className="pill pill--open">In tracker</span>
        ) : (
          <button
            type="button"
            className="btn btn--primary btn--small"
            onClick={() => onSave(listing)}
            disabled={saving || closed}
            aria-label={`Save ${listing.title} to your tracker`}
          >
            {saving ? 'Saving…' : closed ? 'Closed' : 'Save'}
          </button>
        )}
      </div>
    </article>
  );
}
