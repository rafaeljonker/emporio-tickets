# Research 08 — Support-ticket product UI patterns

Caveat: marketing pages say little in text and gallery screenshots were not readable; per-product visual details are recall, not verified.

## Directions
A. Editorial list (recommended): single centered column 760–880px; Fraunces headline + sans count; hairline walnut 8% dividers, no boxed cards. Refs: Linear 2024 redesign (linear.app/now/how-we-redesigned-the-linear-ui), Superhuman, Help Scout inbox (helpscout.com/inbox).
B. Two-pane inbox: list ~380px + detail with "Take over" CTA. Refs: Missive (missiveapp.com/docs/get-started/missive-interface), Plain (plain.com), Front, Intercom. Detail pane feels empty with description only; collapses to A on mobile.
C. Card board: grid of spruce cards. Refs: Height, Attio boards, Dribbble helpdesk shots. Scans worst; delete reflows grid. Hybrid: A + spruce only for empty state and takeover dialog.

## Row anatomy
32px initials/bot avatar tint 15%; title 600 15–16px; summary 400 14px 70% line-clamp-2; time tabular 13px muted right with full date tooltip; source badge once in header subtitle unless sources vary; hover walnut 4% tint, time swaps to pencil/trash (opacity + focus-within; Fastmail revamped inbox, shadcn aria chat-conversation-list); kebab on touch; delete rightmost, neutral at rest; whole row links to edit, actions stop propagation.

## Header
Sticky cream + backdrop-blur, hairline after scroll; Fraunces headline + count left; terracotta "New ticket" + plus + `N` kbd chip right. Skeleton rows mirror anatomy, pulse, 150ms delay. Infinite scroll: sentinel + 3 skeleton rows; end line "That's every ticket. The agent is still on shift." between hairlines; Retry on failure; keep real Load more.

## Empty state
Line-art SVG (resting guitar / music stand, walnut strokes, honey fill); Fraunces "Quiet in the shop"; one sentence; CTA. Superhuman inbox-zero as reference.

## Form
Dedicated page, single column max 600px, labels above, "Optional" muted; validate on blur then live; error with circle-alert, focus first invalid; counter only >80%; auto-grow textarea; footer actions (ghost Cancel, terracotta Save ticket), sticky on mobile; ⌘↵ submits; unsaved-changes guard; Save pending spinner.

## Delete + toasts
NN/g (nngroup.com/articles/confirmation-dialog): specific confirm title `Delete "…"?`, consequence line, "Delete ticket" / "Keep it", initial focus on Keep it. Sonner style (emilkowal.ski/ui/building-a-toast-component): bottom-right stack, ~4s, pause on hover/hidden. Success spruce + check; error terracotta-dark + Retry.

## Transcript + locked overlay
Customer left (cream-dark bubbles), agent right (spruce bubbles, cream text, bot label); grouped; divider "Agent handed off · 14:32". Overlay: blur 4–6px + cream gradient keeping first 1–2 messages legible; honey circle lock icon; Fraunces line; playful copy; ghost "Got it"; single 6° wiggle; no stripes/ribbons.

## Micro-interactions
Row enter fade + 4px, 20ms stagger for new pages only; delete fade + grid-rows collapse 200ms; terracotta focus outline on :focus-visible; active scale .98; 120ms hover opacity; reduced motion.

## Warm fit
Good: hairlines, honey badges, spruce toasts/bubbles, serif empty states. Poor: cool-grey density, blue selection → walnut 6% fill + 2px terracotta bar. Terracotta for primary CTA + delete-hover only.

Sources: linear.app/now/how-we-redesigned-the-linear-ui, linear.app/method/introduction, helpscout.com/inbox, missiveapp.com docs, plain.com, intercom.com, fastmail.com/blog/revamped-inbox, shadcn.io/blocks/aria/chat-conversation-list, nngroup.com/articles/confirmation-dialog, emilkowal.ski/ui/building-a-toast-component.
