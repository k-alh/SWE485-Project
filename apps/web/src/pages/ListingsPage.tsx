import { useCallback, useEffect, useState } from 'react';
import type { ListingDto, ListingInput } from '@talea/shared';
import { api } from '../api.js';
import { DeadlinePill } from '../components/DeadlinePill.js';
import { ListingForm, toFormValues } from '../components/ListingForm.js';
import { formatDate } from '../lib/labels.js';

export function ListingsPage() {
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
        <h1 className="hero__title">Every listing, in one place.</h1>
        <p className="hero__lede">
          Edit an opportunity, archive one that has closed, or restore it. Archived listings stay out
          of the catalogue but keep their history.
        </p>
      </section>

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
          <p className="panel__note">
            No listings yet. <a href="/admin">Add one</a> to get started.
          </p>
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
