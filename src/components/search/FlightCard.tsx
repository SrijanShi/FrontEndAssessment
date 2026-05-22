import Link from 'next/link';
import { ArrowRight, Clock } from 'lucide-react';
import type { Flight } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatTime, formatDate, formatDuration, formatPrice } from '@/lib/utils';

interface FlightCardProps {
  flight: Flight;
}

export function FlightCard({ flight }: FlightCardProps) {
  const isBookable = flight.status === 'scheduled' || flight.status === 'delayed';

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 transition-shadow hover:shadow-md">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

        {/* Route */}
        <div className="flex flex-1 items-center gap-3">
          {/* Depart */}
          <div className="min-w-[4rem] text-center">
            <p className="text-2xl font-bold tabular-nums text-slate-900">{formatTime(flight.departs_at)}</p>
            <p className="text-sm font-semibold text-blue-600">{flight.origin}</p>
          </div>

          {/* Flight path */}
          <div className="flex flex-1 flex-col items-center gap-0.5">
            <span className="flex items-center gap-1 text-xs text-slate-400">
              <Clock size={11} />
              {formatDuration(flight.departs_at, flight.arrives_at)}
            </span>
            <div className="flex w-full items-center gap-1">
              <div className="h-px flex-1 bg-slate-200" />
              <ArrowRight size={14} className="shrink-0 text-blue-500" />
            </div>
            <span className="text-xs text-slate-400">{formatDate(flight.departs_at)}</span>
          </div>

          {/* Arrive */}
          <div className="min-w-[4rem] text-center">
            <p className="text-2xl font-bold tabular-nums text-slate-900">{formatTime(flight.arrives_at)}</p>
            <p className="text-sm font-semibold text-blue-600">{flight.destination}</p>
          </div>
        </div>

        {/* Divider */}
        <div className="hidden w-px self-stretch bg-slate-100 sm:block" />

        {/* Price + action */}
        <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end sm:justify-center">
          <div className="text-right">
            <p className="text-xs text-slate-400">from</p>
            <p className="text-2xl font-bold text-blue-700">{formatPrice(flight.base_price)}</p>
            <p className="text-xs text-slate-400">{flight.aircraft_type} · {flight.flight_no}</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge status={flight.status} type="flight" />
            {isBookable ? (
              <Link href={`/flights/${flight.id}`}>
                <Button size="sm">Select Seat</Button>
              </Link>
            ) : (
              <Button size="sm" disabled>Unavailable</Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
