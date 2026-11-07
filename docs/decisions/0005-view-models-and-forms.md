# 0005. View-model pattern and React Hook Form over the shared schema

## Context
The statement asks for functional components with hooks for state, a form that blocks an empty title, and clear feedback for every state.

## Decision
- Every use-case component (list, row, form) makes one hook call to its colocated view model `use{Name}` and only renders. Presentational pieces in `client/<domain>/ui` have no hooks.
- View models return unions (`empty | content`) so guard clauses narrow the data.
- View models call tRPC's `queryOptions`/`mutationOptions` directly; there is no extra data-hook layer.
- The form uses React Hook Form with `zodResolver(ticketInput)`, the same schema the server validates with. Server field errors go through `setError`; anything else shows in an alert banner. The view model owns `useForm`, submission and its side effects.

## Consequences
- Components are markup; behavior is tested in view-model tests against the real router (`localLink`), and rendering is tested with the view model mocked.
- One validation source for client and server.
- A second submit or a second delete confirm while one is in flight is ignored.

## Alternatives
- Logic inline in components: fewer files, harder to test each half alone.
- `useState` form: no dependency, but duplicates what React Hook Form already does well.

Sources: research 03, 05.
