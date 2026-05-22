import { cn } from '@/lib/utils';
import type { BookingStatus, FlightStatus } from '@/types';

const bookingColors: Record<BookingStatus, string> = {
  confirmed:   'bg-green-100 text-green-800',
  rescheduled: 'bg-amber-100 text-amber-800',
  cancelled:   'bg-red-100 text-red-800',
};

const flightColors: Record<FlightStatus, string> = {
  scheduled:  'bg-blue-100 text-blue-800',
  delayed:    'bg-amber-100 text-amber-800',
  cancelled:  'bg-red-100 text-red-800',
  completed:  'bg-slate-100 text-slate-600',
};

interface BadgeProps {
  status: BookingStatus | FlightStatus;
  type?: 'booking' | 'flight';
  className?: string;
}

export function Badge({ status, type = 'booking', className }: BadgeProps) {
  const color =
    type === 'booking'
      ? bookingColors[status as BookingStatus]
      : flightColors[status as FlightStatus];

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize',
        color,
        className
      )}
    >
      {status}
    </span>
  );
}
