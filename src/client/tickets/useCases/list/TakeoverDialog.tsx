import { LockIcon, MessageSquareIcon } from 'lucide-react';
import { Button } from '@/client/shared/components/ui/button';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from '@/client/shared/components/ui/dialog';

interface TakeoverDialogProps {
  title: string;
}

const bubble = 'max-w-[78%] rounded-[21.6px] px-[15px] py-[9px] text-[15px] leading-snug';
const customer = `${bubble} self-end rounded-br-lg bg-user-bubble text-user-bubble-foreground`;
const agent = `${bubble} self-start rounded-bl-lg bg-card`;

/** A deliberate easter egg: the live handoff is designed but not built. */
export function TakeoverDialog({ title }: TakeoverDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="size-9 rounded-lg text-muted-foreground hover:text-foreground" aria-label="Take over conversation">
          <MessageSquareIcon className="size-5" strokeWidth={1.75} aria-hidden="true" />
        </Button>
      </DialogTrigger>
      <DialogContent closeLabel="Close" className="md:max-w-xl">
        <div className="border-b border-border px-5 pt-5 pb-3.5 pr-14">
          <DialogTitle className="text-[21px] leading-tight">{title}</DialogTitle>
          <DialogDescription className="mt-1.5 text-[15px]">Conversation between the customer and the store agent.</DialogDescription>
        </div>
        <div className="p-5">
          <div className="relative flex h-[300px] flex-col gap-2 overflow-hidden rounded-lg bg-background p-4 shadow-[inset_0_0_0_1px_var(--border)]">
            <p className={customer}>Oi, comprei um violão de vocês e a corda Si arrebentou na primeira afinada</p>
            <p className={agent}>Poxa, que chato. Me passa o número do pedido que eu já vejo aqui?</p>
            <div aria-hidden="true" className="flex flex-col gap-2 opacity-70 blur-[5px]">
              <p className={customer}>4417</p>
              <p className={agent}>Achei. Está dentro dos 30 dias de defeito, então vou passar para a equipe trocar o encordoamento.</p>
            </div>
            <div className="absolute inset-x-0 bottom-0 flex h-[205px] flex-col items-center justify-end bg-gradient-to-b from-background/0 to-background to-[46%] px-6 pb-5 text-center">
              <span className="mb-2.5 grid size-[52px] -rotate-6 place-items-center rounded-full bg-accent text-rail shadow-lg">
                <LockIcon className="size-6" strokeWidth={1.75} aria-hidden="true" />
              </span>
              <p className="font-display text-[22px] leading-tight font-semibold">🔒 Live handoff</p>
              <p className="mt-1.5 max-w-[40ch] text-[15.5px]">Designed, not built yet. Unlocks right after this candidate gets hired. 😉</p>
            </div>
          </div>
        </div>
        <div className="flex justify-end px-5 pb-5">
          <DialogClose asChild>
            <Button variant="secondary">Got it</Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
}
