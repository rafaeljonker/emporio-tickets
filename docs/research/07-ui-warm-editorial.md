# Research 07 — Warm editorial application UI (techniques)

Caveat from the researcher: product references (Claude.ai, Things 3, Readwise Reader, Are.na, Read.cv, Stripe Press, Teenage Engineering, Mailchimp/Substack) are from general knowledge, not fresh fetches; hex values are proposals — the Empório tokens (research 09) override them.

## Lessons
- Claude.ai: warm off-white, serif for greetings/headlines only, terracotta the only saturated hue on primary actions.
- Things 3: no borders, whitespace separation, selected = soft tint; completion collapses with height animation.
- Readwise Reader / Literal: dense lists on warm canvas; serif titles, muted sans metadata, tabular numerals.
- Are.na / Read.cv: restraint, hairlines, one typeface.
- Stripe Press / Teenage Engineering: physical craft; one loud accent on calm field (honey on walnut).
- Mailchimp/Substack: serif headline over plain sans tables; never serif in cells.

## Checklist
- Fraunces only for the one headline: `font-variation-settings: "opsz" 96, "SOFT" 50, "WONK" 0; letter-spacing: -0.015em`; WONK only on an empty state (quirky in a work tool).
- Sans scale: section labels 12/600 uppercase .06em; row titles 15–16/600; metadata 13/400; tabular-nums for dates/counts; `text-wrap: pretty` body, `balance` headlines.
- Contrast ladder (3–4 clear steps); honey never as text on cream; hairlines ~1px warm for separators, ≥3:1 only where the border is the sole control cue (inputs).
- Hover: walnut 5% tint; selected: honey 14% tint + 3px honey left bar; focus: 2px outline offset 2px on :focus-visible.
- Layering: canvas → card slightly lighter warm (never pure white) → popover with stronger shadow. Layered walnut-tinted shadows (Comeau).
- Grain: SVG feTurbulence, fixed, opacity ~.05, multiply, canvas only (cards = smoother stock). Card inset top highlight.
- Wood rail: walnut gradient within ~6% lightness + 3px honey bottom rule.
- Buttons: :active scale(.97), 120ms; disabled under reduced motion.
- Loading: static walnut 6% blocks with slow opacity pulse, no shimmer.
- Toasts: card surface, 12px radius, 3px semantic left rule, icon + word; bottom-centre on mobile.
- Dialog backdrop: warm dark 35% + blur(4px).
- Dividers inset from row padding (Things/iOS).
- Badges: icon + word, pill, 12–16% tint, darker same-hue text.
- Motion: 150–200ms cubic-bezier(.2,.8,.2,1), opacity + translateY(4px); delete collapse grid-template-rows 1fr→0fr + opacity 200ms; reduced motion keeps fades only.
- Responsive: rail 64→52px; Fraunces h1 ~28px; rows stack, 44px min, secondary actions in sheet; sticky bottom primary bar with safe-area padding.

## Signatures
1. Wood rail (+ honey rule echoed under active row).
2. One soft serif moment per screen.
3. Paper vs card stock; spruce reserved for special blocks.

## Pitfalls
Too many close browns; grain > 6% or on text surfaces; pure white cards; grey shadows; shadcn default ring/muted tokens leaking slate/blue; honey text; terracotta on non-clickables; serif in tables/buttons; WONK in tool; big gradients.

Sources: joshwcomeau.com/css/designing-shadows; joshwcomeau.com/css/introducing-shadow-palette-generator; freecodecamp grainy CSS backgrounds; css-tricks grainy gradients; github.com/arrowtype/Fraunces; fonts.google.com/specimen/Fraunces; Emil Kowalski design-eng rules (emilkowalski/skills).
