import { useCallback, useEffect, useState } from 'react';
import type { ExtractionDraftDto, ListingDto, ListingInput } from '@talea/shared';
import { api } from '../api.js';
import { DeadlinePill } from '../components/DeadlinePill.js';
import { ListingForm, toFormValues } from '../components/ListingForm.js';
import type { ListingFormValues } from '../components/ListingForm.js';
import { formatDate } from '../lib/labels.js';

const SAMPLE_TEXT = `Position: CO-OP Training — Backend Engineering
Company: Tamara
City: Riyadh
Deadline: 2026-12-05
Type: CO-OP
Eligibility: Year 4 and Year 5 students

Join the payments platform team for a six-month cooperative training placement.
You will build and test Node.js services, write integration tests and present your
work at the end of the placement.`;

function draftToFormValues(draft: ExtractionDraftDto): ListingFormValues {
  return {
    title: draft.fields.title,
    organisation: draft.fields.organisation,
    type: draft.fields.type,
    city: draft.fields.city,
    description: draft.fields.description,
    deadline: draft.fields.deadline,
    eligibilityYears: [...draft.fields.eligibilityYears],
  };
}

export function AdminPage() {
  const [rawText, setRawText] = useState('');
  const [draft, setDraft] = useState<ExtractionDraftDto | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [extractError, setExtractError] = useState('');

  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState('');
  const [publishedTitle, setPublishedTitle] = useState('');

  const [listings, setListings] = useState<ListingDto[]>([]);
  const [listingsError, setListingsError] = useState('');
  const [listingsLoading, setListingsLoading] = useState(true);

  const [editing, setEditing] = useState<ListingDto | null>(null);
  const [editBusy, setEditBusy] = useState(false);
  const [editError, setEditError] = useState('');
  const [rowBusyId, setRowBusyId] = useState<string | null>(null);

  const refreshListings = useCallback(async () => {
    setListingsLoading(true);
    setListingsError('');
    try {
      const result = await api.listings({ includeArchived: true, sort: 'recent' });
      setListings(result.items);
    } catch (caught) {
      setListingsError(caught instanceof Error ? caught.message : 'Could not load listings.');
    } finally {
      setListingsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshListings();
  }, [refreshListings]);

  const handleExtract = async () => {
    setExtracting(true);
    setExtractError('');
    setPublishedTitle('');
    try {
      const result = await api.adminExtract(rawText);
      setDraft(result.draft);
    } catch (caught) {
      setExtractError(caught instanceof Error ? caught.message : 'Extraction failed.');
    } finally {
      setExtracting(false);
    }
  };

  const handleApprove = async (input: ListingInput) => {
    if (!draft) return;
    setPublishing(true);
    setPublishError('');
    try {
      const result = await api.adminCreateListing(input, draft.id);
      setPublishedTitle(result.listing.title);
      setDraft(null);
      setRawText('');
      await refreshListings();
    } catch (caught) {
      setPublishError(caught instanceof Error ? caught.message : 'Could not publish that listing.');
    } finally {
      setPublishing(false);
    }
  };

  const handleEdit = async (input: ListingInput) => {
    if (!editing) return;
    setEditBusy(true);
    setEditError('');
    try {
      await api.adminUpdateListing(editing.id, input);
      setEditing(null);
      await refreshListings();
    } catch (caught) {
      setEditError(caught instanceof Error ? caught.message : 'Could not save those changes.');
    } finally {
      setEditBusy(false);
    }
  };

  const toggleActive = async (listing: ListingDto) => {
    setRowBusyId(listing.id);
    setListingsError('');
    try {
      await api.adminUpdateListing(listing.id, { isActive: !listing.isActive });
      await refreshListings();
    } catch (caught) {
      setListingsError(caught instanceof Error ? caught.message : 'Could not update that listing.');
    } finally {
      setRowBusyId(null);
    }
  };

  return (
    <>
      <section className="hero">
        <span className="hero__kicker">Admin</span>
        <h1 className="hero__title">Turn pasted text into a reviewed listing.</h1>
        <p className="hero__lede">
          Paste the raw opportunity text. The extractor fills what it can find, flags anything that
          looks like an instruction, and never publishes on its own — you review and approve.
        </p>
      </section>

      <div className="admin-grid">
        <section className="panel" aria-labelledby="ingest-title">
          <h2 className="panel__title" id="ingest-title">
            1 · Paste the text
          </h2>
          <p className="panel__note">
            Grounded only in what you paste. No scraping, no outside lookup.
          </p>

          <div className="form__row">
            <label className="field__label" htmlFor="raw-text">
              Raw opportunity text
            </label>
            <textarea
              id="raw-text"
              className="textarea textarea--tall"
              value={rawText}
              onChange={(event) => setRawText(event.target.value)}
              placeholder="Paste the listing exactly as you received it…"
            />
            <span className="field__hint">{rawText.trim().length} / 8000 characters</span>
          </div>

          {extractError && (
            <div className="callout callout--error" role="alert">
              {extractError}
            </div>
          )}

          <div className="filters__row">
            <button
              type="button"
              className="btn btn--primary"
              onClick={handleExtract}
              disabled={extracting || rawText.trim().length < 20}
            >
              {extracting ? 'Extracting…' : 'Extract fields'}
            </button>
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => setRawText(SAMPLE_TEXT)}
              disabled={extracting}
            >
              Use sample text
            </button>
          </div>
        </section>

        <section className="panel" aria-labelledby="review-title">
          <h2 className="panel__title" id="review-title">
            2 · Review and approve
          </h2>

          {!draft && !publishedTitle && (
            <p className="panel__note">
              Nothing to review yet. Extract a draft to see the fields the extractor filled.
            </p>
          )}

          {publishedTitle && (
            <div className="callout callout--info" role="status">
              <span className="callout__title">Published</span>
              <span>“{publishedTitle}” is now in the catalogue.</span>
            </div>
          )}

          {draft && (
            <>
              <p className="panel__note">
                Extracted by <code>{draft.provider}</code>. Edit anything that is wrong, then approve.
              </p>
              <ListingForm
                key={draft.id}
                initial={draftToFormValues(draft)}
                submitLabel="Approve and publish"
                busy={publishing}
                serverError={publishError}
                missing={draft.missing}
                flagged={draft.flaggedInstructions}
                onSubmit={handleApprove}
              />
            </>
          )}
        </section>
      </div>

      {editing && (
        <section className="panel" style={{ marginBottom: '2.5rem' }}>
          <div className="filters__row" style={{ justifyContent: 'space-between' }}>
            <h2 className="panel__title">Editing “{editing.title}”</h2>
            <button type="button" className="btn btn--ghost btn--small" onClick={() => setEditing(null)}>
              Cancel
            </button>
          </div>
          <ListingForm
            key={editing.id}
            initial={toFormValues(editing)}
            submitLabel="Save changes"
            busy={editBusy}
            serverError={editError}
            onSubmit={handleEdit}
          />
        </section>
      )}

      <section aria-labelledby="all-listings-title">
        <div className="results-line">
          <h2 className="panel__title" id="all-listings-title">
            All listings
          </h2>
          <span>{listings.length} total</span>
        </div>

        {listingsError && (
          <div className="callout callout--error" role="alert" style={{ marginBottom: '1rem' }}>
            {listingsError}
          </div>
        )}

        {listingsLoading && <p className="loading">Loading listings…</p>}

        {!listingsLoading && listings.length === 0 && (
          <p className="panel__note">No listings yet. Extract one above to start.</p>
        )}

        {!listingsLoading && listings.length > 0 && (
          <table className="table">
            <thead>
              <tr>
                <th scope="col">Listing</th>
                <th scope="col">Deadline</th>
                <th scope="col">State</th>
                <th scope="col">
                  <span className="visually-hidden">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {listings.map((listing) => (
                <tr key={listing.id}>
                  <td>
                    <div className="table__title">{listing.title}</div>
                    <div className="table__sub">
                      {listing.organisation} · {listing.city}
                    </div>
                  </td>
                  <td>
                    <DeadlinePill deadline={listing.deadline} />
                    <div className="table__sub">{formatDate(listing.deadline)}</div>
                  </td>
                  <td>
                    <span className={`pill ${listing.isActive ? 'pill--open' : 'pill--closed'}`}>
                      {listing.isActive ? 'Active' : 'Archived'}
                    </span>
                  </td>
                  <td>
                    <div className="table__actions">
                      <button
                        type="button"
                        className="btn btn--ghost btn--small"
                        onClick={() => {
                          setEditing(listing);
                          setEditError('');
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="btn btn--ghost btn--small"
                        onClick={() => toggleActive(listing)}
                        disabled={rowBusyId === listing.id}
                      >
                        {listing.isActive ? 'Archive' : 'Restore'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </>
  );
}
