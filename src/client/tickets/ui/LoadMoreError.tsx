import { CircleAlertIcon, RefreshCwIcon } from 'lucide-react';
import { Button } from '@/client/shared/components/ui/button';

interface LoadMoreErrorProps {
  message: string;
  onRetry: () => void;
}

export function LoadMoreError({ message, onRetry }: LoadMoreErrorProps) {
  return (
    <div className="mt-5 flex items-center justify-between gap-3 rounded-lg bg-card py-3 pr-3 pl-4 text-[15px] font-semibold">
      <span className="flex items-center gap-2 text-destructive">
        <CircleAlertIcon className="size-5" strokeWidth={1.75} aria-hidden="true" />
        {message}
      </span>
      <Button variant="secondary" size="sm" onClick={onRetry}>
        <RefreshCwIcon className="size-4" strokeWidth={1.75} aria-hidden="true" />
        Try again
      </Button>
    </div>
  );
}
