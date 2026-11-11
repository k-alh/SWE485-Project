import { useState } from 'react';
import type { FormEvent } from 'react';
import { ACADEMIC_YEARS, LISTING_TYPES, LISTING_TYPE_LABELS, listingInputSchema } from '@talea/shared';
import type { AcademicYear, ListingDto, ListingInput, ListingType } from '@talea/shared';

export interface ListingFormValues {
  title: string;
  organisation: string;
  type: ListingType;
  city: string;
  description: string;
  deadline: string;
  eligibilityYears: AcademicYear[];
}

export function emptyFormValues(): ListingFormValues {
  return {
    title: '',
    organisation: '',
    type: 'coop',
    city: '',
    description: '',
    deadline: '',
    eligibilityYears: [4],
  };
}

export function toFormValues(listing: ListingDto): ListingFormValues {
  return {
    title: listing.title,
    organisation: listing.organisation,
    type: listing.type,
    city: listing.city,
    description: listing.description,
    deadline: listing.deadline.slice(0, 10),
    eligibilityYears: [...listing.eligibilityYears],
  };
}

interface ListingFormProps {
  initial: ListingFormValues;
  submitLabel: string;
  busy: boolean;
  serverError?: string;
  missing?: string[];
  flagged?: string[];
  onSubmit: (input: ListingInput) => Promise<void>;
}

const YEAR_OPTIONS = ACADEMIC_YEARS.map((year) => ({
  value: year,
  label: year === 'graduate' ? 'Graduates' : `Year ${year}`,
}));

export function ListingForm({
  initial,
  submitLabel,
  busy,
  serverError,
  missing = [],
  flagged = [],
  onSubmit,
}: ListingFormProps) {
  const [values, setValues] = useState<ListingFormValues>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = <K extends keyof ListingFormValues>(key: K, value: ListingFormValues[K]) => {
    setValues((previous) => ({ ...previous, [key]: value }));
  };

  const toggleYear = (year: AcademicYear) => {
    setValues((previous) => ({
      ...previous,
      eligibilityYears: previous.eligibilityYears.includes(year)
        ? previous.eligibilityYears.filter((item) => item !== year)
        : [...previous.eligibilityYears, year],
    }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const parsed = listingInputSchema.safeParse(values);
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      const next: Record<string, string> = {};
      for (const [key, messages] of Object.entries(fieldErrors)) {
        const first = messages?.[0];
        if (first) next[key] = first;
      }
      setErrors(next);
      return;
    }
    setErrors({});
    await onSubmit(parsed.data as ListingInput);
  };

  const fieldError = (name: string) =>
    errors[name] ? (
      <span className="field__error" id={`${name}-error`} role="alert">
        {errors[name]}
      </span>
    ) : null;

  return (
    <form className="form" onSubmit={handleSubmit} noValidate>
      {flagged.length > 0 && (
        <div className="callout callout--warn">
          <span className="callout__title">Instruction-like text was ignored</span>
          <span>
            These lines were treated as data, not instructions, and were not used to fill any
            field. Check the values below before publishing.
          </span>
          <ul>
            {flagged.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>
      )}

      {missing.length > 0 && (
        <div className="callout callout--info">
          <span className="callout__title">The extractor could not find</span>
          <span>{missing.join(', ')}. Fill these in yourself before approving.</span>
        </div>
      )}

      <div className="form__row">
        <label className="field__label" htmlFor="title">
          Title
        </label>
        <input
          id="title"
          className="input"
          value={values.title}
          onChange={(event) => set('title', event.target.value)}
          aria-invalid={Boolean(errors.title)}
          aria-describedby={errors.title ? 'title-error' : undefined}
        />
        {fieldError('title')}
      </div>

      <div className="form__grid">
        <div className="form__row">
          <label className="field__label" htmlFor="organisation">
            Organisation
          </label>
          <input
            id="organisation"
            className="input"
            value={values.organisation}
            onChange={(event) => set('organisation', event.target.value)}
            aria-invalid={Boolean(errors.organisation)}
            aria-describedby={errors.organisation ? 'organisation-error' : undefined}
          />
          {fieldError('organisation')}
        </div>

        <div className="form__row">
          <label className="field__label" htmlFor="type">
            Type
          </label>
          <select
            id="type"
            className="select"
            value={values.type}
            onChange={(event) => set('type', event.target.value as ListingType)}
          >
            {LISTING_TYPES.map((type) => (
              <option key={type} value={type}>
                {LISTING_TYPE_LABELS[type]}
              </option>
            ))}
          </select>
        </div>

        <div className="form__row">
          <label className="field__label" htmlFor="city">
            City
          </label>
          <input
            id="city"
            className="input"
            value={values.city}
            onChange={(event) => set('city', event.target.value)}
            aria-invalid={Boolean(errors.city)}
            aria-describedby={errors.city ? 'city-error' : undefined}
          />
          {fieldError('city')}
        </div>

        <div className="form__row">
          <label className="field__label" htmlFor="deadline">
            Deadline
          </label>
          <input
            id="deadline"
            type="date"
            className="input"
            value={values.deadline}
            onChange={(event) => set('deadline', event.target.value)}
            aria-invalid={Boolean(errors.deadline)}
            aria-describedby={errors.deadline ? 'deadline-error' : undefined}
          />
          {fieldError('deadline')}
        </div>
      </div>

      <div className="form__row">
        <label className="field__label" htmlFor="description">
          Description
        </label>
        <textarea
          id="description"
          className="textarea"
          value={values.description}
          onChange={(event) => set('description', event.target.value)}
          aria-invalid={Boolean(errors.description)}
          aria-describedby={errors.description ? 'description-error' : undefined}
        />
        {fieldError('description')}
      </div>

      <fieldset className="form__row" style={{ border: 'none', padding: 0, margin: 0 }}>
        <legend className="field__label">Eligible years</legend>
        <div className="checkbox-row">
          {YEAR_OPTIONS.map((option) => (
            <label className="checkbox" key={String(option.value)}>
              <input
                type="checkbox"
                checked={values.eligibilityYears.includes(option.value)}
                onChange={() => toggleYear(option.value)}
              />
              {option.label}
            </label>
          ))}
        </div>
        {fieldError('eligibilityYears')}
      </fieldset>

      {serverError && (
        <div className="callout callout--error" role="alert">
          {serverError}
        </div>
      )}

      <div>
        <button type="submit" className="btn btn--clay" disabled={busy}>
          {busy ? 'Saving…' : submitLabel}
        </button>
      </div>
    </form>
  );
}
