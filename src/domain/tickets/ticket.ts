import { z } from 'zod';

export const MAX_TICKETS = 1000;
export const TITLE_MAX = 120;
export const DESCRIPTION_MAX = 2000;
export const PAGE_SIZE = 10;
export const LIMIT_MAX = 50;

export const ticketSchema = z.object({
  id: z.string().min(1),
  title: z.string(),
  description: z.string().optional(),
  /** Epoch milliseconds, assigned by the server and never changed. */
  createdAt: z.number().int(),
});

export const ticketInput = z.object({
  title: z.string().trim().min(1, 'Title is required').max(TITLE_MAX),
  // `.transform` (not `z.preprocess`) keeps the input type `string | undefined` for the form.
  description: z
    .string()
    .trim()
    .max(DESCRIPTION_MAX)
    .optional()
    .transform((value) => (value === '' ? undefined : value)),
});

// Ids are only checked for presence: an unknown id is a NOT_FOUND, not a BAD_REQUEST.
export const idInput = z.object({ id: z.string().min(1) });

/** Full replacement of title and description, not a patch. */
export const updateInput = ticketInput.extend({ id: z.string().min(1) });

// Over-max limits are rejected rather than silently coerced.
export const listInput = z.object({
  limit: z.number().int().min(1).max(LIMIT_MAX).default(PAGE_SIZE),
  cursor: z.string().nullish(),
});

export type Ticket = z.infer<typeof ticketSchema>;
export type TicketInput = z.output<typeof ticketInput>;
export type TicketFormValues = z.input<typeof ticketInput>;
export type ListInput = z.output<typeof listInput>;
