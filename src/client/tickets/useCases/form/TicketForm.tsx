'use client';

import { ChevronLeftIcon, CircleAlertIcon } from 'lucide-react';
import Link from 'next/link';
import { Controller } from 'react-hook-form';
import { Button, buttonVariants } from '@/client/shared/components/ui/button';
import { Input } from '@/client/shared/components/ui/input';
import { Textarea } from '@/client/shared/components/ui/textarea';
import { useTicketForm, type TicketFormProps } from './useTicketForm';

function FieldMessage({ id, message }: { id: string; message: string | undefined }) {
  if (!message) return null;
  return (
    <p id={id} className="flex items-center gap-1.5 text-sm font-semibold text-destructive">
      <CircleAlertIcon className="size-4" strokeWidth={1.75} aria-hidden="true" />
      {message}
    </p>
  );
}

export function TicketForm(props: TicketFormProps) {
  const { control, heading, tagline, fieldErrors, counters, formError, isSaving, submitLabel, onSubmit } = useTicketForm(props);

  return (
    <main className="mx-auto max-w-[36rem] px-4 pt-6 pb-12 md:px-6 md:pt-9">
      <Link href="/" className="mb-3.5 inline-flex items-center gap-1.5 rounded-full text-[15px] text-muted-foreground hover:text-foreground">
        <ChevronLeftIcon className="size-4" strokeWidth={1.75} aria-hidden="true" />
        All tickets
      </Link>
      <h1 className="font-display text-[34px] leading-tight">{heading}</h1>
      <p className="tagline tnum mt-1.5 text-[17px]">{tagline}</p>
      <form noValidate onSubmit={onSubmit} className="mt-6 rounded-lg bg-card p-6 md:p-7">
        <Controller
          control={control}
          name="title"
          render={({ field }) => (
            <div className="flex flex-col gap-1.5">
              <label htmlFor="ticket-title" className="font-semibold">
                Title
              </label>
              <Input
                {...field}
                id="ticket-title"
                autoComplete="off"
                aria-invalid={fieldErrors.title ? true : undefined}
                aria-describedby={fieldErrors.title ? 'ticket-title-error' : undefined}
                className="aria-invalid:border-destructive aria-invalid:ring-1 aria-invalid:ring-destructive"
              />
              <FieldMessage id="ticket-title-error" message={fieldErrors.title} />
              {counters.title && <p className="tnum text-right text-sm text-muted-foreground">{counters.title}</p>}
            </div>
          )}
        />
        <Controller
          control={control}
          name="description"
          render={({ field }) => (
            <div className="mt-5 flex flex-col gap-1.5">
              <label htmlFor="ticket-description" className="flex items-baseline justify-between font-semibold">
                Description
                <span className="text-sm font-normal text-muted-foreground">Optional</span>
              </label>
              <Textarea
                {...field}
                value={field.value ?? ''}
                id="ticket-description"
                rows={5}
                placeholder="What happened, and what does the customer need?"
                aria-invalid={fieldErrors.description ? true : undefined}
                aria-describedby={fieldErrors.description ? 'ticket-description-error' : undefined}
                className="field-sizing-content min-h-[132px]"
              />
              <FieldMessage id="ticket-description-error" message={fieldErrors.description} />
              {counters.description && <p className="tnum text-right text-sm text-muted-foreground">{counters.description}</p>}
            </div>
          )}
        />
        {formError && (
          <div role="alert" className="mt-5 flex items-start gap-2.5 rounded-lg bg-popover px-3.5 py-3 font-semibold text-destructive shadow-[inset_0_0_0_1px_var(--border)]">
            <CircleAlertIcon className="mt-0.5 size-5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
            {formError}
          </div>
        )}
        <div className="mt-6 flex justify-end gap-2">
          <Link href="/" className={buttonVariants({ variant: 'ghost' })}>
            Cancel
          </Link>
          <Button type="submit" disabled={isSaving}>
            {submitLabel}
          </Button>
        </div>
      </form>
    </main>
  );
}
