import 'server-only';
import type { Ticket } from '@/domain/tickets/ticket';

/** 10:42 AM on Nov 7, 2026 in Campo Grande (UTC-4). Fixed so URLs and tests are stable. */
const NEWEST = Date.UTC(2026, 10, 7, 14, 42);
const at = (minutesAgo: number) => NEWEST - minutesAgo * 60_000;

export const NEWEST_SEEDED_TITLE = 'Piano tuning quote for a Yamaha U1';

/** Tickets the store agent handed over. Two share a timestamp on purpose (tie-break). */
export const seedTickets: readonly Ticket[] = [
  { id: '00000000-0000-4000-8000-000000000001', title: `Piano tuning quote for a Yamaha U1`, description: `Customer wants a home visit in Campo Grande next week and asked whether tuning and a light regulation fit in one visit. Prefers mornings.`, createdAt: at(0) },
  { id: '00000000-0000-4000-8000-000000000002', title: `B string snapped on a new Giannini GF-1D`, description: `Bought 12 days ago, order 4417. The B string broke on the first tune. Wants a replacement set shipped, not a refund. Within the 30-day defect window.`, createdAt: at(87) },
  { id: '00000000-0000-4000-8000-000000000003', title: `Trade-in value for a used Roland FP-30`, description: `Wants to trade toward an FP-60X and sent photos of the keys and pedal. The agent can't price used gear.`, createdAt: at(141) },
  { id: '00000000-0000-4000-8000-000000000004', title: `20 ukuleles for a public school`, description: `Music teacher asking for an institutional discount and an invoice issued to the school's CNPJ.`, createdAt: at(230) },
  { id: '00000000-0000-4000-8000-000000000005', title: `Delivery to Corumbá took 15 days`, description: `The package arrived, but the customer wants to know why it took so long and whether shipping can be refunded.`, createdAt: at(411) },
  { id: '00000000-0000-4000-8000-000000000006', title: `Is the Fender Player Strat in stock?`, description: `The site shows it, but the agent's stock check timed out. Customer will drive in from Dourados if it's there.`, createdAt: at(560) },
  { id: '00000000-0000-4000-8000-000000000007', title: `Return a Boss DS-1 bought by mistake`, description: `Unopened, bought three days ago. Wants to swap it for a Boss BD-2 and pay the difference.`, createdAt: at(733) },
  { id: '00000000-0000-4000-8000-000000000008', title: `Drum lessons partner contact`, createdAt: at(733) },
  { id: '00000000-0000-4000-8000-000000000009', title: `Cracked bridge on a Tagima acoustic`, description: `Customer says the bridge lifted after a week in a hot car. Asking if this is covered or if the workshop can fix it.`, createdAt: at(902) },
  { id: '00000000-0000-4000-8000-000000000010', title: `Bulk strings for a church band`, description: `Wants 12 sets of 010 electric strings and 6 sets of bass strings every two months. Asking for a standing order.`, createdAt: at(1180) },
  { id: '00000000-0000-4000-8000-000000000011', title: `Gift card that was never delivered`, description: `Bought a R$ 300 gift card for a birthday on Saturday. The email never arrived and the agent couldn't resend it.`, createdAt: at(1395) },
  { id: '00000000-0000-4000-8000-000000000012', title: `Kids' violin size for a 7-year-old`, description: `Parent unsure between 1/4 and 1/2. The agent explained sizing but the parent wants someone to measure in the store.`, createdAt: at(1622) },
  { id: '00000000-0000-4000-8000-000000000013', title: `Pickup swap on a Les Paul copy`, createdAt: at(1810) },
  { id: '00000000-0000-4000-8000-000000000014', title: `Price match on a Yamaha P-145`, description: `Customer found it R$ 400 cheaper on a marketplace and wants to know if we can match before buying today.`, createdAt: at(2077) },
  { id: '00000000-0000-4000-8000-000000000015', title: `Rent a PA for a wedding`, description: `Needs two speakers, a mixer and two wireless mics for one Saturday in December. The agent can't quote rentals.`, createdAt: at(2350) },
  { id: '00000000-0000-4000-8000-000000000016', title: `Wrong color Cajón delivered`, description: `Ordered the natural finish and received black. Wants the right one before a gig next Friday.`, createdAt: at(2641) },
  { id: '00000000-0000-4000-8000-000000000017', title: `Ukulele left in the workshop since August`, description: `Customer dropped it off for a setup and lost the receipt. Asking whether it's still here.`, createdAt: at(2930) },
  { id: '00000000-0000-4000-8000-000000000018', title: `Installments on a Taylor 214ce`, description: `Wants 12 installments without interest. The agent offered up to 10 and the customer asked to talk to someone.`, createdAt: at(3210) },
  { id: '00000000-0000-4000-8000-000000000019', title: `Noise in a Fender Mustang amp`, description: `Hums when the gain is above 6. Bought in April, so the agent wasn't sure about warranty.`, createdAt: at(3507) },
  { id: '00000000-0000-4000-8000-000000000020', title: `Sheet music special order`, description: `Looking for the Villa-Lobos Five Preludes, Eschig edition. The agent couldn't find it in the catalog.`, createdAt: at(3820) },
  { id: '00000000-0000-4000-8000-000000000021', title: `Change of delivery address`, description: `Order 4380 is on its way to the old address in Três Lagoas. Customer moved last week.`, createdAt: at(4161) },
  { id: '00000000-0000-4000-8000-000000000022', title: `Group discount for a music school`, description: `A school in Aquidauana wants a standing discount for its students. Needs someone from sales.`, createdAt: at(4478) },
  { id: '00000000-0000-4000-8000-000000000023', title: `Capo missing from a bundle`, description: `The Starter Acoustic bundle arrived without the capo listed on the box.`, createdAt: at(4805) },
  { id: '00000000-0000-4000-8000-000000000024', title: `Customer wants to sell a vintage Giannini`, description: `A 1970s Giannini Craviola in good shape. Asking if the store buys used instruments or takes consignment.`, createdAt: at(5150) },
  { id: '00000000-0000-4000-8000-000000000025', title: `Accessibility question about the store`, description: `Customer uses a wheelchair and asks if the second floor, where the pianos are, has an elevator.`, createdAt: at(5512) },
];
